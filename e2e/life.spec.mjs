import { expect, test as base } from "@playwright/test";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { defaultAvatar } from "../src/avatar.ts";
import { builtGameServer, sitePath } from "./serve-built-game.mjs";
import { choose, doLifeActivity, doPathAction, getChoices, newChapterLife, newLife, newProfileLife, playYear, startCareerLife } from "../src/engine.ts";
import { familyRoll } from "../src/fertilityModel.ts";
import { startPregnancyPlay } from "../src/pregnancyTimeline.ts";
import { getWorkDecision } from "../src/workplace.ts";
import { personRelationship } from "../src/peopleIdentity.ts";
import { serialize } from "../src/sessionCodec.ts";

const test = base.extend({
  baseURL: async ({}, use) => {
    const server = builtGameServer();
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    try {
      await use(`http://127.0.0.1:${server.address().port}${sitePath}`);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  },
});

test("a new life advances, keeps its journal after reload, and recovers the previous save", async ({ page, baseURL }) => {
  const localOrigin = new URL(baseURL).origin + "/";
  const problems = [];
  page.on("pageerror", error => problems.push(error.message));
  page.on("response", response => {
    if (response.url().startsWith(localOrigin) && response.status() >= 400) {
      problems.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on("requestfailed", request => {
    if (request.url().startsWith(localOrigin)) {
      problems.push(`${request.failure()?.errorText} ${request.url()}`);
    }
  });

  // Fix the newborn's seed so the first two birthdays never depend on a mortality roll.
  await page.addInitScript(() => {
    const getRandomValues = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = values => {
      if (values instanceof Uint32Array && values.length === 1) {
        values[0] = 108;
        return values;
      }
      return getRandomValues(values);
    };
  });

  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("lang", "bg");
  await page.getByRole("button", { name: "Switch to English" }).tap();
  await page.getByRole("button", { name: /^New life/ }).tap();
  await page.getByLabel("Name", { exact: true }).fill("Eva Petrova");
  await page.getByLabel("Birth city").selectOption("sofia");
  await page.getByRole("button", { name: "Start life" }).tap();

  const age = page.getByTestId("chapter-age");
  const advance = page.getByTestId("advance");
  await expect(age).toHaveText(/^0(?!\d)/);
  await expect(advance).toBeInViewport({ ratio: 1 });
  await advance.tap();
  await expect(age).toHaveText(/^1(?!\d)/);
  const firstYear = page.locator('[data-life-year="1"]');
  await expect(firstYear).toBeVisible();
  const firstYearEvents = firstYear.locator("ul");
  const firstYearText = await firstYearEvents.innerText();
  await advance.tap();
  await expect(age).toHaveText(/^2(?!\d)/);

  const resume = page.getByRole("button", { name: /^Continue.*Eva Petrova.*Sofia/ });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await resume.tap();
  await expect(age).toHaveText(/^2(?!\d)/);
  await expect(firstYearEvents).toHaveText(firstYearText, { useInnerText: true });
  await expect(page.locator('[data-life-year="2"]')).toBeVisible();

  await page.evaluate(() => localStorage.setItem("bglife.journal.v1", "invalid save"));
  await page.reload();
  await expect(page.getByRole("status")).toContainText("Your journal was restored from its previous save.");
  await resume.tap();
  await expect(age).toHaveText(/^1(?!\d)/);
  await expect(firstYearEvents).toHaveText(firstYearText, { useInnerText: true });
  expect(problems, "runtime errors and failed production requests").toEqual([]);
});

test("the standalone playtest can open without network access", async ({ page, context }) => {
  await context.route(/^https?:\/\//, route => route.abort());
  await page.goto(pathToFileURL(resolve("release/BgLife-Playable.html")).href);
  await page.getByRole("button", { name: "Switch to English" }).tap();
  await page.getByRole("button", { name: /^New life/ }).tap();
  await expect(page.getByLabel("Birth city")).toBeVisible();
});

test("intimacy can repeat and a confirmed pregnancy changes Play until the birth", async ({ page }) => {
  const first = "appMatch.encounter.0";
  const second = "appMatch.encounter.1";
  const seed = Array.from({ length: 1024 }, (_, i) => i).find(i =>
    familyRoll(i, 21, first + ".conception") > 0.07 && familyRoll(i, 21, first + ".suspicion") > 0.02
    && familyRoll(i, 21, second + ".conception") < 0.05 && familyRoll(i, 21, second + ".loss") > 0.2
    && familyRoll(i, 21, second + ".late-loss") > 0.01);
  expect(seed).toBeDefined();
  const chooseStory = s => {
    const choices = getChoices(s);
    const option = choices.find(choice => choice.id === "stay") ?? choices[0];
    return option ? choose(s, option.id) : s;
  };
  let life = newChapterLife(seed);
  while (life.age < 21) {
    const next = playYear(chooseStory(life));
    expect(next.age).toBe(life.age + 1);
    life = next;
  }
  life = startPregnancyPlay(doLifeActivity(chooseStory(life), "family.tinder"));
  await page.addInitScript(saved => {
    localStorage.setItem("bglife.language", "en");
    if (!localStorage.getItem("bglife.journal.v1")) localStorage.setItem("bglife.journal.v1", saved);
  }, serialize({ life, album: [] }));
  await page.goto("./");
  const resume = page.getByRole("button", { name: /^Continue.*Mila Nikolova/ });
  await resume.tap();
  await page.locator('[data-tab="people"]').tap();
  await page.locator('[data-person="appMatch"]').tap();
  await page.locator('[data-action-group="intimacy"]').tap();
  await page.getByRole("button", { name: /Without protection/ }).tap();
  const result = page.locator('dialog[data-action-phase="outcome"]');
  await expect(result).toBeVisible();
  await result.getByRole("button", { name: "Repeat", exact: true }).tap();

  const alert = page.locator("[data-pregnancy-notice]");
  await expect(alert).toHaveAttribute("data-pregnancy-notice", "test");
  await alert.getByRole("button", { name: "Take the test" }).tap();
  await expect(alert).toHaveAttribute("data-pregnancy-notice", "confirmed");
  await alert.getByRole("button", { name: "Continue", exact: true }).tap();

  const age = page.getByTestId("chapter-age");
  const play = page.getByTestId("advance");
  await expect(play).toHaveAttribute("data-play-mode", "pregnancy");
  await expect(play).toHaveAccessibleName("Trimester 1");
  await page.getByRole("button", { name: "End the pregnancy" }).tap();
  await page.getByRole("dialog", { name: "End the pregnancy" }).getByRole("button", { name: "Back" }).tap();
  await expect(play).toHaveAccessibleName("Trimester 1");
  await play.tap();
  await expect(page.locator('[data-event-id="pregnancy-dating-scan"]')).toBeVisible();
  await expect(play).toHaveAccessibleName("Trimester 2");
  await play.tap();
  await expect(age).toHaveText(/^21(?!\d)/);
  await expect(page.getByRole("button", { name: "End the pregnancy" })).toHaveCount(0);

  await page.reload();
  await resume.tap();
  await expect(play).toHaveAccessibleName("Trimester 3");
  await play.tap();
  await expect(play).toHaveAccessibleName("Birth");
  await play.tap();
  const naming = page.locator("dialog.birth-naming");
  await expect(naming).toBeVisible();
  await naming.getByRole("button", { name: /^Save name/ }).tap();
  await expect(play).toHaveAttribute("data-play-mode", "year");
  await expect(age).toHaveText(/^21(?!\d)/);
  const leave = page.locator("[data-maternity-status]");
  await expect(leave).toContainText("Maternity leave · first year");
  await leave.getByRole("button", { name: "Career" }).tap();
  const careerLeave = page.locator("[data-career-maternity]");
  await expect(careerLeave).toContainText("Benefit this year");
  await expect(page.getByTestId("open-workplace")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Return to work", exact: true })).toHaveCount(0);
  await play.tap();
  await expect(age).toHaveText(/^22(?!\d)/);
  await expect(leave).toContainText("Maternity leave · second year");
  await leave.getByRole("button", { name: "Career" }).tap();
  await expect(careerLeave).toContainText("4,785.72");
  await careerLeave.getByRole("button", { name: "Return to work", exact: true }).tap();
  await expect(careerLeave).toHaveCount(0);
  await page.getByTestId("open-workplace").tap();
  await expect(page.getByTestId("workplace").locator("[data-work-contact]")).toHaveCount(3);
  await expect(age).toHaveText(/^22(?!\d)/);
});

test("the shopping directory is separate from possessions and a purchase survives reload", async ({ page }) => {
  let life = startCareerLife(newProfileLife({ seed: 108, city: "plovdiv", presentation: "female", avatar: defaultAvatar,
    profile: { name: "Лора Иванова", talent: "none", vip: true, wealthy: true, disposition: null } }));
  for (let year = 0; year < 18; year++) life = playYear(life);
  expect(life.age).toBe(18);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(backup => {
    if (!localStorage.getItem("bglife.journal.v1")) localStorage.setItem("bglife.journal.v1", backup);
  }, serialize({ life, album: [] }));

  await page.goto("./");
  await page.getByRole("button", { name: /^Продължи/ }).tap();
  const assets = page.getByRole("navigation").getByRole("button", { name: "Състояние", exact: true });
  await expect(assets).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("navigation").getByRole("button", { name: "Места", exact: true })).toHaveCount(0);
  await page.getByRole("navigation").getByRole("button", { name: "Още", exact: true }).tap();
  await page.getByRole("button", { name: "Места", exact: true }).tap();
  await expect(page.getByRole("heading", { name: "Места", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Назад към Още", exact: true }).tap();
  await page.getByRole("button", { name: "Към дневника", exact: true }).tap();

  const menu = page.getByRole("region", { name: "Състояние", exact: true });
  await assets.tap();
  await expect(menu.getByText("Нетно състояние")).toHaveCount(0);
  await expect(menu.getByText("В портфейла")).toHaveCount(0);
  await menu.getByRole("button", { name: /^Имоти/ }).tap();
  await expect(page.getByText("Още нямаш жилище или автомобил.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Агенция за имоти/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Назад", exact: true }).tap();
  await menu.getByRole("button", { name: /^Други/ }).tap();
  await expect(page.getByText("Още нямаш вещи.")).toBeVisible();
  await page.getByRole("button", { name: "Назад", exact: true }).tap();
  await menu.getByRole("button", { name: "Харчи кинти", exact: true }).tap();
  for (const store of [/^Агенция за имоти/, /^Автокъща/, /^Бижутерски магазин/, /^Музикален магазин/, /^Луксозни стоки/]) {
    await expect(page.getByRole("button", { name: store })).toBeVisible();
  }
  await page.getByRole("button", { name: "Магазин за техника", exact: true }).tap();
  await page.getByRole("button", { name: /^Лаптоп/ }).tap();
  await page.locator('[data-asset-confirm="asset.buy.laptop"]').tap();
  await expect(page.getByRole("status")).toContainText("Лаптоп");
  await page.getByRole("button", { name: "Към дневника", exact: true }).tap();
  await expect(page.locator('[data-event-id="asset.buy.laptop"]')).toBeFocused();
  await expect(page.locator('[data-event-id="asset.buy.laptop"]')).toContainText("Купих лаптоп.");
  await page.getByTestId("advance").tap();

  await page.reload();
  await page.getByRole("button", { name: /^Продължи/ }).tap();
  await assets.tap();
  await menu.getByRole("button", { name: /^Други/ }).tap();
  await page.getByRole("button", { name: "Техника", exact: true }).tap();
  await page.getByRole("button", { name: /^Лаптоп/ }).tap();
  await expect(page.getByRole("meter", { name: "Състояние на притежанието" })).toHaveAttribute("aria-valuenow", "93");
  await page.getByRole("button", { name: /^Заложи/ }).tap();
  await page.locator('[data-asset-confirm="asset.pawn.laptop"]').tap();
  await expect(page.getByText("Залог · Откупи преди 21 г.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Продай/ })).toHaveCount(0);
  await page.getByRole("button", { name: /^Откупи/ }).tap();
  await page.locator('[data-asset-confirm="asset.release.laptop"]').tap();
  await expect(page.getByRole("button", { name: /^Продай/ })).toBeVisible();
  for (let level = 0; level < 3; level++) await page.getByRole("button", { name: "Назад", exact: true }).tap();
  await menu.getByRole("button", { name: /^Финанси/ }).tap();
  await expect(page.getByRole("button", { name: /^Средства/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Инвестиции/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Придобивки", exact: true }).tap();
  await page.getByRole("button", { name: /^Лаптоп/ }).tap();
  await expect(page.locator('[data-event-id="asset.buy.laptop"]')).toBeFocused();
});

function beforeWorkDecision() {
  for (let seed = 1; seed <= 50; seed++) {
    let life = startCareerLife(newLife(seed, null, "sofia"));
    while (life.age < 19 && !life.finished) life = playYear(life);
    if (life.finished) continue;
    for (const action of ["work.prepare", "work.apply.sofia-shop", "work.interview.sofia-shop.learn", "work.accept.sofia-shop"]) {
      life = doPathAction(life, action);
    }
    if (!life.path.work.job) continue;
    for (let year = 0; year < 4 && !life.finished; year++) {
      const next = playYear(life);
      if (getWorkDecision(next)) return life;
      life = next;
    }
  }
  throw new Error("Missing workplace fixture");
}

test("Career and Work have separate screens and workplace decisions go to the journal", async ({ page }) => {
  const life = beforeWorkDecision();
  const decision = getWorkDecision(playYear(life));
  await page.addInitScript(saved => {
    if (sessionStorage.getItem("work-fixture")) return;
    sessionStorage.setItem("work-fixture", "loaded");
    localStorage.setItem("bglife.language", "en");
    localStorage.setItem("bglife.journal.v1", saved);
  }, serialize({ life, album: [] }));
  await page.goto("./");
  const resume = page.getByRole("button", { name: /^Continue/ });
  await resume.tap();
  await page.locator('[data-tab="career"]').tap();
  await expect(page.getByRole("heading", { name: "Career", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vacancies · Sofia" })).toBeVisible();
  await page.getByTestId("open-workplace").tap();
  const work = page.getByTestId("workplace");
  await expect(work.getByRole("heading", { name: "Shop assistant" })).toBeVisible();
  await expect(work.getByRole("heading", { name: "Vacancies · Sofia" })).toHaveCount(0);
  await expect(work.locator("[data-work-contact]")).toHaveCount(3);
  await work.locator('[data-work-contact="boss"] button').first().tap();
  await work.getByRole("button", { name: "Ask for feedback" }).tap();
  await expect(work.getByRole("status")).toContainText("how to improve my work");
  await page.getByTestId("advance").tap();

  const prompt = page.getByTestId("work-decision");
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: decision.choices[0].label.en }).tap();
  await expect(prompt).toHaveCount(0);
  const entry = page.locator('[data-event-id="' + decision.choices[0].id + '"]');
  await expect(entry).toHaveCount(1);
  await expect(entry.locator("summary")).toBeVisible();
  await expect(entry.getByText(decision.situation.en, { exact: true })).toBeHidden();
  await entry.locator("summary").tap();
  await expect(entry.getByText(decision.situation.en, { exact: true })).toBeVisible();
  await expect(entry.getByText("I chose · " + decision.choices[0].label.en)).toBeVisible();
  await expect(entry.getByText(/^Performance \+/)).toBeVisible();
  await page.reload();
  await resume.tap();
  await expect(prompt).toHaveCount(0);
  await expect(entry).toHaveCount(1);
});

async function resumeFixture(page, life) {
  await page.addInitScript(save => {
    if (!localStorage.getItem("bglife.journal.v1")) localStorage.setItem("bglife.journal.v1", save);
    localStorage.setItem("bglife.language", "bg");
  }, serialize({ life, album: [] }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: /^Продължи/ }).tap();
}

function chapterAtShelf() {
  let life = newChapterLife(108);
  while (life.age < 20) {
    const next = playYear(life.age === 19 ? choose(life, "shared") : life);
    expect(next.age).toBe(life.age + 1);
    life = next;
  }
  return life;
}

test("closing a story dialog skips it after reload and allows the next year", async ({ page }) => {
  await resumeFixture(page, chapterAtShelf());
  const decision = page.getByRole("dialog", { name: "Чий е този рафт?" });
  await expect(decision).toBeVisible();
  await expect(page.locator(".life-timeline [data-choice]")).toHaveCount(0);
  await decision.getByRole("button", { name: "Пропусни събитието" }).tap();
  await page.locator('[data-tab="more"]').tap();
  await page.locator('[data-category="gym"]').tap();
  const run = page.locator('[data-activity-id="gym.run"]');
  await expect(run).toHaveAttribute("data-locked", "false");
  await run.tap();
  await page.locator('[data-activity-confirm="gym.run"]').tap();
  await page.getByRole("button", { name: "Към дневника", exact: true }).tap();
  await expect(decision).toHaveCount(0);
  await expect(page.locator('[data-event-id="gym.run"]')).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /^Продължи/ }).tap();
  await expect(decision).toHaveCount(0);
  await page.getByTestId("advance").tap();
  await expect(page.getByTestId("chapter-age")).toHaveText(/^21\b/);
  await expect(decision).toHaveCount(0);
  await expect(page.locator('[data-life-year="20"] [data-decision-result]')).toHaveCount(0);
});

test("choosing a response still records its outcome in the current year", async ({ page }) => {
  await resumeFixture(page, chapterAtShelf());
  const decision = page.getByRole("dialog", { name: "Чий е този рафт?" });
  await expect(decision).toBeVisible();
  await decision.getByRole("button", { name: "Запази бурканите за гости" }).tap();
  const result = page.locator('[data-decision-result][data-event-id="keep"]');
  await expect(decision).toHaveCount(0);
  await expect(result).toHaveCount(1);
  await expect(result).toBeFocused();
  await expect(result).toContainText("Под леглото");
  await expect(page.getByTestId("chapter-age")).toHaveText(/^20\b/);
  await page.reload();
  await page.getByRole("button", { name: /^Продължи/ }).tap();
  await expect(result).toHaveCount(1);
});

test("city invitations show options only after opening the dialog", async ({ page }) => {
  let life = startCareerLife(newLife(112, null, "burgas"));
  while (life.age < 16) {
    const next = playYear(life);
    expect(next.age).toBe(life.age + 1);
    life = next;
  }
  await resumeFixture(page, life);
  const dialog = page.getByTestId("decision-dialog");
  const invitation = page.locator("[data-city-opportunity]");
  const choice = "city-life.burgas.story.join";
  await expect(dialog).toHaveCount(0);
  await invitation.tap();
  await expect(dialog).toHaveAttribute("data-kind", "city");
  await dialog.locator('[data-choice="' + choice + '"]').tap();
  await expect(dialog).toHaveCount(0);
  await expect(invitation).toHaveCount(0);
  await expect(page.locator('[data-decision-result][data-event-id="' + choice + '"]')).toBeFocused();
});

test("a partner activity after a skipped decision uses the same local detail in its result and journal", async ({ page }) => {
  let life = newChapterLife(107);
  while (life.age < 18) {
    const next = playYear(life);
    expect(next.age).toBe(life.age + 1);
    life = next;
  }
  const [choice] = getChoices(life);
  if (choice) life = choose(life, choice.id);
  life = doLifeActivity(life, "family.tinder");
  expect(life.lifeSystems.family.partner).toBe("appMatch");
  life = playYear(life);
  expect(life.age).toBe(19);
  await resumeFixture(page, life);

  await page.getByTestId("decision-dialog").getByRole("button", { name: "Пропусни събитието" }).tap();
  await page.locator('[data-tab="people"]').tap();
  await page.locator('[data-person="appMatch"]').tap();
  await page.getByRole("button", { name: "Комплимент", exact: true }).tap();
  const compliment = page.getByRole("dialog", { name: "Комплимент" });
  await expect(compliment).toHaveAttribute("data-action-phase", "choose");
  await compliment.getByRole("button", { name: /За стила/ }).tap();
  await expect(compliment).toHaveAttribute("data-action-phase", "outcome");
  await expect(compliment).toContainText("Похвалих стила");
  await expect(compliment.getByRole("button", { name: "Потвърди" })).toHaveCount(0);
  await compliment.getByRole("button", { name: "Продължи" }).tap();

  await page.getByRole("button", { name: /Поръчайте вечеря/ }).tap();
  const outcome = page.getByRole("dialog", { name: "Поръчайте вечеря" });
  await expect(outcome).toHaveAttribute("data-action-phase", "outcome");
  await expect(outcome).toContainText("„Ергенът“");
  await expect(outcome.locator(".person-dialog-avatar")).toBeVisible();
  await expect(outcome.getByRole("meter", { name: "Връзката се подобри" })).toHaveCount(1);
  await expect(outcome.getByRole("button", { name: "Към дневника" })).toHaveCount(0);
  await outcome.getByRole("button", { name: "Продължи" }).tap();
  await expect(page.locator(".people-profile")).toContainText("Александър Георгиев");
  await page.getByRole("button", { name: "Назад към Хора" }).tap();
  await page.getByRole("button", { name: "Към дневника", exact: true }).tap();
  await expect(page.getByTestId("decision-dialog")).toHaveCount(0);
  await expect(page.locator('[data-event-id="people.appMatch.takeaway"]')).toContainText("„Ергенът“");
});

test("a brother's family activities take one tap and use first names and kinship in the result and journal", async ({ page }) => {
  let life = startCareerLife(newProfileLife({
    seed: 5, city: "tryavna", presentation: "female", avatar: defaultAvatar,
    profile: { name: "Лора Иванова", talent: "none", vip: true, wealthy: false, disposition: null },
  }));
  while (life.age < 8) {
    const next = playYear(life);
    expect(next.age).toBe(life.age + 1);
    life = next;
  }
  const id = "kin-sibling-0";
  await resumeFixture(page, life);
  await page.locator('[data-tab="people"]').tap();
  await page.locator('[data-person="' + id + '"]').tap();

  const timeId = "people." + id + ".family-time";
  await page.getByRole("button", { name: "Прекарайте време заедно", exact: true }).tap();
  life = doLifeActivity(life, timeId);
  const outcome = page.getByRole("dialog");
  await expect(outcome).toHaveAttribute("data-action-phase", "outcome");
  await expect(outcome.locator(".person-dialog-result")).toContainText("брат ми Александър");
  await expect(outcome.getByRole("meter")).toHaveAttribute("value", String(personRelationship(life, id)));
  await expect(outcome.locator(".person-dialog-result")).not.toContainText("Иванов");
  await outcome.getByRole("button", { name: "Продължи" }).tap();
  await expect(page.locator(".people-profile")).toContainText("Александър Иванов");

  const storyId = "people." + id + ".family-story";
  await page.getByRole("button", { name: "Попитай за семейна история", exact: true }).tap();
  const text = "Поговорих с брат ми Александър за живота в Трявна преди години. Остана ми в главата едно „Туй тука ли е?“";
  await expect(outcome.locator(".person-dialog-result")).toHaveText(text);
  await outcome.getByRole("button", { name: "Затвори" }).tap();
  await page.getByRole("button", { name: "Назад към Хора" }).tap();
  await page.getByRole("button", { name: "Към дневника", exact: true }).tap();
  await expect(page.locator('[data-event-id="' + storyId + '"]')).toContainText(text);
  await expect(page.locator('[data-event-id="' + timeId + '"]')).toHaveCount(1);
});

test("special careers keep casting, the current role and side projects on distinct screens", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 730 });
  let life;
  for (let seed = 1; seed <= 12; seed++) {
    let candidate = startCareerLife(newLife(seed, defaultAvatar, "sofia"));
    while (candidate.age < 19 && !candidate.finished) {
      if (candidate.age >= 15) {
        candidate = doPathAction(candidate, "special.actor.drama");
        candidate = doPathAction(candidate, "special.actor.camera");
      }
      candidate = playYear(candidate);
    }
    if (candidate.finished) continue;
    const audition = doPathAction(candidate, "special.actor.audition.sofia-background");
    if (audition.path.special?.actor.offer) { life = candidate; break; }
  }
  expect(life).toBeDefined();
  await page.addInitScript(saved => {
    if (sessionStorage.getItem("special-career-fixture")) return;
    sessionStorage.setItem("special-career-fixture", "loaded");
    localStorage.setItem("bglife.language", "en");
    localStorage.setItem("bglife.journal.v1", saved);
  }, serialize({ life, album: [] }));
  await page.goto("./");
  const resume = page.getByRole("button", { name: /^Continue/ });
  await resume.tap();
  const openSpecial = async () => {
    await page.locator('[data-tab="career"]').tap();
    await page.getByRole("button", { name: "Special", exact: true }).tap();
  };
  await openSpecial();
  await expect(page.getByTestId("special-careers")).toBeVisible();
  await expect(page.locator("[data-special-career]")).toHaveCount(4);
  await page.locator('[data-special-career="actor"]').tap();
  await page.locator("summary").filter({ hasText: "Under the Last Bridge" }).tap();
  const action = id => page.locator('[data-career-action="' + id + '"]');
  await action("special.actor.audition.sofia-background").tap();
  await action("special.actor.sign.sofia-background.fixed").tap();
  await page.getByTestId("open-workplace").tap();
  const work = page.getByTestId("workplace");
  await expect(work.getByRole("heading", { name: "Under the Last Bridge" })).toBeVisible();
  await expect(work.getByRole("button", { name: "Send a self-tape" })).toHaveCount(0);
  await action("special.actor.work.rehearse").tap();
  await expect(work.getByRole("status")).toContainText("toughest scene");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await openSpecial();
  await page.locator('[data-special-career="creator"]').tap();
  await action("special.creator.open.tiktok").tap();
  await action("special.creator.publish.long").tap();
  await expect(page.locator(".career-row").filter({ hasText: "Followers" })).not.toContainText(/^Followers0$/);
  await page.reload();
  await resume.tap();
  await openSpecial();
  await page.locator('[data-special-career="creator"]').tap();
  await expect(page.getByRole("heading", { name: "TikTok" })).toBeVisible();
  expect(Number(await page.locator(".career-row").filter({ hasText: "Followers" }).locator("strong").textContent())).toBeGreaterThan(0);
  await page.getByTestId("open-workplace").tap();
  await expect(work.getByRole("heading", { name: "Under the Last Bridge" })).toBeVisible();
});

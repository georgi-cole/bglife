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
  const confirm = page.locator('.person-dialog-actions').getByRole("button", { name: "Confirm", exact: true });
  await confirm.tap();
  await page.getByRole("button", { name: "Repeat", exact: true }).tap();
  await confirm.tap();

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

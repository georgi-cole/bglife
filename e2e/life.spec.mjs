import { expect, test as base } from "@playwright/test";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { builtGameServer, sitePath } from "./serve-built-game.mjs";
import { choose, doLifeActivity, getChoices, newChapterLife, playYear } from "../src/engine.ts";
import { familyRoll } from "../src/fertilityModel.ts";
import { startPregnancyPlay } from "../src/pregnancyTimeline.ts";
import { serialize } from "../src/session.ts";

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
  await expect(page.getByRole("button", { name: "Take on responsibility" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Return to work", exact: true })).toHaveCount(0);
  await play.tap();
  await expect(age).toHaveText(/^22(?!\d)/);
  await expect(leave).toContainText("Maternity leave · second year");
  await leave.getByRole("button", { name: "Career" }).tap();
  await expect(careerLeave).toContainText("4,785.72");
  await careerLeave.getByRole("button", { name: "Return to work", exact: true }).tap();
  await expect(careerLeave).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Take on responsibility" })).toBeVisible();
  await expect(age).toHaveText(/^22(?!\d)/);
});

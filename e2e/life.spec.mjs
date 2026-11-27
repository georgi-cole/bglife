import { expect, test as base } from "@playwright/test";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { builtGameServer, sitePath } from "./serve-built-game.mjs";
import { doPathAction, newLife, playYear, startCareerLife } from "../src/engine.ts";
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

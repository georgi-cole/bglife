import { expect, test as base } from "@playwright/test";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { defaultAvatar } from "../src/avatar.ts";
import { newProfileLife, playYear, startCareerLife } from "../src/engine.ts";
import { serialize } from "../src/sessionCodec.ts";
import { builtGameServer, sitePath } from "./serve-built-game.mjs";

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

test("Assets replaces Places and a shop purchase survives reload", async ({ page }) => {
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
  await expect(menu.getByText("Нетно състояние")).toBeVisible();
  await menu.getByRole("button", { name: /^Имоти/ }).tap();
  await expect(page.getByRole("button", { name: "Недвижими имоти", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Движимо имущество", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Назад", exact: true }).tap();
  await menu.getByRole("button", { name: /^Други/ }).tap();
  await page.getByRole("button", { name: "Техника", exact: true }).tap();
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
  await expect(page.getByRole("button", { name: /^Лаптоп/ })).toBeVisible();
  for (let level = 0; level < 2; level++) await page.getByRole("button", { name: "Назад", exact: true }).tap();
  await menu.getByRole("button", { name: /^Финанси/ }).tap();
  await expect(page.getByRole("button", { name: /^Средства/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Инвестиции/ })).toBeVisible();
  await page.getByRole("button", { name: "Придобивки", exact: true }).tap();
  await page.getByRole("button", { name: /^Лаптоп/ }).tap();
  await expect(page.locator('[data-event-id="asset.buy.laptop"]')).toBeFocused();
});

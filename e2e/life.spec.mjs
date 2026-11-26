import { expect, test as base } from "@playwright/test";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
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

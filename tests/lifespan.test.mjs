import assert from "node:assert/strict";
import test from "node:test";
import { defaultAvatar } from "../src/avatar.ts";
import { cities, cityIds } from "../src/cities.ts";
import { annualBudget, choose, decodeSave, doAction, doLifeActivity, encodeSave, getChoices, getPersonActivities,
  newChapterLife, newLife, playYear } from "../src/engine.ts";
import { annualMortality, districtHazardFactor, nationalMortality, PLAYER_MORTALITY_FACTOR } from "../src/mortality.ts";
import { districtLifeExpectancy } from "../src/mortalityData.ts";
import { deserialize, serialize } from "../src/session.ts";

function nextYear(life) {
  const next = playYear(life);
  if (next !== life) return next;
  const selection = getChoices(life)[0];
  assert.ok(selection, "a living age must have a way to advance");
  return playYear(choose(life, selection.id));
}

function playTo(life, age) {
  while (!life.finished && life.age < age) life = nextYear(life);
  assert.equal(life.age, age);
  assert.equal(life.finished, false);
  return life;
}

test("every district centre can start at birth and every oblast has a playable location", () => {
  assert.equal(cityIds.filter(city => cities[city].districtCentre !== false).length, 27);
  assert.equal(cityIds.length, 29);
  assert.deepEqual(new Set(cityIds.map(city => cities[city].district)), new Set(Object.keys(districtLifeExpectancy)));
  for (const city of cityIds) {
    const life = newLife(108, defaultAvatar, city);
    assert.equal(life.age, 0);
    assert.equal(life.city, city);
    assert.equal(life.history[0].id, "birth");
    assert.equal(life.history[0].text.bg.includes(cities[city].name.bg), true);
    assert.deepEqual(decodeSave(encodeSave(life)), life);
  }
});

test("the single-age baseline matches NSI and the player, sex and district produce different hazards", () => {
  assert.equal(nationalMortality(0, "male"), 0.00519);
  assert.equal(nationalMortality(0, "female"), 0.00417);
  assert.equal(nationalMortality(65, "male"), 0.02837);
  assert.equal(nationalMortality(65, "female"), 0.01174);
  assert.equal(nationalMortality(99, "female"), 0.31268);
  assert.ok(nationalMortality(130, "female") < 1);
  assert.ok(nationalMortality(130, "female") > nationalMortality(100, "female"));
  const profile = { age: 70, sex: "female", city: "varna" };
  const base = annualMortality(profile);
  const active = annualMortality({ ...profile, player: true });
  assert.ok(active > 0 && active < base);
  assert.ok(Math.abs(active - (1 - (1 - base) ** PLAYER_MORTALITY_FACTOR)) < 1e-12);
  assert.ok(annualMortality({ ...profile, health: 20 }) > annualMortality({ ...profile, health: 95 }));
  assert.ok(districtHazardFactor("SOF", "female") < districtHazardFactor("VID", "female"));
  const needsCare = annualMortality({ ...profile, condition: { cause: "heart", severity: "urgent" } });
  assert.ok(needsCare > base);
});

test("an independent move changes the current city once per year and persists through a replay", () => {
  const life = newLife(108, defaultAvatar, "varna");
  assert.equal(doAction(life, "move.vidin"), life);
  const adult = playTo(life, 19);
  assert.equal(doAction(adult, "move.unknown"), adult);
  const moved = doAction(adult, "move.vidin");
  assert.equal(moved.city, "vidin");
  assert.equal(moved.birthCity, "varna");
  assert.equal(adult.cash - moved.cash, 16_000);
  assert.equal(moved.history.at(-1).movedTo, "vidin");
  assert.equal(doAction(moved, "move.sofia"), moved);
  assert.deepEqual(decodeSave(encodeSave(moved)), moved);
  assert.equal(doAction(playYear(moved), "move.sofia").city, "sofia");
});

test("a completed old chapter resumes at 27 while the archived chapter and previous decisions are preserved", () => {
  let chapter = newChapterLife(108, defaultAvatar);
  while (!chapter.finished) chapter = nextYear(chapter);
  assert.equal(chapter.age, 26);
  const session = deserialize(serialize({ life: chapter, album: [chapter] }));
  assert.equal(session.life.age, 27);
  assert.equal(session.life.finished, false);
  assert.deepEqual(session.life.history.slice(0, chapter.history.length), chapter.history);
  assert.deepEqual(session.album[0], chapter);
  const year28 = playYear(session.life);
  assert.equal(year28.age, 28);
  assert.deepEqual(decodeSave(encodeSave(year28)), year28);
  const avatarOnly = deserialize(serialize({ life: newChapterLife(108, defaultAvatar), album: [] })).life;
  assert.equal(avatarOnly.age, 16);
  assert.deepEqual(decodeSave(encodeSave(avatarOnly)), avatarOnly);
});

test("infant death is possible, logged at age zero and cannot advance or roll again", () => {
  const life = newLife(733);
  const ended = playYear(life);
  assert.equal(ended.age, 0);
  assert.equal(ended.endReason, "death");
  assert.equal(ended.history.at(-1).kind, "end");
  assert.equal(ended.history.at(-1).id, "death");
  assert.equal(playYear(ended), ended);
  assert.deepEqual(decodeSave(encodeSave(ended)), ended);
});

test("a playable life can celebrate age 131, then ends there and remembers close people", () => {
  let life = newLife(26_809, defaultAvatar, "sofia");
  let at131;
  while (!life.finished) {
    if (life.age >= 19 && life.career === "student") life = doAction(life, "life.work");
    if (life.lifeSystems.medicalIssue) {
      life = doLifeActivity(life, life.lifeSystems.medicalIssue === "urgent" ? "hospital.emergency" : "hospital.clinic");
    }
    if (life.age >= 4 && life.stats.health < 100) life = doLifeActivity(life, "gym.walk");
    if (life.age === 131) at131 = life;
    life = nextYear(life);
  }
  assert.equal(at131.finished, false);
  assert.ok(at131.history.some(event => event.id === "131st-birthday"));
  assert.deepEqual(life.death, { age: 131, cause: "oldAge" });
  const named = Object.keys(life.deceased);
  assert.ok(named.length > 0);
  assert.ok(life.history.some(event => event.id === "loss-" + named[0]));
  assert.deepEqual(getPersonActivities(at131, named[0]), []);
  assert.deepEqual(decodeSave(encodeSave(life)), life);
});

test("retirement uses years in work, reduces earned income and remains in the saved life", () => {
  const working = doAction(playTo(newLife(26_809, defaultAvatar, "sofia"), 19), "life.work");
  const before = playTo(working, 64);
  assert.equal(doAction(before, "life.retire"), before);
  const eligible = nextYear(before);
  const retired = doAction(eligible, "life.retire");
  assert.equal(retired.retirement.age, 65);
  assert.ok(retired.serviceYears >= 37);
  assert.ok(annualBudget(retired).pay > 0 && annualBudget(retired).pay < annualBudget(eligible).pay);
  assert.equal(doAction(retired, "life.retire"), retired);
  const moved = doAction(retired, "move.pleven");
  assert.equal(moved.city, "pleven");
  assert.equal(annualBudget(moved).pay, annualBudget(retired).pay);
  assert.deepEqual(decodeSave(encodeSave(retired)), retired);
});

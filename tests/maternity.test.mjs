import test from "node:test";
import assert from "node:assert/strict";
import {
  choose, continueLife, decodeSave, doLifeActivity, doMaternityReturn, doPathAction, doPregnancyAction,
  encodeSave, getChoices, getScene, nameNewborns, newChapterLife, playYear, startCareerLife,
} from "../src/engine.ts";
import { serviceMonths } from "../src/employment.ts";
import { familyRoll } from "../src/fertilityModel.ts";
import { pathBudget } from "../src/lifePath.ts";
import { maternityStatus, maternityYear } from "../src/maternity.ts";
import { netMonthly, policy } from "../src/pathPolicy.ts";
import { startPregnancyPlay } from "../src/pregnancyTimeline.ts";
import { deserialize, serialize } from "../src/sessionCodec.ts";
import { drawWorkEvent, getWorkDecision, workplaceView } from "../src/workplace.ts";

const encounter = "people.appMatch.intimacy.unprotected";
const saved = life => assert.deepEqual(decodeSave(encodeSave(life)), life);

function pickStory(life) {
  const choices = getChoices(life);
  const choice = choices.find(option => option.id === "shared") ?? choices[0];
  return choice ? choose(life, choice.id) : life;
}

function ageTo(life, age) {
  while (life.age < age) {
    const next = playYear(pickStory(life));
    assert.equal(next.age, life.age + 1);
    life = next;
  }
  return pickStory(life);
}

function activity(life, id) {
  const next = doLifeActivity(life, id);
  assert.notEqual(next, life, id);
  return next;
}

function employedCouple(seed) {
  let life = ageTo(newChapterLife(seed), 21);
  life = activity(activity(life, "family.tinder"), "family.time-together");
  life = ageTo(life, 22);
  life = activity(activity(life, "family.time-together"), "family.commit");
  return startCareerLife(continueLife(ageTo(life, 24)));
}

function findSeed(condition) {
  for (let seed = 0; seed < 10_000; seed++) if (condition(seed)) return seed;
  assert.fail("No seed for the maternity scenario");
}

const nameBaby = life => nameNewborns(life, life.lifeSystems.reproduction.naming.newborns.map(baby => baby.firstName), "mother");

test("birth interrupts the pending work scene, replaces two years of wages and keeps the job", () => {
  const key = "couple.appMatch.21";
  const seed = findSeed(seed => familyRoll(seed, 24, "appMatch.conception") > 0.2
    && familyRoll(seed, 25, key + ".conception") < 0.08
    && familyRoll(seed, 25, key + ".loss") > 0.22 && familyRoll(seed, 25, key + ".late-loss") > 0.01);
  let life = startPregnancyPlay(activity(employedCouple(seed), encounter));
  const job = life.path.work.job;
  const service = serviceMonths(life.path.work);
  assert.ok(job && service >= 24);
  const workplace = workplaceView(life);
  const task = workplace.tasks[0].id;

  life = playYear(life);
  assert.equal(life.age, 25);
  assert.equal(getScene(life).id, "release-week");
  assert.equal(life.lifeSystems.reproduction.notice.kind, "test");
  life = doPregnancyAction(doPregnancyAction(life, "pregnancy-test"), "pregnancy-read");
  for (let i = 0; i < 4; i++) life = playYear(life);
  life = nameBaby(life);

  assert.equal(life.age, 25);
  assert.equal(getScene(life), null);
  assert.equal(maternityYear(life), 1);
  assert.equal(life.history.some(entry => entry.id === "maternity-first"), true);
  const firstYear = pathBudget(life, life.path);
  assert.equal(firstYear.wage, 0);
  assert.equal(firstYear.maternity, netMonthly(job.gross) * 12);
  assert.equal(firstYear.pay, firstYear.maternity);
  assert.strictEqual(doMaternityReturn(life), life);
  assert.strictEqual(doPathAction(life, "work.practice"), life);
  assert.strictEqual(doPathAction(life, "work.leave"), life);
  assert.strictEqual(doPathAction(life, task), life);
  assert.equal(workplaceView(life), null);
  assert.equal(getWorkDecision(life), null);
  saved(life);

  const second = playYear(life);
  assert.equal(second.age, 26);
  assert.equal(maternityYear(second), 2);
  assert.equal(second.path.work.job.job, job.job);
  assert.equal(drawWorkEvent(second), undefined);
  assert.equal(getWorkDecision(second), null);
  assert.strictEqual(doPathAction(second, task), second);
  assert.equal(second.path.work.job.performance, life.path.work.job.performance);
  assert.equal(serviceMonths(second.path.work), service + 24);
  assert.equal(second.history.some(entry => entry.id === "work-year-25"), false);
  assert.match(second.history.find(entry => entry.id === "year-25").text.en, /Maternity benefit/);
  const secondYear = pathBudget(second, second.path);
  assert.equal(secondYear.wage, 0);
  assert.equal(secondYear.maternity, 39881 * 12);

  const returned = doMaternityReturn(second);
  assert.equal(maternityStatus(returned), null);
  assert.equal(pathBudget(returned, returned.path).wage, netMonthly(job.gross) * 12);
  assert.equal(pathBudget(returned, returned.path).maternity, 39881 * 6);
  assert.deepEqual(workplaceView(returned).team.map(person => person.name), workplace.team.map(person => person.name));
  assert.notStrictEqual(doPathAction(returned, task), returned);
  assert.strictEqual(doMaternityReturn(returned), returned);
  saved(returned);

  const finished = playYear(second);
  assert.equal(finished.age, 27);
  assert.equal(maternityYear(finished), null);
  assert.equal(pathBudget(finished, finished.path).maternity, 0);
  assert.equal(pathBudget(finished, finished.path).wage, netMonthly(job.gross) * 12);
  assert.equal(finished.history.some(entry => entry.id === "maternity-finished"), true);
  saved(finished);
});

test("an older save with a newborn starts leave on resume and keeps its past journal", () => {
  const seed = findSeed(seed => familyRoll(seed, 24, "appMatch.conception") < 0.04
    && familyRoll(seed, 25, "player.Мила Николова.loss") > 0.25);
  let old = activity(employedCouple(seed), encounter);
  old = nameBaby(playYear(old));
  assert.equal(old.age, 25);
  assert.equal(getScene(old).id, "release-week");
  assert.equal(maternityStatus(old), null);

  const restored = deserialize(serialize({ life: old, album: [] })).life;
  assert.equal(restored.age, old.age);
  assert.equal(restored.cash, old.cash);
  assert.deepEqual(restored.history.slice(0, old.history.length), old.history);
  assert.equal(restored.history.at(-1).id, "maternity-first");
  assert.equal(getScene(restored), null);
  assert.equal(pathBudget(restored, restored.path).wage, 0);
  assert.ok(pathBudget(restored, restored.path).maternity > 0);
  saved(restored);
});

test("parenting at home without insured service does not add an insurance payment", () => {
  const seed = findSeed(seed => familyRoll(seed, 21, "appMatch.encounter.0.conception") < 0.04
    && familyRoll(seed, 21, "appMatch.encounter.0.loss") > 0.23
    && familyRoll(seed, 21, "appMatch.encounter.0.late-loss") > 0.01);
  let life = newChapterLife(seed);
  while (life.age < 21) {
    if (life.age === 19) {
      life = startCareerLife(continueLife(life));
      life = choose(life, "stay");
    }
    life = playYear(pickStory(life));
  }
  life = startPregnancyPlay(activity(pickStory(life), "family.tinder"));
  life = activity(life, encounter);
  life = doPregnancyAction(doPregnancyAction(life, "pregnancy-test"), "pregnancy-read");
  for (let i = 0; i < 4; i++) life = playYear(life);
  life = nameBaby(life);
  assert.equal(maternityYear(life), 1);
  assert.equal(pathBudget(life, life.path).maternity, 0);
  const next = playYear(life);
  assert.equal(next.age, 22);
  assert.equal(maternityYear(next), 2);
  assert.equal(pathBudget(next, next.path).maternity, 0);
  assert.equal(policy.maternity.insuredMonths, 12);
  saved(next);
});

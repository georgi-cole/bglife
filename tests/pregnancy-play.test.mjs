import test from "node:test";
import assert from "node:assert/strict";
import {
  advance, choose, continueLife, decodeSave, doLifeActivity, doPregnancyAction, encodeSave, getChoices,
  getPersonActivities, nameNewborns, newChapterLife, playYear,
} from "../src/engine.ts";
import { activeContraceptive, annualFailure, conceptionWithProtection } from "../src/contraception.ts";
import { birthCount, familyRoll } from "../src/fertilityModel.ts";
import { canEndPregnancy, pregnancyTurnLabel, startPregnancyPlay } from "../src/pregnancyTimeline.ts";
import { deserialize } from "../src/session.ts";

const unprotected = "people.appMatch.intimacy.unprotected";
const protectedEncounter = "people.appMatch.intimacy.protected";
const planned = "people.appMatch.intimacy.try";
const personOption = (s, id, person = "appMatch") => getPersonActivities(s, person).find(option => option.id === id);
const replay = s => assert.deepEqual(decodeSave(encodeSave(s)), s);

function pickStory(s) {
  const choices = getChoices(s);
  const choice = choices.find(option => option.id === "stay") ?? choices[0];
  return choice ? choose(s, choice.id) : s;
}

function act(s, id) {
  const next = doLifeActivity(s, id);
  assert.notStrictEqual(next, s, id);
  return next;
}

function grow(s, age) {
  while (s.age < age) {
    const next = s.endReason === "chapter" ? continueLife(s) : playYear(pickStory(s));
    assert.ok(next.age > s.age && !next.finished, "Could not reach age " + age + " from " + s.age);
    s = next;
  }
  return pickStory(s);
}

function couple(seed, age = 21) {
  let s = grow(newChapterLife(seed), 18);
  s = act(act(s, "family.tinder"), "family.time-together");
  s = grow(s, 19);
  s = act(act(s, "family.time-together"), "family.commit");
  return grow(s, age);
}

function findSeed(works) {
  for (let seed = 0; seed < 100_000; seed++) if (works(seed)) return seed;
  assert.fail("No matching test seed");
}

function confirmed(s) {
  assert.equal(s.lifeSystems.reproduction.notice?.kind, "test");
  const result = doPregnancyAction(s, "pregnancy-test");
  assert.equal(result.lifeSystems.reproduction.notice.kind, "confirmed");
  return doPregnancyAction(result, "pregnancy-read");
}

const random = (seed, age, event) => familyRoll(seed, age, event);
const firstEncounter = "appMatch.encounter.0";

test("relationship actions unlock with closeness, and the first kiss happens once", () => {
  const s = act(startPregnancyPlay(grow(newChapterLife(108), 21)), "family.tinder");
  const firstKiss = "people.appMatch.first-kiss";
  const holdHands = "people.appMatch.hold-hands";
  assert.ok(personOption(s, holdHands));
  assert.equal(personOption(s, firstKiss), undefined);
  const held = act(s, holdHands);
  const repeated = act(held, holdHands);
  assert.equal(repeated.lifeSystems.family.bond, held.lifeSystems.family.bond);
  const ready = act(repeated, "family.time-together");
  assert.ok(personOption(ready, firstKiss));
  assert.ok(personOption(ready, "people.appMatch.inside-joke"));
  const kissed = act(ready, firstKiss);
  assert.equal(kissed.lifeSystems.family.relationship.firstKissAt, 21);
  assert.equal(personOption(kissed, firstKiss), undefined);
  assert.strictEqual(doLifeActivity(kissed, firstKiss), kissed);
  const again = act(act(kissed, "people.appMatch.kiss"), "people.appMatch.kiss");
  replay(again);
});

test("multiple encounters in one year get independent draws and a test precedes confirmation", () => {
  const seed = findSeed(seed => random(seed, 21, firstEncounter + ".conception") >= 0.065
    && random(seed, 21, firstEncounter + ".suspicion") >= 0.02
    && random(seed, 21, "appMatch.encounter.1.conception") < 0.05);
  const initial = startPregnancyPlay(couple(seed));
  const first = act(initial, unprotected);
  assert.equal(first.lifeSystems.reproduction.notice, null);
  assert.equal(personOption(first, unprotected).blocked, null);
  assert.equal(personOption(first, protectedEncounter).blocked, null);
  const second = act(first, unprotected);
  assert.equal(second.age, initial.age);
  assert.equal(second.lifeSystems.reproduction.pregnancy, null);
  assert.equal(second.lifeSystems.reproduction.notice.kind, "test");
  assert.strictEqual(playYear(second), second);
  assert.equal(second.commands.filter(command => command.id === unprotected).length, 2);
  replay(second);
  replay(confirmed(second));
});

test("a missed period can lead to a negative test and the next Play advances a year", () => {
  const seed = findSeed(seed => random(seed, 21, firstEncounter + ".conception") > 0.1
    && random(seed, 21, firstEncounter + ".suspicion") < 0.02);
  const scare = act(startPregnancyPlay(couple(seed)), unprotected);
  const tested = doPregnancyAction(scare, "pregnancy-test");
  assert.equal(tested.lifeSystems.reproduction.notice.kind, "negative");
  assert.equal(tested.lifeSystems.reproduction.pregnancy, null);
  assert.equal(tested.history.at(-1).id, "pregnancy-negative");
  const read = doPregnancyAction(tested, "pregnancy-read");
  assert.equal(pregnancyTurnLabel(read), null);
  assert.equal(playYear(read).age, 22);
  replay(read);
});

test("Play advances through three trimesters and then delivers the scanned babies in the same year", () => {
  const seed = findSeed(seed => random(seed, 21, firstEncounter + ".conception") < 0.22
    && birthCount(21, "natural", random(seed, 21, firstEncounter + ".count")) === 2
    && random(seed, 21, firstEncounter + ".loss") > 0.20 && random(seed, 21, firstEncounter + ".late-loss") > 0.01
    && random(seed, 21, firstEncounter + ".scan.2.0") < 0.82);
  let s = confirmed(act(startPregnancyPlay(couple(seed)), planned));
  const yearCount = s.history.filter(event => event.kind === "year").length;
  const cash = s.cash;
  assert.equal(pregnancyTurnLabel(s).en, "Trimester 1");
  assert.equal(canEndPregnancy(s), true);
  assert.strictEqual(advance(s), s);
  s = playYear(s);
  assert.equal(s.lifeSystems.reproduction.pregnancy.gestation.trimester, 1);
  assert.match(s.history.at(-1).text.en, /twins/);
  assert.equal(canEndPregnancy(s), true);
  s = playYear(s);
  const prenatal = s.lifeSystems.reproduction.pregnancy.gestation;
  assert.equal(prenatal.trimester, 2);
  assert.equal(prenatal.knownSexes[0], prenatal.babies[0]);
  assert.strictEqual(doPregnancyAction(s, "pregnancy-end"), s);
  replay(s);
  s = playYear(s);
  assert.equal(pregnancyTurnLabel(s).en, "Birth");
  assert.equal(s.lifeSystems.family.children, 0);
  s = playYear(s);
  assert.equal(s.age, 21);
  assert.equal(s.cash, cash);
  assert.equal(s.history.filter(event => event.kind === "year").length, yearCount);
  assert.deepEqual(s.lifeSystems.family.childProfiles.map(child => child.gender), prenatal.babies);
  assert.equal(s.lifeSystems.reproduction.naming.newborns.length, 2);
  assert.strictEqual(playYear(s), s);
  s = nameNewborns(s, ["Ива", "Рая"], "mother");
  assert.equal(pregnancyTurnLabel(s), null);
  const following = playYear(s);
  assert.equal(following.age, 22);
  assert.equal(following.lifeSystems.reproduction.notice, null);
  replay(following);
});

test("a miscarriage returns to yearly Play and encounters do not reroll recovery that year", () => {
  const seed = findSeed(seed => random(seed, 21, firstEncounter + ".conception") < 0.22
    && random(seed, 21, firstEncounter + ".loss") < 0.10 && random(seed, 21, firstEncounter + ".loss-stage") < 0.8
    && random(seed, 21, "after-loss.player.Мила Николова.conception") >= 0.01);
  const expecting = confirmed(act(startPregnancyPlay(couple(seed)), planned));
  const lost = playYear(expecting);
  assert.equal(lost.age, 21);
  assert.equal(lost.lifeSystems.reproduction.notice.kind, "loss");
  assert.equal(lost.lifeSystems.reproduction.pregnancy, null);
  let s = doPregnancyAction(lost, "pregnancy-read");
  for (let n = 0; n < 80; n++) s = act(s, unprotected);
  assert.equal(s.lifeSystems.reproduction.notice, null);
  assert.equal(pregnancyTurnLabel(s), null);
  replay(s);
});

test("first-trimester termination uses one shared same-year retry with a 1% ceiling", () => {
  const seed = findSeed(seed => random(seed, 21, firstEncounter + ".conception") < 0.22
    && random(seed, 21, "after-loss.player.Мила Николова.conception") < 0.01);
  const initial = confirmed(act(startPregnancyPlay(couple(seed)), planned));
  const terminated = doPregnancyAction(initial, "pregnancy-end");
  assert.equal(terminated.lifeSystems.reproduction.notice.kind, "termination");
  const retry = act(doPregnancyAction(terminated, "pregnancy-read"), unprotected);
  assert.equal(retry.lifeSystems.reproduction.notice.kind, "test");
  assert.equal(retry.lifeSystems.reproduction.recoveries["player.Мила Николова"].retried, true);
  const secondEnd = doPregnancyAction(confirmed(retry), "pregnancy-end");
  let s = doPregnancyAction(secondEnd, "pregnancy-read");
  for (let n = 0; n < 10; n++) s = act(s, unprotected);
  assert.equal(s.lifeSystems.reproduction.notice, null);
  replay(s);
});

test("contraception changes chances, supports method changes, and keeps tubal ligation permanent", () => {
  for (const method of ["pill", "iud", "tubal"]) {
    const protectedChance = conceptionWithProtection(0.85, method, false);
    assert.ok(Math.abs(protectedChance - annualFailure[method]) < 1e-12);
    assert.ok(conceptionWithProtection(0.12, method, false) > 0);
    assert.ok(conceptionWithProtection(0.12, method, true) < conceptionWithProtection(0.12, method, false));
  }
  assert.ok(Math.abs(conceptionWithProtection(0.85, null, true) - annualFailure.condom) < 1e-12);
  let s = act(startPregnancyPlay(couple(108)), "fertility.contraception-pill");
  assert.equal(activeContraceptive(s), "pill");
  assert.ok(personOption(s, planned).blocked);
  s = act(act(s, "fertility.contraception-stop"), "fertility.contraception-iud");
  assert.equal(activeContraceptive({ ...s, age: 30 }), "iud");
  assert.equal(activeContraceptive({ ...s, age: 31 }), null);
  s = act(s, "fertility.contraception-tubal");
  assert.equal(activeContraceptive(s), "tubal");
  assert.strictEqual(doLifeActivity(s, "fertility.contraception-stop"), s);
  assert.strictEqual(doLifeActivity(s, "fertility.contraception-pill"), s);
  replay(s);
});

test("an established couple can discover pregnancy without an explicit intimacy action", () => {
  const chance = conceptionWithProtection(1 - 0.75 ** 2, null, true);
  const seed = findSeed(seed => random(seed, 21, "couple.appMatch.18.conception") < chance);
  const s = startPregnancyPlay(couple(seed, 20));
  const next = playYear(s);
  assert.equal(next.age, 21);
  assert.equal(next.lifeSystems.reproduction.notice.kind, "test");
  assert.ok(next.history.some(event => event.id === "pregnancy-suspected"));
  assert.equal(next.commands.some(command => command.id?.includes(".intimacy.")), false);
  replay(confirmed(next));
});

test("five- and ten-year milestones use separate relationship and wedding dates", () => {
  let s = startPregnancyPlay(continueLife(grow(newChapterLife(108), 18)));
  s = act(act(act(s, "family.dating-service"), "family.time-together"), "family.commit");
  s = grow(s, 19);
  s = act(act(s, "family.time-together"), "family.engage");
  s = act(grow(s, 20), "family.marry");
  assert.equal(s.lifeSystems.family.relationship.marriedAt, 20);
  const later = grow(s, 30);
  assert.deepEqual(later.history.filter(event => event.id === "relationship-anniversary").map(event => event.age), [23, 28]);
  assert.deepEqual(later.history.filter(event => event.id === "wedding-anniversary").map(event => event.age), [25, 30]);
  const ended = grow(act(later, "family.break-up"), 35);
  assert.equal(ended.history.filter(event => event.id === "relationship-anniversary").length, 2);
  replay(ended);
});

test("active prior saves resume a known pregnancy with trimester Play and keep the old diary", () => {
  const seed = findSeed(seed => random(seed, 21, "appMatch.conception") < 0.22);
  const old = act(couple(seed), planned);
  assert.equal(old.lifeSystems.reproduction.pregnancy.gestation, undefined);
  assert.ok(personOption(old, planned).blocked);
  const raw = JSON.stringify({ version: 1, life: encodeSave(old), album: [encodeSave(old)] });
  const restored = deserialize(raw);
  assert.equal(restored.life.lifeSystems.reproduction.pregnancy.gestation.trimester, 0);
  assert.equal(restored.album[0].lifeSystems.reproduction.pregnancy.gestation, undefined);
  assert.deepEqual(restored.life.history, old.history);
  replay(restored.life);
});

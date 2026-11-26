import test from "node:test";
import assert from "node:assert/strict";
import { defaultMaleAvatar } from "../src/avatar.ts";
import {
  choose, continueLife, decodeSave, doAction, doLifeActivity, encodeSave, getActions, getChoices, getLifeActivities, getPersonActivities,
  nameNewborns, newChapterLife, newProfileLife, playYear,
} from "../src/engine.ts";
import { birthCount, clinicChance, familyRoll, menopauseAge, miscarriageChance, naturalChance } from "../src/fertilityModel.ts";
import { personAge, personGender, personName, personSeed } from "../src/peopleIdentity.ts";
import { rollDeath } from "../src/mortality.ts";
import { deserialize, serialize } from "../src/session.ts";

function story(s) {
  const choices = getChoices(s);
  if (!choices.length) return s;
  const option = (s.age === 19 && choices.find(choice => choice.id === "stay")) || choices[0];
  return choose(s, option.id);
}

function birthday(s) {
  const next = playYear(story(s));
  assert.notEqual(next, s);
  return next;
}

function ageUp(s, age) {
  while (s.age < age) {
    s = s.endReason === "chapter" ? continueLife(s) : birthday(s);
  }
  return story(s);
}

function activity(s, id) {
  const next = doLifeActivity(s, id);
  assert.notEqual(next, s, id);
  return next;
}

const replay = s => assert.deepEqual(decodeSave(encodeSave(s)), s);

function findSeed(predicate) {
  for (let seed = 0; seed < 100_000; seed++) if (predicate(seed)) return seed;
  assert.fail("No seed for the scenario");
}

function startDating(s, id) {
  return activity(activity(s, id), "family.time-together");
}

function couple(seed, age, { male = false, married = false, begins = 18 } = {}) {
  let s = ageUp(newChapterLife(seed, male ? defaultMaleAvatar : null), begins);
  s = startDating(s, male ? "family.dating-service" : "family.tinder");
  s = story(birthday(s));
  s = activity(activity(s, "family.time-together"), "family.commit");
  if (married) {
    s = story(birthday(s));
    s = activity(activity(s, "family.engage"), "family.marry");
  }
  return ageUp(s, age);
}

const player = "player.Мила Николова";
const partner = "appMatch";
const attempt = "people.appMatch.intimacy.try";
const conceptionDraw = (seed, age, id = partner) => familyRoll(seed, age, id + ".conception");
const lossDraw = (seed, due, mother = player) => familyRoll(seed, due, mother + ".loss");

test("fertility climbs down through the 40s with a rare chance before menopause", () => {
  assert.equal(naturalChance(27, 51, true, false), 0.25);
  assert.equal(naturalChance(40, 51, true, false), 0.10);
  assert.ok(naturalChance(46, 52, true, false) > naturalChance(50, 52, true, false));
  assert.ok(naturalChance(50, 52, true, false) > 0);
  assert.equal(naturalChance(52, 52, true, false), 0);
  assert.ok(naturalChance(31, 52, false, false) < naturalChance(31, 52, true, false));
  assert.ok(miscarriageChance(43, "natural") > miscarriageChance(27, "natural"));
  assert.ok(clinicChance("donor-ivf", 46, 51, false) > clinicChance("ivf", 46, 51, false));
  assert.equal(birthCount(29, "natural", 0.0001), 3);
  assert.equal(birthCount(29, "natural", 0.01), 2);
  assert.equal(birthCount(29, "natural", 0.4), 1);
});

test("consensual adult intimacy respects protection, contact gender and the yearly action limit", () => {
  const teen = newChapterLife(14);
  assert.equal(getLifeActivities(teen).filter(item => item.category === "fertility" || item.category === "adoption").length, 0);
  assert.strictEqual(doLifeActivity(teen, "family.casual.unprotected"), teen);

  const seed = findSeed(seed => conceptionDraw(seed, 21) < naturalChance(21, 51, false, false));
  const s = couple(seed, 21);
  assert.ok(getPersonActivities(s, partner).some(item => item.id === attempt));
  const protectedLife = activity(s, "people.appMatch.intimacy.protected");
  assert.equal(protectedLife.lifeSystems.reproduction.pregnancy, null);
  assert.strictEqual(doLifeActivity(protectedLife, "people.appMatch.intimacy.unprotected"), protectedLife);
  const unprotected = activity(s, "people.appMatch.intimacy.unprotected");
  assert.equal(unprotected.lifeSystems.reproduction.pregnancy.dueAge, 22);
  replay(unprotected);

  let sameSex = ageUp(newChapterLife(14), 21);
  sameSex = activity(sameSex, "family.dating-service");
  assert.ok(!getPersonActivities(sameSex, "serviceMatch").some(item => item.id.endsWith(".try")));
  sameSex = activity(sameSex, "people.serviceMatch.intimacy.unprotected");
  assert.equal(sameSex.lifeSystems.reproduction.pregnancy, null);
  replay(sameSex);
});

test("the mother's age and name are tracked when the player is the father", () => {
  const mother = "serviceMatch.Даниела Маринова";
  const seed = findSeed(seed => conceptionDraw(seed, 22, "serviceMatch") < 0.16 && lossDraw(seed, 23, mother) > 0.20);
  const father = couple(seed, 22, { male: true });
  assert.equal(getLifeActivities(father).some(item => item.category === "fertility"), false);
  const expecting = activity(father, "people.serviceMatch.intimacy.try");
  assert.equal(expecting.lifeSystems.reproduction.pregnancy.mother.age, 24);
  assert.equal(expecting.lifeSystems.reproduction.pregnancy.mother.id, "serviceMatch");
  assert.equal(expecting.lifeSystems.reproduction.pregnancy.father.id, "player");
  const born = birthday(expecting);
  assert.deepEqual(born.lifeSystems.reproduction.naming.surnames, ["mother", "father"]);
  replay(born);
});

test("newborns receive an editable Bulgarian name and a surname from the parents at birth", () => {
  const seed = findSeed(seed => conceptionDraw(seed, 22) < 0.25 && lossDraw(seed, 23) > 0.20
    && birthCount(22, "natural", familyRoll(seed, 23, player + ".birth-count")) === 1);
  const expecting = activity(couple(seed, 22), attempt);
  assert.equal(expecting.lifeSystems.family.children, 0);
  assert.equal(expecting.history.at(-1).age, 22);
  const born = birthday(expecting);
  const profile = born.lifeSystems.family.childProfiles[0];
  assert.equal(born.history.at(-1).id, "birth");
  assert.equal(profile.joinedAt, 23);
  assert.equal(personAge(born, "child-0"), 0);
  assert.ok(born.lifeSystems.reproduction.naming.newborns[0].firstName);
  assert.deepEqual(born.lifeSystems.reproduction.naming.surnames, ["mother", "father"]);
  assert.strictEqual(playYear(born), born);
  assert.strictEqual(nameNewborns(born, ["<html>"], "father"), born);
  replay(born);

  const named = nameNewborns(born, ["  Стоян "], "father");
  const inflection = personGender(named, "child-0") === "female" ? "а" : "";
  assert.equal(personName(named, "child-0").bg, "Стоян Александров" + inflection + " Георгиев" + inflection);
  assert.equal(personName(named, "child-0").en, "Stoyan Aleksandrov" + (inflection ? "a" : "") + " Georgiev" + (inflection ? "a" : ""));
  assert.strictEqual(nameNewborns(named, ["Петър"], "mother"), named);
  replay(named);

  const married = birthday(activity(couple(seed, 22, { married: true }), attempt));
  assert.deepEqual(married.lifeSystems.reproduction.naming.surnames, ["father"]);
  assert.strictEqual(nameNewborns(married, ["Димитър"], "mother"), married);
  replay(nameNewborns(married, ["Димитър"], "father"));

  const apart = birthday(activity(expecting, "family.break-up"));
  assert.deepEqual(apart.lifeSystems.reproduction.naming.surnames, ["mother", "father"]);
  assert.equal(apart.lifeSystems.reproduction.naming.father.id, partner);
  replay(apart);
});

test("pregnancy loss is recorded on the next birthday without opening the naming form", () => {
  const seed = findSeed(seed => conceptionDraw(seed, 23) < 0.25 && lossDraw(seed, 24) < miscarriageChance(23, "natural"));
  const next = birthday(activity(couple(seed, 23), attempt));
  assert.equal(next.history.at(-1).id, "pregnancy-loss");
  assert.equal(next.lifeSystems.reproduction.pregnancy, null);
  assert.equal(next.lifeSystems.reproduction.naming, null);
  assert.equal(next.lifeSystems.family.children, 0);
  replay(next);
});

test("a conception at the chapter boundary is resolved at 27 and older natural pregnancies remain reachable", () => {
  const chapterSeed = findSeed(seed => conceptionDraw(seed, 26) < 0.25 && lossDraw(seed, 27) > 0.20);
  const pregnant = activity(couple(chapterSeed, 26), attempt);
  const end = birthday(pregnant);
  assert.equal(end.endReason, "chapter");
  assert.equal(end.lifeSystems.reproduction.pregnancy.dueAge, 27);
  replay(end);
  const continued = continueLife(decodeSave(encodeSave(end)));
  assert.equal(continued.age, 27);
  assert.equal(continued.history.at(-1).id, "birth");
  replay(continued);

  const seed = findSeed(seed => naturalChance(46, menopauseAge(seed, player), true, false) > conceptionDraw(seed, 46)
    && lossDraw(seed, 47) > miscarriageChance(46, "natural"));
  const older = couple(seed, 46, { begins: 44 });
  assert.ok(older.history.some(entry => entry.id === "family-questions" && entry.age === 27));
  const expecting = activity(older, attempt);
  assert.equal(expecting.lifeSystems.reproduction.pregnancy.mother.age, 46);
  assert.match(expecting.history.at(-1).text.en, /Rumi|Eli/);
  const birth = birthday(expecting);
  assert.match(birth.history.at(-1).text.en, /Rumi|Eli|neighbour/);
  replay(birth);
});

test("clinic treatment persists and a multiple birth creates a separate playable profile for each child", () => {
  const seed = findSeed(seed => familyRoll(seed, 24, "clinic.iui") < clinicChance("iui", 24, 51, false)
    && birthCount(24, "iui", familyRoll(seed, 25, player + ".birth-count")) === 3 && lossDraw(seed, 25) > 0.20);
  let s = ageUp(newChapterLife(seed), 24);
  const beforeEvaluation = s;
  assert.strictEqual(doLifeActivity(s, "fertility.iui"), s);
  if (s.lifeSystems.medicalIssue === "urgent") s = activity(s, "hospital.emergency");
  s = activity(s, "fertility.checkup");
  const treated = activity(s, "fertility.treatment");
  assert.equal(treated.lifeSystems.reproduction.treatmentUntil, 25);
  replay(treated);
  assert.equal(treated.lifeSystems.reproduction.evaluationAt, beforeEvaluation.age);
  s = activity(s, "fertility.iui");
  assert.equal(s.lifeSystems.reproduction.pregnancy.father, null);
  let born = birthday(s);
  assert.equal(born.lifeSystems.family.children, 3);
  assert.equal(new Set(born.lifeSystems.reproduction.naming.newborns.map(baby => baby.firstName)).size, 3);
  assert.deepEqual(born.lifeSystems.reproduction.naming.surnames, ["mother"]);
  born = story(nameNewborns(born, ["Анна", "Мария", "Стоян"], "mother"));
  const third = getPersonActivities(born, "child-2").find(item => item.id === "people.child-2.bedtime");
  assert.equal(third.blocked, null);
  born = activity(born, third.id);
  assert.equal(born.lifeSystems.family.childProfiles[2].bond, 68);
  replay(born);
});

test("adoption advances through assessment, matching and a player decision", () => {
  let s = ageUp(newChapterLife(117), 21);
  s = activity(s, "adoption.apply");
  assert.equal(s.lifeSystems.reproduction.adoption.stage, "review");
  assert.equal(s.lifeSystems.family.children, 0);
  s = birthday(s);
  assert.equal(s.lifeSystems.reproduction.adoption.stage, "waiting");
  s = birthday(s);
  assert.equal(s.lifeSystems.reproduction.adoption.stage, "offer");
  replay(s);
  const passed = activity(s, "adoption.decline");
  assert.equal(passed.lifeSystems.reproduction.adoption.stage, "waiting");
  assert.strictEqual(doLifeActivity(passed, "adoption.accept"), passed);
  const nextOffer = birthday(passed);
  const child = nextOffer.lifeSystems.reproduction.adoption;
  assert.equal(child.stage, "offer");
  const joined = activity(nextOffer, "adoption.accept");
  assert.equal(joined.lifeSystems.reproduction.adoption, null);
  assert.equal(joined.lifeSystems.family.children, 1);
  assert.equal(joined.lifeSystems.family.childProfiles[0].origin, "adoption");
  assert.equal(personAge(joined, "child-0"), child.age);
  assert.match(personName(joined, "child-0").bg, new RegExp("^" + child.firstName + " "));
  assert.ok(joined.age - child.age >= 15 && joined.age - child.age <= 50);
  replay(joined);
});

function customLife(seed) {
  return newProfileLife({
    seed, city: "varna", presentation: "male", avatar: defaultMaleAvatar,
    profile: { name: "Явор Тодоров", talent: "none", vip: false, wealthy: false, disposition: null },
  });
}

test("a named life started at birth passes its own surname to the next generation", () => {
  const mother = "serviceMatch.Даниела Маринова";
  const seed = findSeed(seed => conceptionDraw(seed, 23, "serviceMatch") < 0.25 && lossDraw(seed, 24, mother) > 0.2
    && birthCount(25, "natural", familyRoll(seed, 24, mother + ".birth-count")) === 1
    && !rollDeath({ age: 25, sex: "female", city: "varna" }, personSeed(seed, "serviceMatch")));
  let s = ageUp(customLife(seed), 20);
  assert.equal(s.history[0].age, 0);
  const work = getActions(s).find(item => item.id.startsWith("life.work."));
  assert.ok(work);
  s = ageUp(doAction(s, work.id), 21);
  s = startDating(s, "family.dating-service");
  s = birthday(s);
  s = ageUp(activity(activity(s, "family.time-together"), "family.commit"), 23);
  s = activity(s, "people.serviceMatch.intimacy.try");
  assert.equal(s.lifeSystems.reproduction.pregnancy.father.name.bg, "Явор Тодоров");
  const born = birthday(s);
  assert.equal(born.lifeSystems.reproduction.naming.father.name.en, "Yavor Todorov");
  assert.strictEqual(doAction(born, "move.sofia"), born);
  const female = personGender(born, "child-0") === "female";
  const saved = nameNewborns(born, [female ? "Рая" : "Стоян"], "father");
  assert.equal(personName(saved, "child-0").bg, female ? "Рая Яворова Тодорова" : "Стоян Яворов Тодоров");
  assert.equal(saved.city, "varna");
  replay(saved);
});

test("a partner's death settles a pending pregnancy and closes a joint adoption application", () => {
  const seed = findSeed(seed => conceptionDraw(seed, 22, "serviceMatch") < 0.25
    && rollDeath({ age: 24, sex: "female", city: "tryavna" }, personSeed(seed, "serviceMatch")));
  let s = continueLife(couple(seed, 22, { male: true, married: true }));
  s = activity(s, "adoption.apply");
  s = activity(s, "people.serviceMatch.intimacy.try");
  assert.equal(s.lifeSystems.reproduction.adoption.stage, "review");
  assert.ok(s.lifeSystems.reproduction.pregnancy);
  const next = birthday(s);
  assert.ok(next.deceased.serviceMatch);
  assert.equal(next.lifeSystems.reproduction.pregnancy, null);
  assert.equal(next.lifeSystems.reproduction.adoption, null);
  assert.equal(next.lifeSystems.family.children, 0);
  assert.ok(next.history.some(event => event.id === "pregnancy-loss" && event.age === 23));
  assert.ok(next.history.some(event => event.id === "adoption-household" && event.age === 23));
  replay(next);
});

test("existing lifespan saves keep their journal and receive family conversations on future birthdays", () => {
  const played = ageUp(customLife(108), 30);
  const transcript = JSON.parse(encodeSave(played));
  assert.equal(transcript.version, 3);
  delete transcript.familyEventsFrom;
  const raw = JSON.stringify(transcript);
  const session = deserialize(JSON.stringify({ version: 1, life: raw, album: [raw] }));
  assert.ok(session);
  const earlierEntries = played.history.filter(event => event.id !== "family-questions");
  assert.deepEqual(session.life.history, earlierEntries);
  assert.deepEqual(session.album[0].history, earlierEntries);
  assert.equal(session.life.lifeSystems.reproduction.familyEventsFrom, played.commands.length);
  assert.equal(session.album[0].lifeSystems.reproduction.familyEventsFrom, null);

  const advanced = birthday(session.life);
  assert.equal(advanced.age, 31);
  assert.deepEqual(advanced.history.filter(event => event.id === "family-questions").map(event => event.age), [31]);
  assert.deepEqual(deserialize(serialize({ ...session, life: advanced })).life, advanced);
});

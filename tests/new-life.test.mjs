import assert from "node:assert/strict";
import test from "node:test";
import { defaultAvatar } from "../src/avatar.ts";
import { generateBirthFamily } from "../src/birthFamily.ts";
import { cityIds } from "../src/cities.ts";
import { cityCulture, voices } from "../src/cityCulture.ts";
import { cityPaths, jobTypes, studyFields } from "../src/cityPaths.ts";
import { annualBudget, decodeSave, doAction, doLifeActivity, encodeSave, getActions, getPersonActivities,
  newLife, newProfileLife, playYear } from "../src/engine.ts";
import { automaticAppearance, bilingualName, HEIR_CASH, parseLifeProfile } from "../src/lifeProfile.ts";
import { personAge, personName, personRelationship } from "../src/peopleIdentity.ts";

const defaultProfile = { name: "Лора Иванова", talent: "none", vip: false, wealthy: false, disposition: null };
const start = (overrides = {}) => newProfileLife({ seed: 108, city: "plovdiv", presentation: "female",
  avatar: defaultAvatar, profile: defaultProfile, ...overrides });
const toAge = (original, age) => {
  let life = original;
  while (life.age < age && !life.finished) {
    const next = playYear(life);
    assert.notEqual(next, life);
    life = next;
  }
  assert.equal(life.age, age);
  assert.equal(life.finished, false);
  return life;
};

test("every newly created profile starts at birth and both normal and VIP appearance are enforced", () => {
  const normal = start({ avatar: { ...defaultAvatar, skin: "deep" } });
  assert.equal(normal.age, 0);
  assert.equal(normal.cash, 0);
  assert.deepEqual(normal.avatar, automaticAppearance("female", 108));
  assert.equal(bilingualName(normal.profile.name).en, "Lora Ivanova");
  assert.ok(normal.history[0].text.bg.includes("Пловдив"));
  assert.equal(parseLifeProfile({ ...defaultProfile, wealthy: true }), null);
  assert.equal(parseLifeProfile({ ...defaultProfile, disposition: "curious" }), null);
  const vip = start({ avatar: { ...defaultAvatar, skin: "deep" },
    profile: { ...defaultProfile, vip: true, wealthy: true, disposition: "curious" } });
  assert.equal(vip.age, 0);
  assert.equal(vip.avatar.skin, "deep");
  assert.equal(vip.cash, HEIR_CASH);
  assert.equal(vip.stats.brains, normal.stats.brains + 10);
  assert.deepEqual(decodeSave(encodeSave(vip)), vip);
  const old = newLife(42);
  assert.equal(decodeSave(encodeSave(old)).birthFamily, null);
});

test("birth families include all care arrangements and follow the NSI first-birth share", () => {
  const arrangements = new Set();
  let firstBorn = 0;
  let unknownFamily = 0;
  let singleGrandmother = 0;
  let twoGrandmothers = 0;
  let motherInSofia = 0;
  let motherInSliven = 0;
  let regionalPairs = 0;
  for (let seed = 0; seed < 12_000; seed++) {
    const inSofia = generateBirthFamily(seed, "sofia", "Лора Иванова");
    arrangements.add(inSofia.upbringing);
    if (inSofia.relatives.length === 0) unknownFamily++;
    if (!inSofia.relatives.some(relative => relative.role === "sibling")) firstBorn++;
    const atHome = inSofia.relatives.filter(relative => relative.household);
    if (inSofia.relatives.length === 1 && atHome[0]?.role === "grandmother") singleGrandmother++;
    if (atHome.filter(relative => relative.role === "grandmother").length === 2 && inSofia.upbringing === "grandparents")
      twoGrandmothers++;
    if (inSofia.upbringing !== "foster") assert.ok(atHome.length > 0);
    if (inSofia.orphan) assert.ok(inSofia.relatives.every(relative => relative.role !== "mother" && relative.role !== "father"));
    const mom = inSofia.relatives.find(relative => relative.role === "mother");
    if (seed < 2000 && mom) {
      const other = generateBirthFamily(seed, "sliven", "Лора Иванова").relatives.find(relative => relative.role === "mother");
      assert.ok(other);
      motherInSofia += mom.ageAtBirth;
      motherInSliven += other.ageAtBirth;
      regionalPairs++;
    }
  }
  assert.equal(arrangements.size, 6);
  assert.ok(firstBorn / 12_000 > .47 && firstBorn / 12_000 < .52);
  assert.ok(unknownFamily > 0 && unknownFamily / 12_000 < .003);
  assert.ok(singleGrandmother > 0 && twoGrandmothers > 0);
  assert.ok((motherInSofia - motherInSliven) / regionalPairs > 6);
});

test("natal relatives age and remember interaction through a save", () => {
  const life = start();
  const mother = life.birthFamily.relatives.find(relative => relative.role === "mother");
  assert.ok(mother);
  assert.deepEqual(getPersonActivities(life, mother.id), []);
  const child = toAge(life, 7);
  assert.equal(personAge(child, mother.id), personAge(life, mother.id) + 7);
  const [activity] = getPersonActivities(child,mother.id);
  assert.ok(activity && !activity.blocked);
  const updated = doLifeActivity(child, activity.id);
  assert.ok(personRelationship(updated,mother.id) > personRelationship(child,mother.id));
  assert.equal(personName(updated,mother.id).bg, mother.name.bg);
  assert.deepEqual(decodeSave(encodeSave(updated)), updated);
});

test("a child's remaining parent takes over after a recorded family loss", () => {
  const life = start({ seed: 18 });
  const after = toAge(life, 3);
  assert.ok(after.deceased["kin-mother"]);
  assert.ok(after.history.some(event => event.id === "loss-kin-mother"));
  const change = after.history.find(event => event.id === "caregiver-2");
  assert.ok(change.text.bg.includes(personName(after,"kin-father").bg));
  assert.deepEqual(getPersonActivities(after,"kin-mother"),[]);
  assert.deepEqual(decodeSave(encodeSave(after)),after);
});

test("all cities supply complete playable content and use it for study and work", () => {
  assert.equal(cityIds.length, 29);
  assert.ok(new Set(cityIds.map(city => cityCulture[city].voice)).size >= 8);
  for (const city of cityIds) {
    assert.ok(voices[cityCulture[city].voice].phrase.bg);
    assert.equal(cityCulture[city].places.length, 2);
    assert.equal(cityPaths[city].schools.filter(school => school.level === "secondary").length, 2);
    assert.equal(cityPaths[city].jobs.length, 3);
    for (const school of cityPaths[city].schools) assert.ok(studyFields[school.field] && school.name.bg);
    for (const job of cityPaths[city].jobs) assert.ok(jobTypes[job].pay > 0);
  }
  const child = toAge(start(), 7);
  assert.ok(child.history.find(event => event.id === "first-grade").text.bg.includes("Душо Хаджидеков"));
  const teenager = toAge(child, 14);
  const french = getActions(teenager).find(action => action.label.en.includes("French Language"));
  assert.ok(french);
  const enrolled = doAction(teenager,french.id);
  assert.equal(enrolled.enrollment.index, 2);
  assert.ok(enrolled.history.some(event => event.id.startsWith("city-plovdiv-")));
  const adult = toAge(enrolled,19);
  assert.ok(getActions(adult).some(action => action.label.en.includes("University of Plovdiv")));
  const working = doAction(adult,"life.work.electronics");
  assert.equal(working.localJob,"electronics");
  assert.equal(annualBudget(working).pay,jobTypes.electronics.pay);
  const relocated = doAction(working,"move.burgas");
  assert.equal(relocated.localJob,null);
  assert.ok(getActions(playYear(relocated)).some(action => action.id==="life.work.port"));
  assert.deepEqual(decodeSave(encodeSave(relocated)),relocated);
});

test("a chosen talent improves matching activities and persists through replay", () => {
  const withTalent=toAge(start({ profile: {...defaultProfile,talent:"sport"} }),4);
  const none=toAge(start(),4);
  const active=doLifeActivity(withTalent,"gym.walk");
  const ordinary=doLifeActivity(none,"gym.walk");
  assert.ok(active.stats.health > ordinary.stats.health);
  assert.deepEqual(decodeSave(encodeSave(active)),active);
});

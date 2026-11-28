import assert from "node:assert/strict";
import test from "node:test";

import { defaultAvatar } from "../src/avatar.ts";
import { getRelative } from "../src/birthFamily.ts";
import { contactDetails } from "../src/contactLives.ts";
import {
  choose, decodeSave, doAction, doLifeActivity, encodeSave, getActions, getChoices, getPersonActivities, hasPendingStoryDecision,
  newProfileLife, playYear, skipDecision, startCareerLife,
} from "../src/engine.ts";
import { weddingDecision } from "../src/journalDecisions.ts";
import { personAge, personCity, personName } from "../src/peopleIdentity.ts";

const profile = { name: "Яна Костова", talent: "none", vip: true, wealthy: true, disposition: null };
const start = () => startCareerLife(newProfileLife({ seed: 5, city: "tryavna", presentation: "female", avatar: defaultAvatar, profile }));

function ready(life) {
  if (!hasPendingStoryDecision(life)) return life;
  const [choice] = getChoices(life);
  return choice ? choose(life, choice.id) : skipDecision(life, life.sceneId);
}

function throughYears(life, maximum, observe) {
  while (life.age < maximum && !life.finished) {
    const next = playYear(ready(life));
    assert.equal(next.age, life.age + 1);
    assert.ok(next.history.filter(entry => entry.age === next.age && entry.id.startsWith("contact-")).length <= 2);
    life = next;
    if (observe(life)) break;
  }
  return life;
}

test("contacts independently work, move, marry and add children to the same family on replay", () => {
  let moved;
  let nieceOrNephew;
  let wedding;
  const finished = throughYears(start(), 55, life => {
    if (!moved && personCity(life, "kin-sibling-1") !== life.birthCity) moved = life;
    wedding ??= weddingDecision(life) ? life : undefined;
    nieceOrNephew ??= life.lifeSystems.contacts.relatives.find(relative => relative.role === "niece-nephew");
    return Boolean(moved && wedding && nieceOrNephew);
  });
  assert.ok(moved && wedding && nieceOrNephew);
  const sibling = "kin-sibling-1";
  const destination = personCity(moved, sibling);
  assert.notEqual(destination, moved.city);
  assert.ok(moved.history.some(entry => entry.id === "contact-move-" + sibling && entry.city === destination));
  const adult = throughYears(moved, 18, () => false);
  assert.ok(getPersonActivities(adult, sibling).some(option => option.id === "people." + sibling + ".visit." + destination));
  assert.ok(!getPersonActivities(adult, sibling).some(option => option.branch?.id === "walk"));

  const parents = nieceOrNephew.parentIds;
  assert.equal(parents.length, 2);
  assert.equal(getRelative(finished, nieceOrNephew.id), nieceOrNephew);
  assert.ok(contactDetails(finished, parents[0]).children.some(child => child.id === nieceOrNephew.id));
  assert.equal(personAge(finished, nieceOrNephew.id), 0);
  assert.notEqual(personName(finished, nieceOrNephew.id).bg, "Роднина");
  assert.ok(finished.history.some(entry => entry.id.startsWith("contact-work-")));
  assert.deepEqual(decodeSave(encodeSave(finished)), finished);
});

test("attending and skipping a wedding leave the marriage in place and close the invitation", () => {
  const life = throughYears(start(), 35, state => Boolean(weddingDecision(state)));
  const wedding = weddingDecision(life);
  assert.ok(wedding);
  const [attend, greet] = wedding.options;
  assert.equal(attend.blocked, false);
  const guest = doAction(life, attend.option.id);
  assert.notStrictEqual(guest, life);
  assert.equal(guest.city, life.city);
  assert.equal(guest.cash, life.cash + attend.option.effect.cash);
  assert.equal(weddingDecision(guest), null);
  assert.strictEqual(doLifeActivity(guest, greet.option.id), guest);
  const skipped = skipDecision(life, wedding.id);
  assert.equal(weddingDecision(skipped), null);
  assert.deepEqual(skipped.lifeSystems.contacts, life.lifeSystems.contacts);
  assert.deepEqual(skipped.history, life.history);
  assert.ok(life.history.some(entry => entry.id === wedding.id));
  for (const state of [guest, skipped]) assert.deepEqual(decodeSave(encodeSave(state)), state);
});

test("a legacy journal begins contact simulation only when the next real year advances", () => {
  const commands = Array.from({ length: 12 }, (_, age) => ({ age, kind: "year", cityEvent: null }));
  const legacy = decodeSave(JSON.stringify({ format: "bglife.chapter", version: 4, content: "bulgarian-career-1",
    seed: 108, birthCity: "burgas", avatar: defaultAvatar, profile, careerFrom: 0, commands }));
  assert.equal(legacy.age, 12);
  assert.equal(legacy.lifeSystems.contacts, undefined);
  assert.deepEqual(legacy.commands, commands);
  const next = playYear(ready(legacy));
  assert.equal(next.age, 13);
  assert.ok(next.lifeSystems.contacts);
  assert.equal(next.commands.at(-1).contactLives, 1);
  assert.deepEqual(next.history.slice(0, legacy.history.length), legacy.history);
  assert.deepEqual(decodeSave(encodeSave(next)), next);
});


test("a new sibling and a grandchild are linked to both of their parents", () => {
  const bornInBurgas = seed => newProfileLife({ seed, city: "burgas", presentation: "female", avatar: defaultAvatar, profile });
  const siblingYear = throughYears(startCareerLife(bornInBurgas(8)), 22,
    life => life.lifeSystems.contacts.relatives.some(relative => relative.role === "sibling" && !relative.halfSibling));
  const sibling = siblingYear.lifeSystems.contacts.relatives.find(relative => relative.role === "sibling" && !relative.halfSibling);
  assert.ok(sibling);
  assert.deepEqual(sibling.parentIds, ["kin-mother", "kin-father"]);
  assert.equal(personAge(siblingYear, sibling.id), 0);
  const halfSiblingYear = throughYears(startCareerLife(bornInBurgas(3)), 22,
    life => life.lifeSystems.contacts.relatives.some(relative => relative.halfSibling));
  const halfSibling = halfSiblingYear.lifeSystems.contacts.relatives.find(relative => relative.halfSibling);
  assert.ok(halfSibling.parentIds.includes("kin-father"));
  assert.equal(personAge(halfSiblingYear, halfSibling.id), 0);

  const adult = ready(throughYears(bornInBurgas(0), 22, () => false));
  const job = getActions(adult).find(action => action.id.startsWith("life.work."));
  assert.ok(job);
  const transcript = JSON.parse(encodeSave(doAction(adult, job.id)));
  transcript.commands.push({ age: adult.age, kind: "action", id: "family.adopt" });
  const parent = decodeSave(JSON.stringify(transcript));
  assert.equal(parent.lifeSystems.family.childProfiles.length, 1);
  const grandparent = throughYears(parent, 65,
    life => life.lifeSystems.contacts.relatives.some(relative => relative.role === "grandchild"));
  const grandchild = grandparent.lifeSystems.contacts.relatives.find(relative => relative.role === "grandchild");
  assert.ok(grandchild);
  assert.equal(grandchild.parentIds[0], "child-0");
  assert.equal(personAge(grandparent, grandchild.id), 0);
  assert.ok(contactDetails(grandparent, "child-0").children.includes(grandchild));
  assert.deepEqual(decodeSave(encodeSave(grandparent)), grandparent);
});

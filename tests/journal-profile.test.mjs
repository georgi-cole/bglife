import assert from "node:assert/strict";
import test from "node:test";
import { defaultAvatar, defaultMaleAvatar } from "../src/avatar.ts";
import { quietYear } from "../src/everydayEvents.ts";
import { decodeSave, doAction, doLifeActivity, doPathAction, encodeSave, newChapterLife, newProfileLife, playYear, startCareerLife } from "../src/engine.ts";
import { journalLine } from "../src/journalCopy.ts";
import { playerBirthday, playerEducation, playerStatus, zodiacFor } from "../src/playerProfile.ts";

function born(seed, city = "tryavna", career = true) {
  const life = newProfileLife({ seed, city, presentation: "female", avatar: defaultAvatar,
    profile: { name: "Лора Иванова", talent: "none", vip: true, wealthy: true, disposition: null } });
  return career ? startCareerLife(life) : life;
}

function until(life, age) {
  while (life.age < age) {
    const next = playYear(life);
    assert.equal(next.age, life.age + 1);
    life = next;
  }
  return life;
}

test("most childhood years get multiple distinct memories and quiet years have bilingual copy", () => {
  const life = until(born(3), 13);
  const byAge = Array.from({ length: 14 }, (_, age) => life.history.filter(event => event.age === age && event.kind !== "year"));
  const richer = byAge.filter(events => events.length > 1).length;
  const quiet = byAge.filter(events => !events.length).length;
  assert.ok(richer >= 8, "rich years: " + richer);
  assert.ok(quiet <= 2, "quiet years: " + quiet);
  const notes = life.history.filter(event => event.id.startsWith("diary-"));
  const cityEvents = life.history.filter(event => event.cityEvent);
  assert.ok(notes.length > 0 && cityEvents.length > 0);
  assert.ok(notes.length + cityEvents.length >= 12);
  const previous = new Map();
  for (const event of notes) {
    const latest = previous.get(event.id) ?? -10;
    assert.ok(event.age > latest + 5);
    previous.set(event.id, event.age);
  }
  assert.match(quietYear(life.seed, 2).bg, /\S/u);
  assert.match(quietYear(life.seed, 55).en, /\S/u);
  assert.deepEqual(decodeSave(encodeSave(life)), life);
});

test("birthdays and signs stay stable through aging and save replay", () => {
  const original = born(87, "sofia");
  const first = playerBirthday(original);
  assert.equal(first.getUTCFullYear(), 2026);
  assert.deepEqual(playerBirthday(decodeSave(encodeSave(until(original, 7)))), first);
  assert.equal(playerBirthday(newChapterLife(87, defaultMaleAvatar)).getUTCFullYear(), 2010);
  assert.equal(zodiacFor(new Date("2026-03-20")).bg, "Риби");
  assert.equal(zodiacFor(new Date("2026-03-21")).bg, "Овен");
});

test("the profile distinguishes an heir, pending school enrolment and the actual school", () => {
  let life = born(87, "sofia");
  assert.equal(playerStatus(life).bg, "Богата наследница");
  life = until(life, 7);
  assert.match(playerEducation(life).bg, /предстои записване/u);
  for (const id of ["school.zone.lozenets", "school.apply.107-ou", "school.enroll.107-ou"]) {
    const next = doPathAction(life, id);
    assert.ok(next !== life, id);
    life = next;
  }
  assert.equal(playerStatus(life).bg, "Ученичка");
  assert.match(playerEducation(life).bg, /107/u);
});

test("regional walks remain distinct and keep the city where the action occurred after moving", () => {
  const coastal = until(born(108, "burgas", false), 18);
  const walked = doLifeActivity(coastal, "people.friend.walk.local-burgas");
  const moved = doAction(walked, "move.varna");
  assert.equal(moved.city, "varna");
  const second = doLifeActivity(playYear(moved), "people.friend.walk.local-varna");
  const restored = decodeSave(encodeSave(second));
  assert.deepEqual(second, restored);
  const walks = restored.history.filter(event => event.id.startsWith("people.friend.walk.local-"));
  assert.deepEqual(walks.map(event => journalLine(event, "bg")), [
    "Разходих се с Елица Петрова край Морското казино.",
    "Разходих се с Елица Петрова край Римските терми.",
  ]);
});

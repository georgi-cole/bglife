import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAvatar } from "../src/avatar.ts";
import { cities, cityIds } from "../src/cities.ts";
import { cityChoices, cityEvents, cityPlaces, cityWeatherDate, getCityEvent } from "../src/cityLife.ts";
import { cityLifeData } from "../src/cityLifeData/index.ts";
import {
  decodeSave, doAction, encodeSave, getCityOpportunity, newLife, newProfileLife,
  playYear, startCareerLife,
} from "../src/engine.ts";

function advanceTo(life, age) {
  while (life.age < age) {
    const next = playYear(life);
    assert.notEqual(next, life, life.city + " " + life.age);
    life = next;
  }
  return life;
}

function atAge(city, age) {
  return advanceTo(startCareerLife(newLife(112, null, city)), age);
}

function newTestProfile(city, seed, wealthy = false) {
  return startCareerLife(newProfileLife({
    city, seed, avatar: defaultAvatar, presentation: "female",
    profile: { name: "Лора Иванова", talent: "none", vip: wealthy, wealthy, disposition: null },
  }));
}

const bilingual = value => typeof value.bg === "string" && value.bg.length > 0
  && typeof value.en === "string" && value.en.length > 0;

test("every registered city has places, dated occasions and a distinct story", () => {
  assert.deepEqual(Object.keys(cityLifeData).sort(), [...cityIds].sort());
  const storyTitles = new Set();
  for (const id of cityIds) {
    const data = cityLifeData[id];
    assert.ok(data.population > 0 && bilingual(data.childhood.line), id);
    assert.ok(new Set(cityPlaces(id).map(place => place.bg)).size >= 4, id);
    assert.ok(data.occasion.source.startsWith("https://"), id);
    const events = cityEvents(id);
    assert.ok(events.length >= 6, id);
    assert.equal(new Set(events.map(event => event.id)).size, events.length, id);
    const choiceIds = new Set(events.flatMap(event => event.choices.map(choice => event.id + "." + choice.id)));
    for (const event of events) {
      assert.match(event.id, /^[a-z][a-z0-9-]*$/, id);
      assert.ok(bilingual(event.title) && bilingual(event.body), id + "/" + event.id);
      assert.ok(event.ages[0] <= event.ages[1] && event.choices.length >= 2, id);
      assert.ok(!event.after || choiceIds.has(event.after.action), id + "/" + event.id);
      assert.equal(new Set(event.choices.map(choice => choice.id)).size, event.choices.length, id);
      assert.ok(!event.day || event.months?.every(month => event.day <= new Date(Date.UTC(2000, month, 0)).getUTCDate()), id);
      for (const choice of event.choices) {
        assert.match(choice.id, /^[a-z][a-z0-9-]*$/, id);
        assert.ok(bilingual(choice.label) && bilingual(choice.outcome), id);
        assert.ok(choice.cash === undefined || Number.isSafeInteger(choice.cash), id);
      }
    }
    storyTitles.add(getCityEvent(id, "story").title.bg);
  }
  assert.equal(storyTitles.size, cityIds.length);
});

test("an ordinary game reaches the two-part story in each city and can replay the results", () => {
  for (const id of cityIds) {
    let life = atAge(id, cityLifeData[id].story.from ?? 13);
    while (life.age < 23 && !getCityOpportunity(life)?.id.endsWith(".story")) {
      const next = playYear(life);
      assert.notEqual(next, life, id);
      life = next;
    }
    const open = getCityOpportunity(life);
    assert.ok(open?.id.endsWith("." + id + ".story"), cities[id].name.en);
    const [join, look] = open.options.map(row => row.option);
    const joined = doAction(life, join.id);
    assert.equal(joined.history.at(-1).city, id);
    assert.equal(joined.history.at(-1).cashDelta, join.effect.cash ?? 0, id);
    assert.equal(doAction(joined, look.id), joined, id);
    const after = playYear(joined);
    assert.ok(after.history.some(e => e.age === after.age && e.cityEvent?.id === "continuation"), id);
    assert.deepEqual(decodeSave(encodeSave(after)), after, id);
  }
});

test("a missed invitation and a secondary choice do not unlock the next episode", () => {
  const life = atAge("burgas", 16);
  const open = getCityOpportunity(life);
  const [join, look] = open.options.map(row => row.option);
  assert.ok([6, 7, 8].includes(life.history.at(-1).cityEvent.month));
  assert.equal(doAction(life, join.id, life.age - 1), life);
  const observed = doAction(life, look.id);
  for (const before of [life, observed]) {
    const next = playYear(before);
    assert.ok(!next.history.some(e => e.cityEvent?.id === "continuation"));
    assert.equal(doAction(next, join.id), next);
  }
});

test("moving closes the previous city's offer and the next birthdays use the new city", () => {
  let life = advanceTo(newTestProfile("burgas", 112, true), 18);
  while (life.age < 26 && !getCityOpportunity(life)) life = playYear(life);
  const earlier = getCityOpportunity(life);
  assert.ok(earlier);
  const moved = doAction(life, "move.sofia");
  assert.equal(moved.city, "sofia");
  assert.equal(getCityOpportunity(moved), null);
  assert.equal(doAction(moved, earlier.options[0].option.id), moved);
  assert.deepEqual(decodeSave(encodeSave(moved)), moved);
  let next = playYear(moved);
  while (next.age < moved.age + 9 && !getCityOpportunity(next)) next = playYear(next);
  assert.ok(getCityOpportunity(next)?.id.startsWith("city-life.sofia."));
});

test("save replay respects its original city moment and future years start the new catalog", () => {
  const life = atAge("plovdiv", 12);
  const old = JSON.parse(encodeSave(life));
  for (const command of old.commands) delete command.cityEvent;
  const restored = decodeSave(JSON.stringify(old));
  assert.ok(restored);
  assert.equal(restored.history.some(entry => entry.cityEvent), false);
  const next = playYear(restored);
  const roll = next.commands.at(-1).cityEvent;
  assert.ok(roll && getCityEvent(next.city, roll.id));
  assert.deepEqual(next.history.find(e => e.age === next.age && e.cityEvent)?.cityEvent, roll);
  assert.deepEqual(decodeSave(encodeSave(next)), next);
  const invalid = JSON.parse(encodeSave(next));
  invalid.commands.at(-1).cityEvent = { ...roll, month: 17 };
  assert.equal(decodeSave(JSON.stringify(invalid)), null);
});

test("new starts in the same city vary the early journal and the age of the local story", () => {
  const patterns = new Set();
  const openingAges = new Set();
  for (let seed = 100; seed < 124; seed++) {
    const life = advanceTo(newTestProfile("tryavna", seed), 17);
    const early = life.history.filter(entry => entry.age >= 1 && entry.age <= 12 && entry.cityEvent);
    assert.deepEqual(early.map(e => e.age), Array.from({ length: 12 }, (_, i) => i + 1));
    assert.equal(new Set(early.map(e => e.text.bg)).size, early.length);
    patterns.add(early.slice(0, 6).map(e => e.cityEvent.id).join("|"));
    const opening = life.history.find(entry => entry.cityEvent?.id === "story");
    assert.ok(opening);
    openingAges.add(opening.age);
  }
  assert.ok(patterns.size >= 22);
  assert.ok(openingAges.size >= 3);
});

test("passive journal entries create no city opportunity and replay exactly", () => {
  const life = advanceTo(newTestProfile("burgas", 119), 2);
  const entry = life.history.find(e => e.age === 2 && e.cityEvent);
  assert.ok(entry);
  assert.match(entry.cityEvent.id, /^life-/);
  assert.equal(getCityOpportunity(life), null);
  assert.deepEqual(decodeSave(encodeSave(life)), life);
});

test("a snow day changes the route's choice and a fixed date displays with its day", () => {
  const dayTrip = getCityEvent("smolyan", "day-trip");
  assert.equal(cityChoices(dayTrip, { id: dayTrip.id, month: 1, weather: "clear" })[0].stats.health, 1);
  assert.equal(cityChoices(dayTrip, { id: dayTrip.id, month: 1, weather: "snow" })[0].stats.health, undefined);
  const fixed = { id: "occasion", month: 12, day: 6, weather: "rain" };
  assert.match(cityWeatherDate(fixed, "bg"), /6 декември/);
});

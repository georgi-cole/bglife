import test from "node:test";
import assert from "node:assert/strict";
import {
  advance, annualBudget, choose, commitmentsLeft, decodeSave, doAction, encodeSave,
  getActions, getChoices, getScene, newLife,
} from "../src/engine.ts";
import { actions, scenes } from "../src/story.ts";

test("each of the 30 scenes has bilingual text, stable option IDs and whole-cent effects", () => {
  assert.equal(scenes.length, 30);
  assert.equal(new Set(scenes.map(s => s.id)).size, scenes.length);
  const bilingual = (text) => {
    assert.match(text.bg, /[А-Яа-я]/u);
    assert.match(text.en, /[A-Za-z]/);
  };
  const checkOption = (option) => {
    bilingual(option.label);
    bilingual(option.result);
    assert.ok(Number.isSafeInteger(option.effect?.cash ?? 0));
  };
  for (const scene of scenes) {
    bilingual(scene.title);
    bilingual(scene.body);
    assert.ok(scene.choices.length >= 2);
    assert.equal(scene.choices.length, new Set(scene.choices.map(o => o.id)).size);
    scene.choices.forEach(checkOption);
  }
  assert.equal(actions.length, new Set(actions.map(a => a.id)).size);
  actions.forEach(checkOption);
});

function toAge(age, seed = 108) {
  let s = newLife(seed);
  while (s.age < age) {
    const option = getChoices(s)[0];
    assert.ok(option, "No primary decision at age " + s.age);
    s = advance(choose(s, option.id), s.age);
  }
  return s;
}

function move(housing, seed) {
  const initial = toAge(19, seed);
  const choice = getChoices(initial).find(o => o.effect?.housing === housing);
  assert.ok(choice, "Missing age-19 housing offer for " + housing);
  return choose(initial, choice.id);
}

test("the resolver cannot skip an open decision, reuse a choice or advance a stale screen", () => {
  const s = newLife(12);
  assert.strictEqual(advance(s), s);
  assert.strictEqual(choose(s, "missing"), s);
  const resolved = choose(s, getChoices(s)[0].id, s.age);
  assert.equal(resolved.history.length, 1);
  assert.equal(s.history.length, 0);
  assert.strictEqual(choose(resolved, resolved.choiceId), resolved);
  const next = advance(resolved, s.age);
  assert.equal(next.age, 17);
  assert.strictEqual(advance(next, 16), next);
  assert.strictEqual(choose(next, getChoices(next)[0].id, 16), next);
  assert.deepEqual(decodeSave(encodeSave(next)), next);
});

test("the move quotes agree with the ledger and the Friday agreement reserves time", () => {
  const original = toAge(19);
  const rumi = move("rumi");
  const shared = move("shared");
  assert.equal(rumi.cash, original.cash - 6000);
  assert.equal(shared.cash, original.cash - 46000);
  assert.equal(shared.deposit, 40000);
  assert.equal(rumi.deposit, 0);
  assert.equal(rumi.city, "sofia");
  assert.equal(commitmentsLeft(rumi), 1);
  assert.equal(commitmentsLeft(shared), 2);
  for (const [state, net] of [[rumi, 240000], [shared, 60000]]) {
    const next = advance(state);
    assert.equal(annualBudget(state).net, net);
    assert.equal(next.cash - state.cash, net);
    assert.equal(next.history.at(-1).cashDelta, net);
    assert.deepEqual(decodeSave(encodeSave(state)), state);
    assert.deepEqual(decodeSave(encodeSave(next)), next);
  }
});

test("an optional commitment can be spent once, cannot overdraw capacity, and resets next year", () => {
  let s = move("rumi");
  const action = getActions(s)[0];
  assert.ok(action);
  const after = doAction(s, action.id);
  assert.equal(commitmentsLeft(after), 0);
  assert.deepEqual(getActions(after), []);
  assert.strictEqual(doAction(after, action.id), after);
  s = advance(after);
  assert.deepEqual(s.usedActions, []);
  assert.equal(commitmentsLeft(s), 1);
  assert.deepEqual(getActions(s), []);
});

test("save decoding rejects broken, impossible, duplicate and incompatible transcripts", () => {
  const s = newLife(0xffffffff);
  const first = choose(s, getChoices(s)[0].id);
  const base = JSON.parse(encodeSave(first));
  const invalid = [
    null, {}, { ...base, version: 53 }, { ...base, content: "other" },
    { ...base, seed: -1 }, { ...base, seed: 3.2 }, { ...base, seed: 2 ** 32 },
    { ...base, commands: [...base.commands, ...base.commands] },
    { ...base, commands: [{ kind: "year", age: 16 }] },
    { ...base, commands: [{ kind: "choice", age: 17, id: base.commands[0].id }] },
    { ...base, commands: [{ kind: "choice", age: 16, id: "missing" }] },
    { ...base, commands: Array(45).fill(base.commands[0]) },
  ];
  for (const item of invalid) assert.equal(decodeSave(JSON.stringify(item)), null);
  assert.equal(decodeSave("trashed"), null);
  const compact = { ...base };
  delete compact.version;
  assert.deepEqual(decodeSave(JSON.stringify(compact)), first);
});

test("seeded lives reach distinct age-26 endings with exact, replayable cash histories", () => {
  const observed = new Set();
  const homes = new Set();
  const routeAt21 = new Map();
  for (let seed = 1; seed <= 600; seed++) {
    let s = newLife(seed);
    let state = Math.imul(seed, 0x9e3779b1) >>> 0;
    const draw = (n) => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return Math.floor(state * n / 0x100000000);
    };
    while (!s.finished) {
      const scene = getScene(s);
      observed.add(scene.id);
      if (s.age === 21) {
        if (!routeAt21.has(s.housing)) routeAt21.set(s.housing, new Set());
        routeAt21.get(s.housing).add(scene.id);
      }
      const options = getChoices(s);
      assert.ok(options.length > 0, scene.id + " has no eligible option");
      s = choose(s, options[draw(options.length)].id);
      for (let i = draw(3); i > 0; i--) {
        const available = getActions(s);
        if (!available.length) break;
        s = doAction(s, available[draw(available.length)].id);
      }
      s = advance(s);
    }
    homes.add(s.housing);
    assert.equal(s.age, 26);
    assert.equal(s.cash, 70_000 + s.history.reduce((sum, h) => sum + h.cashDelta, 0));
    assert.equal(s.history.filter(h => h.kind === "choice").length, 11);
    assert.equal(s.history.filter(h => h.kind === "year").length, 11);
    assert.strictEqual(advance(s), s);
    assert.deepEqual(decodeSave(encodeSave(s)), s);
  }
  assert.equal(homes.size, 3);
  assert.equal(routeAt21.size, 3);
  assert.notDeepEqual([...routeAt21.get("rumi")].sort(), [...routeAt21.get("shared")].sort());
  assert.deepEqual([...observed].sort(), scenes.map(s => s.id).sort(), "Every authored scene must be reachable");
});

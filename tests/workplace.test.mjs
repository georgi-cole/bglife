
import test from "node:test";
import assert from "node:assert/strict";
import { decodeSave, doPathAction, encodeSave, newLife, playYear, startCareerLife } from "../src/engine.ts";
import { findJob } from "../src/employment.ts";
import { getWorkDecision, workplaceView } from "../src/workplace.ts";
import { workTrack } from "../src/workplaceContent.ts";

function act(life, id) {
  const next = doPathAction(life, id);
  assert.notEqual(next, life, id);
  return next;
}

function employed(job, city = "sofia") {
  for (let seed = 1; seed <= 80; seed++) {
    let life = startCareerLife(newLife(seed, null, city));
    while (life.age < 19 && !life.finished) life = playYear(life);
    if (life.finished) continue;
    life = act(life, "work.prepare");
    life = act(life, "work.apply." + job);
    if (life.path.work.applications[job] !== "interview") continue;
    life = act(life, "work.interview." + job + ".learn");
    if (life.path.work.applications[job] === "offer") return act(life, "work.accept." + job);
  }
  assert.fail("No contract in the fixture range for " + job);
}

function nextDecision(life) {
  const until = life.age + 8;
  while (!life.finished && life.age < until) {
    const current = getWorkDecision(life);
    if (current) return { life, decision: current };
    life = playYear(life);
  }
  assert.fail("No workplace decision reached");
}

test("a workplace keeps its boss, colleagues and earned relationships with the current contract", () => {
  const life = employed("sofia-shop");
  const place = workplaceView(life);
  const [boss, teammate, other] = place.team;
  assert.equal(boss.id, "boss");
  assert.equal(new Set(place.team.map(person => person.name.bg)).size, 3);
  assert.match(place.tasks[0].label.en, /inventory/);
  const help = teammate.actions.find(action => action.id.endsWith(".help"));
  const feedback = boss.actions.find(action => action.id.endsWith(".feedback"));
  let next = act(act(life, help.id), feedback.id);
  assert.equal(doPathAction(next, help.id), next);
  let team = workplaceView(next).team;
  assert.equal(team[0].bond, boss.bond + 6);
  assert.equal(team[1].bond, teammate.bond + 8);
  assert.equal(team[2].bond, other.bond);
  assert.equal(next.path.work.job.performance, life.path.work.job.performance + 9);
  next = playYear(next);
  team = workplaceView(next).team;
  assert.deepEqual(team.map(person => person.name), place.team.map(person => person.name));
  assert.equal(team[1].bond, teammate.bond + 8);
  assert.deepEqual(decodeSave(encodeSave(next)), next);
  const left = act(next, "work.leave");
  assert.equal(workplaceView(left), null);
  assert.equal(getWorkDecision(left), null);
  assert.equal(doPathAction(left, help.id), left);
});

test("workplace tasks and prompts follow the type of job, including shift-based roles", () => {
  const shop = workTrack(findJob("sofia", "sofia-shop"));
  const café = workTrack(findJob("sofia", "sofia-cafe"));
  const qa = workTrack(findJob("sofia", "sofia-qa"));
  const nursing = workTrack(findJob("sofia", "sofia-nurse"));
  assert.equal(new Set([shop, café, qa, nursing].map(track => track.tasks[0].label.bg)).size, 4);
  assert.equal(new Set([shop, café, qa, nursing].map(track => track.scenario.id)).size, 4);
  let warehouse = employed("sofia-warehouse");
  assert.match(workplaceView(warehouse).tasks[0].label.en, /shipments/);
  warehouse = playYear(warehouse);
  assert.equal(workplaceView(warehouse), null);
  assert.equal(getWorkDecision(warehouse), null);
});

test("a work decision writes one replayable outcome with context, choice and effects", () => {
  const { life, decision } = nextDecision(employed("sofia-shop"));
  assert.equal(decision.title.bg, "Опашка до входа");
  assert.deepEqual(decodeSave(encodeSave(life)), life);
  const chosen = decision.choices[0];
  const oldPerformance = life.path.work.job.performance;
  const next = act(life, chosen.id);
  assert.equal(next.history.length, life.history.length + 1);
  const record = next.history.at(-1);
  assert.equal(record.age, life.age);
  assert.deepEqual(record.decision, { choice: chosen.label, situation: decision.situation });
  assert.equal(record.workImpact.performance, next.path.work.job.performance - oldPerformance);
  assert.ok(record.workImpact.relationship.delta > 0);
  assert.equal(getWorkDecision(next), null);
  assert.equal(doPathAction(next, chosen.id), next);
  assert.equal(doPathAction(next, decision.choices[1].id), next);
  assert.deepEqual(decodeSave(encodeSave(next)), next);
});

test("dismissal or ageing out consumes an opportunity without a diary entry, and old years do not schedule work prompts", () => {
  const { life, decision } = nextDecision(employed("sofia-shop"));
  const skipped = act(life, decision.dismiss);
  assert.deepEqual(skipped.history, life.history);
  assert.equal(skipped.cash, life.cash);
  assert.equal(skipped.path.work.job.performance, life.path.work.job.performance);
  assert.equal(getWorkDecision(skipped), null);
  assert.deepEqual(decodeSave(encodeSave(skipped)), skipped);
  const followingYear = playYear(skipped);
  assert.equal(getWorkDecision(followingYear), null);
  assert.equal(doPathAction(followingYear, decision.choices[0].id), followingYear);
  assert.equal(getWorkDecision(playYear(life)), null);
  const save = JSON.parse(encodeSave(life));
  delete save.commands.at(-1).workEvent;
  const old = decodeSave(JSON.stringify(save));
  assert.ok(old);
  assert.deepEqual(old.history, life.history);
  assert.equal(getWorkDecision(old), null);
});

test("a paid scenario credits the wallet and diary once, independently of annual salary", () => {
  let life = employed("sofia-shop");
  let decision;
  for (let i = 0; i < 45 && !life.finished; i++) {
    const current = getWorkDecision(life);
    if (current?.key.endsWith(".cover-shift")) {
      decision = current;
      break;
    }
    if (current) life = act(life, current.dismiss);
    life = playYear(act(life, workplaceView(life).tasks[0].id));
  }
  assert.ok(decision, "Missing paid shift");
  const result = act(life, decision.choices[0].id);
  assert.equal(result.cash - life.cash, 6000);
  assert.equal(result.history.at(-1).cashDelta, 6000);
  assert.equal(result.path.work.job.gross, life.path.work.job.gross);
  assert.equal(doPathAction(result, decision.choices[0].id), result);
  assert.deepEqual(decodeSave(encodeSave(result)), result);
});

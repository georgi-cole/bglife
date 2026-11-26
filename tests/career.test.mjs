import test from "node:test";
import assert from "node:assert/strict";
import {
  annualBudget, choose, decodeSave, doPathAction, encodeSave, newCareerLife, newLife, playYear, resumeCareerLife,
} from "../src/engine.ts";
import { healthCoverage, pensionRequirements, recentInsuredMonths, serviceMonths, workView } from "../src/employment.ts";
import { pathBudget } from "../src/lifePath.ts";
import { pathCities, playableCities } from "../src/pathCatalog.ts";
import { policy } from "../src/pathPolicy.ts";

function act(life, ...ids) {
  for (const id of ids) {
    const next = doPathAction(life, id);
    assert.notStrictEqual(next, life, id + " is unavailable at age " + life.age);
    life = next;
  }
  return life;
}

function toAge(life, age) {
  while (life.age < age) {
    const next = playYear(life);
    assert.equal(next.age, life.age + 1);
    life = next;
  }
  return life;
}

const sofia = (seed, age = 16) => newCareerLife(seed, null, { age, city: "sofia" });

function hire(life, vacancy) {
  life = act(life, "work.apply." + vacancy);
  if (life.path.work.applications[vacancy] !== "interview") return life;
  life = act(life, "work.interview." + vacancy + ".learn");
  return life.path.work.applications[vacancy] === "offer" ? act(life, "work.accept." + vacancy) : life;
}

test("every playable city provides local school admission, wage data and youth and adult vacancies", () => {
  for (const city of playableCities) {
    const entry = pathCities[city];
    assert.ok(entry.benchmark >= policy.minimumWage);
    for (const zone of Object.keys(entry.zones)) {
      assert.ok(entry.schools.some(school => school.primary && school.zone === zone), city + " " + zone);
    }
    assert.ok(entry.schools.some(s => s.admission?.cutoff === 0));
    assert.ok(entry.jobs.some(j => j.youth && j.hours === 4 && j.termMonths < 12 && j.requirement === "none"));
    assert.ok(entry.jobs.some(j => j.requirement !== "none"));
  }
  const programIds = playableCities.flatMap(city => pathCities[city].programs.map(p => p.id));
  assert.equal(programIds.length, new Set(programIds).size);
});

test("first-class catchments, assessments and VII-grade admissions lead to a diploma", () => {
  let life = sofia(87, 7);
  assert.strictEqual(doPathAction(life, "work.apply.sofia-bookshop"), life);
  assert.strictEqual(doPathAction(life, "school.leave"), life);
  life = act(life, "school.zone.lozenets", "school.apply.107-ou", "school.enroll.107-ou");
  assert.equal(life.path.school.schoolId, "107-ou");
  life = act(life, "school.study.math", "school.homework.math", "school.test.math");
  assert.ok(life.path.school.assessments.math.test >= 4);
  assert.strictEqual(doPathAction(life, "school.test.math"), life);
  life = toAge(life, 8);
  while (life.age < 19) {
    const grade = life.path.school.grade;
    if (grade === 8) {
      assert.equal(life.path.school.nvo.grade, 7);
      life = act(life, "school.apply.smg", "school.enroll.smg");
      assert.equal(life.path.school.schoolId, "smg");
    }
    life = act(life, "school.study.math", "school.homework.math", "school.study.bulgarian", "school.homework.bulgarian");
    if (grade === 7) life = act(life, "school.nvo");
    if (grade === 12) life = act(life, "school.final.bulgarian", "school.final.second");
    life = playYear(life);
  }
  assert.equal(life.path.school.transcript.length, 12);
  assert.equal(life.path.school.grade, null);
  assert.ok(life.path.school.diploma.bulgarian >= 5);
  assert.equal(life.path.school.diploma.second.subject, "math");
  assert.deepEqual(decodeSave(encodeSave(life)), life);
});

test("strong final marks can earn a state-funded place and scholarship, then unlock a qualified job", () => {
  let life = sofia(87);
  for (let i = 0; i < 3; i++) {
    life = act(life, "school.study.math", "school.homework.math", "school.study.bulgarian", "school.homework.bulgarian");
    life = playYear(life);
  }
  assert.strictEqual(doPathAction(life, "work.apply.sofia-qa"), life);
  assert.strictEqual(doPathAction(life, "university.apply.mu-medicine"), life);
  life = act(life, "university.exam.mu-medicine");
  assert.equal(life.path.university.entrance["mu-medicine"].length, 2);
  life = act(life, "university.apply.su-computing", "university.enroll.su-computing");
  assert.equal(life.path.university.student.funding, "state");
  assert.equal(healthCoverage(life, life.path.work), "public");
  assert.equal(pathBudget(life, life.path).tuition, 45_000);
  for (let i = 0; i < 4; i++) {
    life = act(life, "university.study", "university.coursework", "university.session");
    if (i > 0) {
      life = act(life, "university.scholarship");
      assert.equal(life.path.university.student.scholarship, "awarded");
      assert.equal(pathBudget(life, life.path).scholarship, 90_000);
    }
    life = playYear(life);
  }
  assert.equal(life.path.university.degrees[0].field, "tech");
  assert.equal(workView(life, life.path.work).actions.find(a => a.id === "work.apply.sofia-qa").blocked, undefined);
  assert.deepEqual(decodeSave(encodeSave(life)), life);
});

test("paid offers can be unaffordable, and a contract can pay tuition and restore course progress", () => {
  let life = toAge(sofia(12), 19);
  life = act(life, "university.apply.unwe-econ", "university.enroll.unwe-econ");
  assert.equal(life.path.university.student.funding, "paid");
  assert.equal(pathBudget(life, life.path).tuitionPaid, false);
  const unpaid = playYear(life);
  assert.equal(unpaid.path.university.student.yearsPassed, 0);
  assert.ok(unpaid.history.some(event => event.id === "tuition-19"));
  life = act(life, "work.prepare");
  life = hire(life, "sofia-warehouse");
  assert.ok(life.path.work.job);
  assert.equal(pathBudget(life, life.path).tuitionPaid, true);
  const budget = annualBudget(life);
  const after = playYear(life);
  assert.equal(after.path.university.student.yearsPassed, 1);
  assert.equal(after.cash - life.cash, budget.net);
});

test("a youth contract and a full fixed-term contract produce different service and benefit rights", () => {
  let youth;
  for (let seed = 1; seed < 30; seed++) {
    const candidate = hire(act(sofia(seed), "work.prepare"), "sofia-bookshop");
    if (candidate.path.work.job) { youth = candidate; break; }
  }
  assert.ok(youth);
  assert.strictEqual(doPathAction(youth, "work.apply.sofia-warehouse"), youth);
  assert.equal(youth.path.work.job.hours, 4);
  youth = playYear(youth);
  assert.equal(youth.path.work.job, null);
  assert.equal(recentInsuredMonths(youth.path.work), 3);
  assert.equal(serviceMonths(youth.path.work), 1);
  assert.strictEqual(doPathAction(youth, "insurance.unemployment"), youth);

  let adult = toAge(sofia(12), 19);
  adult = hire(act(adult, "work.prepare"), "sofia-warehouse");
  assert.equal(adult.path.work.job?.monthsLeft, 12);
  assert.strictEqual(doPathAction(adult, "path.move.tryavna"), adult);
  adult = playYear(adult);
  assert.equal(adult.path.work.job, null);
  assert.equal(serviceMonths(adult.path.work), 12);
  assert.equal(recentInsuredMonths(adult.path.work), 12);
  adult = act(adult, "insurance.unemployment");
  assert.equal(adult.path.work.benefit.months, 4);
  assert.ok(pathBudget(adult, adult.path).benefit > 0);
  assert.equal(playYear(adult).path.work.benefit, null);
});

test("an active legacy save retains its balance and replays its recorded service checkpoint", () => {
  let chapter = toAge(newLife(37), 19);
  chapter = choose(chapter, "rumi");
  chapter = toAge(chapter, 21);
  const upgraded = resumeCareerLife(chapter);
  assert.equal(upgraded.cash, chapter.cash);
  assert.deepEqual(upgraded.history, chapter.history);
  assert.equal(upgraded.path.work.job.city, "sofia");
  assert.equal(serviceMonths(upgraded.path.work), 24);
  assert.deepEqual(decodeSave(encodeSave(upgraded)), upgraded);
  assert.equal(toAge(upgraded, 27).finished, false);
  assert.equal(toAge(chapter, 26).path, null);
});

test("a contract can run through adulthood and the pension is paid after an eligible application", () => {
  let life;
  for (let seed = 1; seed < 40; seed++) {
    const candidate = hire(act(toAge(sofia(seed), 19), "work.prepare"), "sofia-shop");
    if (candidate.path.work.job) { life = candidate; break; }
  }
  assert.ok(life);
  while (life.age < 63) life = playYear(act(life, "work.practice"));
  assert.equal(life.finished, false);
  assert.equal(pensionRequirements(life, life.path.work).eligible, "full");
  life = act(life, "insurance.pension", "work.leave");
  assert.equal(life.path.work.pension.kind, "full");
  assert.ok(pathBudget(life, life.path).pension >= policy.pensionMin * 12);
  assert.equal(healthCoverage(life, life.path.work), "pension");
  assert.strictEqual(doPathAction(life, "insurance.unemployment"), life);
  const next = playYear(life);
  assert.equal(next.cash - life.cash, annualBudget(life).net);
  assert.deepEqual(decodeSave(encodeSave(next)), next);
});


import test from "node:test";
import assert from "node:assert/strict";
import { defaultAvatar } from "../src/avatar.ts";
import { cityIds } from "../src/cities.ts";
import { cityPaths } from "../src/cityPaths.ts";
import {
  annualBudget, choose, continueLife, decodeSave, doAction, doLifeActivity, doPathAction, encodeSave, getActions, getChoices,
  getLifeActivities, movingCost, nameNewborns, newChapterLife, newLife, newProfileLife, playYear, startCareerLife,
} from "../src/engine.ts";
import { healthCoverage, pensionRequirements, recentInsuredMonths, serviceMonths, workView } from "../src/employment.ts";
import { birthCount, familyRoll } from "../src/fertilityModel.ts";
import { pathBudget } from "../src/lifePath.ts";
import { pathCities } from "../src/pathCatalog.ts";
import { policy } from "../src/pathPolicy.ts";
import { deserialize, serialize } from "../src/session.ts";

const profile = { name: "Лора Иванова", talent: "none", vip: false, wealthy: false, disposition: null };
const legacyProfileLife = (seed, city = "sofia") => newProfileLife({ seed, city, profile, presentation: "female", avatar: defaultAvatar });
const born = (seed, city) => startCareerLife(legacyProfileLife(seed, city));

function act(life, ...ids) {
  for (const id of ids) {
    const next = doPathAction(life, id);
    assert.notEqual(next, life, id + " is unavailable at age " + life.age);
    life = next;
  }
  return life;
}

function activity(life, id) {
  const next = doLifeActivity(life, id);
  assert.notEqual(next, life, id + " is unavailable at age " + life.age);
  return next;
}

function toAge(life, age) {
  while (life.age < age) {
    const next = playYear(life);
    assert.equal(next.age, life.age + 1);
    life = next;
  }
  return life;
}

function prepareSchool(life) {
  return act(life, "school.study.math", "school.homework.math", "school.study.bulgarian", "school.homework.bulgarian");
}

function hire(life, vacancy) {
  life = act(life, "work.prepare", "work.apply." + vacancy);
  if (life.path.work.applications[vacancy] !== "interview") return life;
  life = act(life, "work.interview." + vacancy + ".learn");
  return life.path.work.applications[vacancy] === "offer" ? act(life, "work.accept." + vacancy) : life;
}

const replay = life => assert.deepEqual(decodeSave(encodeSave(life)), life);

test("the career catalog covers all 29 birth cities and their existing study paths", () => {
  assert.equal(cityIds.length, 29);
  for (const city of cityIds) {
    const entry = pathCities[city];
    assert.ok(entry.benchmark >= policy.minimumWage, city);
    for (const zone of Object.keys(entry.zones)) {
      assert.ok(entry.schools.some(school => school.primary && school.zone === zone), city + " " + zone);
    }
    assert.ok(entry.schools.some(s => s.admission?.cutoff === 0), city);
    assert.ok(entry.jobs.some(j => j.youth && j.hours === 4 && j.termMonths < 12 && j.requirement === "none"), city);
    assert.ok(entry.jobs.some(j => j.requirement !== "none"), city);
    for (const program of cityPaths[city].schools.filter(s => s.level === "higher")) {
      assert.ok(entry.programs.some(row => row.institution.bg === program.name.bg), city + " " + program.name.bg);
    }
  }
  assert.equal(pathCities.tryavna.benchmark, pathCities.gabrovo.benchmark);
  assert.equal(pathCities.samokov.benchmark, 134_400);
  const ids = cityIds.flatMap(city => pathCities[city].programs.map(p => p.id));
  assert.equal(ids.length, new Set(ids).size);
});

test("a newborn enters school at seven with pocket money, then goes through NVO, admissions and graduation", () => {
  let life = born(87);
  assert.equal(life.age, 0);
  assert.ok(life.birthFamily);
  assert.equal(life.path.school.grade, null);
  assert.equal(doPathAction(life, "school.study.math"), life);
  life = toAge(life, 7);
  assert.equal(life.path.school.grade, 1);
  assert.equal(life.enrollment, null);
  assert.equal(annualBudget(life).pay, 6_000);
  assert.equal(doPathAction(life, "work.apply.sofia-bookshop"), life);
  assert.equal(doPathAction(life, "school.leave"), life);
  life = act(life, "school.zone.lozenets", "school.apply.107-ou", "school.enroll.107-ou");
  for (let grade = 1; grade <= 12; grade++) {
    assert.equal(life.path.school.grade, grade);
    if (grade === 8) {
      assert.equal(life.path.school.nvo.grade, 7);
      life = act(life, "school.apply.smg", "school.enroll.smg");
      assert.equal(life.path.school.schoolId, "smg");
    }
    life = prepareSchool(life);
    if (grade === 1) {
      life = act(life, "school.test.math");
      assert.ok(life.path.school.assessments.math.test >= 4);
      assert.equal(doPathAction(life, "school.test.math"), life);
    }
    if (grade === 7) life = act(life, "school.nvo");
    if (grade === 12) life = act(life, "school.final.bulgarian", "school.final.second");
    life = playYear(life);
  }
  assert.equal(life.path.school.grade, null);
  assert.equal(life.path.school.transcript.length, 12);
  assert.ok(life.path.school.diploma.bulgarian > 5);
  replay(life);
});

test("state-funded university enrollment outside your city shares the move ledger and can lead to a scholarship and qualified job", () => {
  let life = toAge(born(87, "plovdiv"), 7);
  while (life.age < 19) life = playYear(prepareSchool(life));
  assert.equal(doPathAction(life, "university.apply.mu-medicine"), life);
  life = act(life, "university.exam.mu-medicine", "university.apply.su-computing");
  assert.equal(life.path.university.entrance["mu-medicine"].length, 2);
  const before = life;
  life = act(life, "university.enroll.su-computing");
  assert.equal(life.city, "sofia");
  assert.equal(life.cash, before.cash - movingCost(before));
  assert.deepEqual(life.commands.slice(-2).map(c => c.id), ["move.sofia", "university.enroll.su-computing"]);
  assert.equal(life.path.university.student.funding, "state");
  assert.equal(healthCoverage(life, life.path.work), "public");
  assert.equal(doPathAction(life, "work.apply.sofia-qa"), life);
  for (let i = 0; i < 4; i++) {
    life = act(life, "university.study", "university.coursework", "university.session");
    if (i > 0) {
      life = act(life, "university.scholarship");
      assert.equal(life.path.university.student.scholarship, "awarded");
    }
    life = playYear(life);
  }
  assert.equal(life.path.university.degrees[0].field, "tech");
  assert.equal(workView(life, life.path.work).actions.find(a => a.id === "work.apply.sofia-qa").blocked, undefined);
  replay(life);
});

test("a fixed-term job can cover tuition and qualify for unemployment when the contract expires", () => {
  let life = toAge(born(12), 19);
  life = act(life, "university.apply.unwe-econ", "university.enroll.unwe-econ");
  assert.equal(life.path.university.student.funding, "paid");
  assert.equal(pathBudget(life, life.path).tuitionPaid, false);
  assert.equal(playYear(life).path.university.student.yearsPassed, 0);
  life = hire(life, "sofia-warehouse");
  assert.equal(life.path.work.job.monthsLeft, 12);
  assert.equal(doAction(life, "move.tryavna"), life);
  assert.equal(pathBudget(life, life.path).tuitionPaid, true);
  life = act(life, "university.study", "university.coursework", "university.session");
  const budget = annualBudget(life);
  const next = playYear(life);
  assert.equal(next.cash - life.cash, budget.net);
  assert.equal(next.path.university.student.yearsPassed, 1);
  assert.equal(serviceMonths(next.path.work), 12);
  assert.equal(recentInsuredMonths(next.path.work), 12);
  assert.equal(next.path.work.job, null);
  life = act(next, "insurance.unemployment");
  assert.equal(life.path.work.benefit.months, 4);
  replay(life);
});

test("a legacy enrollment and the original chapter both resume with their previous journal and budget intact", () => {
  let legacy = toAge(legacyProfileLife(108, "plovdiv"), 19);
  const option = getActions(legacy).find(a => a.id.startsWith("life.study.") && a.id.endsWith(".computing"));
  legacy = toAge(doAction(legacy, option.id), 20);
  const session = deserialize(serialize({ life: legacy, album: [legacy] }));
  const migrated = startCareerLife(session.life);
  assert.equal(migrated.cash, legacy.cash);
  assert.deepEqual(migrated.history, legacy.history);
  assert.equal(migrated.path.university.student.yearsPassed, 1);
  assert.equal(pathBudget(migrated, migrated.path).tuition, 0);
  assert.deepEqual(session.album[0], legacy);
  assert.equal(getActions(migrated).some(a => a.id.startsWith("life.study.")), false);
  replay(migrated);

  let chapter = toAge(newChapterLife(37), 19);
  chapter = choose(chapter, "rumi");
  chapter = toAge(chapter, 26);
  chapter = playYear(chapter);
  const resumed = startCareerLife(continueLife(chapter));
  assert.equal(resumed.age, 27);
  assert.equal(resumed.cash, chapter.cash);
  assert.deepEqual(resumed.history.slice(0, chapter.history.length), chapter.history);
  assert.equal(resumed.path.work.job.city, "sofia");
  assert.equal(serviceMonths(resumed.path.work), chapter.serviceYears * 12);
  replay(resumed);
});

test("adoption uses the new contract for the application and the following year's assessment", () => {
  let adult;
  for (let seed = 1; seed <= 25 && !adult; seed++) {
    const candidate = toAge(born(seed), 21);
    assert.ok(getLifeActivities(candidate).find(a => a.id === "adoption.apply").blocked);
    const employed = hire(candidate, "sofia-shop");
    if (employed.path.work.job) adult = employed;
  }
  assert.ok(adult);
  assert.equal(adult.career, "student"); // The old career field is retained for legacy transcripts.
  adult = activity(adult, "adoption.apply");
  assert.equal(adult.lifeSystems.reproduction.adoption.stage, "review");
  adult = playYear(adult);
  assert.equal(adult.lifeSystems.reproduction.adoption.stage, "waiting");
  replay(adult);
});

test("a pending birth naming dialog blocks career actions until the baby is named", () => {
  const mother = "player.Мила Николова";
  let seed = 0;
  while (!(familyRoll(seed, 22, "appMatch.conception") < .25 && familyRoll(seed, 23, mother + ".loss") > .2
    && birthCount(22, "natural", familyRoll(seed, 23, mother + ".birth-count")) === 1)) seed++;
  const story = s => {
    const choices = getChoices(s);
    const choice = s.age === 19 ? choices.find(item => item.id === "stay") : choices[0];
    return choice ? choose(s, choice.id) : s;
  };
  let life = story(toAge(newChapterLife(seed), 18));
  life = activity(activity(life, "family.tinder"), "family.time-together");
  life = story(playYear(life));
  life = activity(activity(life, "family.time-together"), "family.commit");
  life = story(toAge(life, 22));
  life = startCareerLife(continueLife(activity(life, "people.appMatch.intimacy.try")));
  life = playYear(life);
  assert.ok(life.lifeSystems.reproduction.naming);
  assert.equal(doPathAction(life, "work.prepare"), life);
  assert.equal(playYear(life), life);
  life = nameNewborns(life, ["Стоян"], "father");
  assert.equal(life.lifeSystems.reproduction.naming, null);
  life = act(life, "work.prepare");
  replay(life);
});

test("career keeps the lifespan's mortality, accumulates pension rights, and can run beyond 100", () => {
  let life = toAge(newLife(26_809, defaultAvatar, "sofia"), 19);
  life = startCareerLife(doAction(life, "life.work"));
  while (!life.finished) {
    if (life.lifeSystems.medicalIssue) {
      life = doLifeActivity(life, life.lifeSystems.medicalIssue === "urgent" ? "hospital.emergency" : "hospital.clinic");
    }
    if (life.stats.health < 100) life = doLifeActivity(life, "gym.walk");
    if (life.path.work.job) life = act(life, "work.practice");
    if (life.age === 63) {
      assert.equal(pensionRequirements(life, life.path.work).eligible, "full");
      life = act(life, "insurance.pension", "work.leave");
      assert.ok(pathBudget(life, life.path).pension >= policy.pensionMin * 12);
    }
    life = playYear(life);
  }
  assert.deepEqual(life.death, { age: 131, cause: "oldAge" });
  assert.ok(life.history.some(event => event.id === "131st-birthday"));
  replay(life);
});

import test from "node:test";
import assert from "node:assert/strict";
import { defaultAvatar, defaultMaleAvatar } from "../src/avatar.ts";
import { decodeSave, doPathAction, encodeSave, newLife, playYear, startCareerLife } from "../src/engine.ts";
import { serviceMonths } from "../src/employment.ts";
import { pathBudget, pathOccupation } from "../src/lifePath.ts";
import { nextElectionAge } from "../src/politicalCareer.ts";
import { getSpecialDecision, specialCareerView } from "../src/specialCareers.ts";
import { clubs } from "../src/specialCareerCatalog.ts";

const newCareerLife = (seed, city = "sofia", avatar = defaultAvatar) => startCareerLife(newLife(seed, avatar, city));

function toAge(life, age) {
  while (life.age < age && !life.finished) {
    const next = playYear(life);
    assert.notEqual(next, life, "Year must advance");
    life = next;
  }
  return life;
}

function act(life, id) {
  const next = doPathAction(life, id);
  assert.notEqual(next, life, id);
  return next;
}

function replay(life) {
  assert.deepEqual(decodeSave(encodeSave(life)), life);
}

function trainingLife(seed = 1) {
  let life = toAge(newCareerLife(seed), 8);
  for (let age = 8; age < 14; age++) {
    life = act(act(life, "special.actor.drama"), "special.actor.camera");
    life = toAge(life, age + 1);
  }
  return toAge(life, 19);
}

function getPart() {
  for (let seed = 1; seed <= 30; seed++) {
    const trained = trainingLife(seed);
    if (trained.finished) continue;
    const applied = act(trained, "special.actor.audition.sofia-dub");
    if (applied.path.special.actor.offer) return act(applied, "special.actor.sign.sofia-dub.license");
  }
  assert.fail("No role offer in the fixture range");
}

test("a creator starts as a teenager and receives a labelled sponsorship once as an adult", () => {
  let life = toAge(newCareerLife(1), 13);
  assert.equal(doPathAction(life, "special.creator.open.tiktok"), life);
  life = act(toAge(life, 14), "special.creator.open.tiktok");
  life = act(act(life, "special.creator.publish.long"), "special.creator.publish.short");
  assert.ok(life.path.special.channel.followers > 0);
  assert.equal(doPathAction(life, "special.creator.sponsor.book"), life);
  for (let year = 15; year < 37; year++) {
    life = toAge(life, year);
    life = act(act(life, "special.creator.publish.long"), "special.creator.publish.short");
    life = doPathAction(life, "special.creator.collab");
    if (year >= 18 && life.path.special.channel.followers >= 1500) break;
  }
  const booked = act(life, "special.creator.sponsor.book");
  const paid = act(booked, "special.creator.sponsor.publish");
  const transferred = Math.floor(booked.path.special.channel.sponsor.gross * .82);
  assert.equal(paid.cash - booked.cash, transferred);
  assert.equal(paid.history.at(-1).cashDelta, transferred);
  assert.equal(doPathAction(paid, "special.creator.sponsor.publish"), paid);
  assert.equal(paid.path.work.job, null);
  assert.equal(pathBudget(paid, paid.path).special.independent.net, 0);
  replay(paid);
  const following = playYear(paid);
  assert.equal(following.path.special.independentGross, 0);
  replay(following);
});

test("YouTube monetization checks followers and qualifying formats together", () => {
  const opened = act(toAge(newCareerLife(1), 19), "special.creator.open.youtube");
  const withNumbers = (watchHours, shorts) => ({ ...opened, path: { ...opened.path, special: {
    ...opened.path.special, channel: { ...opened.path.special.channel, followers: 1000, watchHours, shorts, views: 60_000 },
  } } });
  const below = withNumbers(3999, 9_999_999);
  assert.equal(doPathAction(below, "special.creator.monetize"), below);
  const eligible = act(withNumbers(4000, 0), "special.creator.monetize");
  const payout = pathBudget(eligible, eligible.path).special.independent;
  assert.deepEqual(payout, { gross: 14_400, net: 11_808 });
  assert.equal(playYear(eligible).path.special.careerReceipts, payout.net);
  assert.equal(act(withNumbers(0, 10_000_000), "special.creator.monetize").path.special.channel.monetized, true);
});

test("NATFA practical admissions have three paid rounds, a secondary diploma and an offer", () => {
  let life = trainingLife();
  assert.ok(life.path.school.diploma);
  assert.equal(doPathAction(life, "university.apply.natfiz-acting"), life);
  assert.equal(doPathAction(life, "university.practical-2.natfiz-acting"), life);
  life = act(life, "university.prepare.natfiz-acting");
  const cash = life.cash;
  for (let round = 1; round <= 3; round++) {
    const id = "university.practical-" + round + ".natfiz-acting";
    life = act(life, id);
    assert.equal(doPathAction(life, id), life);
  }
  assert.equal(cash - life.cash, 15_500);
  const application = act(life, "university.apply.natfiz-acting");
  assert.ok(["state", "paid"].includes(application.path.university.applications["natfiz-acting"].outcome));
  replay(application);
});

test("a completed acting contract pays salary and service before separate royalties", () => {
  let life = getPart();
  assert.equal(life.path.work.job.special.kind, "actor");
  assert.equal(pathOccupation(life).en, "Actor");
  assert.ok(specialCareerView(life, "actor").work.some(card => card.id === "production"));
  life = act(life, "special.actor.work.rehearse");
  const service = serviceMonths(life.path.work);
  const budget = pathBudget(life, life.path);
  assert.ok(budget.wage > 0);
  assert.equal(budget.special.independent.net, 0);
  const wrapped = playYear(life);
  assert.equal(wrapped.path.work.job, null);
  assert.equal(serviceMonths(wrapped.path.work), service + 12);
  assert.equal(wrapped.path.special.actor.credits, 1);
  assert.ok(pathBudget(wrapped, wrapped.path).special.independent.net > 0);
  assert.equal(wrapped.history.filter(item => item.id === "special.actor.release.sofia-dub").length, 1);
  replay(wrapped);
  replay(playYear(wrapped));
});

function recruit() {
  for (let seed = 1; seed <= 40; seed++) {
    let life = toAge(newCareerLife(seed, "sofia", defaultMaleAvatar), 14);
    if (life.finished) continue;
    life = act(act(life, "special.athlete.select.football"), "special.athlete.academy");
    for (let age = 14; age < 19; age++) {
      life = act(act(life, "special.athlete.train"), "special.athlete.fitness");
      life = toAge(life, age + 1);
    }
    const targets = specialCareerView(life, "athlete").cards.map(card => card.id);
    assert.ok(targets.includes("levski"));
    assert.ok(!targets.includes("nsa-w"));
    const tried = act(life, "special.athlete.trial.levski");
    if (tried.path.special.sport.offer) return tried;
  }
  assert.fail("No club offer in the fixture range");
}

test("football uses club divisions, a medical clearance, a contract and real season accounting", () => {
  let life = recruit();
  assert.equal(doPathAction(life, "special.athlete.sign.levski"), life);
  life = act(act(life, "special.athlete.medical"), "special.athlete.sign.levski");
  assert.equal(life.path.work.job.special.club, "levski");
  assert.equal(specialCareerView(life, "athlete").work[0].title.en, "Levski Sofia");
  life = act(act(life, "special.athlete.work.drills"), "special.athlete.work.match");
  const service = serviceMonths(life.path.work);
  life = playYear(life);
  assert.equal(serviceMonths(life.path.work), service + 12);
  assert.equal(life.path.special.sport.seasons, 1);
  const result = life.path.special.sport.last;
  assert.equal(result.field, clubs.filter(club => club.sport === "football" && club.level === 1 && club.division === "male").length);
  assert.ok(result.rank >= 1 && result.rank <= result.field);
  assert.ok(result.appearances > 0);
  replay(life);
});

test("a special career prompt can be chosen or skipped once and replays cleanly", () => {
  let life = recruit();
  life = act(act(life, "special.athlete.medical"), "special.athlete.sign.levski");
  const end = life.age + 10;
  for (; !getSpecialDecision(life) && life.age < end; life = playYear(life)) {
    if (!life.path.work.job) {
      for (const item of ["levski", "cska", "slavia"]) {
        const tried = doPathAction(life, "special.athlete.trial." + item);
        if (tried.path.special.sport.offer) {
          life = act(act(tried, "special.athlete.medical"), "special.athlete.sign." + item);
          break;
        }
        life = tried;
      }
    }
    life = doPathAction(life, "special.athlete.recover");
    life = doPathAction(life, "special.athlete.work.drills");
    life = doPathAction(life, "special.athlete.work.match");
    life = doPathAction(life, "special.athlete.work.renew");
  }
  const decision = getSpecialDecision(life);
  assert.ok(decision);
  const skipped = act(life, decision.dismiss);
  assert.deepEqual(skipped.history, life.history);
  assert.equal(getSpecialDecision(skipped), null);
  replay(skipped);
  const chosen = act(life, decision.choices[0].id);
  assert.equal(chosen.history.length, life.history.length + 1);
  assert.deepEqual(chosen.history.at(-1).decision.situation, decision.situation);
  assert.equal(doPathAction(chosen, decision.choices[1].id), chosen);
  replay(chosen);
});

test("municipal election registration, voting, a paid term and the term end replay", () => {
  let life = toAge(newCareerLife(1), 16);
  assert.equal(doPathAction(life, "special.politics.run.council.independent"), life);
  assert.equal(doPathAction(life, "special.politics.run.president.list"), life);
  for (let age = 16; age <= nextElectionAge(18, "council"); age++) {
    life = toAge(life, age);
    life = act(act(life, "special.politics.civic"), "special.politics.volunteer");
    if (age === 18) life = act(life, "special.politics.run.council.independent");
    if (age >= 18) life = act(life, "special.politics.campaign.field");
  }
  assert.equal(life.age, nextElectionAge(18, "council"));
  assert.equal(doPathAction(life, "special.politics.run.assembly.independent"), life);
  life = act(life, "special.politics.campaign.register");
  life = act(act(life, "special.politics.campaign.meeting"), "special.politics.campaign.debate");
  life = playYear(life);
  assert.ok(life.path.special.politics.last.won);
  const first = act(life, "special.politics.swear.council");
  assert.equal(first.path.work.job.monthsLeft, 48);
  assert.equal(first.path.work.job.special.office, "council");
  const voted = act(first, "special.politics.work.vote");
  assert.ok(voted.path.special.politics.approval > first.path.special.politics.approval);
  assert.ok(pathBudget(voted, voted.path).wage > 0);
  const end = toAge(voted, voted.age + 4);
  assert.equal(end.path.work.job, null);
  assert.equal(end.path.special.politics.service, 4);
  assert.ok(end.history.some(item => item.id === "special.politics.term-end"));
  replay(end);
});

test("a local teen debut requires a production permit and ends as short part-time work", () => {
  let selected;
  for (let seed = 1; seed < 20; seed++) {
    let life = toAge(newCareerLife(seed), 13);
    for (let age = 13; age < 16; age++) {
      life = act(act(life, "special.actor.drama"), "special.actor.camera");
      life = toAge(life, age + 1);
    }
    const tried = act(life, "special.actor.audition.sofia-background");
    if (tried.path.special.actor.offer) { selected = tried; break; }
  }
  assert.ok(selected);
  const sign = "special.actor.sign.sofia-background.fixed";
  assert.equal(doPathAction(selected, sign), selected);
  assert.equal(doPathAction(selected, "special.actor.sign.sofia-background.license"), selected);
  const hired = act(act(selected, "special.actor.permit.sofia-background"), sign);
  assert.equal(hired.path.work.job.hours, 4);
  assert.equal(hired.path.work.job.monthsLeft, 2);
  const wrapped = playYear(act(hired, "special.actor.work.rehearse"));
  assert.equal(wrapped.path.work.job, null);
  assert.equal(wrapped.path.special.actor.credits, 1);
  assert.equal(wrapped.path.work.insuredMonths, 2);
  replay(wrapped);
});

test("the presidency requires a running mate and caps the number of terms", () => {
  let life = toAge(newCareerLife(1), nextElectionAge(40, "president"));
  life = act(life, "special.politics.civic");
  life = { ...life, path: { ...life.path, special: { ...life.path.special,
    politics: { ...life.path.special.politics, standing: 76 },
  } } };
  const campaign = act(life, "special.politics.run.president.list");
  const registration = "special.politics.campaign.register";
  assert.equal(doPathAction(campaign, registration), campaign);
  const ticket = act(campaign, "special.politics.campaign.ticket.transport");
  assert.equal(act(ticket, registration).path.special.politics.campaign.registered, true);
  const served = { ...life, path: { ...life.path, special: { ...life.path.special,
    politics: { ...life.path.special.politics, presidentialTerms: 2 },
  } } };
  assert.equal(doPathAction(served, "special.politics.run.president.list"), served);
  assert.equal(doPathAction(served, "special.politics.run.premier.list"), served);
});

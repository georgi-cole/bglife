import test from "node:test";
import assert from "node:assert/strict";
import {
  advance, annualBudget, choose, decodeSave, doAction, doLifeActivity, encodeSave,
  getChoices, getEstate, getLifeActivities, getPersonActivities, giveUp, lifeStatKeys, newChapterLife as newLife, newProfileLife, playYear, startCareerLife,
} from "../src/engine.ts";
import { defaultAvatar } from "../src/avatar.ts";
import { personAvatarTraits, personCity, personName, personRelationship } from "../src/peopleIdentity.ts";

const option = (s, id) => getLifeActivities(s).find(activity => activity.id === id);
function pick(s) {
  const choices = getChoices(s);
  const choice = (s.age === 19 && choices.find(item => item.id === "stay")) || choices[0];
  assert.ok(choice, "Every year has a feasible story choice");
  return choose(s, choice.id);
}
function doActivity(s, id) {
  const offered = option(s, id);
  assert.ok(offered);
  assert.equal(offered.blocked, null, id);
  const after = doLifeActivity(s, id);
  assert.notStrictEqual(after, s);
  assert.equal(after.cash - s.cash, offered.cashDelta || 0);
  assert.deepEqual(after.history.at(-1).statsDelta, offered.statDelta);
  for (const key of lifeStatKeys) assert.ok(0 <= after.stats[key] && after.stats[key] <= 100, key);
  return after;
}
function replayLegacyAction(s, id) {
  assert.equal(option(s, id), undefined);
  assert.strictEqual(doLifeActivity(s, id), s);
  const transcript = JSON.parse(encodeSave(s));
  transcript.commands.push({ age: s.age, kind: "action", id });
  const replayed = decodeSave(JSON.stringify(transcript));
  assert.ok(replayed, "Old journals still replay " + id);
  return replayed;
}
function toAge(age, seed = 108) {
  let s = newLife(seed);
  while (s.age < age) s = advance(pick(s));
  return s;
}
function roundTrip(s) {
  assert.deepEqual(decodeSave(encodeSave(s)), s);
}

test("distinct activities, story actions and longer outings can share a year", () => {
  const fresh = newLife(108);
  assert.ok(option(fresh, "gym.run").blocked);
  assert.ok(option(fresh, "social.onlyfans.register").blocked);
  assert.strictEqual(doLifeActivity(fresh, "gym.run"), fresh);
  const chosen = pick(fresh);
  const afterRun = doActivity(chosen, "gym.run");
  assert.ok(afterRun.stats.health > chosen.stats.health);
  assert.strictEqual(doLifeActivity(afterRun, "gym.run"), afterRun);
  const afterMarket = doAction(afterRun, "market-morning");
  const afterPicnic = doActivity(afterMarket, "holidays.picnic");
  assert.equal(afterPicnic.usedActions.length, 3);
  roundTrip(afterPicnic);
  const next = advance(afterPicnic);
  assert.ok(next.history.at(-1).statsDelta.brains > 0);
  roundTrip(next);

  const grown = pick(toAge(23));
  const trip = doActivity(grown, "holidays.abroad");
  roundTrip(trip);
});

test("an urgent in-game issue permits 112 before the story choice and after other activities", () => {
  const s = playYear(newLife(40));
  assert.equal(s.lifeSystems.medicalIssue, "urgent");
  assert.equal(s.choiceId, null);
  assert.ok(option(s, "hospital.clinic").blocked);
  const emergency = doActivity(s, "hospital.emergency");
  assert.equal(emergency.lifeSystems.medicalIssue, null);
  assert.strictEqual(doLifeActivity(emergency, "hospital.emergency"), emergency);
  roundTrip(emergency);

  const full = doActivity(doActivity(pick(s), "hospital.grandma"), "holidays.picnic");
  const after = doActivity(full, "hospital.emergency");
  roundTrip(after);
});

test("bank transfers, the borrowing ledger and estate cash remain replayable", () => {
  let s = pick(toAge(18));
  s = doActivity(s, "bank.open");
  s = doActivity(s, "bank.deposit");
  assert.equal(s.lifeSystems.bank.balance, 20_000);
  s = pick(advance(s));
  assert.equal(s.age, 19);
  assert.equal(s.lifeSystems.bank.balance, 20_200);
  const before = s.cash;
  s = doActivity(s, "bank.loan");
  assert.equal(s.cash, before + 60_000);
  const budget = annualBudget(s);
  assert.equal(budget.obligations, 23_000);
  const after = advance(s);
  assert.equal(after.lifeSystems.bank.loan, 40_000);
  assert.equal(after.cash, s.cash + budget.net);
  assert.equal(after.cash, 70_000 + after.history.reduce((total, entry) => total + entry.cashDelta, 0));
  const estate = getEstate(after);
  assert.equal(estate.net, estate.cash + estate.bankBalance + estate.homeValue + estate.rentalDeposit - estate.debt);
  roundTrip(after);
});

test("legacy pregnancy saves replay into a family and an estate plan splits the remaining balance", () => {
  let s = pick(toAge(18));
  s = doActivity(s, "family.dating-service");
  s = doActivity(s, "family.time-together");
  s = pick(advance(s));
  s = doActivity(s, "family.commit");
  s = doActivity(s, "family.time-together");
  s = pick(advance(s));
  s = doActivity(s, "family.engage");
  s = doActivity(s, "family.marry");
  s = pick(advance(s));
  s = replayLegacyAction(s, "family.baby");
  assert.equal(s.lifeSystems.family.expecting, true);
  s = doActivity(s, "legacy.add.partner");
  s = pick(advance(s));
  assert.equal(s.lifeSystems.family.children, 1);
  assert.deepEqual(s.lifeSystems.family.childProfiles, [{ joinedAt: s.age, ageAtJoin: 0, bond: 60, gender: "male" }]);
  assert.equal(personAvatarTraits(s, "child-0").presentation, "male");
  assert.match(personName(s, "child-0").bg, /Николов$/);
  assert.equal(s.lifeSystems.family.expecting, false);
  s = doActivity(s, "legacy.add.children");
  s = doActivity(s, "legacy.prepare");

  const ended = giveUp(s);
  assert.equal(ended.finished, true);
  assert.equal(ended.endReason, "gaveUp");
  assert.equal(ended.history.at(-1).kind, "end");
  assert.strictEqual(giveUp(ended), ended);
  assert.strictEqual(playYear(ended), ended);
  const estate = getEstate(ended);
  assert.deepEqual(estate.shares.map(share => share.heir), ["partner", "children"]);
  assert.equal(estate.shares.reduce((sum, share) => sum + share.amount, 0), estate.net);
  roundTrip(ended);
});

test("a former partner remains in the life history after a save is replayed", () => {
  let s = pick(toAge(18));
  s = doActivity(s, "family.dating-service");
  const portrait = personAvatarTraits(s, s.lifeSystems.family.partner);
  s = doActivity(s, "family.break-up");
  assert.equal(s.lifeSystems.family.stage, "single");
  assert.deepEqual(s.lifeSystems.family.formerPartners, [{ id: "serviceMatch", endedAt: 18 }]);
  assert.deepEqual(personAvatarTraits(decodeSave(encodeSave(s)), "serviceMatch"), portrait);
  roundTrip(s);
});

test("an adopted child keeps the same recorded gender, name and portrait on replay", () => {
  const s = replayLegacyAction(pick(toAge(22, 109)), "family.adopt");
  const [child] = s.lifeSystems.family.childProfiles;
  assert.equal(child.gender, "female");
  assert.equal(personAvatarTraits(s, "child-0").presentation, child.gender);
  assert.match(personName(s, "child-0").bg, /Николова$/);
  roundTrip(s);
});

test("platform options require an account and posts have persistent followers and effects", () => {
  const s = pick(newLife(108));
  assert.ok(option(s, "social.tiktok.video").blocked);
  const registered = doActivity(s, "social.tiktok.register");
  const video = getLifeActivities(registered).find(activity => (
    activity.id.startsWith("social.tiktok.") && !activity.id.endsWith(".register") && activity.blocked === null
  ));
  assert.ok(video);
  const after = doActivity(registered, video.id);
  assert.equal(after.lifeSystems.social.tiktok.posts, 1);
  assert.ok(after.lifeSystems.social.tiktok.followers > 0);
  assert.ok(after.stats.influence > s.stats.influence);
  roundTrip(after);
});

test("profile actions use money and trust and replay with the same outcome", () => {
  const s=pick(toAge(16));
  assert.ok(getPersonActivities(s,"niki").some(action=>action.id==="people.niki.game"));
  assert.ok(!getPersonActivities(s,"niki").some(action=>action.id==="people.niki.gaming"));
  assert.deepEqual(getPersonActivities(s,"appMatch"), []);
  assert.strictEqual(doLifeActivity(s,"people.appMatch.video-call"),s);
  assert.ok(!getLifeActivities(s).some(action=>action.id.startsWith("people.")));
  assert.strictEqual(doLifeActivity(s,"people.rumi.coffee"),s);
  const oldVisit = replayLegacyAction(s, "people.rumi.coffee");
  assert.equal(oldVisit.trust.rumi,s.trust.rumi+7);
  assert.equal(oldVisit.cash,s.cash-800);
  assert.equal(oldVisit.history.at(-1).person,"rumi");
  roundTrip(oldVisit);

  const sofia = choose(toAge(19), "rumi");
  const after = doLifeActivity(sofia, "people.rumi.coffee");
  assert.equal(after.trust.rumi, sofia.trust.rumi + 7);
  assert.equal(after.cash, sofia.cash - 800);
  assert.strictEqual(doLifeActivity(after,"people.rumi.coffee"),after);
  roundTrip(after);
});

test("child profiles offer age-appropriate actions that strengthen their bond", () => {
  let s=pick(toAge(21));
  assert.deepEqual(getPersonActivities(s,"child-0"),[]);
  s=replayLegacyAction(s,"family.adopt");
  assert.ok(getPersonActivities(s,"child-0").some(action=>action.id==="people.child-0.playground"));
  assert.ok(!getPersonActivities(s,"child-0").some(action=>action.id==="people.child-0.board-game"));
  s=doLifeActivity(s,"people.child-0.bedtime");
  assert.equal(s.lifeSystems.family.childProfiles[0].bond,53);
  roundTrip(s);
  while(s.age<23)s=pick(advance(s));
  assert.ok(getPersonActivities(s,"child-0").some(action=>action.id==="people.child-0.board-game"));
  assert.strictEqual(doLifeActivity(s,"people.child-0.park"),s);
});

test("branched walks respect locations and record the selected place and person", () => {
  const town=pick(toAge(16));
  const townChoices=getPersonActivities(town,"friend").filter(action=>action.branch?.id==="walk");
  assert.ok(!townChoices.some(action=>action.id.endsWith(".south-park")));
  assert.strictEqual(doLifeActivity(town, "people.friend.walk.south-park"), town);
  const walked=doLifeActivity(town,"people.friend.walk.tryavna-centre");
  assert.ok(walked.history.at(-1).title.bg.includes("Часовниковата кула"));
  assert.ok(walked.history.at(-1).text.bg.includes("Елица Петрова"));
  assert.strictEqual(doLifeActivity(walked,"people.friend.walk.tryavna-river"),walked);
  roundTrip(walked);
  const sofia=choose(toAge(19),"rumi");
  assert.equal(sofia.city,"sofia");
  const route=getPersonActivities(sofia,"rumi").find(action=>action.id==="people.rumi.walk.ariana");
  assert.equal(route.blocked,null);
  roundTrip(doLifeActivity(sofia,route.id));
});

function familyAt(age) {
  let life = startCareerLife(newProfileLife({
    seed: 108, city: "tryavna", presentation: "female", avatar: defaultAvatar,
    profile: { name: "Яна Костова", talent: "none", vip: true, wealthy: true, disposition: null },
  }));
  while (life.age < age && !life.finished) life = playYear(life);
  assert.equal(life.age, age);
  const [choice] = getChoices(life);
  return choice ? choose(life, choice.id) : life;
}

test("relatives share the social catalogue and get different family activities by role", () => {
  const life = familyAt(18);
  const mother = life.birthFamily.relatives.find(row => row.role === "mother");
  const distant = life.birthFamily.relatives.find(row => ["aunt", "uncle", "grandmother"].includes(row.role)
    && !row.household && !life.deceased[row.id] && personCity(life, row.id) === life.city);
  assert.ok(mother && distant);
  const motherOptions = getPersonActivities(life, mother.id);
  const auntOptions = getPersonActivities(life, distant.id);
  for (const options of [motherOptions, auntOptions]) {
    for (const group of ["conversation", "compliment", "gift", "walk"]) {
      assert.ok(options.some(option => option.branch?.id === group && !option.blocked), group);
    }
  }
  assert.ok(motherOptions.some(option => option.id.endsWith(".family-advice")));
  assert.ok(motherOptions.some(option => option.id.endsWith(".family-help")));
  assert.ok(!motherOptions.some(option => option.id.endsWith(".family-recipe")));
  assert.ok(auntOptions.some(option => option.id.endsWith(".family-recipe")));
  assert.ok(auntOptions.some(option => option.id.endsWith(".family-album")));
  assert.ok(!auntOptions.some(option => option.id.endsWith(".family-help")));

  const compliment = "people." + mother.id + ".compliment.effort";
  const after = doLifeActivity(life, compliment);
  assert.ok(personRelationship(after, mother.id) > personRelationship(life, mother.id));
  assert.strictEqual(doLifeActivity(after, "people." + mother.id + ".compliment.style"), after);
  roundTrip(after);
});

test("moving switches contacts to remote actions and visits use the destination without relocating", () => {
  const home = familyAt(18);
  const mother = "kin-mother";
  const together = getPersonActivities(home, mother);
  assert.ok(together.some(option => option.branch?.id === "walk"));
  assert.ok(!together.some(option => option.id.includes(".visit.")));
  const moved = doAction(home, "move.sofia");
  assert.equal(moved.city, "sofia");
  assert.equal(personCity(moved, mother), "tryavna");
  const away = getPersonActivities(moved, mother);
  assert.ok(away.some(option => option.branch?.label.bg === "Обади се"));
  assert.ok(away.some(option => option.id.endsWith(".remote-message")));
  assert.ok(away.some(option => option.id.endsWith(".remote-parcel")));
  assert.ok(away.some(option => option.id.endsWith(".family-advice")));
  assert.ok(!away.some(option => ["walk", "fitness", "gift"].includes(option.branch?.id)));
  assert.ok(!away.some(option => option.id.endsWith(".family-help")));
  assert.strictEqual(doLifeActivity(moved, "people.kin-mother.walk.south-park"), moved);
  assert.strictEqual(doLifeActivity(moved, "people.kin-mother.family-help"), moved);
  assert.strictEqual(doLifeActivity(moved, "people.kin-mother.visit.varna"), moved);
  assert.ok(getPersonActivities(moved, "friend").some(option => option.id === "people.friend.visit.tryavna"));
  assert.ok(!getPersonActivities(moved, "friend").some(option => option.id === "people.friend.cinema"));
  assert.ok(!getPersonActivities(moved, "rumi").some(option => option.id.includes(".visit.")));

  const visit = away.find(option => option.id === "people.kin-mother.visit.tryavna");
  assert.equal(visit?.label.bg, "Посети в Трявна");
  assert.ok(visit.cashDelta < 0);
  const shortOnCash = { ...moved, cash: 0 };
  assert.strictEqual(doAction(shortOnCash, visit.id), shortOnCash);
  const visited = doAction(moved, visit.id);
  assert.equal(visited.cash - moved.cash, visit.cashDelta);
  assert.equal(visited.city, "sofia");
  assert.ok(personRelationship(visited, mother) > personRelationship(moved, mother));
  assert.match(visited.history.at(-1).text.bg, /в Трявна/);
  assert.strictEqual(doAction(visited, visit.id), visited);
  roundTrip(visited);
});

test("localized branch choices use actual wallet and relationship changes", () => {
  const initial=pick(toAge(16));
  const voucher=doLifeActivity(initial,"people.rumi.give-money.billa-voucher");
  assert.equal(voucher.cash,initial.cash-1500);
  assert.ok(voucher.history.at(-1).text.bg.includes("ваучера"));
  assert.strictEqual(doLifeActivity(voucher,"people.rumi.give-money.old-leva"),voucher);
  const insult=doLifeActivity(voucher,"people.rumi.insult.filmar");
  assert.ok(insult.trust.rumi<voucher.trust.rumi);
  const asked=doLifeActivity(initial,"people.rumi.ask-money.doner");
  assert.ok([0,500].includes(asked.cash-initial.cash));
  assert.equal(asked.history.at(-1).cashDelta,asked.cash-initial.cash);
  roundTrip(asked);
  roundTrip(insult);
});

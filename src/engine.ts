import { advanceContactLives, weddingInvitation } from "./contactLives.ts";
import { cleanFirstName } from "./babyNames.ts";
import { getPeopleActivityDefinitions, personVisitDefinition, remoteBranchLabels } from "./peopleActivities.ts";
import { applyNewbornNames, familyPlayEnabled, settleReproductionYear, updateReproduction, type SurnameSource } from "./reproduction.ts";
import { backgroundPregnancy } from "./lifeReproduction.ts";
import { advancePregnancy, dismissPregnancyNotice, resolvePregnancyCheck, startPregnancyPlay, terminatePregnancy } from "./pregnancyTimeline.ts";
import { markAnniversaries, trackRelationship } from "./relationships.ts";
import { markMaternityYear, maternityPay, onMaternityLeave, returnFromMaternity } from "./maternity.ts";
import { cities, inCityBg, isCity, type City } from "./cities.ts";
import { generateBirthFamily, isKin, type BirthFamily } from "./birthFamily.ts";
import { cityPaths, jobTypes, studyFields, type Enrollment, type JobId, type SchoolLevel } from "./cityPaths.ts";
import { kinActivities, kinActivityById } from "./kinActivities.ts";
import { automaticAppearance, dispositions, HEIR_CASH, parseLifeProfile, talentBonus, type LifeProfile, type NewLifeDraft } from "./lifeProfile.ts";
import { isKnownPerson, personCity, personName, storyPeople, type PeopleId } from "./peopleIdentity.ts";
import { cityChoices, cityEventMemory, getCityEvent, openCityEvent, parseCityEvent, rollCityEvent } from "./cityLife.ts";
import type { CityEventRoll } from "./cityLifeModel.ts";
import { birthEntry, retirementEligible, yearlyMoment } from "./lifeEvents.ts";
import { everydayEvents } from "./everydayEvents.ts";
import { mortalityCondition, treatHealth } from "./lifeHealth.ts";
import { settlePeople } from "./lifeLoss.ts";
import { deathCauses, MAX_AGE, rollDeath, type Death } from "./mortality.ts";
import { actions, hasPendingStoryDecision, scenes } from "./story.ts";
import { parseAvatar, type AvatarTraits } from "./avatar.ts";
import {
  activityDefinitions, applyStats, getLifeActivityDefinition, lifeActivityOption, startingLifeSystems,
  startingStats, statsChange, type LifeActivityOption, type LifeStats, type LifeSystems, type StatDelta,
} from "./lifeActivities.ts";
import { billText, settleFinances } from "./lifeEconomy.ts";
import { settleAssets } from "./lifeAssets.ts";
import { settleWellbeing, storyStats } from "./lifeWellbeing.ts";
import { closePathYear, pathBudget, relocatePath, resolvePathAction, startPath, type LifePath } from "./lifePath.ts";
import { pathText } from "./pathCatalog.ts";
import { openSpecialYear } from "./specialCareers.ts";
import { serviceMonths } from "./employment.ts";
import { drawWorkEvent, queueWorkEvent, type WorkImpact } from "./workplace.ts";

export { hasPendingStoryDecision } from "./story.ts";
export { lifeHeirLabel, lifePartnerLabel, lifeStatKeys } from "./lifeActivities.ts";
export type { Heir, LifeActivityCategory, LifeActivityOption, LifeStat, LifeStats, Platform } from "./lifeActivities.ts";
export { getEstate } from "./lifeEconomy.ts";

/** All amounts in state or story effects are integer euro cents. */
export type Text = { bg: string; en: string };
export type { City } from "./cities.ts";
export { MAX_AGE } from "./mortality.ts";
export type Housing = "home" | "rumi" | "shared";
export type Career = "student" | "woodcarver" | "qa" | "local-job";
export type PersonId = "rumi" | "niki" | "mentor" | "friend";
export type Condition = {
  city?: City;
  housing?: Housing;
  flags?: string[];
  without?: string[];
  minCash?: number;
};
export type Effect = {
  cash?: number;
  city?: City;
  housing?: Housing;
  career?: Career;
  flags?: string[];
  removeFlags?: string[];
  trust?: Partial<Record<PersonId, number>>;
  person?: PersonId;
  stats?: StatDelta;
};
export type Option = { id: string; label: Text; result: Text; effect?: Effect; when?: Condition };
export type Scene = {
  id: string;
  age: number;
  title: Text;
  body: Text;
  choices: Option[];
  when?: Condition;
  priority?: number;
  requiresWork?: boolean;
};
export type Action = Option & { minAge?: number; maxAge?: number; requiresWork?: boolean };

const pregnancyActions = {
  "pregnancy-test": resolvePregnancyCheck,
  "pregnancy-read": dismissPregnancyNotice,
  "pregnancy-turn": advancePregnancy,
  "pregnancy-end": terminatePregnancy,
};
export type PregnancyAction = keyof typeof pregnancyActions;
export type Command =
  | { age: number; kind: "choice" | "action" | "path" | "skip-decision"; id: string }
  | { age: number; kind: "year"; cityEvent?: CityEventRoll | null; workEvent?: string; contactLives?: 1 }
  | { age: number; kind: "end" | "maternity-return" | PregnancyAction }
  | { age: number; kind: "name-children"; names: string[]; surname: SurnameSource };
export type Memory = {
  age: number;
  city: City;
  kind: "choice" | "action" | "year" | "end" | "event" | "path";
  id: string;
  title: Text;
  text: Text;
  person?: PersonId;
  witnesses: PersonId[];
  cashDelta: number;
  statsDelta?: StatDelta;
  movedTo?: City;
  startedCareer?: Career;
  cityEvent?: CityEventRoll;
  decision?: { choice: Text; situation: Text };
  workImpact?: WorkImpact;
};

export type GameState = {
  seed: number;
  avatar: AvatarTraits | null;
  profile: LifeProfile | null;
  birthFamily: BirthFamily | null;
  enrollment: Enrollment | null;
  localJob: JobId | null;
  age: number;
  city: City;
  birthCity: City;
  origin: "birth" | "chapter";
  storyRoute: boolean;
  lifespanStart: number | null;
  careerFrom: number | null;
  path: LifePath | null;
  death: Death | null;
  deceased: Partial<Record<PeopleId, Death>>;
  serviceYears: number;
  retirement: { age: number; payment: number } | null;
  housing: Housing;
  career: Career;
  cash: number;
  deposit: number;
  trust: Record<PersonId, number>;
  flags: string[];
  history: Memory[];
  usedActions: string[];
  skippedDecisions: string[];
  sceneId: string;
  choiceId: string | null;
  commands: Command[];
  finished: boolean;
  endReason: "chapter" | "gaveUp" | "death" | null;
  stats: LifeStats;
  lifeSystems: LifeSystems;
};

export const FIRST_AGE = 0;
const CHAPTER_START = 16;
const CHAPTER_END = 26;
const SHARED_DEPOSIT = 40_000;
const MOVE_COST = 16_000;
const FORMAT = "bglife.chapter";
const ORIGINAL_CONTENT = "tryavna-sofia-1";
const LIFESPAN_CONTENT = "bulgarian-lifespan-1";
const FAMILY_CONTENT = "bulgarian-family-1";
const CAREER_CONTENT = "bulgarian-career-1";

function eligible(s: GameState, filter?: Condition): boolean {
  if (!filter) return true;
  return (!filter.city || filter.city === s.city)
    && (!filter.housing || filter.housing === s.housing)
    && (filter.minCash === undefined || s.cash >= filter.minCash)
    && (!filter.flags || filter.flags.every((flag) => s.flags.includes(flag)))
    && (!filter.without || filter.without.every((flag) => !s.flags.includes(flag)));
}

function sceneForYear(s: GameState): string {
  if (!s.storyRoute || s.age < CHAPTER_START || s.age > CHAPTER_END) return "";
  if (s.path && s.age === 18 && (s.path.school.grade !== 12 || s.path.school.left)) return "";
  const matches = scenes.filter((scene) => scene.age === s.age && eligible(s, scene.when));
  if (matches.length === 0) throw new Error("Missing eligible scene for age " + s.age);
  const eligibleScenes = onMaternityLeave(s) ? matches.filter(scene => !scene.requiresWork) : matches;
  if (!eligibleScenes.length) return "";
  const priority = Math.max(...eligibleScenes.map((scene) => scene.priority ?? 0));
  const pool = eligibleScenes.filter((scene) => (scene.priority ?? 0) === priority);
  // Keep a stable draw even when the player backgrounds or reopens a decision.
  const draw = Math.imul(s.seed ^ Math.imul(s.age, 0x85ebca6b), 0xc2b2ae35) >>> 0;
  return pool[draw % pool.length].id;
}

function randomSeed(): number {
  return globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? (Date.now() >>> 0);
}

function createLife(seed: number, avatar: AvatarTraits | null, birthCity: City, chapter: boolean, profile: LifeProfile | null = null): GameState {
  const stats = startingStats();
  const s: GameState = {
    seed: seed >>> 0, avatar, profile, age: chapter ? CHAPTER_START : FIRST_AGE, city: birthCity,
    birthFamily: profile ? generateBirthFamily(seed >>> 0, birthCity, profile.name) : null,
    enrollment: null, localJob: null,
    birthCity, origin: chapter ? "chapter" : "birth",
    storyRoute: birthCity === "tryavna", lifespanStart: chapter ? null : 0, careerFrom: null, path: null,
    death: null, deceased: {}, serviceYears: 0, retirement: null,
    housing: "home", career: "student", cash: chapter ? 70_000 : profile?.wealthy ? HEIR_CASH : 0, deposit: 0,
    trust: { rumi: 60, niki: 45, mentor: 45, friend: 55 },
    flags: [], history: [], usedActions: [], skippedDecisions: [], sceneId: "", choiceId: null, commands: [], finished: false,
    endReason: null, stats: chapter ? stats : applyStats({ ...stats, health: 88, brains: 12 },
      profile?.disposition ? dispositions[profile.disposition].stats : {}), lifeSystems: startingLifeSystems(),
  };
  s.sceneId = sceneForYear(s);
  if (!chapter) s.history.push(birthEntry(s));
  return chapter ? s : startPregnancyPlay(s);
}

export function newLife(seed = randomSeed(), avatar: AvatarTraits | null = null, city: City = "tryavna"): GameState {
  return createLife(seed, avatar, city, false);
}

export function newProfileLife(draft: NewLifeDraft): GameState {
  const profile = parseLifeProfile(draft.profile);
  if (!profile) throw new Error("Invalid new life profile");
  const avatar = profile.vip && (draft.avatar.presentation ?? "female") === draft.presentation ? parseAvatar(draft.avatar) : null;
  return createLife(draft.seed, avatar ?? automaticAppearance(draft.presentation, draft.seed), draft.city, false, profile);
}

export function newChapterLife(seed = randomSeed(), avatar: AvatarTraits | null = null): GameState {
  return createLife(seed, avatar, "tryavna", true);
}

export function hasStartedLife(s: GameState): boolean {
  return s.avatar !== null || s.commands.length > 0;
}

/** Upgrade the active life at the exact end of its original transcript. */
export function continueLife(s: GameState): GameState {
  if (s.lifespanStart !== null || s.endReason === "gaveUp") return s;
  if (!hasStartedLife(s)) return newLife(s.seed);
  const life = { ...s, lifespanStart: s.commands.length };
  if (s.endReason !== "chapter") return life;
  const next: GameState = { ...life, age: CHAPTER_END + 1, finished: false, endReason: null };
  const moment = yearlyMoment(next);
  return settleReproductionYear(moment ? { ...next, history: [...next.history, moment] } : next);
}

/** Attach Career after the previous rules have replayed to the saved checkpoint. */
export function startCareerLife(s: GameState): GameState {
  if (s.path || s.finished || s.lifespanStart === null) return s;
  return { ...s, careerFrom: s.commands.length, path: startPath(s) };
}

const relocationReplies: Record<string, Text> = {
  rumi: pathText("Ключът тежи в джоба ти. Обявите за стаж са в „Кариера“.",
    "The key is heavy in your pocket. Trainee vacancies are in Career."),
  shared: pathText("Остави депозит за стаята. Вече можеш да търсиш работа или следване в София.",
    "You paid the rental deposit. You can now look for work or study in Sofia."),
  stay: pathText("Стефан ти каза да минеш за разговор, ако искаш да кандидатстваш за чирак.",
    "Stefan asked you to drop by if you want to apply for the apprenticeship."),
};

export function getScene(s: GameState): Scene | null {
  const scene = s.finished ? null : scenes.find(item => item.id === s.sceneId) ?? null;
  if (!s.path || scene?.id !== "spare-key") return scene;
  return { ...scene, choices: scene.choices.map(option => {
    const { career: _career, ...effect } = option.effect ?? {};
    return { ...option, effect, result: relocationReplies[option.id] ?? option.result,
      label: option.id === "stay"
        ? s.city === "tryavna" ? pathText("Остани в Трявна", "Stay in Tryavna") : pathText("Върни се в Трявна", "Return to Tryavna")
        : option.label };
  }) };
}

function cashEffect(s: GameState, effect?: Effect): number {
  const leavingShared = effect?.housing !== undefined && effect.housing !== "shared" && s.housing === "shared";
  return (effect?.cash ?? 0) + (leavingShared ? s.deposit : 0);
}

function available(s: GameState, option: Option): boolean {
  const changingCity = option.effect?.city && option.effect.city !== s.city;
  const student = s.path?.university.student;
  if (changingCity && (s.path?.work.job || (student && !student.paused))) return false;
  const cost = cashEffect(s, option.effect);
  return eligible(s, option.when) && ((s.path !== null && cost >= 0) || s.cash + cost >= 0);
}

export function getChoices(s: GameState): Option[] {
  if (s.finished || !hasPendingStoryDecision(s) || s.lifeSystems.reproduction.naming || s.lifeSystems.reproduction.notice) return [];
  return getScene(s)?.choices.filter((option) => available(s, option)) ?? [];
}

/** The Play button can take the displayed low-commitment choice on behalf of the player. */
export function defaultPlayChoice(s: GameState): Option | undefined {
  if (s.lifeSystems.reproduction.pregnancy?.gestation) return undefined;
  const choices = getChoices(s);
  if (s.sceneId === "spare-key") return choices.find((option) => option.id === "stay");
  return choices.find((option) => (option.effect?.cash ?? 0) >= 0
    && !(option.effect?.city && option.effect.city !== s.city)
    && !(option.effect?.housing && option.effect.housing !== s.housing)
    && !Object.values(option.effect?.trust ?? {}).some((change) => change < 0));
}

export function playYear(s: GameState, expectedAge = s.age): GameState {
  const { pregnancy, naming, notice } = s.lifeSystems.reproduction;
  if (s.age !== expectedAge || s.finished || naming || notice) return s;
  if (pregnancy?.gestation) return doPregnancyAction(s, "pregnancy-turn", expectedAge);
  if (!hasPendingStoryDecision(s)) return advance(s, expectedAge);
  const option = defaultPlayChoice(s);
  return option ? advance(choose(s, option.id, expectedAge), expectedAge) : s;
}

export function yearRecap(s: GameState, age: number) {
  const entries = s.history.filter((entry) => entry.age === age);
  const budget = entries.find((entry) => entry.kind === "year");
  if (!budget) return null;
  const cashDelta = entries.reduce((total, entry) => total + entry.cashDelta, 0);
  const laterDelta = s.history.reduce((total, entry) => entry.age > age ? total + entry.cashDelta : total, 0);
  return { age, entries, cashDelta, closingCash: s.cash - laterDelta };
}

const localWork: Action = {
  id: "life.work", label: { bg: "Започни работа", en: "Start a job" },
  result: { bg: "Прие предложение за работа в града и вече имаш постоянен доход.",
    en: "You accepted an offer from a local employer and now have a regular income." },
  effect: { career: "local-job" },
};

const retire: Action = {
  id: "life.retire", label: { bg: "Пенсионирай се", en: "Retire" },
  result: { bg: "Приключи последната си смяна. От тази година основният ти доход е пенсията.",
    en: "You finished your last shift. From this year, your pension is your main source of income." },
};

function studyActions(s: GameState): Action[] {
  let level: SchoolLevel;
  if (s.age >= 14 && s.age < 19) level = "secondary";
  else if (s.age >= 19 && s.age <= 24 && s.career === "student") level = "higher";
  else return [];
  const previous = s.enrollment && cityPaths[s.enrollment.city].schools[s.enrollment.index];
  if (previous?.level === level) return [];
  return cityPaths[s.city].schools.flatMap((school, index) => school.level !== level ? [] : [{
    id: `life.study.${index}.${school.field}`,
    label: { bg: school.name.bg + " · " + studyFields[school.field].bg, en: school.name.en + " · " + studyFields[school.field].en },
    result: { bg: "Записа се в " + school.name.bg + ".", en: "You enrolled at " + school.name.en + "." },
  }]);
}

function workActions(s: GameState): Action[] {
  if (s.sceneId || s.age < 19 || s.retirement || s.career !== "student" || s.localJob || onMaternityLeave(s)) return [];
  if (!s.profile) return [localWork];
  if (s.enrollment && s.enrollment.graduationAge > s.age) return [];
  return cityPaths[s.city].jobs.map(id => ({
    ...localWork, id: "life.work." + id, label: jobTypes[id].label,
    result: { bg: "Започна работа на позиция „" + jobTypes[id].label.bg + "“.",
      en: "You started a new job as " + jobTypes[id].label.en + "." },
  }));
}

export function getActions(s: GameState): Action[] {
  if (s.finished || hasPendingStoryDecision(s) || s.lifeSystems.reproduction.naming || s.lifeSystems.reproduction.notice) return [];
  const onLeave = onMaternityLeave(s);
  const availableActions = s.sceneId ? actions.filter((action) =>
    s.age >= (action.minAge ?? CHAPTER_START) && s.age <= (action.maxAge ?? CHAPTER_END)
    && (!onLeave || !action.requiresWork)
    && (!s.path || action.id !== "extra-shift" || s.path.work.job?.job.startsWith("sofia-qa"))
    && !s.usedActions.includes(action.id) && available(s, action),
  ) : [];
  if (s.lifespanStart !== null && !s.path) {
    if (s.profile) availableActions.push(...studyActions(s));
    availableActions.push(...workActions(s));
    if (s.retirement === null && retirementEligible(s)) availableActions.push(retire);
  }
  return availableActions;
}

export function movingCost(s: GameState): number {
  return Math.max(0, MOVE_COST - s.deposit);
}

export function moveBlocker(s: GameState, city: City): Text | null {
  if (s.finished || s.lifespanStart === null || s.age < 18) return {
    bg: "Можеш да се преместиш самостоятелно от 18 години.",
    en: "You can move independently from age 18.",
  };
  if (s.lifeSystems.reproduction.naming) return { bg: "Първо запиши името на бебето.", en: "Name the new baby first." };
  if (s.lifeSystems.reproduction.notice) return { bg: "Първо виж съобщението за бременността.", en: "Read the pregnancy update first." };
  if (city === s.city) return { bg: "Вече живееш в този град.", en: "You already live in this city." };
  if (s.path) {
    if (s.sceneId === "spare-key" && hasPendingStoryDecision(s))
      return pathText("Първо реши къде да живееш в дневника.", "Resolve the move in your journal first.");
    if (s.path.work.job) return pathText("Първо приключи трудовия си договор.", "End your current employment contract first.");
    const student = s.path.university.student;
    if (student && !student.paused) return pathText("Първо прекъсни или завърши обучението си.", "Pause or finish your current studies first.");
  }
  if (s.usedActions.some(id => id.startsWith("move."))) {
    return { bg: "Можеш да се преместиш веднъж годишно.", en: "You can move once per year." };
  }
  if (s.cash < movingCost(s)) return { bg: "Парите за преместване не стигат.", en: "There is not enough cash to move." };
  return null;
}

function moveTo(s: GameState, city: City): GameState {
  if (moveBlocker(s, city)) return s;
  const town = cities[city].name;
  const leavingJob = !s.path && s.localJob !== null && s.retirement === null;
  const choice: Action = {
    id: "move." + city, label: { bg: "Преместване", en: "Moving home" },
    result: { bg: "Премести се " + inCityBg(city) + ".", en: "You moved to " + town.en + "." },
    effect: { city, housing: "home", cash: -MOVE_COST, ...(leavingJob && { career: "student" }),
      ...(s.path && { removeFlags: ["fridays", "ownRoom"] }) },
  };
  return { ...applyOption(s, "action", choice, choice.label), storyRoute: false, sceneId: "", choiceId: null,
    localJob: leavingJob ? null : s.localJob };
}

type BaseBudget = { pay: number; essentials: number; housing: number; net: number };

export function pocketMoney(s: GameState): number {
  return s.lifespanStart === null || s.age < 7 || s.age > 15 ? 0 : s.age < 13 ? 6_000 : 11_500;
}

function baseBudget(s: GameState): BaseBudget {
  const maternity = maternityPay(s);
  if (s.age < 19 || s.career === "student") {
    const pay = pocketMoney(s) + maternity;
    return { pay, essentials: 0, housing: 0, net: pay };
  }
  const payScale = s.localJob ? jobTypes[s.localJob].pay : s.city === "sofia" ? 1_380_000 : 1_110_000;
  const salary = { woodcarver: 840_000, qa: 1_080_000, "local-job": payScale }[s.career];
  const livingCosts = s.city === "sofia" ? 660_000 : 510_000;
  const homeCosts = { home: 150_000, rumi: 180_000, shared: 360_000 }[s.housing];
  const retired = s.retirement !== null;
  const pay = (s.retirement?.payment ?? (onMaternityLeave(s) ? 0 : salary)) + maternity;
  const essentials = retired ? Math.round(livingCosts * 0.78) : livingCosts;
  const housing = retired ? Math.round(homeCosts * 0.80) : homeCosts;
  return { pay, essentials, housing, net: pay - essentials - housing };
}

function annualFinances(s: GameState) {
  const pathFinances = s.path && pathBudget(s, s.path);
  const { pay, essentials, housing, net } = pathFinances ?? baseBudget(s);
  const finances = settleFinances(s, net);
  return {
    ...finances, pathFinances,
    budget: { pay, essentials, housing, net: net - finances.obligations, obligations: finances.obligations },
  };
}

export function annualBudget(s: GameState): { pay: number; essentials: number; housing: number; net: number; obligations: number } {
  return annualFinances(s).budget;
}

function applyEffect(s: GameState, effect?: Effect): GameState {
  if (!effect) return s;
  const newHousing = effect.housing ?? s.housing;
  const deposit = newHousing === "shared" ? (s.housing === "shared" ? s.deposit : SHARED_DEPOSIT) : 0;
  const flags = new Set(s.flags);
  for (const flag of effect.removeFlags ?? []) flags.delete(flag);
  for (const flag of effect.flags ?? []) flags.add(flag);
  const trust = { ...s.trust };
  for (const id of storyPeople) trust[id] = Math.max(0, Math.min(100, trust[id] + (effect.trust?.[id] ?? 0)));
  return {
    ...s, city: effect.city ?? s.city, housing: newHousing, career: effect.career ?? s.career,
    path: s.path && effect.city && effect.city !== s.city ? relocatePath(s.path, effect.city) : s.path,
    cash: s.cash + cashEffect(s, effect), deposit, flags: [...flags], trust,
  };
}

function applyOption(s: GameState, kind: "choice" | "action", option: Option, title: Text): GameState {
  const result = applyEffect(s, option.effect);
  const stats = applyStats(storyStats(s, result, option, kind), talentBonus(s.profile?.talent, option.id));
  const witnesses = storyPeople.filter((id) => id === option.effect?.person || option.effect?.trust?.[id] !== undefined);
  const memory: Memory = {
    age: s.age, city: result.city, kind, id: option.id, title, text: option.result,
    person: option.effect?.person, witnesses, cashDelta: result.cash - s.cash, statsDelta: statsChange(s.stats, stats),
  };
  if (result.city !== s.city) memory.movedTo = result.city;
  if (result.career !== s.career && !option.id.startsWith("move.") && !option.id.startsWith("life.work.")) memory.startedCareer = result.career;
  return {
    ...result, stats,
    choiceId: kind === "choice" ? option.id : s.choiceId,
    usedActions: kind === "action" ? [...s.usedActions, option.id] : s.usedActions,
    history: [...s.history, memory],
    commands: [...s.commands, { age: s.age, kind, id: option.id }],
  };
}

export function choose(s: GameState, optionId: string, expectedAge = s.age): GameState {
  if (s.age !== expectedAge) return s;
  const scene = getScene(s);
  const option = getChoices(s).find((o) => o.id === optionId);
  return scene && option ? applyOption(s, "choice", option, scene.title) : s;
}

export function skipDecision(s: GameState, id: string, expectedAge = s.age): GameState {
  if (s.finished || s.age !== expectedAge || s.lifeSystems.reproduction.naming || s.lifeSystems.reproduction.notice) return s;
  const pendingStory = id === s.sceneId && hasPendingStoryDecision(s);
  if (!pendingStory && openCityEvent(s)?.entry.id !== id && weddingInvitation(s)?.id !== id) return s;
  return { ...s, skippedDecisions: [...s.skippedDecisions, id],
    commands: [...s.commands, { age: s.age, kind: "skip-decision", id }] };
}

export function getCityOpportunity(s: GameState) {
  const open = openCityEvent(s);
  if (!open) return null;
  const friendHere = !s.deceased.friend && isKnownPerson(s, "friend") && personCity(s, "friend") === s.city;
  const options = cityChoices(open.event, open.roll).map(choice => {
    const friend = choice.withFriend && friendHere ? personName(s, "friend") : null;
    const effect: Effect = { stats: choice.stats, cash: choice.cash };
    if (friend) {
      effect.person = "friend";
      effect.trust = { friend: 4 };
    }
    const option: Option = {
      id: open.entry.id + "." + choice.id,
      label: choice.label,
      result: friend ? pathText(friend.bg + " · " + choice.outcome.bg, friend.en + " · " + choice.outcome.en) : choice.outcome,
      effect,
    };
    return { option, blocked: !available(s, option) };
  });
  return { id: open.entry.id, entry: open.entry, options };
}

export function doAction(s: GameState, actionId: string, expectedAge = s.age): GameState {
  return applyAction(s, actionId, expectedAge);
}

function applyAction(s: GameState, actionId: string, expectedAge: number, replaying = false): GameState {
  if (s.age !== expectedAge || s.lifeSystems.reproduction.naming || s.lifeSystems.reproduction.notice) return s;
  if (actionId.startsWith("city-life.")) {
    const choice = getCityOpportunity(s)?.options.find(row => row.option.id === actionId);
    return choice && !choice.blocked ? applyOption(s, "action", choice.option, choice.option.label) : s;
  }
  if (actionId.startsWith("move.")) {
    const city = actionId.slice(5);
    return isCity(city) ? moveTo(s, city) : s;
  }
  const action = getActions(s).find((a) => a.id === actionId);
  if (!action) return applyLifeActivity(s, actionId, expectedAge, replaying);
  const result = applyOption(s, "action", action, action.label);
  if (action.id === retire.id) return { ...result, retirement: { age: s.age, payment: Math.round(baseBudget(s).pay * 0.67) } };
  if (action.id.startsWith("life.work.")) return { ...result, localJob: action.id.slice(10) as JobId };
  if (action.id.startsWith("life.study.")) {
    const index = Number(action.id.split(".")[2]);
    const school = cityPaths[s.city].schools[index];
    const graduationAge = school.level === "higher" ? s.age + (school.field === "medicine" || school.field === "veterinary" ? 6 : 4) : 19;
    return { ...result, enrollment: { city: s.city, index, graduationAge } };
  }
  return result;
}

export function getLifeActivities(s: GameState): LifeActivityOption[] {
  return activityDefinitions.filter(definition => !definition.contact && !definition.replayOnly && (definition.visible?.(s) ?? true))
    .map(definition => lifeActivityOption(s, definition));
}

export function getPersonActivities(s: GameState, contact: PeopleId): LifeActivityOption[] {
  if (!isKnownPerson(s, contact) || s.deceased[contact] || (isKin(contact) && s.age < 4)) return [];
  const city = personCity(s, contact);
  const remote = s.city !== city;
  const definitions = [
    ...(remote ? [personVisitDefinition(contact, city)] : []),
    ...(isKin(contact) ? kinActivities(s, contact) : []),
    ...getPeopleActivityDefinitions(contact),
  ];
  return definitions.filter(definition => (!definition.visible || definition.visible(s))
    && (!definition.sameCity || !remote) && (!definition.city || definition.city === s.city))
    .map(definition => {
      const option = lifeActivityOption(s, definition);
      const label = remote && option.branch && remoteBranchLabels[option.branch.id];
      return label && option.branch ? { ...option, branch: { ...option.branch, label } } : option;
    });
}

export function doLifeActivity(s: GameState, id: string, expectedAge = s.age): GameState {
  return applyLifeActivity(s, id, expectedAge);
}

function applyLifeActivity(s: GameState, id: string, expectedAge: number, replaying = false): GameState {
  if (s.age !== expectedAge) return s;
  const definition = getLifeActivityDefinition(id) ?? kinActivityById(s, id);
  if (!definition || (definition.replayOnly && !replaying)) return s;
  // Old journals may contain meetings recorded before contact locations were enforced.
  if (definition.contact && (definition.sameCity === "always" || (definition.sameCity && !replaying))
    && personCity(s, definition.contact) !== s.city) return s;
  const activity = lifeActivityOption(s, definition);
  if (activity.blocked) return s;

  const resolution=definition.resolve?.(s);
  const label=definition.historyTitle ?? (definition.branch ? {
    bg: definition.branch.label.bg+" · "+definition.label.bg,
    en: definition.branch.label.en+" · "+definition.label.en,
  } : definition.label);
  const narrative=resolution?.result ?? definition.result;
  const contact=definition.contact ? personName(s,definition.contact) : null;
  const option: Option = {
    id: definition.id, label,
    result: contact ? {bg: contact.bg+" · "+narrative.bg, en: contact.en+" · "+narrative.en} : narrative,
    effect: {
      cash: activity.cashDelta, stats: resolution?.stats ?? definition.stats ?? {},
      trust: resolution?.trust ?? definition.trust, person: definition.person,
    },
  };
  const result = applyOption(s, "action", option, label);
  const changedSystems = resolution?.lifeSystems ?? definition.update?.(s) ?? s.lifeSystems;
  const lifeSystems = trackRelationship(s, changedSystems, id);
  return { ...result, lifeSystems: definition.resolvesMedicalIssue ? treatHealth(lifeSystems, s.age) : lifeSystems };
}

export function doPathAction(s: GameState, id: string, expectedAge = s.age): GameState {
  if (s.finished || s.age !== expectedAge || !s.path || s.lifeSystems.reproduction.naming || s.lifeSystems.reproduction.notice) return s;
  let result = resolvePathAction(s, id);
  if (!result) return s;
  let base = s;
  if (result.moveTo) {
    // Enrolling away from home uses the same move, cost and time as Places.
    base = moveTo(s, result.moveTo);
    if (base === s) return s;
    result = resolvePathAction(base, id);
    if (!result) return s;
  }
  const path = { ...result.state, used: [...result.state.used, id] };
  const commands: Command[] = [...base.commands, { age: base.age, kind: "path", id }];
  if (result.silent) return { ...base, path, commands };

  const stats = applyStats(applyStats(base.stats, result.stats ?? {}), talentBonus(base.profile?.talent, id));
  const cashDelta = result.cash ?? 0;
  const memory: Memory = { age: base.age, city: base.city, kind: "path", id, title: result.decision?.title ?? result.label, text: result.note,
    witnesses: [], cashDelta, statsDelta: statsChange(base.stats, stats),
    ...(result.decision && { decision: { choice: result.label, situation: result.decision.situation } }),
    ...(result.workImpact && { workImpact: result.workImpact }) };
  return { ...base, path, cash: base.cash + cashDelta, stats, history: [...base.history, memory], commands };
}

export function nameNewborns(s: GameState, names: string[], surname: SurnameSource, expectedAge = s.age): GameState {
  const naming = s.lifeSystems.reproduction.naming;
  if (s.finished || s.age !== expectedAge || !naming || names.length !== naming.newborns.length) return s;
  const clean = names.map(cleanFirstName).filter((name): name is string => name !== null);
  if (clean.length !== names.length) return s;
  const next = applyNewbornNames(s, clean, surname);
  return next === s ? s : { ...next, commands: [...s.commands, { age: s.age, kind: "name-children", names: clean, surname }] };
}

export function doPregnancyAction(s: GameState, kind: PregnancyAction, expectedAge = s.age): GameState {
  if (s.finished || s.age !== expectedAge || !familyPlayEnabled(s)) return s;
  const next = pregnancyActions[kind](s);
  return next === s ? s : { ...next, commands: [...s.commands, { age: s.age, kind }] };
}

export function doMaternityReturn(s: GameState, expectedAge = s.age): GameState {
  if (s.age !== expectedAge) return s;
  const next = returnFromMaternity(s);
  return next === s ? s : { ...next, commands: [...s.commands, { age: s.age, kind: "maternity-return" }] };
}

export function giveUp(s: GameState, expectedAge = s.age): GameState {
  if (s.finished || s.age !== expectedAge || s.lifeSystems.reproduction.naming || s.lifeSystems.reproduction.notice) return s;
  const memory: Memory = {
    age: s.age, city: s.city, kind: "end", id: "end-" + s.age, witnesses: [], cashDelta: 0,
    title: { bg: "Край на историята", en: "End of the story" },
    text: s.profile ? { bg: "Историята приключи. Дневникът остава в албума.", en: "This life has ended. Its journal stays in the album." }
      : s.avatar?.presentation === "male"
      ? { bg: "Приключи историята на Милен. Дневникът му остава в албума.", en: "You ended Milen’s story. His journal stays in the album." }
      : { bg: "Приключи тази история на Мила. Дневникът ѝ остава в албума.", en: "You ended this story for Mila. Her journal stays in the album." },
  };
  return {
    ...s, finished: true, endReason: "gaveUp", sceneId: "", choiceId: null,
    lifeSystems: updateReproduction(s, { pregnancy: null, adoption: null, notice: null }),
    history: [...s.history, memory], commands: [...s.commands, { age: s.age, kind: "end" }],
  };
}

const euroFormat = { style: "currency", currency: "EUR", maximumFractionDigits: 0, minimumFractionDigits: 0 } as const;
const formatters = { "bg-BG": new Intl.NumberFormat("bg-BG", euroFormat), "en-IE": new Intl.NumberFormat("en-IE", euroFormat) };
function currency(amount: number, locale: keyof typeof formatters): string {
  return formatters[locale].format(amount / 100);
}

export function advance(s: GameState, expectedAge = s.age): GameState {
  return advanceYear(s, expectedAge, s.path ? "draw" : undefined, s.path ? "draw" : undefined, s.lifespanStart !== null ? 1 : undefined);
}

function advanceYear(s: GameState, expectedAge: number, cityResult: CityEventRoll | null | "draw" | undefined,
  workResult?: string, contactLives?: 1): GameState {
  const { pregnancy, naming, notice } = s.lifeSystems.reproduction;
  if (s.finished || s.age !== expectedAge || hasPendingStoryDecision(s) || naming || notice || pregnancy?.gestation) return s;
  const full = s.lifespanStart !== null;
  const death = full ? rollDeath({
    age: s.age, sex: s.avatar?.presentation ?? "female", city: s.city, player: true,
    health: s.stats.health, condition: mortalityCondition(s),
  }, s.seed) : null;
  const finished = death !== null || (!full && s.age === CHAPTER_END);
  const { budget, bank, unpaidCare, unpaidDebt, pathFinances } = annualFinances(s);
  const pathYear = s.path && pathFinances ? closePathYear(s, s.path, pathFinances, finished) : null;
  const wellbeing = settleWellbeing(s, bank, unpaidCare, unpaidDebt, finished);
  const { lifeSystems, notes, healthNote } = wellbeing;
  const assetsYear = settleAssets(s, lifeSystems, finished);
  const stats = pathFinances?.shortfall ? applyStats(wellbeing.stats, { joy: -3 }) : wellbeing.stats;
  if (budget.obligations > 0) notes.unshift(billText(budget.obligations));
  const summary: Text = s.age < 19 && (!pathFinances || pathFinances.pay === pathFinances.pocket)
    ? budget.pay === 0
      ? { bg: "Джобните са у теб. Домашните разходи са поети от семейството.", en: "Your pocket money stays yours. The family covered the household bills." }
      : { bg: `Джобни за годината ${currency(budget.pay, "bg-BG")}. Семейството пое домашните разходи.`,
        en: `Pocket money for the year ${currency(budget.pay, "en-IE")}. Your family covered household expenses.` }
    : {
      bg: `Доход ${currency(budget.pay, "bg-BG")} · Издръжка ${currency(budget.essentials, "bg-BG")} · Дом ${currency(budget.housing, "bg-BG")}.`,
      en: `Income ${currency(budget.pay, "en-IE")} · Everyday costs ${currency(budget.essentials, "en-IE")} · Housing ${currency(budget.housing, "en-IE")}.`,
    };
  const maternity = pathFinances?.maternity ?? maternityPay(s);
  if (maternity) notes.push(pathText("Обезщетение за майчинство " + currency(maternity, "bg-BG") + ".",
    "Maternity benefit " + currency(maternity, "en-IE") + "."));
  if (pathFinances?.tuition) notes.push(pathText("Такса за обучение " + currency(pathFinances.tuition, "bg-BG") + ".",
    "Tuition " + currency(pathFinances.tuition, "en-IE") + "."));
  if (pathFinances?.health) notes.push(pathText("Лични здравни вноски " + currency(pathFinances.health, "bg-BG") + ".",
    "Personal health contributions " + currency(pathFinances.health, "en-IE") + "."));
  const independent = pathFinances?.special?.independent.net;
  if (independent) notes.push(pathText("Хонорари и отчисления " + currency(independent, "bg-BG") + ".",
    "Independent fees and royalties " + currency(independent, "en-IE") + "."));
  const prize = pathFinances?.special?.prize;
  if (prize) notes.push(pathText("Спортна премия " + currency(prize, "bg-BG") + ".",
    "Sports prize " + currency(prize, "en-IE") + "."));
  const pathMemories: Memory[] = (pathYear?.events ?? []).map(event => ({
    age: s.age, city: s.city, kind: "path", id: event.id, title: event.title, text: event.note, witnesses: [], cashDelta: 0,
  }));
  const memory: Memory = {
    age: s.age, city: s.city, kind: "year", id: "year-" + s.age, witnesses: [],
    title: { bg: "Годишна равносметка", en: "The year in numbers" },
    text: {
      bg: [summary.bg, ...notes.map(note => note.bg)].join(" "),
      en: [summary.en, ...notes.map(note => note.en)].join(" "),
    },
    cashDelta: budget.net, statsDelta: statsChange(s.stats, stats),
  };
  const yearCommand: Extract<Command, { kind: "year" }> = { age: s.age, kind: "year" };
  let closed: GameState = {
    ...s, cash: s.cash + budget.net, stats, lifeSystems: assetsYear.lifeSystems, death, finished,
    serviceYears: pathYear ? Math.floor(serviceMonths(pathYear.path.work) / 12)
      : s.serviceYears + Number(s.age >= 19 && s.career !== "student" && s.retirement === null),
    path: pathYear?.path ?? null,
    history: [...s.history, ...pathMemories, memory], commands: [...s.commands, yearCommand],
    endReason: death ? "death" : finished ? "chapter" : null,
  };
  if (death) {
    closed.lifeSystems = updateReproduction(closed, { pregnancy: null, adoption: null });
    const cause = deathCauses[death.cause];
    closed.history.push({
      age: death.age, city: s.city, kind: "end", id: "death", witnesses: [], cashDelta: 0,
      title: { bg: "Край на живота", en: "End of life" }, text: cause,
    });
  } else if (full) {
    closed = settlePeople(closed);
  }

  const next: GameState = { ...closed, age: finished ? s.age : s.age + 1,
    sceneId: "", choiceId: null, usedActions: [], skippedDecisions: [] };
  const openingStart = next.history.length;
  next.history.push(...assetsYear.events);
  if (lifeSystems.family.children > s.lifeSystems.family.children) {
    next.history.push({
      age: next.age, city: next.city, kind: "event", id: "child-birth", witnesses: [], cashDelta: 0,
      title: pathText("Раждане на дете", "Birth of a child"),
      text: pathText("Посрещнахме бебе в семейството.", "We welcomed a baby into the family."),
    });
  }
  if (!finished) {
    next.sceneId = sceneForYear(next);
    if (!next.path && next.profile && next.age === 7) next.enrollment = { city: next.city, index: 0, graduationAge: 14 };
    if (full) {
      if (healthNote) next.history.push({
        age: next.age, city: next.city, kind: "event", id: "health-" + next.age, witnesses: [], cashDelta: 0,
        title: { bg: "Здраве", en: "Health" }, text: healthNote,
      });
      const roll = cityResult === "draw" ? rollCityEvent(next) : cityResult;
      const local = roll ? cityEventMemory(next, roll) : roll;
      const replacesMilestone = roll && getCityEvent(next.city, roll.id)?.milestone;
      const moment = local && (cityResult !== "draw" || replacesMilestone) ? local : yearlyMoment(next, local);
      if (roll !== undefined) yearCommand.cityEvent = moment?.cityEvent ?? null;
      if (moment) next.history.push(moment);
    }
  }
  if (finished) return workResult && workResult !== "draw" ? s : next;
  const withFamily = settleReproductionYear(next);
  if (!full) return familyPlayEnabled(s) ? backgroundPregnancy(markAnniversaries(markMaternityYear(withFamily, true))) : withFamily;
  const opening = withFamily.history.slice(openingStart);
  // Optional family conversations must not change the everyday memories when an older transcript is replayed.
  const everyday = everydayEvents(withFamily, opening.filter(event => event.id !== "family-questions"));
  const yearWithMemories = everyday.length ? { ...withFamily, history: [...withFamily.history.slice(0, openingStart), ...everyday, ...opening] } : withFamily;
  const familyYear = familyPlayEnabled(s) ? backgroundPregnancy(markAnniversaries(markMaternityYear(yearWithMemories, true))) : yearWithMemories;
  // Follow the version on the recorded annual command. Old journals did not simulate contact milestones.
  if (contactLives === 1) yearCommand.contactLives = contactLives;
  const year = contactLives === 1 ? advanceContactLives(familyYear) : familyYear;
  const workId = workResult === "draw" ? drawWorkEvent(year) : workResult;
  if (!workId && !year.path?.special) return year;
  const otherDecision = year.sceneId || year.lifeSystems.reproduction.naming || year.lifeSystems.reproduction.notice || getCityOpportunity(year);
  if (!workId) return otherDecision ? year : openSpecialYear(year);
  if (otherDecision) return workResult === "draw" ? year : s;
  const queued = queueWorkEvent(year, workId);
  if (queued === year) return s;
  yearCommand.workEvent = workId;
  return queued;
}

/** Store the portrait's starting traits and replay the commands that shaped the life. */
export function encodeSave(s: GameState): string {
  const { familyEventsFrom, familyPlayFrom } = s.lifeSystems.reproduction;
  const base = {
    format: FORMAT, seed: s.seed, ...(s.avatar && { avatar: s.avatar }),
    ...(familyEventsFrom !== null && { familyEventsFrom }), ...(familyPlayFrom !== null && { familyPlayFrom }),
    ...(s.careerFrom !== null && { careerFrom: s.careerFrom }), commands: s.commands,
  };
  if (s.lifespanStart === null) return JSON.stringify({ ...base, version: 1, content: ORIGINAL_CONTENT });
  const edition = s.careerFrom !== null ? { version: 4, content: CAREER_CONTENT }
    : s.profile ? { version: 3, content: FAMILY_CONTENT } : { version: 2, content: LIFESPAN_CONTENT };
  return JSON.stringify({
    ...base, ...edition,
    ...(s.origin === "birth" ? { birthCity: s.birthCity, ...(s.profile && { profile: s.profile }) } : { upgradeAt: s.lifespanStart }),
  });
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function decodeSave(raw: string): GameState | null {
  if (typeof raw !== "string" || raw.length > 2_000_000) return null;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!object(saved) || saved.format !== FORMAT || "opening" in saved) return null;
    const legacy = saved.content === ORIGINAL_CONTENT && (saved.version === undefined || saved.version === 1);
    const full = saved.content === LIFESPAN_CONTENT && saved.version === 2;
    const family = saved.content === FAMILY_CONTENT && saved.version === 3;
    const career = saved.content === CAREER_CONTENT && saved.version === 4;
    if (!legacy && !full && !family && !career) return null;
    const profiled = family || (career && "profile" in saved);
    if (typeof saved.seed !== "number" || !Number.isSafeInteger(saved.seed) || saved.seed < 0 || saved.seed > 0xffffffff) return null;
    const careerFrom = saved.careerFrom ?? null;
    if (!Array.isArray(saved.commands)) return null;
    if (career ? typeof careerFrom !== "number" || !Number.isInteger(careerFrom) || careerFrom < 0
      || careerFrom > saved.commands.length : careerFrom !== null) return null;
    const familyEventsFrom = saved.familyEventsFrom ?? null;
    if (familyEventsFrom !== null && (typeof familyEventsFrom !== "number" || !Number.isInteger(familyEventsFrom)
      || familyEventsFrom < 0 || familyEventsFrom > saved.commands.length)) return null;
    const familyPlayFrom = saved.familyPlayFrom ?? null;
    if (familyPlayFrom !== null && (typeof familyPlayFrom !== "number" || !Number.isInteger(familyPlayFrom)
      || familyPlayFrom < 0 || familyPlayFrom > saved.commands.length)) return null;
    const avatar = "avatar" in saved ? parseAvatar(saved.avatar) : null;
    if ("avatar" in saved && !avatar) return null;
    const upgradeAt = (full || (career && !profiled)) && "upgradeAt" in saved ? saved.upgradeAt : null;
    if (upgradeAt !== null && (typeof upgradeAt !== "number" || !Number.isInteger(upgradeAt)
      || upgradeAt < 0 || upgradeAt > saved.commands.length || "birthCity" in saved)) return null;
    if (typeof careerFrom === "number" && typeof upgradeAt === "number" && careerFrom < upgradeAt) return null;
    if (!legacy && upgradeAt === null && !isCity(saved.birthCity)) return null;
    const profile = profiled ? parseLifeProfile(saved.profile) : null;
    if (profiled && (!profile || !avatar || "upgradeAt" in saved)) return null;
    let s = legacy || upgradeAt !== null ? newChapterLife(saved.seed, avatar) : profile && avatar
      ? newProfileLife({ seed: saved.seed, city: saved.birthCity as City, presentation: avatar.presentation ?? "female", avatar, profile })
      : newLife(saved.seed, avatar, saved.birthCity as City);
    s = { ...s, lifeSystems: updateReproduction(s, { familyEventsFrom, familyPlayFrom: null }) };
    function checkpoints(index: number): boolean {
      if (index === upgradeAt) {
        s = continueLife(s);
        if (s.lifespanStart !== index) return false;
      }
      if (index === careerFrom) {
        s = startCareerLife(s);
        if (s.careerFrom !== index) return false;
      }
      if (index === familyPlayFrom) {
        s = startPregnancyPlay(s);
        if (s.lifeSystems.reproduction.familyPlayFrom !== index) return false;
      }
      return true;
    }
    for (const [index, c] of saved.commands.entries()) {
      if (!checkpoints(index) || !object(c) || c.age !== s.age || s.finished) return null;
      let next: GameState;
      if (c.kind === "year") {
        if ("id" in c) return null;
        let cityResult: CityEventRoll | null | undefined;
        if ("cityEvent" in c) {
          if (!s.path) return null;
          cityResult = c.cityEvent === null ? null : parseCityEvent(c.cityEvent, s.city);
          if (cityResult === null && c.cityEvent !== null) return null;
        }
        if ("workEvent" in c && (!s.path || typeof c.workEvent !== "string" || !/^[a-z-]{3,40}$/.test(c.workEvent) || c.workEvent === "draw")) return null;
        if ("contactLives" in c && (c.contactLives !== 1 || s.lifespanStart === null)) return null;
        next = advanceYear(s, s.age, cityResult, typeof c.workEvent === "string" ? c.workEvent : undefined,
          c.contactLives === 1 ? 1 : undefined);
        const recorded = next.commands.at(-1);
        if (c.contactLives === 1 && (recorded?.kind !== "year" || recorded.contactLives !== 1)) return null;
      } else if (c.kind === "end") {
        if ("id" in c || "cityEvent" in c || "workEvent" in c) return null;
        next = giveUp(s, s.age);
      } else if (c.kind === "maternity-return") {
        if ("id" in c || "cityEvent" in c) return null;
        next = doMaternityReturn(s, s.age);
      } else if (typeof c.kind === "string" && Object.hasOwn(pregnancyActions, c.kind)) {
        if ("id" in c || "cityEvent" in c) return null;
        next = doPregnancyAction(s, c.kind as PregnancyAction, s.age);
      } else if (c.kind === "name-children") {
        if (!Array.isArray(c.names) || !c.names.every(name => typeof name === "string")
          || (c.surname !== "mother" && c.surname !== "father")) return null;
        next = nameNewborns(s, c.names, c.surname, s.age);
      } else {
        if (typeof c.id !== "string" || c.id.length > 100) return null;
        if (c.kind === "choice") next = choose(s, c.id, s.age);
        else if (c.kind === "skip-decision") next = skipDecision(s, c.id, s.age);
        else if (c.kind === "action") next = applyAction(s, c.id, s.age, true);
        else if (c.kind === "path") next = doPathAction(s, c.id, s.age);
        else return null;
      }
      if (next === s || next.commands.length !== index + 1) return null;
      s = next;
    }
    return checkpoints(saved.commands.length) ? s : null;
  } catch {
    return null;
  }
}

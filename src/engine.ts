import { cleanFirstName } from "./babyNames.ts";
import { getPeopleActivityDefinitions } from "./peopleActivities.ts";
import { applyNewbornNames, settleReproductionYear, updateReproduction, type SurnameSource } from "./reproduction.ts";
import { cities, inCityBg, isCity, type City } from "./cities.ts";
import { generateBirthFamily, isKin, type BirthFamily } from "./birthFamily.ts";
import { cityPaths, jobTypes, studyFields, type Enrollment, type JobId, type SchoolLevel } from "./cityPaths.ts";
import { kinActivities, kinActivityById } from "./kinActivities.ts";
import { automaticAppearance, dispositions, HEIR_CASH, parseLifeProfile, talentBonus, type LifeProfile, type NewLifeDraft } from "./lifeProfile.ts";
import { personName, storyPeople, type PeopleId } from "./peopleIdentity.ts";
import { birthEntry, retirementEligible, yearlyMoment } from "./lifeEvents.ts";
import { mortalityCondition, treatHealth } from "./lifeHealth.ts";
import { settlePeople } from "./lifeLoss.ts";
import { deathCauses, MAX_AGE, rollDeath, type Death } from "./mortality.ts";
import { actions, scenes } from "./story.ts";
import { parseAvatar, type AvatarTraits } from "./avatar.ts";
import {
  activityDefinitions, applyStats, getLifeActivityDefinition, lifeActivityOption, spentActivityTime, startingLifeSystems,
  startingStats, statsChange, type LifeActivityOption, type LifeStats, type LifeSystems, type StatDelta,
} from "./lifeActivities.ts";
import { billText, settleFinances } from "./lifeEconomy.ts";
import { settleWellbeing, storyStats } from "./lifeWellbeing.ts";

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
};
export type Action = Option & { minAge?: number; maxAge?: number };

export type Command =
  | { age: number; kind: "choice" | "action"; id: string }
  | { age: number; kind: "year" | "end" }
  | { age: number; kind: "name-children"; names: string[]; surname: SurnameSource };
export type Memory = {
  age: number;
  city: City;
  kind: "choice" | "action" | "year" | "end" | "event";
  id: string;
  title: Text;
  text: Text;
  person?: PersonId;
  witnesses: PersonId[];
  cashDelta: number;
  statsDelta?: StatDelta;
  movedTo?: City;
  startedCareer?: Career;
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
const YEARLY_TIME = 2;
// Include room for newborn names and time-free activities during a year.
const MAX_CHAPTER_COMMANDS = (CHAPTER_END - CHAPTER_START + 1) * (YEARLY_TIME + 7) + 1;
const MAX_LIFE_COMMANDS = (MAX_AGE + 1) * (YEARLY_TIME + 7) + 1;

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
  const eligibleScenes = scenes.filter((scene) => scene.age === s.age && eligible(s, scene.when));
  if (eligibleScenes.length === 0) throw new Error("Missing eligible scene for age " + s.age);
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
    storyRoute: birthCity === "tryavna", lifespanStart: chapter ? null : 0,
    death: null, deceased: {}, serviceYears: 0, retirement: null,
    housing: "home", career: "student", cash: chapter ? 70_000 : profile?.wealthy ? HEIR_CASH : 0, deposit: 0,
    trust: { rumi: 60, niki: 45, mentor: 45, friend: 55 },
    flags: [], history: [], usedActions: [], sceneId: "", choiceId: null, commands: [], finished: false,
    endReason: null, stats: chapter ? stats : applyStats({ ...stats, health: 88, brains: 12 },
      profile?.disposition ? dispositions[profile.disposition].stats : {}), lifeSystems: startingLifeSystems(),
  };
  s.sceneId = sceneForYear(s);
  if (!chapter) s.history.push(birthEntry(s));
  return s;
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

export function getScene(s: GameState): Scene | null {
  return s.finished ? null : scenes.find((scene) => scene.id === s.sceneId) ?? null;
}

function cashEffect(s: GameState, effect?: Effect): number {
  const leavingShared = effect?.housing !== undefined && effect.housing !== "shared" && s.housing === "shared";
  return (effect?.cash ?? 0) + (leavingShared ? s.deposit : 0);
}

function available(s: GameState, option: Option): boolean {
  return eligible(s, option.when) && s.cash + cashEffect(s, option.effect) >= 0;
}

export function getChoices(s: GameState): Option[] {
  if (s.finished || s.choiceId !== null || s.lifeSystems.reproduction.naming) return [];
  return getScene(s)?.choices.filter((option) => available(s, option)) ?? [];
}

/** The Play button can take the displayed low-commitment choice on behalf of the player. */
export function defaultPlayChoice(s: GameState): Option | undefined {
  const choices = getChoices(s);
  if (s.sceneId === "spare-key") return choices.find((option) => option.id === "stay");
  return choices.find((option) => (option.effect?.cash ?? 0) >= 0
    && !(option.effect?.city && option.effect.city !== s.city)
    && !(option.effect?.housing && option.effect.housing !== s.housing)
    && !Object.values(option.effect?.trust ?? {}).some((change) => change < 0));
}

export function playYear(s: GameState, expectedAge = s.age): GameState {
  if (s.age !== expectedAge || s.finished || s.lifeSystems.reproduction.naming) return s;
  if (!s.sceneId || s.choiceId !== null) return advance(s, expectedAge);
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

export function commitmentsLeft(s: GameState): number {
  if (s.finished) return 0;
  const reserved = s.housing === "rumi" && s.flags.includes("fridays") ? 1 : 0;
  return Math.max(0, YEARLY_TIME - reserved - spentActivityTime(s));
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
  if (s.sceneId || s.age < 19 || s.retirement || s.career !== "student" || s.localJob) return [];
  if (!s.profile) return [localWork];
  if (s.enrollment && s.enrollment.graduationAge > s.age) return [];
  return cityPaths[s.city].jobs.map(id => ({
    ...localWork, id: "life.work." + id, label: jobTypes[id].label,
    result: { bg: "Започна работа на позиция „" + jobTypes[id].label.bg + "“.",
      en: "You started a new job as " + jobTypes[id].label.en + "." },
  }));
}

export function getActions(s: GameState): Action[] {
  if (s.finished || (s.sceneId && s.choiceId === null) || s.lifeSystems.reproduction.naming || commitmentsLeft(s) === 0) return [];
  const availableActions = s.sceneId ? actions.filter((action) =>
    s.age >= (action.minAge ?? CHAPTER_START) && s.age <= (action.maxAge ?? CHAPTER_END)
    && !s.usedActions.includes(action.id) && available(s, action),
  ) : [];
  if (s.lifespanStart !== null) {
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
  if (city === s.city) return { bg: "Вече живееш в този град.", en: "You already live in this city." };
  if (!commitmentsLeft(s) || s.usedActions.some(id => id.startsWith("move."))) {
    return { bg: "Нужно е свободно време за едно преместване годишно.", en: "Moving takes free time and is available once per year." };
  }
  if (s.cash < movingCost(s)) return { bg: "Парите за преместване не стигат.", en: "There is not enough cash to move." };
  return null;
}

function moveTo(s: GameState, city: City): GameState {
  if (moveBlocker(s, city)) return s;
  const town = cities[city].name;
  const leavingJob = s.localJob !== null && s.retirement === null;
  const choice: Action = {
    id: "move." + city, label: { bg: "Преместване", en: "Moving home" },
    result: { bg: "Премести се " + inCityBg(city) + ".", en: "You moved to " + town.en + "." },
    effect: { city, housing: "home", cash: -MOVE_COST, ...(leavingJob && { career: "student" }) },
  };
  return { ...applyOption(s, "action", choice, choice.label), storyRoute: false, sceneId: "", choiceId: null,
    localJob: leavingJob ? null : s.localJob };
}

type BaseBudget = { pay: number; essentials: number; housing: number; net: number };

function baseBudget(s: GameState): BaseBudget {
  if (s.age < 19 || s.career === "student") {
    const pocketMoney = s.lifespanStart === null || s.age < 7 || s.age > 15 ? 0 : s.age < 13 ? 6_000 : 11_500;
    return { pay: pocketMoney, essentials: 0, housing: 0, net: pocketMoney };
  }
  const payScale = s.localJob ? jobTypes[s.localJob].pay : s.city === "sofia" ? 1_380_000 : 1_110_000;
  const salary = { woodcarver: 840_000, qa: 1_080_000, "local-job": payScale }[s.career];
  const livingCosts = s.city === "sofia" ? 660_000 : 510_000;
  const homeCosts = { home: 150_000, rumi: 180_000, shared: 360_000 }[s.housing];
  const retired = s.retirement !== null;
  const pay = s.retirement?.payment ?? salary;
  const essentials = retired ? Math.round(livingCosts * 0.78) : livingCosts;
  const housing = retired ? Math.round(homeCosts * 0.80) : homeCosts;
  return { pay, essentials, housing, net: pay - essentials - housing };
}

function annualFinances(s: GameState) {
  const base = baseBudget(s);
  const finances = settleFinances(s, base.net);
  return {
    ...finances,
    budget: { ...base, net: base.net - finances.obligations, obligations: finances.obligations },
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

export function doAction(s: GameState, actionId: string, expectedAge = s.age): GameState {
  if (s.age !== expectedAge) return s;
  if (actionId.startsWith("move.")) {
    const city = actionId.slice(5);
    return isCity(city) ? moveTo(s, city) : s;
  }
  const action = getActions(s).find((a) => a.id === actionId);
  if (!action) return doLifeActivity(s, actionId, expectedAge);
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
  const timeLeft = commitmentsLeft(s);
  return activityDefinitions.filter(definition => !definition.contact && !definition.replayOnly && (definition.visible?.(s) ?? true))
    .map(definition => lifeActivityOption(s, definition, timeLeft));
}

export function getPersonActivities(s: GameState, contact: PeopleId): LifeActivityOption[] {
  if (s.deceased[contact]) return [];
  const timeLeft = commitmentsLeft(s);
  if (isKin(contact)) return kinActivities(s, contact).map(definition => lifeActivityOption(s, definition, timeLeft));
  return getPeopleActivityDefinitions(contact).filter(definition => definition.visible?.(s))
    .map(definition => lifeActivityOption(s, definition, timeLeft));
}

export function doLifeActivity(s: GameState, id: string, expectedAge = s.age): GameState {
  return applyLifeActivity(s, id, expectedAge);
}

function applyLifeActivity(s: GameState, id: string, expectedAge: number, replayingLegacyActivity = false): GameState {
  if (s.age !== expectedAge) return s;
  const definition = getLifeActivityDefinition(id) ?? kinActivityById(s, id);
  if (!definition || (definition.replayOnly && !replayingLegacyActivity)) return s;
  const activity = lifeActivityOption(s, definition, commitmentsLeft(s));
  if (activity.blocked) return s;

  const resolution=definition.resolve?.(s);
  const label=definition.branch ? {
    bg: definition.branch.label.bg+" · "+definition.label.bg,
    en: definition.branch.label.en+" · "+definition.label.en,
  } : definition.label;
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
  const lifeSystems = resolution?.lifeSystems ?? definition.update?.(s) ?? s.lifeSystems;
  return { ...result, lifeSystems: definition.resolvesMedicalIssue ? treatHealth(lifeSystems, s.age) : lifeSystems };
}

export function nameNewborns(s: GameState, names: string[], surname: SurnameSource, expectedAge = s.age): GameState {
  const naming = s.lifeSystems.reproduction.naming;
  if (s.finished || s.age !== expectedAge || !naming || names.length !== naming.newborns.length) return s;
  const clean = names.map(cleanFirstName).filter((name): name is string => name !== null);
  if (clean.length !== names.length) return s;
  const next = applyNewbornNames(s, clean, surname);
  return next === s ? s : { ...next, commands: [...s.commands, { age: s.age, kind: "name-children", names: clean, surname }] };
}

export function giveUp(s: GameState, expectedAge = s.age): GameState {
  if (s.finished || s.age !== expectedAge || s.lifeSystems.reproduction.naming) return s;
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
    lifeSystems: updateReproduction(s, { pregnancy: null, adoption: null }),
    history: [...s.history, memory], commands: [...s.commands, { age: s.age, kind: "end" }],
  };
}

const euroFormat = { style: "currency", currency: "EUR", maximumFractionDigits: 0, minimumFractionDigits: 0 } as const;
const formatters = { "bg-BG": new Intl.NumberFormat("bg-BG", euroFormat), "en-IE": new Intl.NumberFormat("en-IE", euroFormat) };
function currency(amount: number, locale: keyof typeof formatters): string {
  return formatters[locale].format(amount / 100);
}

export function advance(s: GameState, expectedAge = s.age): GameState {
  if (s.finished || s.age !== expectedAge || (s.sceneId && s.choiceId === null) || s.lifeSystems.reproduction.naming) return s;
  const full = s.lifespanStart !== null;
  const death = full ? rollDeath({
    age: s.age, sex: s.avatar?.presentation ?? "female", city: s.city, player: true,
    health: s.stats.health, condition: mortalityCondition(s),
  }, s.seed) : null;
  const finished = death !== null || (!full && s.age === CHAPTER_END);
  const { budget, bank, unpaidCare, unpaidDebt } = annualFinances(s);
  const { stats, lifeSystems, notes, healthNote } = settleWellbeing(s, bank, unpaidCare, unpaidDebt, finished);
  if (budget.obligations > 0) notes.unshift(billText(budget.obligations));
  const summary: Text = s.age < 19
    ? budget.pay === 0
      ? { bg: "Джобните са у теб. Домашните разходи са поети от семейството.", en: "Your pocket money stays yours. The family covered the household bills." }
      : { bg: `Джобни за годината ${currency(budget.pay, "bg-BG")}. Семейството пое домашните разходи.`,
        en: `Pocket money for the year ${currency(budget.pay, "en-IE")}. Your family covered household expenses.` }
    : {
      bg: `Доход ${currency(budget.pay, "bg-BG")} · Издръжка ${currency(budget.essentials, "bg-BG")} · Дом ${currency(budget.housing, "bg-BG")}.`,
      en: `Income ${currency(budget.pay, "en-IE")} · Everyday costs ${currency(budget.essentials, "en-IE")} · Housing ${currency(budget.housing, "en-IE")}.`,
    };
  const memory: Memory = {
    age: s.age, city: s.city, kind: "year", id: "year-" + s.age, witnesses: [],
    title: { bg: "Годишна равносметка", en: "The year in numbers" },
    text: {
      bg: [summary.bg, ...notes.map(note => note.bg)].join(" "),
      en: [summary.en, ...notes.map(note => note.en)].join(" "),
    },
    cashDelta: budget.net, statsDelta: statsChange(s.stats, stats),
  };
  let closed: GameState = {
    ...s, cash: s.cash + budget.net, stats, lifeSystems, death, finished,
    serviceYears: s.serviceYears + Number(s.age >= 19 && s.career !== "student" && s.retirement === null),
    history: [...s.history, memory], commands: [...s.commands, { age: s.age, kind: "year" }],
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

  const next: GameState = { ...closed, age: finished ? s.age : s.age + 1, sceneId: "", choiceId: null, usedActions: [] };
  if (!finished) {
    next.sceneId = sceneForYear(next);
    if (next.profile && next.age === 7) next.enrollment = { city: next.city, index: 0, graduationAge: 14 };
    if (full) {
      if (healthNote) next.history.push({
        age: next.age, city: next.city, kind: "event", id: "health-" + next.age, witnesses: [], cashDelta: 0,
        title: { bg: "Здраве", en: "Health" }, text: healthNote,
      });
      const moment = yearlyMoment(next);
      if (moment) next.history.push(moment);
    }
  }
  return finished ? next : settleReproductionYear(next);
}

/** Store the portrait's starting traits and replay the commands that shaped the life. */
export function encodeSave(s: GameState): string {
  const { familyEventsFrom } = s.lifeSystems.reproduction;
  const base = {
    format: FORMAT, seed: s.seed, ...(s.avatar && { avatar: s.avatar }),
    ...(familyEventsFrom !== null && { familyEventsFrom }), commands: s.commands,
  };
  if (s.lifespanStart === null) return JSON.stringify({ ...base, version: 1, content: ORIGINAL_CONTENT });
  if (s.profile) return JSON.stringify({ ...base, version: 3, content: FAMILY_CONTENT, birthCity: s.birthCity, profile: s.profile });
  return JSON.stringify({
    ...base, version: 2, content: LIFESPAN_CONTENT,
    ...(s.origin === "birth" ? { birthCity: s.birthCity } : { upgradeAt: s.lifespanStart }),
  });
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function decodeSave(raw: string): GameState | null {
  if (typeof raw !== "string" || raw.length > 131_072) return null;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!object(saved) || saved.format !== FORMAT) return null;
    const legacy = saved.content === ORIGINAL_CONTENT && (saved.version === undefined || saved.version === 1);
    const full = saved.content === LIFESPAN_CONTENT && saved.version === 2;
    const family = saved.content === FAMILY_CONTENT && saved.version === 3;
    if (!legacy && !full && !family) return null;
    if (typeof saved.seed !== "number" || !Number.isSafeInteger(saved.seed) || saved.seed < 0 || saved.seed > 0xffffffff) return null;
    if (!Array.isArray(saved.commands) || saved.commands.length > (legacy ? MAX_CHAPTER_COMMANDS : MAX_LIFE_COMMANDS)) return null;
    const familyEventsFrom = saved.familyEventsFrom ?? null;
    if (familyEventsFrom !== null && (typeof familyEventsFrom !== "number" || !Number.isInteger(familyEventsFrom)
      || familyEventsFrom < 0 || familyEventsFrom > saved.commands.length)) return null;
    const avatar = "avatar" in saved ? parseAvatar(saved.avatar) : null;
    if ("avatar" in saved && !avatar) return null;
    const upgradeAt = full && "upgradeAt" in saved ? saved.upgradeAt : null;
    if (upgradeAt !== null && (typeof upgradeAt !== "number" || !Number.isInteger(upgradeAt)
      || upgradeAt < 0 || upgradeAt > MAX_CHAPTER_COMMANDS || upgradeAt > saved.commands.length || "birthCity" in saved)) return null;
    if ((full || family) && upgradeAt === null && !isCity(saved.birthCity)) return null;
    const profile = family ? parseLifeProfile(saved.profile) : null;
    if (family && (!profile || !avatar || "upgradeAt" in saved)) return null;
    let s = legacy || upgradeAt !== null ? newChapterLife(saved.seed, avatar) : profile && avatar
      ? newProfileLife({ seed: saved.seed, city: saved.birthCity as City, presentation: avatar.presentation ?? "female", avatar, profile })
      : newLife(saved.seed, avatar, saved.birthCity as City);
    s = { ...s, lifeSystems: updateReproduction(s, { familyEventsFrom }) };
    for (const [index, c] of saved.commands.entries()) {
      if (index === upgradeAt) {
        s = continueLife(s);
        if (s.lifespanStart !== index) return null;
      }
      if (!object(c) || c.age !== s.age || s.finished) return null;
      let next: GameState;
      if (c.kind === "year" || c.kind === "end") {
        if ("id" in c) return null;
        next = c.kind === "year" ? advance(s, s.age) : giveUp(s, s.age);
      } else if (c.kind === "name-children") {
        if (!Array.isArray(c.names) || !c.names.every(name => typeof name === "string")
          || (c.surname !== "mother" && c.surname !== "father")) return null;
        next = nameNewborns(s, c.names, c.surname, s.age);
      } else {
        if (typeof c.id !== "string" || c.id.length > 100) return null;
        if (c.kind === "choice") next = choose(s, c.id, s.age);
        else if (c.kind === "action") next = getLifeActivityDefinition(c.id)?.replayOnly
          ? applyLifeActivity(s, c.id, s.age, true) : doAction(s, c.id, s.age);
        else return null;
      }
      if (next === s) return null;
      s = next;
    }
    if (upgradeAt !== saved.commands.length) return s;
    const resumed = continueLife(s);
    return resumed.lifespanStart === upgradeAt ? resumed : null;
  } catch {
    return null;
  }
}

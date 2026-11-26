import { personName, type PeopleId } from "./peopleIdentity.ts";
import { actions, scenes } from "./story.ts";
import { parseAvatar, type AvatarTraits } from "./avatar.ts";
import {
  activityDefinitions, getLifeActivityDefinition, lifeActivityOption, spentActivityTime, startingLifeSystems,
  startingStats, statsChange, type LifeActivityOption, type LifeStats, type LifeSystems, type StatDelta,
} from "./lifeActivities.ts";
import { billText, settleFinances } from "./lifeEconomy.ts";
import { settleWellbeing, storyStats } from "./lifeWellbeing.ts";

export { lifeHeirLabel, lifePartnerLabel, lifeStatKeys } from "./lifeActivities.ts";
export type { Heir, LifeActivityCategory, LifeActivityOption, LifeStat, LifeStats, Platform } from "./lifeActivities.ts";
export { getEstate } from "./lifeEconomy.ts";

/** All amounts in state or story effects are integer euro cents. */
export type Text = { bg: string; en: string };
export type City = "tryavna" | "sofia";
export type Housing = "home" | "rumi" | "shared";
export type Career = "student" | "woodcarver" | "qa";
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

export type Command = { age: number; kind: "choice" | "action"; id: string } | { age: number; kind: "year" | "end" };
export type Memory = {
  age: number;
  city: City;
  kind: Command["kind"];
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
  age: number;
  city: City;
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
  endReason: "chapter" | "gaveUp" | null;
  stats: LifeStats;
  lifeSystems: LifeSystems;
};

export const FIRST_AGE = 16;
const FINAL_AGE = 26;
const SHARED_DEPOSIT = 40_000;
const FORMAT = "bglife.chapter";
const CONTENT = "tryavna-sofia-1";
const YEARLY_TIME = 2;
// Per year: one choice, up to two discretionary activities, a possible emergency, and the year close.
const MAX_COMMANDS = (FINAL_AGE - FIRST_AGE + 1) * (YEARLY_TIME + 3) + 1;
const PEOPLE: PersonId[] = ["rumi", "niki", "mentor", "friend"];

function eligible(s: GameState, filter?: Condition): boolean {
  if (!filter) return true;
  return (!filter.city || filter.city === s.city)
    && (!filter.housing || filter.housing === s.housing)
    && (filter.minCash === undefined || s.cash >= filter.minCash)
    && (!filter.flags || filter.flags.every((flag) => s.flags.includes(flag)))
    && (!filter.without || filter.without.every((flag) => !s.flags.includes(flag)));
}

function sceneForYear(s: GameState): string {
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

export function newLife(seed = randomSeed(), avatar: AvatarTraits | null = null): GameState {
  const s: GameState = {
    seed: seed >>> 0, avatar, age: FIRST_AGE, city: "tryavna", housing: "home", career: "student",
    cash: 70_000, deposit: 0, trust: { rumi: 60, niki: 45, mentor: 45, friend: 55 },
    flags: [], history: [], usedActions: [], sceneId: "", choiceId: null, commands: [], finished: false,
    endReason: null, stats: startingStats(), lifeSystems: startingLifeSystems(),
  };
  s.sceneId = sceneForYear(s);
  return s;
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
  if (s.finished || s.choiceId !== null) return [];
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
  if (s.age !== expectedAge || s.finished) return s;
  if (s.choiceId !== null) return advance(s, expectedAge);
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

export function getActions(s: GameState): Action[] {
  if (s.finished || s.choiceId === null || commitmentsLeft(s) === 0) return [];
  return actions.filter((action) =>
    s.age >= (action.minAge ?? FIRST_AGE) && s.age <= (action.maxAge ?? FINAL_AGE)
    && !s.usedActions.includes(action.id) && available(s, action),
  );
}

function baseBudget(s: GameState): { pay: number; essentials: number; housing: number; net: number } {
  if (s.age < 19 || s.career === "student") return { pay: 0, essentials: 0, housing: 0, net: 0 };
  const pay = { woodcarver: 840_000, qa: 1_080_000 }[s.career];
  const essentials = { tryavna: 510_000, sofia: 660_000 }[s.city];
  const housing = { home: 150_000, rumi: 180_000, shared: 360_000 }[s.housing];
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
  for (const id of PEOPLE) trust[id] = Math.max(0, Math.min(100, trust[id] + (effect.trust?.[id] ?? 0)));
  return {
    ...s, city: effect.city ?? s.city, housing: newHousing, career: effect.career ?? s.career,
    cash: s.cash + cashEffect(s, effect), deposit, flags: [...flags], trust,
  };
}

function applyOption(s: GameState, kind: "choice" | "action", option: Option, title: Text): GameState {
  const result = applyEffect(s, option.effect);
  const stats = storyStats(s, result, option, kind);
  const witnesses = PEOPLE.filter((id) => id === option.effect?.person || option.effect?.trust?.[id] !== undefined);
  const memory: Memory = {
    age: s.age, city: result.city, kind, id: option.id, title, text: option.result,
    person: option.effect?.person, witnesses, cashDelta: result.cash - s.cash, statsDelta: statsChange(s.stats, stats),
  };
  if (result.city !== s.city) memory.movedTo = result.city;
  if (result.career !== s.career) memory.startedCareer = result.career;
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
  const action = getActions(s).find((a) => a.id === actionId);
  return action ? applyOption(s, "action", action, action.label) : doLifeActivity(s, actionId, expectedAge);
}

export function getLifeActivities(s: GameState): LifeActivityOption[] {
  const timeLeft = commitmentsLeft(s);
  return activityDefinitions.filter(definition => !definition.contact).map(definition => lifeActivityOption(s, definition, timeLeft));
}

export function getPersonActivities(s: GameState, contact: PeopleId): LifeActivityOption[] {
  const timeLeft = commitmentsLeft(s);
  return activityDefinitions.filter(definition => definition.contact === contact && definition.visible?.(s))
    .map(definition => lifeActivityOption(s, definition, timeLeft));
}

export function doLifeActivity(s: GameState, id: string, expectedAge = s.age): GameState {
  if (s.age !== expectedAge) return s;
  const definition = getLifeActivityDefinition(id);
  if (!definition) return s;
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
  return { ...result, lifeSystems: definition.resolvesMedicalIssue ? { ...lifeSystems, medicalIssue: null } : lifeSystems };
}

export function giveUp(s: GameState, expectedAge = s.age): GameState {
  if (s.finished || s.age !== expectedAge) return s;
  const memory: Memory = {
    age: s.age, city: s.city, kind: "end", id: "end-" + s.age, witnesses: [], cashDelta: 0,
    title: { bg: "Край на историята", en: "End of the story" },
    text: s.avatar?.presentation === "male"
      ? { bg: "Приключи историята на Милен. Дневникът му остава в албума.", en: "You ended Milen’s story. His journal stays in the album." }
      : { bg: "Приключи тази история на Мила. Дневникът ѝ остава в албума.", en: "You ended this story for Mila. Her journal stays in the album." },
  };
  return {
    ...s, finished: true, endReason: "gaveUp", sceneId: "", choiceId: null,
    history: [...s.history, memory], commands: [...s.commands, { age: s.age, kind: "end" }],
  };
}

const euroFormat = { style: "currency", currency: "EUR", maximumFractionDigits: 0, minimumFractionDigits: 0 } as const;
const formatters = { "bg-BG": new Intl.NumberFormat("bg-BG", euroFormat), "en-IE": new Intl.NumberFormat("en-IE", euroFormat) };
function currency(amount: number, locale: keyof typeof formatters): string {
  return formatters[locale].format(amount / 100);
}

export function advance(s: GameState, expectedAge = s.age): GameState {
  if (s.finished || s.age !== expectedAge || s.choiceId === null) return s;
  const { budget, bank, unpaidCare, unpaidDebt } = annualFinances(s);
  const finished = s.age === FINAL_AGE;
  const { stats, lifeSystems, notes } = settleWellbeing(s, bank, unpaidCare, unpaidDebt, finished);
  if (budget.obligations > 0) notes.unshift(billText(budget.obligations));
  const summary: Text = s.age < 19
    ? { bg: "Джобните са у теб. Домашните разходи са поети от семейството.", en: "Your pocket money stays yours. The family covered the household bills." }
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
  const next: GameState = {
    ...s, age: finished ? s.age : s.age + 1, cash: s.cash + budget.net,
    history: [...s.history, memory], commands: [...s.commands, { age: s.age, kind: "year" }],
    usedActions: [], choiceId: null, finished, sceneId: "",
    endReason: finished ? "chapter" : null, stats, lifeSystems,
  };
  if (!finished) next.sceneId = sceneForYear(next);
  return next;
}

/** Store the portrait's starting traits and replay the commands that shaped the life. */
export function encodeSave(s: GameState): string {
  return JSON.stringify({
    format: FORMAT, version: 1, content: CONTENT, seed: s.seed,
    ...(s.avatar && { avatar: s.avatar }), commands: s.commands,
  });
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function decodeSave(raw: string): GameState | null {
  if (typeof raw !== "string" || raw.length > 32_768) return null;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!object(saved) || saved.format !== FORMAT || saved.content !== CONTENT) return null;
    // The compact first-version transcript can omit its version when its content edition is explicit.
    if (saved.version !== undefined && saved.version !== 1) return null;
    if (typeof saved.seed !== "number" || !Number.isSafeInteger(saved.seed) || saved.seed < 0 || saved.seed > 0xffffffff) return null;
    if (!Array.isArray(saved.commands) || saved.commands.length > MAX_COMMANDS) return null;
    const avatar = "avatar" in saved ? parseAvatar(saved.avatar) : null;
    if ("avatar" in saved && !avatar) return null;
    let s = newLife(saved.seed, avatar);
    for (const c of saved.commands) {
      if (!object(c) || c.age !== s.age || s.finished) return null;
      let next: GameState;
      if (c.kind === "year" || c.kind === "end") {
        if ("id" in c) return null;
        next = c.kind === "year" ? advance(s, s.age) : giveUp(s, s.age);
      } else {
        if (typeof c.id !== "string" || c.id.length > 100) return null;
        if (c.kind === "choice") next = choose(s, c.id, s.age);
        else if (c.kind === "action") next = doAction(s, c.id, s.age);
        else return null;
      }
      if (next === s) return null;
      s = next;
    }
    return s;
  } catch {
    return null;
  }
}

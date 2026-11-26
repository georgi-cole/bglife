import type { City, GameState, PersonId, Text } from "./engine.ts";
import { lifeBank } from "./lifeEconomy.ts";
import { lifeFamily } from "./lifeFamily.ts";
import { lifeLeisure } from "./lifeLeisure.ts";
import { lifeSocial } from "./lifeSocial.ts";
import { personProfiles } from "./story.ts";

export const lifeStatKeys = ["health", "looks", "joy", "brains", "influence"] as const;
export type LifeStat = typeof lifeStatKeys[number];
export type LifeStats = Record<LifeStat, number>;
export type StatDelta = Partial<LifeStats>;

export type LifeActivityCategory = "hospital" | "gym" | "pets" | "holidays" | "family" | "bank" | "aesthetics" | "fun" | "social" | "legacy";
export type Platform = "instagram" | "facebook" | "tiktok" | "youtube" | "vbox7" | "onlyfans";
export type Heir = "partner" | "children" | "rumi" | "friend";

export type LifeSystems = {
  medicalIssue: "routine" | "urgent" | null;
  pets: { adopted: boolean; rescued: boolean; bond: number };
  family: {
    partner: PersonId | "appMatch" | "serviceMatch" | null;
    stage: "single" | "dating" | "committed" | "engaged" | "married";
    bond: number;
    children: number;
    expecting: boolean;
  };
  bank: { accountOpen: boolean; balance: number; loan: number; mortgage: number; ownsHome: boolean };
  social: Partial<Record<Platform, { followers: number; posts: number }>>;
  legacy: { heirs: Heir[]; prepared: boolean };
};

export type LifeActivityDefinition = {
  id: string;
  category: LifeActivityCategory;
  label: Text;
  description: Text;
  result: Text;
  cost?: number;
  walletDelta?: (s: GameState) => number;
  stats?: StatDelta;
  minAge?: number;
  city?: City;
  time?: number;
  trust?: Partial<Record<PersonId, number>>;
  person?: PersonId;
  requires?: (s: GameState) => Text | null;
  update?: (s: GameState) => LifeSystems;
  resolvesMedicalIssue?: boolean;
};

export type LifeActivityOption = Pick<LifeActivityDefinition, "id" | "category" | "label" | "description" | "minAge"> & {
  group?: Text;
  cashDelta: number;
  timeCost: number;
  statDelta: StatDelta;
  blocked: Text | null;
};

export function startingStats(): LifeStats {
  return { health: 76, looks: 55, joy: 66, brains: 63, influence: 24 };
}

export function startingLifeSystems(): LifeSystems {
  return {
    medicalIssue: null,
    pets: { adopted: false, rescued: false, bond: 0 },
    family: { partner: null, stage: "single", bond: 0, children: 0, expecting: false },
    bank: { accountOpen: false, balance: 0, loan: 0, mortgage: 0, ownsHome: false },
    social: {},
    legacy: { heirs: [], prepared: false },
  };
}

export function applyStats(stats: LifeStats, delta: StatDelta): LifeStats {
  return {
    health: boundStat(stats.health + (delta.health ?? 0)),
    looks: boundStat(stats.looks + (delta.looks ?? 0)),
    joy: boundStat(stats.joy + (delta.joy ?? 0)),
    brains: boundStat(stats.brains + (delta.brains ?? 0)),
    influence: boundStat(stats.influence + (delta.influence ?? 0)),
  };
}

export function statsChange(before: LifeStats, after: LifeStats): StatDelta {
  const change: StatDelta = {};
  for (const key of lifeStatKeys) {
    const delta = after[key] - before[key];
    if (delta !== 0) change[key] = delta;
  }
  return change;
}

export function boundStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}

const platformNames = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok",
  youtube: "YouTube", vbox7: "Vbox7", onlyfans: "OnlyFans",
};
export const activityDefinitions: LifeActivityDefinition[] = [
  ...lifeLeisure, ...lifeFamily, ...lifeBank, ...lifeSocial,
];

const byId = new Map(activityDefinitions.map(definition => [definition.id, definition]));
export function getLifeActivityDefinition(id: string): LifeActivityDefinition | undefined {
  return byId.get(id);
}
export function spentActivityTime(s: GameState): number {
  return s.usedActions.reduce((used, id) => used + (byId.get(id)?.time ?? 1), 0);
}

function blocked(s: GameState, definition: LifeActivityDefinition, cashDelta: number, timeLeft: number): Text | null {
  if (s.finished) return { bg: "Тази история е приключила.", en: "This story has ended." };
  if (definition.minAge && s.age < definition.minAge) return {
    bg: `Достъпно от ${definition.minAge} г.`,
    en: `Available from age ${definition.minAge}.`,
  };
  if (definition.city && s.city !== definition.city) return definition.city === "sofia"
    ? { bg: "Достъпно в София.", en: "Available in Sofia." }
    : { bg: "Достъпно в Трявна.", en: "Available in Tryavna." };
  const requirement = definition.requires?.(s);
  if (requirement) return requirement;
  if (s.choiceId === null && definition.time !== 0) return { bg: "Първо вземи решението за тази година в „Живот“.", en: "Make this year’s decision in Life first." };
  if (s.usedActions.includes(definition.id)) return {
    bg: "Вече е направено тази година.", en: "Already done this year.",
  };
  if ((definition.time ?? 1) > timeLeft) return { bg: "Тази година няма достатъчно свободно време.", en: "There isn’t enough free time this year." };
  if (s.cash + cashDelta < 0) return { bg: "Няма достатъчно пари в портфейла.", en: "There isn’t enough in the wallet." };
  return null;
}

export function lifeActivityOption(s: GameState, definition: LifeActivityDefinition, timeLeft: number): LifeActivityOption {
  const cashDelta = definition.walletDelta?.(s) ?? (definition.cost ? -definition.cost : 0);
  const platform = definition.category === "social" ? platformNames[definition.id.split(".")[1] as Platform] : undefined;
  return {
    id: definition.id, category: definition.category, label: definition.label, description: definition.description,
    minAge: definition.minAge,
    group: platform ? { bg: platform, en: platform } : undefined,
    timeCost: definition.time ?? 1, cashDelta,
    statDelta: statsChange(s.stats, applyStats(s.stats, definition.stats ?? {})),
    blocked: blocked(s, definition, cashDelta, timeLeft),
  };
}

export function lifePartnerLabel(s: GameState): Text | null {
  const partner = s.lifeSystems.family.partner;
  if (partner === null) return null;
  if (partner === "appMatch") return { bg: "Алекс", en: "Alex" };
  if (partner === "serviceMatch") return { bg: "Дани", en: "Dani" };
  return personProfiles[partner].name;
}

export function lifeHeirLabel(s: GameState, heir: Heir): Text {
  if (heir === "children") return { bg: "Децата", en: "Children" };
  if (heir === "partner") return lifePartnerLabel(s) ?? { bg: "Партньор", en: "Partner" };
  return personProfiles[heir].name;
}

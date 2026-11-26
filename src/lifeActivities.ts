import type { City, GameState, PersonId, Text } from "./engine.ts";
import type { AvatarPresentation } from "./avatar.ts";
import { getPeopleActivityDefinitions } from "./peopleActivities.ts";
import { isPeopleId, type PeopleId } from "./peopleIdentity.ts";
import { lifeBank } from "./lifeEconomy.ts";
import { lifeFamily } from "./lifeFamily.ts";
import { lifeReproduction } from "./lifeReproduction.ts";
import { startingReproduction, type Reproduction } from "./reproduction.ts";
import { lifeLeisure } from "./lifeLeisure.ts";
import { lifeSocial } from "./lifeSocial.ts";
import { personProfiles } from "./story.ts";
import { applyStats, statsChange, type StatDelta } from "./lifeStats.ts";

export { applyStats, boundStat, lifeStatKeys, startingStats, statsChange } from "./lifeStats.ts";
export type { LifeStat, LifeStats, StatDelta } from "./lifeStats.ts";

export type LifeActivityCategory = "hospital" | "fertility" | "adoption" | "gym" | "pets" | "holidays" | "family" | "bank" | "aesthetics" | "fun" | "social" | "legacy";
export type Platform = "instagram" | "facebook" | "tiktok" | "youtube" | "vbox7" | "onlyfans";
export type Heir = "partner" | "children" | "rumi" | "friend";

export type PartnerId = PersonId | "appMatch" | "serviceMatch";

export type ChildProfile = {
  joinedAt: number; ageAtJoin: number; bond: number; gender: AvatarPresentation;
  name?: Text; origin?: "birth" | "adoption";
};

export type LifeSystems = {
  medicalIssue: "routine" | "urgent" | null;
  pets: { adopted: boolean; rescued: boolean; bond: number };
  family: {
    partner: PartnerId | null;
    formerPartners: { id: PartnerId; endedAt: number }[];
    childProfiles: ChildProfile[];
    stage: "single" | "dating" | "committed" | "engaged" | "married";
    bond: number;
    children: number;
    expecting: boolean;
  };
  reproduction: Reproduction;
  bank: { accountOpen: boolean; balance: number; loan: number; mortgage: number; ownsHome: boolean };
  social: Partial<Record<Platform, { followers: number; posts: number }>>;
  legacy: { heirs: Heir[]; prepared: boolean };
};

export type ActivityBranch = { id: string; label: Text; description: Text };
export type ActivityResolution = { result: Text; stats?: StatDelta; trust?: Partial<Record<PersonId, number>>; lifeSystems?: LifeSystems };

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
  contact?: PeopleId;
  visible?: (s: GameState) => boolean;
  branch?: ActivityBranch;
  exclusive?: string;
  replayOnly?: true;
  resolve?: (s: GameState) => ActivityResolution;
};

export type LifeActivityOption = Pick<LifeActivityDefinition, "id" | "category" | "label" | "description" | "minAge" | "branch"> & {
  group?: Text;
  cashDelta: number;
  timeCost: number;
  statDelta: StatDelta;
  blocked: Text | null;
};

export function startingLifeSystems(): LifeSystems {
  return {
    medicalIssue: null,
    pets: { adopted: false, rescued: false, bond: 0 },
    family: { partner: null, formerPartners: [], childProfiles: [], stage: "single", bond: 0, children: 0, expecting: false },
    reproduction: startingReproduction(),
    bank: { accountOpen: false, balance: 0, loan: 0, mortgage: 0, ownsHome: false },
    social: {},
    legacy: { heirs: [], prepared: false },
  };
}

const platformNames = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok",
  youtube: "YouTube", vbox7: "Vbox7", onlyfans: "OnlyFans",
};
export const activityDefinitions: LifeActivityDefinition[] = [
  ...lifeLeisure, ...lifeFamily, ...lifeBank, ...lifeSocial, ...lifeReproduction,
];

const byId = new Map(activityDefinitions.map(definition => [definition.id, definition]));
export function getLifeActivityDefinition(id: string): LifeActivityDefinition | undefined {
  const standard = byId.get(id);
  if (standard) return standard;
  const [scope, contact] = id.split(".");
  return scope === "people" && isPeopleId(contact) ? getPeopleActivityDefinitions(contact).find(option => option.id === id) : undefined;
}

export function spentActivityTime(s: GameState): number {
  return s.usedActions.reduce((used, id) => used + (getLifeActivityDefinition(id)?.time ?? 1), 0);
}

function blocked(s: GameState, definition: LifeActivityDefinition, cashDelta: number, timeLeft: number): Text | null {
  if (definition.visible && !definition.visible(s)) return { bg: "Това действие не е достъпно за този човек.", en: "This action is not available for this person." };
  if (s.finished) return { bg: "Тази история е приключила.", en: "This story has ended." };
  if (s.lifeSystems.reproduction.naming) return { bg: "Първо запиши името на бебето.", en: "Name the new baby first." };
  if (definition.minAge && s.age < definition.minAge) return {
    bg: `Достъпно от ${definition.minAge} г.`,
    en: `Available from age ${definition.minAge}.`,
  };
  if (definition.city && s.city !== definition.city) return definition.city === "sofia"
    ? { bg: "Достъпно в София.", en: "Available in Sofia." }
    : { bg: "Достъпно в Трявна.", en: "Available in Tryavna." };
  const requirement = definition.requires?.(s);
  if (requirement) return requirement;
  if (s.sceneId && s.choiceId === null && definition.time !== 0) return { bg: "Първо вземи решението за тази година в „Живот“.", en: "Make this year’s decision in Life first." };
  const exclusive = definition.branch?.id ?? definition.exclusive;
  const alreadyUsed = s.usedActions.includes(definition.id) || (exclusive && s.usedActions.some(id => {
    const used = getLifeActivityDefinition(id);
    return used?.contact === definition.contact && (used?.branch?.id ?? used?.exclusive) === exclusive;
  }));
  if (alreadyUsed) return {
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
    minAge: definition.minAge, branch: definition.branch,
    group: platform ? { bg: platform, en: platform } : undefined,
    timeCost: definition.time ?? 1, cashDelta,
    statDelta: statsChange(s.stats, applyStats(s.stats, definition.stats ?? {})),
    blocked: blocked(s, definition, cashDelta, timeLeft),
  };
}

export function lifePartnerLabel(s: GameState, partner = s.lifeSystems.family.partner): Text | null {
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

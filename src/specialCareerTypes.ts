import type { City } from "./cities.ts";
import type { Contract, EmploymentState } from "./employment.ts";
import type { GameState, Text } from "./engine.ts";
import type { LifePath } from "./lifePath.ts";
import { limit, type PathAction, type PathEvent, type PathResult } from "./pathActions.ts";
import { pathMoney, pathText as t } from "./pathCatalog.ts";

export type SpecialCareerId = "creator" | "actor" | "athlete" | "politics";
export type Platform = "youtube" | "instagram" | "tiktok";
export type Niche = "culture" | "sport" | "everyday";
export type Sport = "football" | "volleyball" | "tennis";
export type Office = "council" | "mayor" | "assembly" | "president" | "premier";
export type ElectiveOffice = Exclude<Office, "premier">;
export type Agenda = "education" | "transport" | "economy";
export type Nomination = "list" | "independent";

export type SpecialJob =
  | { kind: "actor"; project: string; license: boolean }
  | { kind: "athlete"; club: string; captain: boolean }
  | { kind: "politics"; office: Office; agenda: Agenda };

export type Channel = {
  platform: Platform; niche: Niche; followers: number; trust: number;
  views: number; watchHours: number; shorts: number; posts: number;
  verified: boolean; monetized: boolean; sponsorAge?: number;
  sponsor?: { age: number; gross: number };
};
export type ActorProgress = {
  skill: number; portfolio: boolean; agent: boolean; credits: number; awards: number;
  offer?: { project: string; age: number; permit?: true };
  licenses: { project: string; until: number; gross: number }[];
};
export type SportProgress = {
  sport: Sport | null; skills: Partial<Record<Sport, number>>; academy?: City;
  form: number; fatigue: number; injury: number; seasons: number; titles: number; caps: number;
  clubs: string[]; retired: boolean;
  offer?: { club: string; age: number };
  last?: { age: number; rank: number; field: number; appearances: number; points: number };
};
export type Campaign = {
  office: ElectiveOffice; city: City; election: number; nomination: Nomination;
  agenda: Agenda; fieldwork: number; funded: number; registered: boolean; runningMate?: Agenda;
};
export type PoliticalProgress = {
  standing: number; integrity: number; approval: number; service: number;
  delivered: number; presidentialTerms: number;
  campaign?: Campaign;
  offer?: { office: ElectiveOffice; city: City; agenda: Agenda; age: number };
  last?: { office: ElectiveOffice; age: number; won: boolean; share: number; runoff?: number; listShare?: number; turnout?: number };
};

export type SpecialProgress = {
  fame: number; channel: Channel | null; actor: ActorProgress; sport: SportProgress; politics: PoliticalProgress;
  independentGross: number; careerReceipts: number;
  decision?: { kind: SpecialCareerId; age: number; alternative: boolean; handled?: true };
};

export function initialSpecialProgress(): SpecialProgress {
  return {
    fame: 0, channel: null,
    actor: { skill: 0, portfolio: false, agent: false, credits: 0, awards: 0, licenses: [] },
    sport: { sport: null, skills: {}, form: 50, fatigue: 0, injury: 0, seasons: 0, titles: 0, caps: 0, clubs: [], retired: false },
    politics: { standing: 0, integrity: 65, approval: 50, service: 0, delivered: 0, presidentialTerms: 0 },
    independentGross: 0, careerReceipts: 0,
  };
}

export type SpecialContext = { life: GameState; path: LifePath; progress: SpecialProgress };
export type SpecialAction = PathAction<LifePath>;
export type SpecialFact = { label: Text; value: Text | number; money?: true };
export type SpecialCard = {
  id: string; city?: City; title: Text; detail?: Text; facts?: SpecialFact[];
  meters?: { label: Text; value: number }[]; actions?: SpecialAction[]; fold?: true;
};
export type SpecialView = { cards: SpecialCard[]; work: SpecialCard[] };
export type IndependentPay = { gross: number; net: number };
export type SpecialYear = {
  progress: SpecialProgress; events: PathEvent[]; independent: IndependentPay; prize: number;
};

export function action(kind: SpecialCareerId, id: string, label: Text, run: SpecialAction["run"], blocked?: Text): SpecialAction {
  return { id: "special." + kind + "." + id, label, run, blocked };
}

export function change(ctx: SpecialContext, patch: Partial<SpecialProgress>, note: Text,
  effects: Omit<PathResult<LifePath>, "state" | "note"> = {}, work = ctx.path.work): PathResult<LifePath> {
  return { ...effects, state: { ...ctx.path, work, special: { ...ctx.progress, ...patch } }, note };
}

export function currentRole<K extends SpecialJob["kind"]>(ctx: SpecialContext, kind: K) {
  const job = ctx.path.work.job;
  if (job?.special?.kind !== kind) return null;
  return job as Contract & { special: Extract<SpecialJob, { kind: K }> };
}

export const endsContract = (ctx: SpecialContext): EmploymentState => ({
  ...ctx.path.work, job: null, separation: { age: ctx.life.age, reason: "leave" },
});

export function signContract(ctx: SpecialContext, role: SpecialJob, gross: number, months: number, performance: number, hours: 4 | 8 = 8): EmploymentState {
  return {
    ...ctx.path.work, job: {
      job: "special-" + role.kind, city: ctx.life.city, gross, hours, monthsLeft: months,
      startedAt: ctx.life.age, tenure: 0, performance, special: role,
    },
    worked: false, benefit: null, separation: null,
  };
}

export const range = (value: number) => Math.round(limit(value, 0, 100));
export const inUse = (ctx: SpecialContext, id: string) => ctx.path.used.includes("special." + id);
export const needsAdult = t("Платената дейност в играта е от 18 г.", "Paid activity in the game starts at 18.");
export const needsFreeContract = t("Първо приключи текущия си договор.", "End your current contract first.");
export const needsWorkingHealth = t("Първо се възстанови.", "Recover first.");
export const fundsRequired = t("Нямаш достатъчно пари.", "You don't have enough cash.");
export const onlyOneOffer = t("Вече имаш предложение за тази година.", "You already have an offer this year.");

// Simulated withholding for independent receipts. Contract pay uses the existing employment model.
export const independentPay = (gross: number): IndependentPay => ({ gross, net: Math.floor(gross * .82) });
export const noIndependentPay = independentPay(0);
export const addPay = (a: IndependentPay, b: IndependentPay): IndependentPay => ({ gross: a.gross + b.gross, net: a.net + b.net });
export const euros = pathMoney;

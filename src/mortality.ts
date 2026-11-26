import type { AvatarPresentation } from "./avatar.ts";
import { cities, type City } from "./cities.ts";
import type { Text } from "./engine.ts";
import { annualDeathRates, causeRatesByAge, districtLifeExpectancy, rateCauses, type District } from "./mortalityData.ts";

export const MAX_AGE = 131;
export const PLAYER_MORTALITY_FACTOR = 0.82;

export type DeathCause = typeof rateCauses[number] | "oldAge";
export type Death = { age: number; cause: DeathCause };

export const deathCauses: Record<DeathCause, Text> = {
  birth: { bg: "Усложнения около раждането", en: "Complications around birth" },
  heart: { bg: "Исхемична болест на сърцето", en: "Ischaemic heart disease" },
  stroke: { bg: "Мозъчносъдово заболяване", en: "Cerebrovascular disease" },
  circulatory: { bg: "Друго сърдечносъдово заболяване", en: "Other cardiovascular disease" },
  cancer: { bg: "Онкологично заболяване", en: "Cancer" },
  respiratory: { bg: "Заболяване на дихателната система", en: "Respiratory disease" },
  sudden: { bg: "Внезапно влошаване с неустановена причина", en: "Sudden deterioration from an undetermined cause" },
  traffic: { bg: "Пътнотранспортна злополука", en: "Road traffic accident" },
  fall: { bg: "Усложнения след падане", en: "Complications after a fall" },
  drowning: { bg: "Инцидент във вода", en: "Accident in water" },
  accident: { bg: "Нещастен случай", en: "Accident" },
  external: { bg: "Тежък инцидент", en: "Serious incident" },
  illness: { bg: "Усложнения от заболяване", en: "Complications of illness" },
  oldAge: { bg: "Усложнения в напреднала възраст", en: "Complications of advanced age" },
};

const seedScale = 0x1_0000_0000;

export function lifeDraw(seed: number, age: number, stream: number): number {
  let n = seed ^ Math.imul(age + 1, 0x9e3779b1) ^ stream;
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return ((n ^ (n >>> 16)) >>> 0) / seedScale;
}

function sexIndex(sex: AvatarPresentation): 0 | 1 {
  return sex === "male" ? 0 : 1;
}

/** q(x, x+1) is measured at x, the completed age before the next birthday. */
export function nationalMortality(age: number, sex: AvatarPresentation): number {
  if (age >= MAX_AGE) return 1;
  const index = sexIndex(sex);
  if (age < 100) return annualDeathRates[Math.max(0, age)][index] / 100_000;
  // NSI groups 100+ together. A smooth game-specific curve continues single ages.
  const anchor = annualDeathRates[99][index] / 100_000;
  return anchor + 0.020 + 0.185 * (1 - Math.exp(-(age - 100) / 10));
}

export type MortalityProfile = {
  age: number;
  sex: AvatarPresentation;
  city?: City;
  player?: boolean;
  health?: number;
  vulnerability?: number;
  condition?: { cause: DeathCause; severity: "routine" | "urgent" };
};

const districtFactors = new Map<string, number>();

export function districtHazardFactor(district: District, sex: AvatarPresentation): number {
  const key = district + "." + sex;
  const cached = districtFactors.get(key);
  if (cached !== undefined) return cached;
  const target = districtLifeExpectancy[district][sexIndex(sex)];
  let low = 0.45;
  let high = 2.3;
  for (let iteration = 0; iteration < 20; iteration++) {
    const factor = (low + high) / 2;
    let survivors = 1;
    let lifespan = 0;
    for (let age = 0; age <= MAX_AGE; age++) {
      const q = nationalMortality(age, sex);
      const next = survivors * Math.pow(1 - q, age < 15 ? 1 : factor);
      lifespan += (survivors - next) * (age === MAX_AGE ? age : age + (age === 0 ? 0.15 : 0.5));
      survivors = next;
    }
    if (lifespan > target) low = factor;
    else high = factor;
  }
  const factor = (low + high) / 2;
  districtFactors.set(key, factor);
  return factor;
}

function causeWeights(profile: MortalityProfile): [DeathCause, number][] {
  const { age, health = 70, condition } = profile;
  let row = causeRatesByAge[0];
  for (const band of causeRatesByAge) {
    if (band[0] > age) break;
    row = band;
  }
  const rates = profile.sex === "male" ? row[1] : row[2];
  const total = rates.reduce((sum, rate) => sum + rate, 0);
  const healthFactor = 1 + (70 - Math.max(0, Math.min(100, health))) * 0.008;
  const weights: [DeathCause, number][] = rateCauses.map((cause, index) => {
    const healthcare = index > 0 && index < 7 || cause === "illness";
    const scale = healthcare ? healthFactor : 1;
    const extra = condition?.cause === cause ? condition.severity === "urgent" ? 3 : 1.65 : 1;
    return [cause, rates[index] / total * scale * extra];
  });
  if (age >= 90) {
    const undetermined = weights[6];
    const frailty = undetermined[1] * Math.min(0.8, 0.20 + (age - 90) * 0.04);
    undetermined[1] -= frailty;
    weights.push(["oldAge", frailty]);
  }
  return weights;
}

function deathRisk(profile: MortalityProfile, weight: number): number {
  const { age, city, sex, player, vulnerability = 1 } = profile;
  if (age >= MAX_AGE) return 1;
  const q = nationalMortality(age, sex);
  const district = city && age >= 15 ? districtHazardFactor(cities[city].district, sex) : 1;
  const factor = district * vulnerability * (player ? PLAYER_MORTALITY_FACTOR : 1);
  return -Math.expm1(Math.log1p(-q) * factor * weight);
}

export function annualMortality(profile: MortalityProfile): number {
  return deathRisk(profile, causeWeights(profile).reduce((sum, [, weight]) => sum + weight, 0));
}

export function rollDeath(profile: MortalityProfile, seed: number): Death | null {
  const { age } = profile;
  if (age >= MAX_AGE) return { age: MAX_AGE, cause: "oldAge" };
  const weights = causeWeights(profile);
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  const vulnerability = profile.vulnerability ?? (0.87 + 0.26 * lifeDraw(seed, 0, 0x4da0739b));
  if (lifeDraw(seed, age, 0x19c86d41) >= deathRisk({ ...profile, vulnerability }, total)) return null;
  let target = lifeDraw(seed, age, 0xa6e53917) * total;
  for (const [cause, weight] of weights) {
    target -= weight;
    if (target < 0) return { age, cause };
  }
  return { age, cause: "illness" };
}

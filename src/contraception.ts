import type { GameState, Text } from "./engine.ts";

export type Contraceptive = "pill" | "iud" | "tubal";
export type Contraception = { method: Contraceptive; startedAt: number };

export function activeContraceptive(s: GameState): Contraceptive | null {
  const contraception = s.lifeSystems.reproduction.contraception;
  return contraception && (contraception.method !== "iud" || s.age - contraception.startedAt < 10)
    ? contraception.method : null;
}

// CDC typical-use failure over the first year. The 0.85 reference is for no method.
// Convert annual risks to hazard ratios before applying them to game exposures.
export const annualFailure = { pill: 0.07, iud: 0.008, tubal: 0.005, condom: 0.13 } as const;
const unprotectedHazard = -Math.log1p(-0.85);
const hazardRatio = (method: keyof typeof annualFailure) => -Math.log1p(-annualFailure[method]) / unprotectedHazard;

export function conceptionWithProtection(chance: number, method: Contraceptive | null, condom: boolean): number {
  const relativeHazard = (method ? hazardRatio(method) : 1) * (condom ? hazardRatio("condom") : 1);
  return -Math.expm1(Math.log1p(-chance) * relativeHazard);
}

export const contraceptionNames: Record<Contraceptive, Text> = {
  pill: { bg: "Противозачатъчни таблетки", en: "Birth control pills" },
  iud: { bg: "Медна спирала", en: "Copper IUD" },
  tubal: { bg: "Трайна контрацепция", en: "Permanent contraception" },
};

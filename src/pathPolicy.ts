import type { City, GameState, Housing } from "./engine.ts";
import { pathMoney, pathText as t } from "./pathCatalog.ts";

export const PATH_POLICY_YEAR = 2026;
export const SHARED_DEPOSIT = pathMoney(400);
const TRAVEL = pathMoney(60);

// Ordinary third-category employment. The preset uses the rules of its reference year.
export const policy = {
  minimumWage: pathMoney(620.2),
  insuranceCeiling: pathMoney(2111.64),
  employeeInsurance: .1378,
  incomeTax: .1,
  ownHealth: pathMoney(22.03),
  unemploymentMin: pathMoney(9.21),
  unemploymentMax: pathMoney(54.78),
  pensionMin: pathMoney(347.51),
  pensionCeiling: pathMoney(1738.4),
  women: { age: 62 * 12 + 6, service: 36 * 12 + 10 },
  men: { age: 64 * 12 + 9, service: 39 * 12 + 10 },
  reduced: { age: 67 * 12, service: 15 * 12 },
};

export function netMonthly(gross: number): number {
  const insurance = Math.round(Math.min(gross, policy.insuranceCeiling) * policy.employeeInsurance);
  return Math.round((gross - insurance) * (1 - policy.incomeTax));
}

export function relocation(s: GameState, target: City) {
  const housing: Housing = target === (s.opening?.city ?? "tryavna") ? "home" : "shared";
  const cash = -TRAVEL - (housing === "shared" && s.housing !== "shared" ? SHARED_DEPOSIT : 0);
  return { city: target, housing, cash, cashDelta: cash + (s.housing === "shared" && housing !== "shared" ? s.deposit : 0) };
}

export function relocationBlock(s: GameState, target: City) {
  if (s.city === target) return;
  if (s.sceneId === "spare-key" && s.choiceId === null) {
    return t("Първо вземи решението за преместване в дневника.", "Resolve the move in your journal first.");
  }
  if (s.path?.work.job) return t("Първо приключи договора в този град.", "End your current local contract before moving.");
  if (s.path?.university.student) return t("Първо завърши или прекрати обучението си.", "Finish or withdraw from your current program first.");
  if (s.cash + relocation(s, target).cashDelta < 0) return t("Не достигат пари за път и депозит.", "You need enough for travel and the rental deposit.");
}

import { pathMoney } from "./pathCatalog.ts";

export const PATH_POLICY_YEAR = 2026;

// Ordinary third-category employment. The preset uses the rules of its reference year.
export const policy = {
  minimumWage: pathMoney(620.2),
  insuranceCeiling: pathMoney(2111.64),
  employeeInsurance: .1378,
  incomeTax: .1,
  ownHealth: pathMoney(22.03),
  unemploymentMin: pathMoney(9.21),
  unemploymentMax: pathMoney(54.78),
  maternity: { insuredMonths: 12, pregnancyRate: .9, childcareMonthly: pathMoney(398.81), returnShare: .5 },
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

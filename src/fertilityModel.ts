export type ConceptionMethod = "natural" | "stimulated" | "iui" | "ivf" | "donor-ivf";

export function familyRoll(seed: number, age: number, event: string): number {
  let hash = (seed ^ Math.imul(age, 0x9e3779b1)) >>> 0;
  for (const character of event) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 2 ** 32;
}

function ageCurve(age: number, points: readonly (readonly [number, number])[]): number {
  const i = points.findIndex(([threshold]) => age <= threshold);
  if (i < 0) return points[points.length - 1][1];
  if (i === 0) return points[0][1];
  const [fromAge, from] = points[i - 1];
  const [toAge, to] = points[i];
  return from + (to - from) * (age - fromAge) / (toAge - fromAge);
}

// ACOG reports about 25% per cycle in the 20s/early 30s and 10% at 40. CDC confirms
// spontaneous pregnancies after 44. Other points and the single-encounter factor are
// simulation values. An encounter with unknown timing is a fraction of a planned cycle.
const naturalCycle = [
  [18, 0.23], [22, 0.25], [30, 0.25], [35, 0.18], [38, 0.13], [40, 0.10],
  [42, 0.055], [44, 0.022], [46, 0.006], [48, 0.002], [50, 0.0005],
  [53, 0.00005], [56, 0.000005],
] as const;

export function menopauseAge(seed: number, person: string): number {
  const draw = (familyRoll(seed, 0, person + ".menopause") + familyRoll(seed, 0, person + ".menopause-spread")) / 2;
  return 45 + Math.floor(draw * 13);
}

export function naturalChance(age: number, menopause: number, planned: boolean, treated: boolean): number {
  if (age < 18 || age >= menopause) return 0;
  const cycle = ageCurve(age, naturalCycle);
  return cycle * (planned ? 1 : 0.24) * (treated ? 1.25 : 1);
}

export function clinicChance(method: "iui" | "ivf" | "donor-ivf", age: number, menopause: number, treated: boolean): number {
  if (method === "donor-ivf") {
    // Donor eggs change the age of the egg. The character still needs clinical clearance.
    return ageCurve(age, [[18, 0.43], [39, 0.43], [45, 0.39], [50, 0.32]]);
  }
  if (age >= menopause) return 0;
  if (method === "iui") return ageCurve(age, naturalCycle) * 0.65 * (treated ? 1.25 : 1);
  // HFEA 2023: pregnancy per fresh own-egg transfer is 41% at 18–34, 34% at 35–37
  // and 25% at 38–39. Further points are game estimates for the same endpoint.
  return ageCurve(age, [[18, 0.41], [34, 0.41], [37, 0.34], [39, 0.25],
    [41, 0.17], [44, 0.085], [46, 0.023], [49, 0.006], [56, 0.00001]]);
}

export function miscarriageChance(age: number, method: ConceptionMethod): number {
  // Rounded age bands from the Norwegian pregnancy registry (BMJ 2019, l869).
  // A younger donor egg uses a lower game risk with a smaller recipient-age effect.
  if (method === "donor-ivf") return ageCurve(age, [[18, 0.10], [35, 0.10], [45, 0.15], [52, 0.20]]);
  if (age < 20) return 0.158;
  if (age < 25) return 0.113;
  if (age < 30) return 0.098;
  if (age < 35) return 0.108;
  if (age < 40) return 0.167;
  if (age < 45) return 0.322;
  return 0.536;
}

export function birthCount(age: number, method: ConceptionMethod, roll: number): 1 | 2 | 3 {
  // Game probabilities per delivery, informed by NSI multiple deliveries and HFEA IVF
  // delivery statistics. Each threshold includes only the stated number of children.
  const triplets = method === "stimulated" || method === "iui" ? 0.002 : 0.0002;
  const twins = method === "stimulated" || method === "iui" ? 0.06
    : method === "ivf" || method === "donor-ivf" ? 0.033
    : ageCurve(age, [[18, 0.010], [29, 0.013], [38, 0.020], [43, 0.016], [48, 0.012]]);
  return roll < triplets ? 3 : roll < triplets + twins ? 2 : 1;
}

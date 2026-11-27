import { serviceMonths, startEmployment, type EmploymentState } from "./employment.ts";
import type { GameState, Text } from "./engine.ts";
import { average } from "./pathActions.ts";
import { pathText as t } from "./pathCatalog.ts";
import { netMonthly, policy } from "./pathPolicy.ts";
import { familyEvent, familyPlayEnabled, updateReproduction } from "./reproduction.ts";
import { scenes } from "./story.ts";

export type Maternity = {
  birthAge: number;
  firstMonthly: number;
  firstPaidMonths: number;
  returned: boolean;
};

export function maternityYear(s: GameState): 1 | 2 | null {
  const { maternity } = s.lifeSystems.reproduction;
  if (s.finished || !maternity || !familyPlayEnabled(s)) return null;
  const elapsed = s.age - maternity.birthAge;
  return elapsed === 0 ? 1 : elapsed === 1 ? 2 : null;
}

export function onMaternityLeave(s: GameState): boolean {
  return maternityYear(s) !== null && !s.lifeSystems.reproduction.maternity?.returned;
}

export function maternityStatus(s: GameState): Text | null {
  if (!onMaternityLeave(s)) return null;
  return maternityYear(s) === 1 ? t("Майчинство · първа година", "Maternity leave · first year")
    : t("Майчинство · втора година", "Maternity leave · second year");
}

function monthsToQualify(work: EmploymentState): number {
  const { job } = work;
  if (!job) return Infinity;
  const needed = Math.max(0, policy.maternity.insuredMonths - serviceMonths(work));
  return needed * 8 / job.hours;
}

function coveredMonths(work: EmploymentState): number {
  return work.job ? Math.min(12, work.job.monthsLeft ?? 12) : 0;
}

function firstMonthlyPay(work: EmploymentState): number {
  const recorded = work.recentGross.slice(-24).map(month => month || policy.minimumWage);
  const months = [...Array<number>(24 - recorded.length).fill(policy.minimumWage), ...recorded];
  const grossBased = average(months) * policy.maternity.pregnancyRate;
  const netCeiling = average(months.map(netMonthly));
  return Math.round(Math.max(policy.minimumWage, Math.min(grossBased, netCeiling)));
}

export function maternityPay(s: GameState, work?: EmploymentState): number {
  const year = maternityYear(s);
  const { maternity } = s.lifeSystems.reproduction;
  if (!year || !maternity) return 0;
  if (year === 1) return maternity.firstMonthly * maternity.firstPaidMonths;
  const employment = work ?? s.path?.work ?? startEmployment(s);
  const paidMonths = Math.max(0, coveredMonths(employment) - monthsToQualify(employment));
  const monthly = policy.maternity.childcareMonthly;
  return Math.round(monthly * paidMonths * (maternity.returned ? policy.maternity.returnShare : 1));
}

export function recordMaternityBirth(s: GameState): GameState {
  const work = s.path?.work ?? startEmployment(s);
  const qualifyingDelay = monthsToQualify(work);
  const hasEntitlement = qualifyingDelay < coveredMonths(work);
  const previous = s.lifeSystems.reproduction.maternity;
  const previousMonthly = previous && maternityPay(s, work) > 0 ? previous.firstMonthly : 0;
  const maternity: Maternity = {
    birthAge: s.age,
    firstMonthly: hasEntitlement ? Math.max(firstMonthlyPay(work), previousMonthly) : 0,
    firstPaidMonths: hasEntitlement ? 12 - qualifyingDelay : 0,
    returned: false,
  };
  return markMaternityYear({ ...s, lifeSystems: updateReproduction(s, { maternity }) });
}

const hasJob = (s: GameState) => s.path ? Boolean(s.path.work.job) : s.career !== "student";

export function markMaternityYear(s: GameState, newYear = false): GameState {
  const { maternity } = s.lifeSystems.reproduction;
  if (s.finished || !maternity || !familyPlayEnabled(s)) return s;
  const title = maternityStatus(s);
  if (title && s.choiceId === null && scenes.some(scene => scene.id === s.sceneId && scene.requiresWork)) {
    s = { ...s, sceneId: "" };
  }
  if (title && maternityYear(s) === 1) {
    return familyEvent(s, "maternity-first", title,
      t("Започнаха месеците у дома с бебето. В един ден се събират първата разходка и три студени кафета.",
        "The months at home with the baby have begun. One day holds a first walk and three cups of cold coffee."));
  }
  if (title) {
    return familyEvent(s, "maternity-second", title,
      t("Първите стъпки започнаха покрай дивана. Тази година можеш да останеш с детето или да се върнеш на работа.",
        "Those first steps started beside the sofa. This year you can stay home with your child or return to work."));
  }
  if (newYear && !maternity.returned && s.age === maternity.birthAge + 2) {
    return familyEvent(s, "maternity-finished", t("Край на майчинството", "End of maternity leave"),
      hasJob(s) ? t("Връщаш се на работа. Приготвяш две чанти сутринта и едната е пълна с резервни чорапи.",
        "You return to work. You pack two bags in the morning. One is full of spare socks.")
        : t("Периодът у дома с детето приключи. В „Кариера“ отново можеш да потърсиш работа.",
          "Your time at home with your child is over. You can look for work again in Career."));
  }
  return s;
}

export function returnFromMaternity(s: GameState): GameState {
  const { maternity, notice, naming } = s.lifeSystems.reproduction;
  if (!maternity || maternity.returned || maternityYear(s) !== 2 || notice || naming) return s;
  const next = { ...s, lifeSystems: updateReproduction(s, { maternity: { ...maternity, returned: true } }) };
  return familyEvent(next, "maternity-returned", t("Връщане от майчинство", "Returning from maternity leave"),
    hasJob(s) ? t("Приключи отпуска по-рано. Уговори кой ще гледа детето, когато си на работа.",
      "You ended your leave early and arranged who will look after your child while you work.")
      : t("Започна да търсиш работа и уговори кой ще гледа детето по време на интервютата.",
        "You started looking for work and arranged childcare for your interviews."));
}

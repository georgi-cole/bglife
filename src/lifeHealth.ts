import type { City, GameState, Text } from "./engine.ts";
import type { LifeSystems } from "./lifeActivities.ts";
import { lifeDraw, type DeathCause, type MortalityProfile } from "./mortality.ts";

const t = (bg: string, en: string): Text => ({ bg, en });
const conditions = {
  infection: { name: t("Инфекция", "Infection"), cause: "illness", chronic: false },
  pneumonia: { name: t("Пневмония", "Pneumonia"), cause: "respiratory", chronic: false },
  pressure: { name: t("Високо кръвно налягане", "High blood pressure"), cause: "circulatory", chronic: true },
  heart: { name: t("Сърдечно заболяване", "Heart disease"), cause: "heart", chronic: true },
  diabetes: { name: t("Диабет тип 2", "Type 2 diabetes"), cause: "illness", chronic: true },
  cancer: { name: t("Онкологично заболяване", "Cancer"), cause: "cancer", chronic: true },
  fall: { name: t("Травма след падане", "Injury after a fall"), cause: "fall", chronic: false },
  collision: { name: t("Травма при пътен инцидент", "Injury in a road accident"), cause: "traffic", chronic: false },
} as const satisfies Record<string, { name: Text; cause: DeathCause; chronic: boolean }>;

type ConditionId = keyof typeof conditions;
type Severity = NonNullable<LifeSystems["medicalIssue"]>;
export type HealthCondition = { id: ConditionId; severity: Severity; since: number; managedUntil?: number };

export function conditionLabel(condition: HealthCondition): Text {
  return conditions[condition.id].name;
}

export function mortalityCondition(s: GameState): MortalityProfile["condition"] {
  if (!s.lifeSystems.medicalIssue) return undefined;
  const condition = s.lifeSystems.healthCondition;
  return { cause: condition ? conditions[condition.id].cause : "illness", severity: s.lifeSystems.medicalIssue };
}

export function treatHealth(systems: LifeSystems, age: number): LifeSystems {
  const condition = systems.healthCondition;
  if (!condition) return { ...systems, medicalIssue: null };
  return {
    ...systems, medicalIssue: null,
    healthCondition: conditions[condition.id].chronic
      ? { ...condition, severity: "routine", managedUntil: age + 3 }
      : null,
  };
}

function drawCondition(age: number, roll: number): ConditionId {
  const pool: ConditionId[] = age < 7 ? ["infection", "infection", "fall", "pneumonia"]
    : age < 18 ? ["infection", "fall", "fall", "collision"]
    : age < 40 ? ["infection", "infection", "fall", "collision", "pressure", "cancer"]
    : age < 65 ? ["pressure", "pressure", "diabetes", "heart", "collision", "cancer", "pneumonia"]
    : ["fall", "heart", "pressure", "diabetes", "pneumonia", "pneumonia", "cancer"];
  return pool[Math.floor(roll * pool.length)];
}

function diagnosis(id: ConditionId, city: City): Text {
  if (id === "collision") {
    return city === "sofia"
      ? t("Пострада при сблъсък на оживено кръстовище. След първия преглед имаш нужда от проследяване.",
        "You were injured in a collision at a busy junction. You need follow-up after the first assessment.")
      : t("Пострада при инцидент на пътя. След първия преглед имаш нужда от проследяване.",
        "You were injured in an accident on the road. You need follow-up after the first assessment.");
  }
  if (id === "fall") {
    return t("Едно падане завърши с травма. Прегледът ще ти помогне да се върнеш към обичайния ритъм.",
      "A fall left you with an injury. A checkup will help you get back into your usual routine.");
  }
  const { name } = conditions[id];
  return t("На преглед откриха нов здравословен проблем. " + name.bg + ".",
    "A checkup identified a new health problem. " + name.en + ".");
}

type HealthYear = { issue: LifeSystems["medicalIssue"]; condition?: HealthCondition | null; health: number; note?: Text };

export function ageHealth(s: GameState, active: boolean, died: boolean): HealthYear {
  const nextAge = s.age + 1;
  const { medicalIssue, healthCondition } = s.lifeSystems;
  const normal = active ? 1 : nextAge >= 85 ? -2 : nextAge >= 50 ? -1 : s.stats.health < 78 ? 1 : 0;
  if (died) return { issue: medicalIssue, condition: healthCondition, health: 0 };
  const roll = lifeDraw(s.seed, nextAge, 0x544fc181);
  if (healthCondition?.managedUntil !== undefined) {
    if (nextAge < healthCondition.managedUntil) return { issue: null, condition: healthCondition, health: normal };
    return {
      issue: "routine",
      condition: { id: healthCondition.id, since: nextAge, severity: "routine" },
      health: normal,
      note: t("Време е за контролен преглед на хроничното ти състояние.", "Your chronic condition is due for a follow-up."),
    };
  }
  if (medicalIssue) {
    const chronic = healthCondition && conditions[healthCondition.id].chronic;
    if (!chronic && roll < (medicalIssue === "urgent" ? 0.24 : 0.55)) {
      return { issue: null, condition: null, health: normal + 4,
        note: t("Здравословният проблем отшумя.", "The health issue cleared up.") };
    }
    const escalated = medicalIssue === "routine" && roll > 0.82 && (chronic || s.stats.health < 55);
    if (escalated) {
      return { issue: "urgent", condition: healthCondition && { ...healthCondition, severity: "urgent" }, health: normal - 12,
        note: t("Състоянието се влоши и в играта вече е нужна спешна помощ.", "The condition worsened and now needs emergency care in the game.") };
    }
    return { issue: medicalIssue, condition: healthCondition, health: normal - (medicalIssue === "urgent" ? 7 : 3) };
  }
  const newIssueChance = nextAge < 18 ? 0.053 : nextAge < 40 ? 0.042 : nextAge < 65 ? 0.085 : 0.125;
  if (roll >= newIssueChance * (s.stats.health < 50 ? 1.35 : 1)) return { issue: null, condition: null, health: normal };
  const id = drawCondition(nextAge, lifeDraw(s.seed, nextAge, 0xe8ea1c3f));
  const severity = lifeDraw(s.seed, nextAge, 0x4d3925bd) < (id === "collision" ? 0.42 : 0.14) ? "urgent" : "routine";
  return { issue: severity, condition: { id, severity, since: nextAge }, health: normal - (severity === "urgent" ? 14 : 6),
    note: diagnosis(id, s.city) };
}

import { studying } from "./lifePath.ts";
import type { GameState, Option, Text } from "./engine.ts";
import { applyStats, boundStat, type LifeStats, type LifeSystems, type StatDelta } from "./lifeActivities.ts";
import { newChildProfile } from "./peopleIdentity.ts";

const text = (bg: string, en: string): Text => ({ bg, en });
const oldActions: Record<string, StatDelta> = {
  "market-morning": { joy: 2, influence: 2 },
  "tea-with-stefan": { brains: 3, joy: 1 },
  rehearsal: { joy: 3 },
  "extra-shift": { brains: 2, influence: 2, joy: -1 },
  "visit-home": { joy: 4 },
};

export function storyStats(s: GameState, result: GameState, option: Option, kind: "choice" | "action"): LifeStats {
  if (option.effect?.stats) return applyStats(s.stats, option.effect.stats);
  if (kind === "action") return applyStats(s.stats, oldActions[option.id] ?? {});
  const gains = Object.values(result.trust).reduce((sum, trust) => sum + trust, 0)
    - Object.values(s.trust).reduce((sum, trust) => sum + trust, 0);
  const raw = Math.sign(gains);
  return applyStats(s.stats, {
    joy: raw * Math.min(3, Math.floor(Math.abs(gains) / 3)),
    brains: result.career !== s.career ? 4 : 0,
    influence: gains >= 6 ? 1 : 0,
  });
}

export function settleWellbeing(s: GameState, bank: LifeSystems["bank"], unpaidCare: boolean, unpaidDebt: boolean, closingChapter: boolean) {
  const notes: Text[] = [];
  const used = s.usedActions;
  const active = used.some(id => id.startsWith("gym."));
  const influenceActivity = used.some(id => /^(social\.|fun\.|family\.)/.test(id));
  const familyActivity = used.some(id => id.startsWith("family."));
  const petActivity = used.some(id => id.startsWith("pets."));
  const wellbeing: StatDelta = {
    health: active ? 1 : -1,
    looks: s.age < 20 ? 1 : s.age > 22 ? -1 : 0,
    joy: unpaidCare || unpaidDebt ? -4 : used.length ? 1 : -1,
    brains: studying(s) ? 2 : 1,
    influence: influenceActivity ? 0 : s.stats.influence > 24 ? -1 : 0,
  };

  const { family, pets, legacy } = s.lifeSystems;
  const spentTimeWithPartner = family.partner && used.some(id => id.startsWith("people." + family.partner + "."));
  const bondChange = family.stage === "single" || familyActivity || spentTimeWithPartner ? 0 : -2;
  const children = family.children + Number(family.expecting);
  if (family.expecting) {
    wellbeing.joy = (wellbeing.joy ?? 0) + 8;
    notes.push(text("Посрещна дете в семейството.", "You welcomed a child into your family."));
  }
  if (unpaidCare) notes.push(text("Бюджетът не стигна за всички грижи у дома.", "The budget fell short of the full cost of care at home."));
  if (unpaidDebt) notes.push(text("Част от вноските остана за следващата година.", "Some repayments carried over to next year."));

  const roll = (Math.imul(s.seed ^ Math.imul(s.age, 0x7feb352d), 0x846ca68b) >>> 0) % 100;
  const assisted = used.some(id => id === "hospital.emergency" || id === "hospital.clinic");
  let issue = s.lifeSystems.medicalIssue;
  if (!assisted) {
    if (issue === "routine" && roll < 14 && s.stats.health < 62) {
      issue = "urgent";
      wellbeing.health = (wellbeing.health ?? 0) - 14;
      notes.push(text("Здравословният проблем се е влошил и вече е спешен.", "The health issue worsened and has become urgent."));
    } else if (!closingChapter && issue === null && roll < (s.stats.health < 50 ? 24 : active ? 5 : 12)) {
      issue = roll < 3 ? "urgent" : "routine";
      wellbeing.health = (wellbeing.health ?? 0) - (issue === "urgent" ? 17 : 8);
      notes.push(issue === "urgent"
        ? text("Възникна спешен здравословен проблем.", "An urgent health issue came up.")
        : text("Тази година се появи здравословен проблем, който можеш да проследиш в „Болница“.", "A health issue came up this year. You can follow up in Hospital."));
    } else if (issue !== null) {
      wellbeing.health = (wellbeing.health ?? 0) - (issue === "urgent" ? 9 : 3);
    }
  }
  if (issue === "urgent") wellbeing.joy = (wellbeing.joy ?? 0) - 2;

  const petBond = adoptedPets(pets) && !petActivity ? boundStat(pets.bond - (unpaidCare ? 6 : 2)) : pets.bond;
  return {
    stats: applyStats(s.stats, wellbeing),
    lifeSystems: {
      ...s.lifeSystems, bank, medicalIssue: issue,
      family: {
        ...family, bond: boundStat(family.bond + bondChange), children, expecting: false,
        childProfiles: family.expecting
          ? [...family.childProfiles, newChildProfile(s, s.age + Number(!closingChapter), 0, 60)]
          : family.childProfiles,
      },
      pets: petBond === pets.bond ? pets : { ...pets, bond: petBond },
      legacy,
    },
    notes,
  };
}

function adoptedPets(pets: LifeSystems["pets"]): boolean {
  return pets.adopted || pets.rescued;
}

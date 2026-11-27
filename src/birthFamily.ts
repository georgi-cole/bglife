import type { AvatarPresentation } from "./avatar.ts";
import { cities, type City } from "./cities.ts";
import type { GameState, Text } from "./engine.ts";
import { bilingualName, genderedSurname, localNames } from "./lifeProfile.ts";
import { districtHazardFactor, lifeDraw, nationalMortality } from "./mortality.ts";
import type { District } from "./mortalityData.ts";

export type KinRole = "mother" | "father" | "grandmother" | "grandfather" | "aunt" | "uncle" | "maternal-uncle" | "sibling";
export type KinId = `kin-${string}`;
export type Relative = {
  id: KinId;
  role: KinRole;
  gender: AvatarPresentation;
  name: Text;
  ageAtBirth: number;
  household: boolean;
  bond: number;
};
type Upbringing = "two-parents" | "mother" | "father" | "grandparents" | "relatives" | "foster";
export type BirthFamily = { upbringing: Upbringing; orphan: boolean; relatives: Relative[] };

// NSI, 2025. District averages at first birth. SFO and SOF are distinct.
const firstBirthAge: Record<District, number> = {
  BLG:26.8, BGS:27.2, VAR:28.5, VTR:27.5, VID:24.6, VRC:25.6, GAB:27.1, DOB:26.3,
  KRZ:27.5, KNL:26.6, LOV:25.0, MON:24.1, PAZ:24.4, PER:27.8, PVN:25.7, PDV:27.7,
  RAZ:25.9, RSE:27.3, SLS:25.4, SLV:22.1, SML:27.1, SFO:25.9, SOF:30.8, SZR:25.5,
  TGV:25.8, HKV:24.8, SHU:26.1, JAM:23.6,
};
const t = (bg: string, en: string): Text => ({ bg, en });
const groupProbability = [0.790, 0.968, 0.992, 0.9965, 0.9992] as const;
const arrangements: readonly Upbringing[] = ["two-parents", "mother", "father", "grandparents", "relatives", "foster"];
const roleLabels: Record<Exclude<KinRole,"sibling">, Text> = {
  mother: t("Майка", "Mother"), father: t("Баща", "Father"),
  grandmother: t("Баба", "Grandmother"), grandfather: t("Дядо", "Grandfather"),
  aunt: t("Леля", "Aunt"), uncle: t("Чичо", "Uncle"), "maternal-uncle": t("Вуйчо", "Maternal uncle"),
};

export function relativeLabel(relative: Relative): Text {
  if (relative.role === "sibling") return relative.gender === "male" ? t("Брат","Brother") : t("Сестра","Sister");
  return roleLabels[relative.role];
}

export function isKin(id: string): id is KinId {
  return id.startsWith("kin-");
}

export function getRelative(s: GameState, id: KinId): Relative | undefined {
  return s.birthFamily?.relatives.find(relative => relative.id === id);
}

const lifeSurvival: Record<AvatarPresentation, number[]> = { female: [1], male: [1] };
function survivesTo(age: number, gender: AvatarPresentation, city: City): number {
  const base = lifeSurvival[gender];
  while (base.length <= age) {
    const from = base.length - 1;
    base.push(base[from] * (1 - (from < 18 ? 0 : nationalMortality(from, gender))));
  }
  return Math.pow(base[age], districtHazardFactor(cities[city].district, gender));
}

export function generateBirthFamily(seed: number, city: City, name: string): BirthFamily {
  const draw = (index: number) => lifeDraw(seed, index, 0x5f427b81);
  const familyRoll = draw(0);
  const arrangement = groupProbability.findIndex(threshold => familyRoll < threshold);
  const upbringing = arrangements[arrangement < 0 ? arrangements.length - 1 : arrangement];
  const extendedCare = upbringing === "grandparents" || upbringing === "relatives";
  const orphan = upbringing === "foster" || (extendedCare && draw(1) < 0.78);
  const surname = name.split(" ").length > 1 ? name.split(" ").at(-1)! : "Иванов";
  const maternalSurname = ["Георгиев", "Тодоров", "Попов", "Маринов", "Стоянов", "Димитров"][Math.floor(draw(4) * 6)];
  const relatives: Relative[] = [];

  function add(id: KinId, role: KinRole, gender: AvatarPresentation, ageAtBirth: number, household: boolean,
    surname: string, index: number) {
    const choices = localNames[gender];
    let first = choices[Math.floor(draw(index) * choices.length)];
    if (name.startsWith(first + " ") || name === first || relatives.some(person => person.name.bg.startsWith(first + " "))) {
      first = choices.find(choice => !name.startsWith(choice + " ") && name !== choice
        && relatives.every(person => !person.name.bg.startsWith(choice + " "))) ?? first;
    }
    relatives.push({ id, role, gender, ageAtBirth, household, bond: household ? 76 : 53,
      name: bilingualName(first + " " + genderedSurname(surname, gender)) });
  }

  // NSI counts of live births by mother's birth order, excluding the 36 unknowns.
  const order = draw(2) * 50_205;
  const olderSiblings = order < 24_807 ? 0 : order < 43_023 ? 1 : order < 47_794 ? 2 : 3 + Math.floor(draw(3) ** 2 * 3);
  const spacing = Array.from({ length: olderSiblings }, (_, i) => 1 + Math.floor(draw(10 + i) * 4));
  const firstAge = Math.max(16, Math.round(firstBirthAge[cities[city].district] + (draw(5) + draw(6) - 1) * 17));
  const motherAge = Math.min(48, firstAge + spacing.reduce((sum, gap) => sum + gap, 0));
  const fatherAge = Math.max(17, Math.min(61, motherAge + Math.round(draw(7) * 12 - 4)));

  if (upbringing === "foster" && draw(8) < 0.75) return { upbringing, orphan, relatives };
  if (upbringing === "grandparents" && orphan && draw(8) < 0.24) {
    add("kin-maternal-grandmother", "grandmother", "female", motherAge + 24, true, maternalSurname, 43);
    return { upbringing, orphan, relatives };
  }
  const motherHome = upbringing === "two-parents" || upbringing === "mother";
  const fatherHome = upbringing === "two-parents" || upbringing === "father";
  if (motherHome || (!orphan && draw(13) < 0.75)) add("kin-mother", "mother", "female", motherAge, motherHome, draw(14) < 0.58 ? surname : maternalSurname, 40);
  if (fatherHome || (!orphan && draw(15) < 0.81)) add("kin-father", "father", "male", fatherAge, fatherHome, surname, 41);

  const grandparents = [
    { branch: "maternal", role: "grandmother", gender: "female", age: motherAge + 20 + Math.floor(draw(18) * 17), surname: maternalSurname },
    { branch: "paternal", role: "grandmother", gender: "female", age: fatherAge + 20 + Math.floor(draw(19) * 15), surname },
    { branch: "maternal", role: "grandfather", gender: "male", age: motherAge + 24 + Math.floor(draw(20) * 17), surname: maternalSurname },
    { branch: "paternal", role: "grandfather", gender: "male", age: fatherAge + 25 + Math.floor(draw(21) * 15), surname },
  ] as const;
  grandparents.forEach((person, i) => {
    const guardian = upbringing === "grandparents" && (i === 0 || (i === 1 && draw(22) < 0.30));
    const household = guardian || (motherHome || fatherHome) && draw(28 + i) < (i < 2 ? 0.15 : 0.075);
    if (guardian || draw(24 + i) < survivesTo(person.age, person.gender, city) * 0.96) {
      add(`kin-${person.branch}-${person.role}`, person.role, person.gender, person.age, household, person.surname, 42 + i);
    }
  });

  const collateral = [
    { id: "kin-maternal-aunt", role: "aunt", gender: "female", age: motherAge, surname: maternalSurname },
    { id: "kin-paternal-aunt", role: "aunt", gender: "female", age: fatherAge, surname },
    { id: "kin-maternal-uncle", role: "maternal-uncle", gender: "male", age: motherAge, surname: maternalSurname },
    { id: "kin-paternal-uncle", role: "uncle", gender: "male", age: fatherAge, surname },
  ] as const;
  const guardianIndex = Math.floor(draw(32) * collateral.length);
  collateral.forEach((person, i) => {
    const guardian = upbringing === "relatives" && i === guardianIndex;
    if (!guardian && draw(34 + i) >= 0.34) return;
    const age = Math.max(18, person.age + Math.round(draw(50 + i) * 14 - 7));
    add(person.id, person.role, person.gender, age, guardian, person.surname, 46 + i);
  });

  let difference = 0;
  spacing.forEach((gap, i) => {
    difference += gap;
    const age = Math.min(motherAge - 14, difference);
    const gender = draw(56 + i) < 0.5127 ? "male" : "female";
    add(`kin-sibling-${i}`, "sibling", gender, age, age < 18 && upbringing !== "foster" && draw(63 + i) < 0.88, surname, 70 + i);
  });
  return { upbringing, orphan, relatives };
}

export function careAtBirth(family: BirthFamily): Text {
  if (family.upbringing === "two-parents") return t("У дома ме посрещнаха и двамата ми родители.", "Both parents welcomed me home.");
  if (family.upbringing === "mother") return t("У дома за мен се грижи майка ми.", "My mother is raising me at home.");
  if (family.upbringing === "father") return t("У дома за мен се грижи баща ми.", "My father is raising me at home.");
  const care = family.upbringing === "grandparents" ? t("У дома за мен се грижи баба или дядо.", "A grandparent is raising me.")
    : family.upbringing === "relatives" ? t("За мен поеха грижа мои роднини.", "Relatives took me into their care.")
      : t("Посрещна ме приемно семейство.", "A foster family welcomed me.");
  return family.orphan ? t("Останах без родители още от самото начало. " + care.bg, "I had no surviving parent when I was born. " + care.en) : care;
}

export function currentCaregiver(s: GameState): Relative | undefined {
  const living = s.birthFamily?.relatives.filter(relative => !s.deceased[relative.id] &&
    (relative.role === "mother" || relative.role === "father" || relative.ageAtBirth + s.age >= 18)) ?? [];
  return living.find(relative => relative.household) ?? (s.birthFamily?.upbringing !== "foster" ? living[0] : undefined);
}

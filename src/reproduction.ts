import { hasSteadyIncome } from "./lifePath.ts";
import { getAvatarName, type AvatarPresentation } from "./avatar.ts";
import type { Contraception } from "./contraception.ts";
import { bulgarianChildName, familySurname, suggestedFirstName } from "./babyNames.ts";
import type { GameState, Text } from "./engine.ts";
import { birthCount, familyRoll, miscarriageChance, type ConceptionMethod } from "./fertilityModel.ts";
import { birthMoment, childFreeMoment, lossSupport, pregnancyMoment } from "./familyMoments.ts";
import { recordMaternityBirth, type Maternity } from "./maternity.ts";
import type { ChildProfile, LifeSystems, PartnerId } from "./lifeActivities.ts";
import { applyStats, statsChange, type StatDelta } from "./lifeStats.ts";
import { bilingualName } from "./lifeProfile.ts";
import { personAge, personGender, personName } from "./peopleIdentity.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

export type Parent = {
  id: "player" | "casual" | PartnerId;
  name: Text;
  gender: AvatarPresentation;
  age: number;
};
export type Parents = { mother: Parent; father: Parent | null };
export type Trimester = 1 | 2 | 3;
export type Gestation = {
  key: string; trimester: 0 | Trimester;
  babies: AvatarPresentation[];
  knownSexes: (AvatarPresentation | null)[];
};
export type Pregnancy = Parents & { method: ConceptionMethod; dueAge: number; gestation?: Gestation };
export type PregnancyNotice =
  | { kind: "test"; mother: Parent; candidate: Pregnancy | null; clinical: boolean }
  | { kind: "confirmed" | "negative" | "loss" | "termination"; title: Text; text: Text };
export type Recovery = { age: number; retried: boolean };
export type SurnameSource = "mother" | "father";
export type BirthNaming = Parents & {
  newborns: { index: number; firstName: string }[];
  surnames: SurnameSource[];
};
export type Adoption =
  | { stage: "review" | "waiting"; nextAge: number; spouse: PartnerId | null }
  | { stage: "offer"; spouse: PartnerId | null; age: number; gender: AvatarPresentation; firstName: string };
export type Reproduction = {
  familyEventsFrom: number | null;
  familyPlayFrom: number | null;
  pregnancy: Pregnancy | null;
  notice: PregnancyNotice | null;
  contraception: Contraception | null;
  recoveries: Record<string, Recovery>;
  deliveredAt: number | null;
  maternity: Maternity | null;
  naming: BirthNaming | null;
  evaluationAt: number | null;
  treatmentUntil: number;
  adoption: Adoption | null;
};
export const startingReproduction = (): Reproduction => ({
  familyEventsFrom: 0, familyPlayFrom: null, pregnancy: null, notice: null, contraception: null,
  recoveries: {}, deliveredAt: null, maternity: null, naming: null, evaluationAt: null, treatmentUntil: 0, adoption: null,
});

export function updateReproduction(s: GameState, patch: Partial<Reproduction>): LifeSystems {
  return { ...s.lifeSystems, reproduction: { ...s.lifeSystems.reproduction, ...patch } };
}

export function startFamilyEvents(s: GameState): GameState {
  if (s.finished || s.lifeSystems.reproduction.familyEventsFrom !== null) return s;
  return { ...s, lifeSystems: updateReproduction(s, { familyEventsFrom: s.commands.length }) };
}

export function playerParent(s: GameState): Parent {
  const name = s.profile ? bilingualName(s.profile.name) : getAvatarName(s.avatar);
  return { id: "player", name, gender: s.avatar?.presentation ?? "female", age: s.age };
}

export function contactParent(s: GameState, id: PartnerId): Parent {
  return { id, name: personName(s, id), gender: personGender(s, id), age: personAge(s, id) ?? s.age };
}

const casualNames = {
  male: [t("Ивайло Тодоров", "Ivaylo Todorov"), t("Георги Илиев", "Georgi Iliev"), t("Стефан Петров", "Stefan Petrov")],
  female: [t("Калина Георгиева", "Kalina Georgieva"), t("Борислава Иванова", "Borislava Ivanova"), t("Мария Василева", "Maria Vasileva")],
};

export function casualParent(s: GameState, gender: AvatarPresentation): Parent {
  const group = casualNames[gender];
  return { id: "casual", name: group[Math.floor(familyRoll(s.seed, s.age, "casual-name") * group.length)],
    gender, age: Math.max(18, s.age + Math.floor(familyRoll(s.seed, s.age, "casual-age") * 7) - 3) };
}

export function naturalParents(a: Parent, b: Parent): Parents | null {
  if (a.gender === b.gender) return null;
  return a.gender === "female" ? { mother: a, father: b } : { mother: b, father: a };
}

export function familyPlayEnabled(s: GameState): boolean {
  return s.lifeSystems.reproduction.familyPlayFrom !== null;
}

export function isExpecting(s: GameState): boolean {
  const { pregnancy, notice } = s.lifeSystems.reproduction;
  return s.lifeSystems.family.expecting || pregnancy !== null || notice?.kind === "test";
}

export function pregnancyStatus(s: GameState): Text | null {
  if (s.finished) return null;
  const { pregnancy, notice } = s.lifeSystems.reproduction;
  if (notice?.kind === "test") return t("Предстои тест за бременност", "Pregnancy test pending");
  if (pregnancy?.gestation) {
    const stage = pregnancy.gestation.trimester;
    const subject = pregnancy.mother.id === "player" ? t("Бременност", "Pregnancy") : pregnancy.mother.name;
    return stage === 0 ? t(subject.bg + " · Потвърдена", subject.en + " · Confirmed")
      : t(subject.bg + " · Триместър " + stage, subject.en + " · Trimester " + stage);
  }
  if (pregnancy) return pregnancy.mother.id === "player"
    ? t("Детето се очаква догодина", "Baby due next year")
    : t(pregnancy.mother.name.bg + " очаква дете догодина", pregnancy.mother.name.en + " is due next year");
  return s.lifeSystems.family.expecting ? t("Очакваш дете", "Expecting a child") : null;
}

export function conception(s: GameState, parents: Parents, method: ConceptionMethod) {
  const pregnancy: Pregnancy = { ...parents, method, dueAge: s.age + 1 };
  const text = parents.mother.id === "player"
    ? t("Разбираш, че си бременна.", "You find out you are pregnant.")
    : t("Научаваш за бременността. Бебето се очаква догодина.", "You learn about the pregnancy. The baby is due next year.");
  const reaction = pregnancyMoment(s, parents.mother.age);
  return {
    result: reaction ? t(text.bg + " " + reaction.bg, text.en + " " + reaction.en) : text,
    lifeSystems: updateReproduction(s, { pregnancy }),
  };
}

export function familyEvent(s: GameState, id: string, title: Text, text: Text, delta: StatDelta = {}): GameState {
  const stats = applyStats(s.stats, delta);
  return { ...s, stats, history: [...s.history, {
    age: s.age, city: s.city, kind: "event", id, title, text, witnesses: [], cashDelta: 0,
    statsDelta: statsChange(s.stats, stats),
  }] };
}

function marriedParents(s: GameState, parents: Parents): boolean {
  if (!parents.father || s.lifeSystems.family.stage !== "married") return false;
  const other = parents.mother.id === "player" ? parents.father.id : parents.mother.id;
  return other === s.lifeSystems.family.partner;
}

export function newbornSurname(naming: BirthNaming, source: SurnameSource, gender: AvatarPresentation): Text {
  return familySurname(source === "father" && naming.father ? naming.father.name : naming.mother.name, gender);
}

export function newbornName(naming: BirthNaming, firstName: string, source: SurnameSource, gender: AvatarPresentation): Text {
  return bulgarianChildName(firstName, (naming.father ?? naming.mother).name, newbornSurname(naming, source, gender), gender);
}

export function applyNewbornNames(s: GameState, names: string[], source: SurnameSource): GameState {
  const naming = s.lifeSystems.reproduction.naming;
  if (!naming || names.length !== naming.newborns.length || !naming.surnames.includes(source)) return s;

  const childProfiles = [...s.lifeSystems.family.childProfiles];
  const namedChildren = naming.newborns.map(({ index }, i) => {
    const child = childProfiles[index];
    const name = newbornName(naming, names[i], source, child.gender);
    childProfiles[index] = { ...child, name };
    return name;
  });
  const lifeSystems = updateReproduction(s, { naming: null });
  return familyEvent({ ...s, lifeSystems: { ...lifeSystems, family: { ...lifeSystems.family, childProfiles } } },
    "newborn-names", namedChildren.length === 1 ? t("Името на бебето", "Naming the baby") : t("Имената на бебетата", "Naming the babies"),
    t(namedChildren.map(name => name.bg).join(" · "), namedChildren.map(name => name.en).join(" · ")));
}

function settlePregnancy(s: GameState, pregnancy: Pregnancy): GameState {
  const { mother, method } = pregnancy;
  const rollKey = mother.id + "." + mother.name.bg;
  const lostMother = mother.id !== "player" && mother.id !== "casual" && s.deceased[mother.id];
  if (lostMother) {
    const lifeSystems = updateReproduction(s, { pregnancy: null });
    return familyEvent({ ...s, lifeSystems }, "pregnancy-loss", t("Загуба на бременността", "Pregnancy loss"),
      t("Бременността приключи след смъртта на " + mother.name.bg + ".",
        "The pregnancy ended when " + mother.name.en + " died."));
  }
  if (familyRoll(s.seed, s.age, rollKey + ".loss") < miscarriageChance(mother.age, method)) {
    const lifeSystems = updateReproduction(s, { pregnancy: null });
    const support = lossSupport(s);
    return familyEvent({ ...s, lifeSystems }, "pregnancy-loss", t("Загуба на бременността", "Pregnancy loss"),
      t("Бременността приключи със спонтанен аборт. " + support.bg,
        "The pregnancy ended in miscarriage. " + support.en),
      { joy: -7, ...(mother.id === "player" ? { health: -3 } : {}) });
  }

  const count = birthCount(mother.age, method, familyRoll(s.seed, s.age, rollKey + ".birth-count"));
  const babies = Array.from({ length: count }, (_, i) =>
    familyRoll(s.seed, s.age, rollKey + ".baby-sex." + i) < 0.488 ? "female" as const : "male" as const);
  return deliverPregnancy(s, pregnancy, babies, rollKey);
}

export function deliverPregnancy(s: GameState, pregnancy: Pregnancy, babies: AvatarPresentation[], rollKey: string): GameState {
  const { mother, gestation } = pregnancy;
  const family = s.lifeSystems.family;
  const childProfiles = [...family.childProfiles];
  const newborns: BirthNaming["newborns"] = [];
  const naming: BirthNaming = { mother, father: pregnancy.father, newborns,
    surnames: marriedParents(s, pregnancy) ? ["father"] : pregnancy.father ? ["mother", "father"] : ["mother"] };
  for (const [i, gender] of babies.entries()) {
    const firstName = suggestedFirstName(gender, familyRoll(s.seed, s.age, rollKey + ".baby-name." + i), newborns.map(child => child.firstName));
    const name = newbornName(naming, firstName, naming.surnames[0], gender);
    newborns.push({ index: childProfiles.length, firstName });
    childProfiles.push({ joinedAt: s.age, ageAtJoin: 0, bond: 60, gender, name, origin: "birth" });
  }

  const lifeSystems = updateReproduction(s, { pregnancy: null, naming, ...(gestation && { deliveredAt: s.age }) });
  const count = babies.length;
  const status = count === 3 ? t("Родиха се тризнаци!", "Triplets were born!")
    : count === 2 ? t("Родиха се близнаци!", "Twins were born!") : t("Роди се бебе!", "A baby was born!");
  const reaction = birthMoment(s, mother.age + Number(!gestation));
  const delivered = familyEvent({ ...s, lifeSystems: { ...lifeSystems,
    family: { ...family, children: childProfiles.length, childProfiles } } },
    "birth", t("Раждане", "Birth"), reaction ? t(status.bg + " " + reaction.bg, status.en + " " + reaction.en) : status,
    { joy: 8, ...(mother.id === "player" ? { health: -2 } : {}) });
  return mother.id === "player" ? recordMaternityBirth(delivered) : delivered;
}

export function adoptionSpouse(s: GameState): PartnerId | null {
  return s.lifeSystems.family.stage === "married" ? s.lifeSystems.family.partner : null;
}

export function adoptionAges(s: GameState, spouse: PartnerId | null): number[] {
  const parentAges = spouse ? [s.age, personAge(s, spouse) ?? s.age] : [s.age];
  return Array.from({ length: 18 }, (_, age) => age)
    .filter(age => parentAges.some(parent => parent - age >= 15 && parent - age <= 50));
}

export function adoptionStatus(s: GameState): Text | null {
  const { adoption } = s.lifeSystems.reproduction;
  if (!adoption) return null;
  if (adoption.stage === "review") return t("Социално проучване", "Social assessment");
  if (adoption.stage === "waiting") return t("В регистъра, в очакване на предложение", "Registered, waiting for a match");
  if (adoption.stage === "offer") return t(adoption.firstName + ", " + adoption.age + " г.", bilingualName(adoption.firstName).en + ", age " + adoption.age);
  return null;
}

function settleAdoption(s: GameState, adoption: Adoption): GameState {
  const title = t("Осиновяване", "Adoption");
  if (adoption.spouse !== adoptionSpouse(s)) {
    return familyEvent({ ...s, lifeSystems: updateReproduction(s, { adoption: null }) }, "adoption-household", title,
      t("Семейното ти положение се промени. Можеш да подадеш нова кандидатура.",
        "Your household changed. You can submit a new application."));
  }
  if (adoption.stage === "offer") {
    const lifeSystems = updateReproduction(s, { adoption: { stage: "waiting", nextAge: s.age + 1, spouse: adoption.spouse } });
    return familyEvent({ ...s, lifeSystems }, "adoption-expired", title,
      t("Срокът за отговор изтече. Оставаш в регистъра и ще получиш следващо предложение.",
        "The response window expired. You remain registered for another match."));
  }
  if (s.age < adoption.nextAge) return s;
  const ages = adoptionAges(s, adoption.spouse);
  if (!hasSteadyIncome(s) || !ages.length) {
    return familyEvent({ ...s, lifeSystems: updateReproduction(s, { adoption: null }) }, "adoption-denied", title,
      t("Социалните приключиха проверката с отказ. Можеш да кандидатстваш отново при промяна на обстоятелствата.",
        "The social services review declined the application. You can reapply if your circumstances change."));
  }
  if (adoption.stage === "review") {
    const lifeSystems = updateReproduction(s, { adoption: { ...adoption, stage: "waiting", nextAge: s.age + 1 } });
    return familyEvent({ ...s, lifeSystems }, "adoption-registered", title,
      t("Социалното проучване приключи и те вписаха в регистъра на кандидат-осиновителите.",
        "The assessment is complete and you have been added to the adoption register."));
  }

  const age = ages[Math.floor(familyRoll(s.seed, s.age, "adoption-match-age") * ages.length)];
  const gender = familyRoll(s.seed, s.age, "adoption-match-gender") < 0.5 ? "female" : "male";
  const firstName = suggestedFirstName(gender, familyRoll(s.seed, s.age, "adoption-match-name"));
  const lifeSystems = updateReproduction(s, { adoption: { stage: "offer", spouse: adoption.spouse, age, gender, firstName } });
  return familyEvent({ ...s, lifeSystems }, "adoption-offer", t("Предложение за осиновяване", "Adoption match"),
    t("Социалният работник ти предлага среща. Можеш да отговориш в „Любов и семейство“.",
      "Your social worker has arranged an introduction. You can respond in Love and Family."));
}

export function acceptAdoption(s: GameState, adoption: Extract<Adoption, { stage: "offer" }>) {
  const adopter = playerParent(s);
  const spouse = adoption.spouse ? contactParent(s, adoption.spouse) : null;
  const source = adopter.gender === "female" && spouse?.gender === "male" ? spouse : adopter;
  const name = bulgarianChildName(adoption.firstName, source.name, familySurname(source.name, adoption.gender), adoption.gender);
  const child: ChildProfile = { name, gender: adoption.gender, joinedAt: s.age, ageAtJoin: adoption.age, bond: 45, origin: "adoption" };
  const family = s.lifeSystems.family;
  const lifeSystems = { ...updateReproduction(s, { adoption: null }),
    family: { ...family, children: family.children + 1, childProfiles: [...family.childProfiles, child] } };
  return {
    lifeSystems, stats: { joy: 10 },
    result: t("След срещите и решението на съда " + name.bg + " вече е част от семейството ти.",
      "After the introductions and the court decision, " + name.en + " joins your family."),
  };
}

export function settleReproductionYear(s: GameState): GameState {
  const { pregnancy, adoption, familyEventsFrom } = s.lifeSystems.reproduction;
  let next = pregnancy && !pregnancy.gestation && s.age >= pregnancy.dueAge ? settlePregnancy(s, pregnancy) : s;
  if (adoption) next = settleAdoption(next, adoption);
  if (familyEventsFrom !== null && s.commands.length > familyEventsFrom && next === s && !pregnancy && !adoption) {
    const moment = childFreeMoment(s);
    if (moment) return familyEvent(s, "family-questions", t("Семейни разговори", "Family conversations"), moment);
  }
  return next;
}

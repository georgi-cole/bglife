import type { GameState, Text } from "./engine.ts";
import { clinicChance, familyRoll, menopauseAge, naturalChance, type ConceptionMethod } from "./fertilityModel.ts";
import type { ActivityBranch, ActivityResolution, LifeActivityDefinition, PartnerId } from "./lifeActivities.ts";
import { isChild, personAge, personGender, type PeopleId } from "./peopleIdentity.ts";
import {
  acceptAdoption, adoptionAges, adoptionSpouse, casualParent, conception, contactParent, isExpecting,
  naturalParents, playerParent, updateReproduction, type Parent,
} from "./reproduction.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

const expecting = (s: GameState): Text | null => isExpecting(s)
  ? t("Вече очакваш дете.", "You’re already expecting a child.") : null;
const menopauseFor = (s: GameState, person: Parent) => menopauseAge(s.seed, person.id + "." + person.name.bg);
const treated = (s: GameState) => s.lifeSystems.reproduction.treatmentUntil >= s.age;

type IntimacyChoice = "protected" | "unprotected" | "try";
const modes = {
  protected: { label: t("С предпазване", "Use protection"), description: t("И двамата сте съгласни да използвате предпазни средства.",
    "You both agree to use protection.") },
  unprotected: { label: t("Без предпазване", "Without protection"), description: t("И двамата приемате възможните последици.",
    "You both agree to go ahead without protection.") },
  try: { label: t("Опити за бебе", "Try for a baby"), description: t("Уговаряте се да опитате за дете в рамките на един цикъл.",
    "You agree to try for a baby over one cycle.") },
} satisfies Record<IntimacyChoice, { label: Text; description: Text }>;
const intimacy: ActivityBranch = { id: "intimacy", label: t("Интимност", "Intimacy"),
  description: t("Обсъдете какво искате и с какво се чувствате комфортно.", "Talk about what you want and what you’re comfortable with.") };
const ordinaryNight = t("Прекарахте вечерта заедно.", "You spent the evening together.");

function resolveIntimacy(s: GameState, partner: Parent, mode: IntimacyChoice): ActivityResolution {
  const parents = naturalParents(playerParent(s), partner);
  if (mode === "protected" || !parents || isExpecting(s)) return { result: ordinaryNight, stats: { joy: 3 } };
  const { mother } = parents;
  const stimulation = mother.id === "player" && treated(s);
  const chance = naturalChance(mother.age, menopauseFor(s, mother), mode === "try", stimulation);
  // Each encounter uses an age- and contact-specific draw that survives replay.
  if (familyRoll(s.seed, s.age, partner.id + ".conception") < chance) {
    return { ...conception(s, parents, stimulation ? "stimulated" : "natural"), stats: { joy: 5 } };
  }
  return {
    result: mode === "try" ? t("Този път опитът не доведе до бременност.", "This attempt did not result in a pregnancy.") : ordinaryNight,
    stats: mode === "try" ? {} : { joy: 3 },
  };
}

export function partnerIntimacy(contact: PeopleId): LifeActivityDefinition[] {
  if (isChild(contact) || contact === "rumi" || contact === "niki") return [];
  const modesForPartner: IntimacyChoice[] = ["protected", "unprotected", "try"];
  return modesForPartner.map(mode => ({
    id: "people." + contact + ".intimacy." + mode, category: "family", contact, minAge: 18, branch: intimacy,
    ...modes[mode], result: ordinaryNight,
    visible: s => s.age >= 18 && s.lifeSystems.family.partner === contact && (personAge(s, contact) ?? 0) >= 18
      && (mode !== "try" || personGender(s, contact) !== playerParent(s).gender),
    requires: s => {
      const { family } = s.lifeSystems;
      if (family.bond < (mode === "try" ? 55 : 28)) {
        return t("И двамата трябва да сте готови за тази стъпка. Прекарайте още време заедно.",
          "You both need to feel ready for this step. Spend more time together.");
      }
      return mode === "try" ? expecting(s) : null;
    },
    resolve: s => {
      const outcome = resolveIntimacy(s, contactParent(s, contact), mode);
      const systems = outcome.lifeSystems ?? s.lifeSystems;
      return { ...outcome, lifeSystems: { ...systems, family: { ...systems.family, bond: Math.min(100, systems.family.bond + 3) } } };
    },
  }));
}

const casualActivities: LifeActivityDefinition[] = (["protected", "unprotected"] as const).map(mode => ({
  id: "family.casual." + mode, category: "family", minAge: 18, exclusive: "casual-encounter", cost: 2400,
  label: mode === "protected" ? t("Среща за една вечер · с предпазване", "One-night encounter · use protection")
    : t("Среща за една вечер · без предпазване", "One-night encounter · without protection"),
  description: mode === "protected"
    ? t("Запознай се с друг пълнолетен човек и се уговорете да използвате предпазни средства.", "Meet another adult and agree to use protection.")
    : t("Запознай се с друг пълнолетен човек и се уговорете да продължите без предпазване.", "Meet another adult and agree to go ahead without protection."),
  result: ordinaryNight,
  visible: s => s.age >= 18 && s.lifeSystems.family.stage === "single",
  resolve: s => resolveIntimacy(s, casualParent(s, playerParent(s).gender === "female" ? "male" : "female"), mode),
}));

export const canAccessFertility = (s: GameState): boolean => s.age >= 18 && s.avatar?.presentation !== "male";

function clinicRestriction(s: GameState): Text | null {
  if (s.lifeSystems.medicalIssue === "urgent") return t("Първо потърси помощ за спешния проблем.", "Get help for the urgent health issue first.");
  return expecting(s);
}

function fertilityClearance(s: GameState, donorEggs = false): Text | null {
  const blocked = clinicRestriction(s);
  if (blocked) return blocked;
  if (s.lifeSystems.reproduction.evaluationAt === null) return t("Първо запази консултация.", "Book a fertility consultation first.");
  if (donorEggs) return s.age > 50 || s.stats.health < 40
    ? t("Клиниката не одобрява процедурата за този персонаж.", "The clinic hasn’t cleared this character for the procedure.") : null;
  return s.age >= menopauseFor(s, playerParent(s))
    ? t("Процедурата е недостъпна след настъпила менопауза.", "This option is unavailable after menopause.") : null;
}

type ClinicalMethod = Extract<ConceptionMethod, "iui" | "ivf" | "donor-ivf">;
const procedures: { id: ClinicalMethod; cost: number; label: Text; description: Text }[] = [
  { id: "iui", cost: 37_000, label: t("Инсеминация", "Insemination"),
    description: t("Един опит с партньорски или донорски материал според семейното ти положение.",
      "One attempt with partner or donor sperm, depending on your circumstances.") },
  { id: "ivf", cost: 260_000, label: t("Инвитро със собствени яйцеклетки", "IVF with your own eggs"),
    description: t("Един опит за инвитро с трансфер на ембрион.", "One IVF attempt with an embryo transfer.") },
  { id: "donor-ivf", cost: 390_000, label: t("Инвитро с донорски яйцеклетки", "IVF with donor eggs"),
    description: t("Един опит с донорска яйцеклетка след преценка от клиниката.", "One attempt with a donor egg after clinical review.") },
];
function resolveProcedure(s: GameState, method: ClinicalMethod): ActivityResolution {
  const mother = playerParent(s);
  const partner = s.lifeSystems.family.partner;
  const father = partner && personGender(s, partner) === "male" && (personAge(s, partner) ?? 0) >= 18
    ? contactParent(s, partner) : null;
  const chance = clinicChance(method, s.age, menopauseFor(s, mother), treated(s));
  if (familyRoll(s.seed, s.age, "clinic." + method) < chance) {
    return { ...conception(s, { mother, father }, method), stats: { joy: 6 } };
  }
  return { result: t("Този опит не доведе до бременност. Клиниката предлага да обсъдите следващата стъпка.",
    "This attempt did not result in pregnancy. The clinic suggests a follow-up to discuss the next step."), stats: { joy: -2 } };
}

const fertilityActivities: LifeActivityDefinition[] = [
  {
    id: "fertility.checkup", category: "fertility", minAge: 18, visible: canAccessFertility, cost: 8500,
    label: t("Консултация и изследвания", "Consultation and tests"),
    description: t("Специалист преглежда състоянието ти и обсъжда възможностите за бременност.", "A specialist reviews your health and discusses pregnancy options."),
    result: t("Изследванията са готови. Вече можеш да обсъдиш подходящите процедури с клиниката.",
      "Your tests are complete. You can now discuss suitable procedures with the clinic."),
    requires: s => clinicRestriction(s) ?? (s.lifeSystems.reproduction.evaluationAt !== null
      ? t("Вече имаш проведена консултация.", "You’ve already completed a consultation.") : null),
    update: s => updateReproduction(s, { evaluationAt: s.age }),
  }, {
    id: "fertility.treatment", category: "fertility", minAge: 18, visible: canAccessFertility, cost: 16_000,
    label: t("Лечение на овулацията", "Ovulation treatment"),
    description: t("Проследен курс, който повишава шанса при естествени опити и инсеминация за две игрови години.",
      "A supervised course that boosts natural attempts and insemination for two in-game years."),
    result: t("Започна лечение под наблюдение. То действа тази и следващата година.",
      "You started supervised treatment. It lasts through this year and the next."),
    requires: s => fertilityClearance(s) ?? (treated(s) ? t("Лечението още действа.", "The treatment is still active.") : null),
    update: s => updateReproduction(s, { treatmentUntil: s.age + 1 }),
  },
  ...procedures.map(procedure => ({
    ...procedure, id: "fertility." + procedure.id, category: "fertility" as const, minAge: 18,
    visible: canAccessFertility, exclusive: "fertility-cycle",
    result: t("Приключи процедурата.", "You completed the procedure."),
    requires: (s: GameState) => fertilityClearance(s, procedure.id === "donor-ivf"),
    resolve: (s: GameState) => resolveProcedure(s, procedure.id),
  })),
];

export const canAccessAdoption = (s: GameState): boolean => s.age >= 18;
function adoptionHouseholdChanged(s: GameState): Text | null {
  return s.lifeSystems.reproduction.adoption?.spouse === adoptionSpouse(s) ? null
    : t("Семейното ти положение се промени. Можеш да оттеглиш кандидатурата.", "Your household changed. You can withdraw the application.");
}

const adoptionActions: LifeActivityDefinition[] = [
  {
    id: "adoption.apply", category: "adoption", minAge: 18,
    label: t("Подай заявление", "Submit an application"),
    description: t("Започни процедура в „Социално подпомагане“. Следва социално проучване.", "Apply through Social Assistance. A social assessment follows."),
    result: t("Документите са подадени. Социален работник ще направи проучване през следващата година.",
      "You submitted your documents. A social worker will assess your application next year."),
    visible: s => canAccessAdoption(s) && !s.lifeSystems.reproduction.adoption,
    requires: s => s.career === "student" ? t("За кандидатурата ти е нужен постоянен доход.", "Your application needs a steady income.")
      : adoptionAges(s, adoptionSpouse(s)).length ? null
      : t("Няма подходяща възрастова разлика за процедурата.", "You’re outside the age-gap range for this route."),
    update: s => updateReproduction(s, { adoption: { stage: "review", spouse: adoptionSpouse(s), nextAge: s.age + 1 } }),
  }, {
    id: "adoption.accept", category: "adoption", minAge: 18, time: 0,
    label: t("Продължи с предложението", "Accept the match"),
    description: t("В рамките на годината следват запознанство, срещи и решение на съда.", "Introductions, visits and a court decision follow within the year."),
    result: t("Осиновяването приключи.", "The adoption is complete."),
    visible: s => s.lifeSystems.reproduction.adoption?.stage === "offer",
    requires: adoptionHouseholdChanged,
    resolve: s => {
      const { adoption } = s.lifeSystems.reproduction;
      return adoption?.stage === "offer" ? acceptAdoption(s, adoption)
        : { result: t("Предложението е изтекло.", "The match is no longer available.") };
    },
  }, {
    id: "adoption.decline", category: "adoption", minAge: 18, time: 0,
    label: t("Изчакай друго предложение", "Wait for another match"),
    description: t("Оставаш в регистъра и чакането продължава.", "Stay on the register and continue waiting."),
    result: t("Освободи предложението. Социалните ще се свържат с теб при друга възможност.",
      "You passed on this match. Social services will contact you when another is available."),
    visible: s => s.lifeSystems.reproduction.adoption?.stage === "offer",
    requires: adoptionHouseholdChanged,
    update: s => updateReproduction(s, { adoption: { stage: "waiting", spouse: adoptionSpouse(s), nextAge: s.age + 1 } }),
  }, {
    id: "adoption.withdraw", category: "adoption", minAge: 18, time: 0,
    label: t("Оттегли кандидатурата", "Withdraw the application"),
    description: t("Приключи текущата процедура по осиновяване.", "Close your current adoption application."),
    result: t("Социалният работник отбеляза, че оттегляш кандидатурата.", "The social worker recorded your withdrawal."),
    visible: s => s.lifeSystems.reproduction.adoption !== null,
    update: s => updateReproduction(s, { adoption: null }),
  },
];

export const lifeReproduction = [...casualActivities, ...fertilityActivities, ...adoptionActions];

import type { GameState, Text } from "./engine.ts";
import type { Heir, LifeActivityDefinition } from "./lifeActivities.ts";
import { hasLivingChildren, newChildProfile, type PeopleId } from "./peopleIdentity.ts";

type Systems = GameState["lifeSystems"];
type Family = Systems["family"];
type Pets = Systems["pets"];

const t = (bg: string, en: string): Text => ({ bg, en });

function updateFamily(s: GameState, changes: Partial<Family>): Systems {
  return { ...s.lifeSystems, family: { ...s.lifeSystems.family, ...changes } };
}

function updatePets(s: GameState, changes: Partial<Pets>): Systems {
  return { ...s.lifeSystems, pets: { ...s.lifeSystems.pets, ...changes } };
}

const single = (s: GameState): Text | null => s.lifeSystems.family.stage === "single" ? null
  : t("Тази дейност е достъпна, когато си без връзка.", "Available when you are single.");

function availableMatch(s: GameState, id: PeopleId): Text | null {
  return single(s) ?? (s.deceased[id] ? t("Тази среща вече е недостъпна.", "This person is no longer available.") : null);
}

const withPartner = (s: GameState): Text | null => s.lifeSystems.family.partner ? null
  : t("Първо започни връзка.", "Start a relationship first.");

function stageRequired(stage: Family["stage"], minimumBond: number, prompt: Text) {
  return (s: GameState): Text | null => {
    const family = s.lifeSystems.family;
    if (family.stage !== stage) return prompt;
    if (family.bond < minimumBond) {
      return t("Прекарайте още време заедно, за да се сближите.", "Spend more time together to grow closer.");
    }
    return null;
  };
}

const familyRoom = (s: GameState): Text | null => {
  const { children, expecting } = s.lifeSystems.family;
  if (expecting) return t("Вече очакваш дете.", "You are already expecting a child.");
  if (children >= 2) return t("Вече се грижиш за две деца.", "You are already raising two children.");
  return null;
};

const hasPet = (s: GameState): Text | null => s.lifeSystems.pets.adopted || s.lifeSystems.pets.rescued
  ? null : t("Първо вземи домашен любимец.", "Bring a pet home first.");

const familyActivities: LifeActivityDefinition[] = [
  {
    id: "family.tinder", category: "family", minAge: 18, requires: s => availableMatch(s, "appMatch"),
    label: t("Намери съвпадение в Tinder", "Find a Tinder match"),
    description: t("Разгледай профили и уговори среща, ако интересът е взаимен.", "Browse profiles and arrange a date if the interest is mutual."),
    result: t("След няколко съобщения и едно кафе и двамата искате да се видите пак.", "After a few messages and a coffee, you both want to see each other again."),
    cost: 900, stats: { joy: 5, influence: 1 },
    update: s => updateFamily(s, { partner: "appMatch", stage: "dating", bond: 28 }),
  }, {
    id: "family.dating-service", category: "family", minAge: 18, requires: s => availableMatch(s, "serviceMatch"),
    label: t("Ползвай услуга за запознанства", "Use a dating service"),
    description: t("Уговори първа среща с човек, с когото имаш общи интереси.", "Arrange a first date with someone who shares your interests."),
    result: t("Харесвате едни и същи филми. Излизате с уговорка за още една среща.", "You like the same films. By the end of the date, you have plans to meet again."),
    cost: 3500, stats: { joy: 4, influence: 2 },
    update: s => updateFamily(s, { partner: "serviceMatch", stage: "dating", bond: 37 }),
  }, {
    id: "family.casual", category: "family", minAge: 18, requires: single,
    label: t("Запознанство за една вечер", "Have a one-night stand"),
    description: t("Запознай се с пълнолетен човек, който също търси неангажираща среща.", "Meet another adult who is also looking for something casual."),
    result: t("И на двама ви е приятно. Имате ясна уговорка, че срещата остава еднократна.", "You both enjoy the evening and agree to leave it as a one-time encounter."),
    cost: 2400, stats: { joy: 5 },
  }, {
    id: "family.date-eli", category: "family", minAge: 18,
    requires: s => availableMatch(s, "friend") ?? (s.trust.friend >= 65 ? null
      : t("Ели трябва да ти има повече доверие.", "Eli needs to trust you more.")),
    label: t("Покани Ели на среща", "Ask Eli on a date"),
    description: t("Покани Ели от кръга ти за разходка и кафе.", "Ask Eli, your childhood friend, to go for a walk and coffee."),
    result: t("Ели приема. На раздяла тя е тази, която предлага да се видите отново.", "Eli says yes. When you say goodbye, she is the one who suggests meeting again."),
    cost: 1600, stats: { joy: 7 }, trust: { friend: 5 }, person: "friend",
    update: s => updateFamily(s, { partner: "friend", stage: "dating", bond: Math.min(64, s.trust.friend - 13) }),
  }, {
    id: "family.time-together", category: "family", minAge: 18, requires: withPartner,
    label: t("Прекарайте време заедно", "Spend time together"),
    description: t("Отделете време за среща и разговор.", "Make time for a date and a conversation."),
    result: t("Изключвате телефоните и си казвате какво ви е липсвало напоследък.", "You put your phones away and talk about what you have both been missing lately."),
    cost: 1600, stats: { joy: 6 },
    update: s => updateFamily(s, { bond: Math.min(100, s.lifeSystems.family.bond + 19) }),
  }, {
    id: "family.commit", category: "family", minAge: 18,
    requires: stageRequired("dating", 48, t("Първо започни да се срещаш с някого.", "Start seeing someone first.")),
    label: t("Обвържи се", "Make it official"),
    description: t("Поговорете за това какво искате от връзката си.", "Talk about what you both want from the relationship."),
    result: t("Уговаряте се да сте двойка. Вече правите планове и за следващите месеци.", "You agree to become a couple. You are making plans for the months ahead."),
    stats: { joy: 6, influence: 2 },
    update: s => updateFamily(s, { stage: "committed", bond: Math.min(100, s.lifeSystems.family.bond + 9) }),
  }, {
    id: "family.engage", category: "family", minAge: 18,
    requires: stageRequired("committed", 64, t("Първо направете връзката си официална.", "Make your relationship official first.")),
    label: t("Сгоди се", "Get engaged"),
    description: t("Предложи брак, след като вече сте говорили за общо бъдеще.", "Propose after you have talked about building a future together."),
    result: t("Получаваш отговор „да“. Първо се обаждате на най-близките си.", "The answer is yes. You call the people closest to you first."),
    cost: 17_000, stats: { joy: 9, influence: 2 },
    update: s => updateFamily(s, { stage: "engaged", bond: Math.min(100, s.lifeSystems.family.bond + 7) }),
  }, {
    id: "family.marry", category: "family", minAge: 18,
    requires: stageRequired("engaged", 68, t("Първо се сгодете.", "Get engaged first.")),
    label: t("Вдигни сватба", "Get married"),
    description: t("Съберете близките си и отпразнувайте решението да сте семейство.", "Gather those close to you and celebrate becoming a family."),
    result: t("На личната ви церемония си разменяте обещания пред най-близките си.", "You exchange vows in a personal ceremony with the people closest to you."),
    cost: 90_000, stats: { joy: 10, influence: 5 },
    update: s => updateFamily(s, { stage: "married", bond: Math.min(100, s.lifeSystems.family.bond + 8) }),
  }, {
    id: "family.baby", category: "family", minAge: 18,
    requires: s => {
      const family = s.lifeSystems.family;
      if (!["committed", "engaged", "married"].includes(family.stage)) {
        return t("Първо изградете сериозна връзка.", "Build a committed relationship first.");
      }
      if (family.bond < 64) return t("Поговорете още за общото си бъдеще.", "Spend more time talking about your future together.");
      return familyRoom(s);
    },
    label: t("Планирай бебе", "Try for a baby"),
    description: t("Направете план за бебе. Ако семейството ви се увеличи, ще имате нови годишни разходи.", "Make a plan for a baby. A growing family brings new annual expenses."),
    result: t("Вече очаквате дете. Отделяте пари за първите покупки.", "You are now expecting a child and set money aside for the first purchases."),
    cost: 28_000, stats: { joy: 8, health: -3 },
    update: s => updateFamily(s, { expecting: true }),
  }, {
    id: "family.adopt", category: "family", minAge: 21,
    requires: s => familyRoom(s) ?? (s.career === "student"
      ? t("Трябва да имаш постоянен доход.", "You need a steady income.") : null),
    label: t("Осинови дете", "Adopt a child"),
    description: t("Подготви дома и бюджета за осиновяване. Грижата за дете влиза в годишните разходи.", "Prepare your home and budget for adoption. Childcare becomes an annual expense."),
    result: t("След период на подготовка вкъщи вече има нов член на семейството.", "After months of preparation, you welcome a child into your home."),
    cost: 50_000, stats: { joy: 10, health: -2, influence: 2 },
    update: s => updateFamily(s, {
      children: s.lifeSystems.family.children + 1,
      childProfiles: [...s.lifeSystems.family.childProfiles, newChildProfile(s, s.age, 3, 45)],
    }),
  }, {
    id: "family.break-up", category: "family", minAge: 18, requires: withPartner,
    label: t("Прекрати връзката", "End the relationship"),
    description: t("Кажи, че искаш да се разделите, и прегледай кого си посочила за наследник.", "Say you want to separate and review any inheritance plans involving your partner."),
    result: t("Разделяте се след спокоен разговор. Уговорките за децата, ако имате такива, остават в сила.", "You separate after a calm conversation. Any arrangements for your children stay in place."),
    stats: { joy: -7 },
    update: s => {
      const { partner, formerPartners } = s.lifeSystems.family;
      const systems = updateFamily(s, {
        partner: null, stage: "single", bond: 0,
        formerPartners: partner ? [...formerPartners.filter(entry => entry.id !== partner), { id: partner, endedAt: s.age }] : formerPartners,
      });
      if (!systems.legacy.heirs.includes("partner")) return systems;
      return {
        ...systems,
        legacy: { heirs: systems.legacy.heirs.filter(heir => heir !== "partner"), prepared: false },
      };
    },
  },
];

const petActivities: LifeActivityDefinition[] = [
  {
    id: "pets.adopt", category: "pets", minAge: 18,
    requires: s => {
      if (s.lifeSystems.pets.adopted) return t("Вече осинови любимец от приют.", "You already adopted a pet from a shelter.");
      if (s.housing === "rumi" && s.trust.rumi < 65 && !s.lifeSystems.bank.ownsHome) {
        return t("Първо трябва да се разбереш с Руми за любимец в апартамента.", "First make sure Rumi is comfortable with a pet in the flat.");
      }
      return null;
    },
    label: t("Осинови любимец от приют", "Adopt a shelter pet"),
    description: t("Подготви дома и бюджета си за нов любимец. Грижата за него влиза в годишните разходи.", "Prepare your home and budget for a pet. Its care becomes an annual expense."),
    result: t("Връщаш се от приюта с куче, което още на втората вечер заспива спокойно.", "You come home from the shelter with a dog that sleeps soundly by its second night."),
    cost: 13_000, stats: { joy: 9, influence: 2 },
    update: s => updatePets(s, { adopted: true, bond: Math.min(100, s.lifeSystems.pets.bond + 24) }),
  }, {
    id: "pets.rescue", category: "pets", minAge: 16,
    requires: s => s.lifeSystems.pets.rescued ? t("Вече се грижиш за намерено животно.", "You are already caring for a stray.") : null,
    label: t("Спаси бездомно животно", "Rescue a stray"),
    description: t("Заведи намерената котка на преглед и я прибери, ако няма стопанин.", "Have a stray cat checked and take it home if no owner comes forward."),
    result: t("След прегледа и търсенето на стопанин малката котка остава при теб.", "After a checkup and a search for its owner, the little cat stays with you."),
    cost: 5900, stats: { joy: 6, influence: 4 },
    update: s => updatePets(s, { rescued: true, bond: Math.min(100, s.lifeSystems.pets.bond + 17) }),
  }, {
    id: "pets.play", category: "pets", requires: hasPet,
    label: t("Поиграй с любимеца си", "Play with your pet"),
    description: t("Отдели време за движение и игра.", "Make time to move around and play together."),
    result: t("Половин час по-късно и двамата сте приятно уморени.", "Half an hour later, you are both pleasantly tired."),
    stats: { joy: 5, health: 2 },
    update: s => updatePets(s, { bond: Math.min(100, s.lifeSystems.pets.bond + 13) }),
  }, {
    id: "pets.vet", category: "pets", requires: hasPet,
    label: t("Заведи любимеца на ветеринар", "Take your pet to the vet"),
    description: t("Направи профилактичен преглед на домашния си любимец.", "Book a routine checkup for your pet."),
    result: t("Прибираш се с бележка за следващия преглед. Любимецът ти получава лакомство.", "You come home with a date for the next checkup. Your pet gets a treat."),
    cost: 5400, stats: { joy: 3, brains: 2 },
    update: s => updatePets(s, { bond: Math.min(100, s.lifeSystems.pets.bond + 7) }),
  },
];

type HeirChoice = { id: Heir; add: Text; remove: Text; eligibility?: (s: GameState) => Text | null };

const heirs: HeirChoice[] = [
  { id: "partner", add: t("Посочи партньора си за наследник", "Name your partner as an heir"), remove: t("Премахни партньора си от наследниците", "Remove your partner as an heir"), eligibility: withPartner },
  { id: "children", add: t("Посочи децата си за наследници", "Name your children as heirs"), remove: t("Премахни децата си от наследниците", "Remove your children as heirs"),
    eligibility: s => hasLivingChildren(s) ? null : t("Все още нямаш деца.", "You do not have children yet.") },
  { id: "rumi", add: t("Посочи Руми за наследник", "Name Rumi as an heir"), remove: t("Премахни Руми от наследниците", "Remove Rumi as an heir") },
  { id: "friend", add: t("Посочи Ели за наследник", "Name Eli as an heir"), remove: t("Премахни Ели от наследниците", "Remove Eli as an heir") },
];

const heirActivities: LifeActivityDefinition[] = heirs.flatMap(({ id, add, remove, eligibility }): LifeActivityDefinition[] => [
  {
    id: "legacy.add." + id, category: "legacy", minAge: 18,
    label: add,
    description: t("Добави човек към наследствения си план. Можеш да посочиш няколко наследници.", "Add someone to your estate plan. You can choose several heirs."),
    result: t("Записваш още един наследник. Дяловете в плана се преизчисляват.", "You add an heir. The shares in your plan are recalculated."),
    requires: s => {
      if (s.lifeSystems.legacy.heirs.includes(id)) return t("Вече е в списъка.", "Already in the plan.");
      if ((id === "rumi" || id === "friend") && s.deceased[id]) {
        return t("Този човек вече е починал.", "This person has died.");
      }
      const partnerIsEli = s.lifeSystems.family.partner === "friend";
      if (partnerIsEli && ((id === "partner" && s.lifeSystems.legacy.heirs.includes("friend")) ||
        (id === "friend" && s.lifeSystems.legacy.heirs.includes("partner")))) {
        return t("Ели вече е в списъка.", "Eli is already in the plan.");
      }
      return eligibility?.(s) ?? null;
    },
    update: s => ({ ...s.lifeSystems, legacy: { heirs: [...s.lifeSystems.legacy.heirs, id], prepared: false } }),
  }, {
    id: "legacy.remove." + id, category: "legacy", minAge: 18,
    label: remove,
    description: t("Премахни име от наследствения план и прегледай останалите дялове.", "Remove a name from the estate plan and review the remaining shares."),
    result: t("Променяш списъка и дяловете на останалите наследници.", "You change the list and update each remaining heir’s share."),
    requires: s => s.lifeSystems.legacy.heirs.includes(id) ? null : t("Името отсъства от списъка.", "They are not in the plan."),
    update: s => ({ ...s.lifeSystems, legacy: { heirs: s.lifeSystems.legacy.heirs.filter(heir => heir !== id), prepared: false } }),
  },
]);

export const lifeFamily: LifeActivityDefinition[] = [
  ...petActivities, ...familyActivities, ...heirActivities,
  {
    id: "legacy.prepare", category: "legacy", minAge: 18,
    label: t("Подреди делата си", "Put your affairs in order"),
    description: t("Прегледай спестяванията, дълговете и разпределението между наследниците.", "Review savings, debts and how the estate is divided among your heirs."),
    result: t("Прибираш на едно място списъка с активите, задълженията и наследниците.", "You keep a record of your assets, debts and heirs together."),
    cost: 3500, stats: { brains: 3, joy: 2 },
    requires: s => {
      if (!s.lifeSystems.legacy.heirs.length) return t("Първо посочи поне един наследник.", "Name at least one heir first.");
      return s.lifeSystems.legacy.prepared ? t("Документите ти вече са подредени.", "Your affairs are already in order.") : null;
    },
    update: s => ({ ...s.lifeSystems, legacy: { ...s.lifeSystems.legacy, prepared: true } }),
  },
];

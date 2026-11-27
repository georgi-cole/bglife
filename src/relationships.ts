import type { GameState, Text } from "./engine.ts";
import type { LifeActivityDefinition, LifeSystems } from "./lifeActivities.ts";
import { isChild, personAge, personName, type ContactId } from "./peopleIdentity.ts";
import { familyEvent, familyPlayEnabled } from "./reproduction.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

export type RelationshipProgress = {
  startedAt: number;
  firstKissAt: number | null;
  marriedAt: number | null;
  usesCondom: boolean | null;
};

export function trackRelationship(s: GameState, systems: LifeSystems, action: string): LifeSystems {
  const { family } = systems;
  const previous = s.lifeSystems.family;
  if (!family.partner) return family.relationship ? { ...systems, family: { ...family, relationship: null } } : systems;
  let relationship = family.relationship;
  if (family.partner !== previous.partner || !relationship) {
    relationship = { startedAt: s.age, firstKissAt: null, marriedAt: null, usesCondom: null };
  }
  if (family.stage === "married" && previous.stage !== "married") relationship = { ...relationship, marriedAt: s.age };
  const prefix = "people." + family.partner + ".intimacy.";
  if (action.startsWith(prefix)) {
    relationship = { ...relationship, firstKissAt: relationship.firstKissAt ?? s.age, usesCondom: action === prefix + "protected" };
  }
  if (action === "people." + family.partner + ".first-kiss") {
    relationship = { ...relationship, firstKissAt: s.age };
  }
  return relationship === family.relationship ? systems : { ...systems, family: { ...family, relationship } };
}

const significant = (years: number) => years > 0 && years % 5 === 0;

export function markAnniversaries(s: GameState): GameState {
  const { partner, relationship, stage } = s.lifeSystems.family;
  if (!partner || !relationship || s.deceased[partner]) return s;
  const name = personName(s, partner);
  const together = s.age - relationship.startedAt;
  const married = stage === "married" && relationship.marriedAt !== null ? s.age - relationship.marriedAt : 0;
  let life = s;
  if (significant(together)) {
    life = familyEvent(life, "relationship-anniversary", t(together + " години заедно", together + " years together"),
      t("С " + name.bg + " си припомнихте първата среща. Оказа се, че помните съвсем различни подробности.",
        "You and " + name.en + " remembered your first date. It turns out you each remember completely different details."));
  }
  if (significant(married)) {
    life = familyEvent(life, "wedding-anniversary", t(married + " години от сватбата", married + "-year wedding anniversary"),
      t("С " + name.bg + " отбелязахте годишнината. Сред старите снимки намерихте една, която никой не помнеше.",
        "You and " + name.en + " celebrated your wedding anniversary. You found a photo neither of you remembered."));
  }
  return life;
}

type Gesture = { id: string; bond: number; gain: number; label: Text; description: Text; result: Text; repeatable?: boolean };
const gestures: Gesture[] = [
  { id: "hold-hands", bond: 26, gain: 3, repeatable: true,
    label: t("Хванете се за ръце", "Hold hands"),
    description: t("Направете си кратка разходка заедно.", "Take a short walk together."),
    result: t("Хванахте се за ръце и продължихте да вървите, дори след като стигнахте.", "You held hands and kept walking even after you’d reached your destination.") },
  { id: "first-kiss", bond: 34, gain: 8,
    label: t("Първа целувка", "First kiss"),
    description: t("Ако и двамата го искате, приближете се.", "If you both want to, lean in."),
    result: t("Целунахте се за първи път. После никой не можа да си спомни за какво сте говорили преди това.",
      "You kissed for the first time. Afterwards, neither of you could remember what you’d been talking about.") },
  { id: "kiss", bond: 34, gain: 3, repeatable: true,
    label: t("Целунете се", "Share a kiss"),
    description: t("Откраднете си един тих момент.", "Find a quiet moment together."),
    result: t("За миг забравихте за всички останали планове.", "For a moment you forgot about all your other plans.") },
  { id: "inside-joke", bond: 49, gain: 5,
    label: t("Споделете си вашата шега", "Share your inside joke"),
    description: t("Подхвърли репликата, на която само вие двамата се смеете.", "Bring up the line only the two of you find funny."),
    result: t("Една реплика беше достатъчна. И двамата се разсмяхте още преди края ѝ.", "One line was enough. You were both laughing before you got to the end.") },
  { id: "sunday-ritual", bond: 61, gain: 6,
    label: t("Измислете си неделен ритуал", "Start a Sunday ritual"),
    description: t("Уговорете нещо малко, за което да си пазите време.", "Pick something small you’ll make time for together."),
    result: t("Палачинки, музика и телефони настрани. Решихте да повторите и другата неделя.",
      "Pancakes, music and phones put away. You decided to do it again next Sunday.") },
  { id: "future-together", bond: 72, gain: 6,
    label: t("Поговорете за общото бъдеще", "Talk about your future"),
    description: t("Споделете какво искате за следващите си години.", "Tell each other what you want from the next few years."),
    result: t("Сравнихте мечтите си и избрахте едно нещо, което да започнете още тази година.",
      "You compared your hopes and picked one thing you’d start this year.") },
];

export function relationshipActivities(contact: ContactId): LifeActivityDefinition[] {
  if (isChild(contact) || contact === "rumi" || contact === "niki") return [];
  return gestures.map(gesture => {
    const id = "people." + contact + "." + gesture.id;
    return {
      id, category: "family", contact, minAge: 18,
      label: gesture.label, description: gesture.description, result: gesture.result, repeatable: gesture.repeatable,
      visible: s => {
        const { partner, bond, relationship } = s.lifeSystems.family;
        if (!familyPlayEnabled(s) || s.age < 18 || partner !== contact || (personAge(s, contact) ?? 0) < 18 || bond < gesture.bond) return false;
        const kissed = relationship?.firstKissAt != null;
        return gesture.id === "first-kiss" ? !kissed : gesture.id !== "kiss" || kissed;
      },
      resolve: s => {
        const firstThisYear = !s.usedActions.includes(id);
        const { family } = s.lifeSystems;
        return {
          result: gesture.result, stats: firstThisYear ? { joy: 2 } : {},
          lifeSystems: { ...s.lifeSystems, family: firstThisYear ? { ...family, bond: Math.min(100, family.bond + gesture.gain) } : family },
        };
      },
    };
  });
}

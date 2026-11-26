import type { GameState, Text } from "./engine.ts";
import { familyRoll } from "./fertilityModel.ts";
import { isKnownPerson, personName, type PeopleId } from "./peopleIdentity.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

function firstName(name: Text): Text {
  return t(name.bg.split(" ")[0], name.en.split(" ")[0]);
}

function livingName(s: GameState, id: PeopleId): Text | null {
  return !s.deceased[id] && isKnownPerson(s, id) ? firstName(personName(s, id)) : null;
}

function elder(s: GameState): Text {
  const relatives = s.birthFamily?.relatives.filter(person => person.ageAtBirth >= 18 && !s.deceased[person.id]) ?? [];
  const selected = relatives[Math.floor(familyRoll(s.seed, s.age, "family-elder") * relatives.length)];
  if (selected) return firstName(selected.name);
  return livingName(s, "rumi") ?? t("Една съседка", "An older neighbour");
}

function supporter(s: GameState, other?: Text): Text {
  const friend = livingName(s, "friend");
  if (friend) return friend;
  const relative = s.birthFamily?.relatives.find(person =>
    !s.deceased[person.id] && person.ageAtBirth + s.age >= 18 && firstName(person.name).bg !== other?.bg);
  if (relative) return firstName(relative.name);
  const aunt = livingName(s, "rumi");
  return aunt && aunt.bg !== other?.bg ? aunt : t("Близък човек", "Someone close to you");
}

function line(s: GameState, event: string, choices: readonly Text[]): Text {
  return choices[Math.floor(familyRoll(s.seed, s.age, event) * choices.length)];
}

export function childFreeMoment(s: GameState): Text | null {
  if (s.age < 27 || s.age > 43 || (s.age - 27) % 4 !== 0 || s.lifeSystems.family.children) return null;
  const speaker = elder(s);
  const friend = supporter(s, speaker);
  return line(s, "children-at-lunch", [
    t(speaker.bg + " подхвана: „На твоите години вече гледах дете.“ " + friend.bg + " смени темата и ти доля кафе.",
      speaker.en + " said, “At your age I already had a child to raise.” " + friend.en + " changed the subject and topped up your coffee."),
    t("На именния ден някой пак попита за бебе. " + friend.bg + " каза: „Хайде всеки да си гледа календара.“",
      "Someone asked about a baby again at the name-day party. " + friend.en + " said, “How about we each mind our own calendar?”"),
    t("На масата стана дума за внуци. " + speaker.bg + " каза: „Това си е твой въпрос. Я ми кажи как си.“",
      "Grandchildren came up at the table. " + speaker.en + " said, “That’s your business. Tell me how you are.”"),
    t("На събиране пак чу „Хайде, кога ще те видим с количка?“. По пътя за вкъщи " + friend.bg + " ти писа: „Следващия път аз черпя, темата е палачинки.“",
      "Someone at the gathering asked, “When are we going to see you with a pram?” On the way home, " + friend.en + " texted, “Next time pancakes are on me. That’s the topic.”"),
  ]);
}

export function pregnancyMoment(s: GameState, motherAge: number): Text | null {
  if (motherAge <= 30) return null;
  const friend = supporter(s);
  return line(s, "pregnancy-reaction", [
    t("В семейния чат се появи едно „Е, най-после!“. " + friend.bg + " звънна отделно да попита как може да помогне.",
      "Someone wrote “Finally!” in the family chat. " + friend.en + " called privately to ask what would help."),
    t("На пейката пред блока две съседки започнаха да смятат годините. " + friend.bg + " донесе баница и попита как се чувствате.",
      "Two neighbours on the bench outside started counting the years. " + friend.en + " brought banitsa and asked how you were doing."),
    t(friend.bg + " се зарадва от сърце и предложи да ви намери бебешки дрешки назаем.",
      friend.en + " was delighted and offered to find some baby clothes you could borrow."),
  ]);
}

export function birthMoment(s: GameState, motherAge: number): Text | null {
  if (motherAge <= 40) return null;
  const friend = supporter(s);
  return line(s, "birth-reaction", [
    t("Пред входа се пошушука: „На тия години?“ " + friend.bg + " донесе питка и предложи да поеме разходката в събота.",
      "Someone whispered outside the building, “At that age?” " + friend.en + " brought a loaf and offered to take the baby out on Saturday."),
    t("На погачата една гостенка пак повдигна въпроса за възрастта. " + friend.bg + " я прати да нареже питката и остана да помага.",
      "At the baby’s pogacha gathering, one guest brought up age again. " + friend.en + " sent her to slice the bread and stayed to help."),
    t("Съседка остави тенджера с топла супа пред вратата. „И аз бях на четирийсет, ще се оправим“, каза тя.",
      "A neighbour left a pot of warm soup at the door. “I was forty too. We’ll manage,” she said."),
  ]);
}

export function lossSupport(s: GameState): Text {
  const friend = supporter(s);
  return t(friend.bg + " се обади и предложи да мине, когато ти се говори.",
    friend.en + " called and offered to come over whenever you felt like talking.");
}

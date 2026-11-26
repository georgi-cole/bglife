import type { GameState, Text } from "./engine.ts";
import { familyRoll } from "./fertilityModel.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

const questions = [
  t("На семейния обяд Руми се обади: „На твоите години вече гледах дете.“ Ели смени темата и ти доля кафе.",
    "Over family lunch, Rumi said, “At your age I already had a child to raise.” Eli changed the subject and topped up your coffee."),
  t("На именния ден някой пак попита за бебе. Ели каза: „Хайде всеки да си гледа календара.“",
    "Someone asked about a baby again at the name-day party. Eli said, “How about we each mind our own calendar?”"),
  t("На масата стана дума за внуци. Руми отмести купата със салатата и каза: „Това си е твой въпрос. Я ми кажи как си.“",
    "Grandchildren came up at the table. Rumi passed the salad and said, “That’s your business. Tell me how you are.”"),
  t("Една роднина подхвана „Хайде, кога ще те видим с количка?“. По пътя за вкъщи Ели ти писа: „Следващия път аз черпя, темата е палачинки.“",
    "A relative asked, “When are we going to see you with a pram?” On the way home, Eli texted, “Next time pancakes are on me. That’s the topic.”"),
];

const afterThirty = [
  t("В семейния чат се появи едно „Е, най-после!“. Руми звънна отделно да попита как може да помогне.",
    "Someone wrote “Finally!” in the family chat. Rumi called privately to ask what would help."),
  t("На пейката пред блока две съседки започнаха да смятат годините. Ели донесе баница и попита как се чувствате.",
    "Two neighbours on the bench outside started counting the years. Eli brought banitsa and asked how you were doing."),
  t("Руми се зарадва от сърце. Вече има списък с бебешки дрешки, които може да ви даде назаем.",
    "Rumi was delighted. She already has a list of baby clothes she can lend you."),
];

const afterForty = [
  t("Пред входа се пошушука: „На тия години?“ Руми донесе питка и се уговорихте да поеме разходката в събота.",
    "Someone whispered outside the building, “At that age?” Rumi brought a loaf and offered to take the baby out on Saturday."),
  t("На погачата една гостенка пак повдигна въпроса за възрастта. Ели я прати да нареже питката и остана да помага.",
    "At the baby’s pogacha gathering, one guest brought up age again. Eli sent her to slice the bread and stayed to help."),
  t("Съседка остави тенджера с топла супа пред вратата. „И аз бях на четирийсет, ще се оправим“, каза тя.",
    "A neighbour left a pot of warm soup at the door. “I was forty too. We’ll manage,” she said."),
];

function line(s: GameState, event: string, choices: readonly Text[]): Text {
  return choices[Math.floor(familyRoll(s.seed, s.age, event) * choices.length)];
}

export function childFreeMoment(s: GameState): Text | null {
  if (s.age < 27 || s.age > 43 || (s.age - 27) % 4 !== 0 || s.lifeSystems.family.children) return null;
  return line(s, "children-at-lunch", questions);
}

export function pregnancyMoment(s: GameState, motherAge: number): Text | null {
  return motherAge > 30 ? line(s, "pregnancy-reaction", afterThirty) : null;
}

export function birthMoment(s: GameState, motherAge: number): Text | null {
  return motherAge > 40 ? line(s, "birth-reaction", afterForty) : null;
}

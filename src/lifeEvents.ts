import { cities, inCityBg } from "./cities.ts";
import { careAtBirth } from "./birthFamily.ts";
import { cityCulture, voices } from "./cityCulture.ts";
import { cityPaths } from "./cityPaths.ts";
import type { GameState, Memory, Text } from "./engine.ts";
import { lifeDraw } from "./mortality.ts";

const t = (bg: string, en: string): Text => ({ bg, en });
type Moment = { id: string; title: Text; text: Text };

const milestones: Readonly<Partial<Record<number, Moment>>> = {
  1: { id: "first-birthday", title: t("Първи рожден ден", "First birthday"), text: t(
    "Семейството сложи първата свещичка на тортата. Цялата маса се събра за снимка.",
    "The family put the first candle on the cake. Everyone squeezed into the photo.") },
  4: { id: "preschool", title: t("Предучилищна група", "Preschool"), text: t(
    "Започна предучилищната подготовка. В гардеробчето вече има място с твоето име.",
    "Preschool started. There is a cubby with your name on it.") },
  7: { id: "first-grade", title: t("Първи учебен ден", "First day of school"), text: t(
    "През септември влезе в първи клас с цветя и раница, която изглеждаше огромна.",
    "In September you started first grade with flowers and a backpack that looked enormous.") },
  14: { id: "after-seventh", title: t("След седми клас", "After seventh grade"), text: t(
    "Мина през външното оценяване. Сега разговорите вкъщи са за гимназия и какво ти се учи.",
    "You sat the national assessments. At home, everyone is talking about high school and what you want to study.") },
  18: { id: "adulthood", title: t("Пълнолетие", "Adulthood"), text: t(
    "Вече можеш да решаваш самостоятелно къде да живееш и какво да правиш след училище.",
    "You can now decide where to live and what to do after school.") },
  27: { id: "adult-years", title: t("Живот след първата глава", "Life after the first chapter"), text: t(
    "Спомените от ученическите и първите работни години остават в дневника. Оттук нататък самите ти решения движат историята.",
    "School and your first working years stay in the journal. From here your choices carry the story forward.") },
  65: { id: "later-years", title: t("На 65", "Turning 65"), text: t(
    "Разговорите с връстниците вече често опират до стаж, пенсия и плановете за следващите години.",
    "Conversations with people your age now often turn to working years, retirement and plans for what comes next.") },
  100: { id: "centenary", title: t("Един век живот", "A century of life"), text: t(
    "Сто години събраха цял куп снимки, писма и истории. Днес прелисти няколко от тях.",
    "A hundred years have filled boxes with photos, letters and stories. Today you revisited some of them.") },
  131: { id: "131st-birthday", title: t("131-ви рожден ден", "131st birthday"), text: t(
    "Дневникът ти стигна до своя сто тридесет и първи рожден ден.",
    "Your journal reached its one hundred and thirty-first birthday.") },
};

const childhood: Moment[] = [
  { id: "martenitsa", title: t("Баба Марта", "Baba Marta"), text: t(
    "Вързаха ти мартеница и цяла седмица оглеждаше дърветата за първите цветове.",
    "You got a red and white martenitsa and spent all week looking for the first blossoms.") },
  { id: "reader", title: t("Първа книжка", "A first book"), text: t(
    "В читалището ти дадоха книжка за вкъщи. Рисунките бързо станаха по-интересни от думите.",
    "The community library sent you home with a book. The drawings soon became more interesting than the words.") },
  { id: "surva", title: t("Сурва", "Surva"), text: t(
    "Украсихте дрянова клонка и си припомнихте наричането за Нова година.",
    "You decorated a dogwood branch and practised the traditional New Year's blessing.") },
];

const schoolYears: Moment[] = [
  { id: "may-24", title: t("24 май", "24 May"), text: t(
    "Класът се събра за училищното шествие. Познаваше почти всички лица по тротоара.",
    "Your class joined the school parade. You recognized nearly every face along the pavement.") },
  { id: "school-project", title: t("Училищен проект", "School project"), text: t(
    "За проекта разпита близките си за квартала. От историите им научи неща, които липсват в учебника.",
    "You asked relatives about the neighbourhood for a school project. Their stories taught you things the textbook left out.") },
];

function entry(s: GameState, moment: Moment): Memory {
  return { ...moment, age: s.age, city: s.city, kind: "event", witnesses: [], cashDelta: 0 };
}

export function birthEntry(s: GameState): Memory {
  const town = cities[s.city].name;
  let text = t("Роди се " + inCityBg(s.city) + ".", "You were born in " + town.en + ".");
  if (s.birthFamily) {
    const care = careAtBirth(s.birthFamily);
    text = t(text.bg + " " + care.bg, text.en + " " + care.en);
    const siblings = s.birthFamily.relatives.filter(relative => relative.role === "sibling");
    if (siblings.length === 1) {
      const brother = siblings[0].gender === "male";
      text.bg += brother ? " Имаш по-голям брат." : " Имаш по-голяма сестра.";
      text.en += brother ? " You have an older brother." : " You have an older sister.";
    } else if (siblings.length > 1) {
      text.bg += " В семейството вече има " + siblings.length + " по-големи деца.";
      text.en += " There are already " + siblings.length + " older children in your family.";
    }
    if (s.profile?.wealthy) {
      text.bg += " На твое име е оставено наследство.";
      text.en += " An inheritance has been set aside in your name.";
    }
  }
  return entry(s, { id: "birth", title: t("Раждане", "Birth"), text });
}

function cityMoment(s: GameState): Memory | null {
  if (!s.profile || s.age < 4 || s.sceneId || lifeDraw(s.seed,s.age,0xba3752de) >= (s.age < 18 ? .34 : .19)) return null;
  const city = cityCulture[s.city];
  const voice = voices[city.voice].phrase;
  const place = city.places[Math.floor(lifeDraw(s.seed,s.age,0xca328ea7) * city.places.length)];
  const prefix = "city-" + s.city + "-";
  const options: Moment[] = [
    { id: prefix + "festival", title: city.festival, text: t("Забави крачка и остана да гледаш. Срещна хора от квартала.",
      "You slowed down to watch for a while and bumped into people from the neighbourhood.") },
    { id: prefix + "food", title: t("Местна трапеза","Around the table"),
      text: t("На масата имаше " + city.food.bg + ". Поиска още, преди разговорът да свърши.",
        "There was " + city.food.en + " on the table. You asked for seconds before the conversation ended.") },
    { id: prefix + "place", title: place,
      text: t("Видя това място с нови очи. Излезе от обичайния си маршрут и си хареса къде да се върнеш.",
        "You saw the place with fresh eyes. Leaving your usual route gave you somewhere to come back to.") },
    { id: prefix + "voice", title: t("Думи от квартала","Words from the neighbourhood"),
      text: t("Някой край теб подхвана разговор. „" + voice.bg + "“", "Someone nearby struck up a conversation. “" + voice.en + "”") },
    { id: prefix + "habit", title: t("Почивен ден","A day off"),
      text: t(city.habit.bg + ". Остана ти време за разговори по пътя.", city.habit.en + ". There was time to talk along the way.") },
  ];
  const available = options.filter(moment => !s.history.some(event => event.id === moment.id));
  const chosen = available[Math.floor(lifeDraw(s.seed,s.age,0xbdee6e51) * available.length)];
  return chosen ? entry(s,chosen) : null;
}

export function yearlyMoment(s: GameState, cityEntry?: Memory | null): Memory | null {
  if (!s.path && s.profile && s.enrollment?.graduationAge === s.age && s.age >= 20) {
    const school = cityPaths[s.enrollment.city].schools[s.enrollment.index];
    return entry(s, { id: "local-graduation", title: t("Завършване","Graduation"),
      text: t("Завърши обучението си в " + school.name.bg + ".", "You graduated from " + school.name.en + ".") });
  }
  if (!s.path && s.profile && s.age === 7) {
    const school = cityPaths[s.city].schools[0];
    return entry(s, { id:"first-grade", title:t("Първи учебен ден","First day of school"),
      text:t("През септември те посрещнаха в " + school.name.bg + ".", "In September, " + school.name.en + " welcomed you into first grade.") });
  }
  const milestone = milestones[s.age];
  if (milestone && (s.age !== 27 || s.storyRoute) && (!s.path || s.age !== 14)) return entry(s, milestone);
  const local = cityEntry === undefined ? cityMoment(s) : cityEntry;
  if (local) return local;

  const roll = lifeDraw(s.seed, s.age, 0x6c8e9cf5);
  if (s.age < 3 || roll >= (s.age < 16 ? 0.46 : 0.23)) return null;
  if (s.age < 16) {
    const pool = s.age >= 7 ? schoolYears : childhood;
    return entry(s, pool[Math.floor(lifeDraw(s.seed, s.age, 0x72b5fac1) * pool.length)]);
  }
  if (s.age <= 26 && s.sceneId) return null;
  const { landmark } = cities[s.city];
  const moment = s.age >= 80
    ? {
      id: "old-photographs", title: t("Старите снимки", "Old photographs"),
      text: t("Докато подреждаше снимките, попадна на кадър от " + landmark.bg + ". Спомни си кой стоеше зад фотоапарата.",
        "While sorting through your photos, you found one from " + landmark.en + ". You remembered who was behind the camera."),
    }
    : {
      id: "local-walk", title: t("Свободен ден в града", "A day in town"),
      text: t("Излезе без план. Разходката те отведе до едно познато място. " + landmark.bg + ".",
        "You went out without a plan and wound up somewhere familiar. " + landmark.en + "."),
    };
  if (s.history.slice(-8).some(event => event.id === moment.id && event.city === s.city)) return null;
  return entry(s, moment);
}

export function retirementEligible(s: GameState): boolean {
  const fullService = s.avatar?.presentation === "male" ? 40 : 37;
  // Age-turn approximation of NSSI's ordinary and minimum-service routes.
  return (s.age >= 65 && s.serviceYears >= fullService) || (s.age >= 67 && s.serviceYears >= 15);
}

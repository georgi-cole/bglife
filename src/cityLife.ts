import { cities, type City } from "./cities.ts";
import { cityCulture } from "./cityCulture.ts";
import { cityLifeData } from "./cityLifeData/index.ts";
import { cityWeatherLabels, climates, t, type CityChoice, type CityEvent, type CityEventRoll, type CityOccasion, type CityWeather, type Month } from "./cityLifeModel.ts";
import type { GameState, Memory, Text } from "./engine.ts";
import { lifeVignettes } from "./lifeVignettes.ts";
import { lifeDraw } from "./mortality.ts";
import { hasPendingStoryDecision } from "./story.ts";

const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const monthFormats = {
  bg: new Intl.DateTimeFormat("bg", { month: "long", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }),
};
const dayFormats = {
  bg: new Intl.DateTimeFormat("bg", { day: "numeric", month: "long", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en", { day: "numeric", month: "long", timeZone: "UTC" }),
};

function monthName(month: Month, language: keyof Text, day?: number) {
  const formats = day === undefined ? monthFormats : dayFormats;
  return formats[language].format(new Date(Date.UTC(2000, month - 1, day ?? 1)));
}

export function cityOccasion(city: City): CityOccasion & { title: Text } {
  const occasion = cityLifeData[city].occasion;
  return { ...occasion, title: occasion.title ?? cityCulture[city].festival };
}

export function occasionDate({ months, day }: Pick<CityOccasion, "months" | "day">, language: keyof Text) {
  return months.map(month => monthName(month, language, day)).join(" / ");
}

export function cityWeatherDate(roll: CityEventRoll, language: keyof Text) {
  return monthName(roll.month, language, roll.day) + " · " + cityWeatherLabels[roll.weather][language].toLocaleLowerCase(language);
}

export function cityPlaces(city: City): readonly Text[] {
  return [cities[city].landmark, ...cityCulture[city].places, ...cityLifeData[city].places];
}

export function cityEventKey(city: City, id: string) {
  return "city-life." + city + "." + id;
}

function buildCityEvents(city: City): readonly CityEvent[] {
  const data = cityLifeData[city];
  const culture = cityCulture[city];
  const [meetingPlace, outdoorPlace] = data.places;
  const occasion = cityOccasion(city);
  const { opening, continuation } = data.story;
  const from = data.story.from ?? 13;
  const through = data.story.through ?? (opening.pay || continuation.pay ? 65 : 22);
  return [
    {
      id: "childhood", ages: [4, 12], months: [3, 4, 5, 6, 9, 10],
      title: meetingPlace, body: data.childhood.body,
      choices: [
        { id: "explore", label: t("Разгледай с приятел", "Explore with a friend"),
          outcome: data.childhood.line, stats: { joy: 3 }, withFriend: true },
        { id: "remember", label: t("Запази нещо за спомен", "Keep a souvenir"),
          outcome: t("Направи си малка рисунка. След време по нея още ще познаваш мястото.",
            "You made a little drawing. Years later you’ll still recognize the place from it."), stats: { brains: 2 } },
      ],
    },
    {
      id: "occasion", ages: [8, 131], months: occasion.months, day: occasion.day, repeatAfter: 8,
      title: occasion.title,
      body: occasion.body, source: occasion.source,
      choices: [
        { id: "help", label: t("Помогни с подготовката", "Help with preparations"),
          outcome: t("Помогна на организаторите и остана за разговор след края. Някой ти даде идея какво да направите догодина.",
            "You helped the organizers and stayed to chat afterwards. Someone had an idea for next year."), stats: { influence: 3, brains: 1 } },
        { id: "attend", label: t("Идете заедно", "Go together"),
          outcome: t("Намерихте къде да седнете. Покрай празника си разказахте и какво се е променило в живота ви.",
            "You found somewhere to sit. The celebration gave you time to catch up on what had changed in your lives."), stats: { joy: 4 }, withFriend: true },
      ],
    },
    {
      id: "story", ages: [from, through], months: opening.months, title: opening.title, body: opening.body,
      choices: [
        { id: "join", label: opening.task, outcome: opening.outcome, stats: { brains: 3, influence: 1 }, cash: opening.pay },
        { id: "look", label: t("Виж как започват", "See how they get started"),
          outcome: t("Остана да наблюдаваш и си тръгна с една идея, която можеш да пробваш самостоятелно.",
            "You stayed to watch and left with an idea you could try on your own."), stats: { brains: 1, joy: 1 } },
      ],
    },
    {
      id: "continuation", ages: [from + 1, 110], months: continuation.months, title: continuation.title, body: continuation.body,
      after: { action: "story.join", years: 1 },
      choices: [
        { id: "finish", label: continuation.task, outcome: continuation.outcome,
          stats: { brains: 2, influence: 3 }, cash: continuation.pay },
        { id: "share", label: t("Предай наученото", "Pass on what you learned"),
          outcome: t("Предложи на друг човек да заеме мястото ти. Обясни му какво ти се искаше да знаеш при първата среща.",
            "You offered someone else your place and told them what you wished you knew at your first meeting."), stats: { joy: 2, influence: 2 } },
      ],
    },
    {
      id: "community", ages: [18, 131], title: data.community.title, body: data.community.body,
      choices: [
        { id: "proposal", label: t("Напиши предложение", "Submit a suggestion"),
          outcome: t("Добави конкретно предложение към обсъждането. Двама души от квартала поискаха да го внесете заедно.",
            "You put a practical suggestion into the discussion. Two neighbours offered to submit it with you."), stats: { influence: 3 } },
        { id: "research", label: t("Попитай засегнатите", "Talk to the people affected"),
          outcome: t("Записа две различни мнения. След разговора вече знаеше защо решението е трудно.",
            "You noted two different opinions. By the end of the conversation you understood why the decision was difficult."), stats: { brains: 2, joy: 1 } },
      ],
    },
    {
      id: "day-trip", ages: [8, 131], repeatAfter: 5, title: outdoorPlace,
      body: t(`Планирате да излезете. Вариантите са разходка до „${outdoorPlace.bg}“ и среща край „${meetingPlace.bg}“.`,
        `You’re planning to go out. You can take a walk to ${outdoorPlace.en} or meet near ${meetingPlace.en}.`),
      choices: [
        { id: "walk", label: t("Направи разходката", "Take the walk"),
          outcome: t("Остана навън по-дълго от планираното. Набеляза къде да се върнеш друг път.",
            "You stayed out longer than planned and found a spot you’d like to return to."), stats: { joy: 3, health: 1 } },
        { id: "meet", label: t("Срещнете се в града", "Meet in town"),
          outcome: t(`Видяхте се и се заговорихте покрай нещо познато на масата — ${culture.food.bg}.`,
            `You caught up over something familiar to eat: ${culture.food.en}.`), stats: { joy: 2 }, withFriend: true },
      ],
    },
    ...(data.events ?? []),
  ];
}

export function cityEvents(city: City): readonly CityEvent[] {
  return catalog[city];
}
const catalog = Object.fromEntries((Object.keys(cityLifeData) as City[]).map(city => [city, buildCityEvents(city)])) as Record<City, readonly CityEvent[]>;

export function getCityEvent(city: City, id: string) {
  return cityEvents(city).find(event => event.id === id) ?? lifeVignettes.find(event => event.id === id);
}

function eligibleEvent(s: GameState, event: CityEvent) {
  const [from, through] = event.ages;
  if (event.retired || s.age < from || s.age > through || event.when?.(s) === false) return false;
  if (event.id === "story") {
    const window = Math.min(4, through - from + 1);
    const openingAge = from + Math.floor(lifeDraw(s.seed, from, 0x4a107bde) * window);
    if (s.age < openingAge) return false;
  }
  const id = cityEventKey(s.city, event.id);
  const repeatAfter = event.repeatAfter ?? Infinity;
  if (s.history.some(row => s.age - row.age < repeatAfter
    && (event.nationwide ? row.cityEvent?.id === event.id : row.id === id))) return false;
  const after = event.after;
  return !after || s.history.some(row => row.id === cityEventKey(s.city, after.action) && s.age - row.age >= after.years);
}

function weatherIn(s: GameState, month: Month): CityWeather {
  const climate = climates[cityLifeData[s.city].climate];
  const draw = lifeDraw(s.seed, s.age, 0x31c828ac);
  if ([12, 1, 2].includes(month) && draw < climate.snow) return "snow";
  if ([6, 7, 8].includes(month) && draw < climate.heat) return "heat";
  return draw >= 1 - climate.rain ? "rain" : "clear";
}

export function rollCityEvent(s: GameState): CityEventRoll | null {
  const pool = [...cityEvents(s.city), ...lifeVignettes].filter(event => eligibleEvent(s, event));
  const milestones = pool.filter(event => event.milestone);
  const followup = pool.find(event => event.after);
  const story = pool.find(event => event.id === "story");
  const recent = s.history.some(row => row.age === s.age - 1 && row.cityEvent);
  const chance = s.age <= 17 ? 1 : recent ? .38 : .82;
  const draw = lifeDraw(s.seed, s.age, 0x1ee7c284);
  const candidates = milestones.length ? milestones : pool;
  const pick = candidates[Math.floor(lifeDraw(s.seed, s.age, 0xdc6c7715) * candidates.length)];
  const event = milestones.length ? pick : followup ?? story ?? (draw < chance ? pick : undefined);
  if (!event) return null;

  const possible = event.months ?? months;
  const month = possible[Math.floor(lifeDraw(s.seed, s.age, 0x6b7c3c7d) * possible.length)];
  return { id: event.id, month, weather: weatherIn(s, month), ...(event.day !== undefined && { day: event.day }) };
}

export function parseCityEvent(value: unknown, city: City): CityEventRoll | null {
  if (typeof value !== "object" || value === null) return null;
  const { id, month, day, weather } = value as Record<string, unknown>;
  if (typeof id !== "string" || !getCityEvent(city, id) || typeof month !== "number" || !months.includes(month as Month)
    || typeof weather !== "string" || !Object.hasOwn(cityWeatherLabels, weather)) return null;
  if (day !== undefined && (typeof day !== "number" || !Number.isInteger(day)
    || day < 1 || day > new Date(Date.UTC(2000, month, 0)).getUTCDate())) return null;
  return { id, month: month as Month, weather: weather as CityWeather, ...(day !== undefined && { day }) };
}

export function cityEventMemory(s: GameState, roll: CityEventRoll): Memory {
  const event = getCityEvent(s.city, roll.id);
  if (!event) throw new Error("Unknown local event " + roll.id);
  const wetOuting = event.id === "day-trip" && (roll.weather === "rain" || roll.weather === "snow");
  const text = wetOuting
    ? t(`Времето обърка плана за „${event.title.bg}“. Можете да съкратите маршрута или да се видите на закрито.`,
        `The weather upset the plan for ${event.title.en}. You can shorten the route or meet indoors.`)
    : event.body;
  return { id: cityEventKey(s.city, event.id), age: s.age, city: s.city, kind: "event",
    title: event.title, text, cashDelta: 0, witnesses: [], cityEvent: roll };
}

export function openCityEvent(s: GameState) {
  if (s.finished || s.lifeSystems.reproduction.naming || s.lifeSystems.reproduction.notice
    || hasPendingStoryDecision(s)) return null;
  const entry = s.history.find(row => row.age === s.age && row.city === s.city && row.cityEvent);
  if (!entry?.cityEvent || s.skippedDecisions.includes(entry.id) || s.usedActions.some(id => id.startsWith(entry.id + "."))) return null;
  const event = getCityEvent(s.city, entry.cityEvent.id);
  return event?.choices.length ? { entry, event, roll: entry.cityEvent } : null;
}

export function cityChoices(event: CityEvent, roll: CityEventRoll) {
  if (event.id !== "day-trip" || roll.weather === "clear") return event.choices;
  return event.choices.map(choice => {
    if (choice.id !== "walk") return roll.weather === "heat" ? choice
      : { ...choice, label: t("Срещнете се на закрито", "Meet indoors") };
    if (roll.weather === "heat") return { ...choice,
      label: t("Излез привечер", "Go in the evening"),
      outcome: t("Изчака да се разхлади. Когато излезе, по алеята още имаше хора.",
        "You waited for it to cool down. There were still people on the path when you went out.") };
    const shortened: CityChoice = { ...choice, label: t("Съкрати маршрута", "Take a shorter route"),
      outcome: t("Стигна само до близкия участък. Остави останалата част за ден с по-добро време.",
        "You made it as far as the nearest stretch and saved the rest for better weather."), stats: { joy: 1 } };
    return shortened;
  });
}

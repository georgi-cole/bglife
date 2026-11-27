import type { GameState, Text } from "./engine.ts";
import type { StatDelta } from "./lifeStats.ts";

export const t = (bg: string, en: string): Text => ({ bg, en });
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const cityWeatherLabels = {
  clear: t("Ясно", "Clear"),
  rain: t("Дъжд", "Rain"),
  snow: t("Сняг", "Snow"),
  heat: t("Жега", "Heat"),
};

export type CityWeather = keyof typeof cityWeatherLabels;

// These are gameplay weights informed by the climate reference, not station estimates.
export const climates = {
  basin: { label: t("Котловина", "Basin"), snow: .40, rain: .28, heat: .25 },
  coast: { label: t("Черноморско крайбрежие", "Black Sea coast"), snow: .12, rain: .27, heat: .30 },
  danube: { label: t("Дунавско крайбрежие", "Danube riverside"), snow: .30, rain: .26, heat: .46 },
  mountain: { label: t("Планински климат", "Mountain climate"), snow: .62, rain: .38, heat: .12 },
  foothills: { label: t("Предпланина", "Foothills"), snow: .32, rain: .33, heat: .30 },
  plain: { label: t("Равнина", "Plain"), snow: .20, rain: .24, heat: .46 },
  plateau: { label: t("Плато", "Plateau"), snow: .34, rain: .25, heat: .32 },
};

export const cityLifeSources = {
  population: { date: "2025-12-31", url: "https://www.nsi.bg/statistical-data/206/648" },
  speech: "https://ibl.bas.bg/nova_dialektna_karta/",
  climate: "https://meteo.bg/meteo7/en/node/776",
};

export type CityOccasion = {
  title?: Text;
  months: readonly [Month, ...Month[]];
  day?: number;
  body: Text;
  source: string;
};

export type CityChoice = {
  id: string;
  label: Text;
  outcome: Text;
  stats: StatDelta;
  cash?: number;
  withFriend?: boolean;
};

export type CityEvent = {
  id: string;
  title: Text;
  body: Text;
  ages: readonly [number, number];
  months?: readonly [Month, ...Month[]];
  day?: number;
  repeatAfter?: number;
  after?: { action: string; years: number };
  source?: string;
  retired?: boolean;
  nationwide?: boolean;
  milestone?: boolean;
  when?: (state: GameState) => boolean;
  choices: readonly CityChoice[];
};

type StoryStep = {
  title: Text;
  body: Text;
  task: Text;
  outcome: Text;
  pay?: number;
  months?: readonly [Month, ...Month[]];
};

export type CityLifeProfile = {
  population: number;
  climate: keyof typeof climates;
  places: readonly [Text, Text, ...Text[]];
  childhood: { body: Text; line: Text };
  occasion: CityOccasion;
  story: { from?: number; through?: number; opening: StoryStep; continuation: StoryStep };
  community: { title: Text; body: Text };
  events?: readonly CityEvent[];
};

export type CityEventRoll = { id: string; month: Month; day?: number; weather: CityWeather };

import { cityWeatherDate } from "./cityLife.ts";
import { getChoices, getCityOpportunity, getScene, hasPendingStoryDecision, type GameState, type Option, type Text } from "./engine.ts";

export type JournalDecision = {
  id: string;
  key: string;
  kind: "story" | "city";
  title: Text;
  body: Text;
  date?: Text;
  options: { option: Option; blocked: boolean }[];
};

export function storyDecision(life: GameState): JournalDecision | null {
  if (!hasPendingStoryDecision(life) || life.lifeSystems.reproduction.naming) return null;
  const scene = getScene(life);
  return scene && {
    id: scene.id, key: [life.seed, life.age, scene.id].join("-"),
    kind: "story", title: scene.title, body: scene.body,
    options: getChoices(life).map(option => ({ option, blocked: false })),
  };
}

export function cityDecision(life: GameState): JournalDecision | null {
  const opportunity = getCityOpportunity(life);
  if (!opportunity) return null;
  const { entry, options } = opportunity;
  const roll = entry.cityEvent;
  return {
    id: entry.id, key: [life.seed, life.age, entry.id].join("-"),
    kind: "city", title: entry.title, body: entry.text, options,
    date: roll ? { bg: cityWeatherDate(roll, "bg"), en: cityWeatherDate(roll, "en") } : undefined,
  };
}

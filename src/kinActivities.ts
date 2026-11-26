import { getRelative, isKin, type KinId } from "./birthFamily.ts";
import { cities } from "./cities.ts";
import { cityCulture, voices } from "./cityCulture.ts";
import type { GameState, Text } from "./engine.ts";
import type { LifeActivityDefinition } from "./lifeActivities.ts";
import { lifeDraw } from "./mortality.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

export function kinActivities(s: GameState, id: KinId): LifeActivityDefinition[] {
  const relative = getRelative(s,id);
  if (!relative || s.deceased[id] || s.age < 4) return [];
  const culture = cityCulture[s.birthCity];
  const voice = voices[culture.voice].phrase;
  const localSpeech = lifeDraw(s.seed,s.age,0x84de59a3) < 0.4;
  const visit = relative.household && s.age < 18
    ? t("Прекарайте време заедно", "Spend time together") : t("Чуйте се", "Catch up");
  const activities: LifeActivityDefinition[] = [
    {
      id: "people." + id + ".family-time", category: "family", contact: id, minAge: 4,
      label: visit, description: t("Отдели време за разговор или обща игра.", "Make time to talk or play a game together."),
      result: t("Разменихте си новини и останахте по-дълго, отколкото очакваше.",
        "You caught up and spent longer together than you expected."),
      stats: { joy: 4 },
      update: life => ({ ...life.lifeSystems, kinBonds: { ...life.lifeSystems.kinBonds,
        [id]: Math.min(100, (life.lifeSystems.kinBonds?.[id] ?? relative.bond) + 7) } }),
    },
    {
      id: "people." + id + ".family-story", category: "family", contact: id, minAge: 7,
      label: t("Попитай за семейна история", "Ask for a family story"),
      description: t("Разбери как е изглеждал градът, когато роднините ти са били малки.",
        "Find out what the town was like when your relatives were young."),
      result: t("Разговорът ви се върна към " + cities[s.birthCity].name.bg +
          ". " + (localSpeech ? "Чу позната реплика: „" + voice.bg + "“" : "Запомни нещо, което искаш да разкажеш и на други."),
        "The conversation took you back to " + cities[s.birthCity].name.en +
          ". " + (localSpeech ? "You heard a familiar line: “" + voice.en + "”" : "You found a story you want to tell someone else.")),
      stats: { joy: 2, brains: 2 },
      update: life => ({ ...life.lifeSystems, kinBonds: { ...life.lifeSystems.kinBonds,
        [id]: Math.min(100, (life.lifeSystems.kinBonds?.[id] ?? relative.bond) + 4) } }),
    },
  ];
  return activities.filter(activity => s.age >= (activity.minAge ?? 0));
}

export function kinActivityById(s: GameState, id: string): LifeActivityDefinition | undefined {
  if (!id.startsWith("people.kin-")) return undefined;
  const [, contact] = id.split(".");
  return isKin(contact) ? kinActivities(s, contact).find(activity => activity.id === id) : undefined;
}

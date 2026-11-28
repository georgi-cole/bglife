import { getRelative, isKin, type KinId } from "./birthFamily.ts";
import { cities } from "./cities.ts";
import { cityCulture, voices } from "./cityCulture.ts";
import type { GameState, Text } from "./engine.ts";
import type { LifeActivityDefinition, LifeSystems } from "./lifeActivities.ts";
import { lifeDraw } from "./mortality.ts";
import { personRelationship } from "./peopleIdentity.ts";

export function changeKinBond(s: GameState, id: KinId, amount: number): LifeSystems {
  const bond = personRelationship(s, id);
  if (bond === null) return s.lifeSystems;
  return { ...s.lifeSystems, kinBonds: { ...s.lifeSystems.kinBonds, [id]: Math.max(0, Math.min(100, bond + amount)) } };
}

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
      id: "people." + id + ".family-time", category: "family", contact: id, minAge: 4, sameCity: "new-actions",
      label: visit, description: t("Отдели време за разговор или обща игра.", "Make time to talk or play a game together."),
      result: t("Разменихте си новини и останахте по-дълго, отколкото очакваше.",
        "You caught up and spent longer together than you expected."),
      stats: { joy: 4 },
      update: life => changeKinBond(life, id, 7),
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
      update: life => changeKinBond(life, id, 4),
    },
  ];
  const close = relative.household || relative.role === "mother" || relative.role === "father" || relative.role === "sibling";
  function familyAction(action: string, label: Text, description: Text, result: Text,
    stats: LifeActivityDefinition["stats"], bond: number, sameCity?: LifeActivityDefinition["sameCity"]): LifeActivityDefinition {
    return { id: "people." + id + "." + action, category: "family", contact: id, minAge: 7,
      label, description, result, stats, sameCity, update: life => changeKinBond(life, id, bond) };
  }
  if (close) {
    activities.push(
      familyAction("family-advice", t("Поискай семеен съвет", "Ask for family advice"),
        t("Разкажи за нещо, за което се колебаеш.", "Talk about something you are unsure about."),
        t("Поговорихте за избора ти. Вече знаеш какво искаш да обмислиш първо.", "You talked through your options and found a place to start."),
        { brains: 3, joy: 2 }, 5),
      familyAction("family-help", t("Помогни вкъщи", "Help around the house"),
        t("Отметнете заедно някоя задача у дома.", "Take care of a chore together."),
        t("Свършихте задачата заедно и си оставихте време за почивка.", "You finished the chore together and still had time for a break."),
        { joy: 3 }, 6, "always"),
    );
  } else {
    activities.push(
      familyAction("family-recipe", t("Научи семейна рецепта", "Learn a family recipe"),
        t("Попитай как се прави ястието, което винаги слагате на празничната маса.", "Ask how to make a dish your family always serves on holidays."),
        t("Записа рецептата, включително онова „на око“, което никога не пише в тефтера.", "You wrote down the recipe, including the parts they always measure by eye."),
        { brains: 3, joy: 2 }, 5),
      familyAction("family-album", t("Разгледайте семейния албум", "Look through the family album"),
        t("Вижте стари снимки и си припомнете кой е на тях.", "Look through old photos and find out who is in them."),
        t("Обърнахте снимките, за да прочетете надписите отзад. Една дата ви изненада.", "You turned over the photos to read the captions. One of the dates surprised you."),
        { joy: 4 }, 6, "always"),
    );
  }
  return activities.filter(activity => s.age >= (activity.minAge ?? 0));
}

export function kinActivityById(s: GameState, id: string): LifeActivityDefinition | undefined {
  if (!id.startsWith("people.kin-")) return undefined;
  const [, contact] = id.split(".");
  return isKin(contact) ? kinActivities(s, contact).find(activity => activity.id === id) : undefined;
}

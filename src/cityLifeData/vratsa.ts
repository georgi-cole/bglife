import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 47874,
  climate: "foothills",
  places: [t("Градската градина", "the City Garden"), t("Ботевата алея към Околчица", "the Botev trail towards Okolchitsa")],
  childhood: {
    body: t("От Градската градина гледате къде скалите свършват в облаците. Всеки сочи различен връх.", "From the City Garden you watch the rocks disappear into the clouds. Everyone points at a different peak."),
    line: t("„Те там се вижда проходът, като падне мъглата.“", "“You can see the gorge there once the fog lifts.”"),
  },
  occasion: {
    months: [5, 6],
    body: t("За Ботевите дни ученическа група подготвя кратко четене и среща със семействата.", "For Botev Days, a school group is preparing a short reading and a get-together with families."),
    source: "https://visitvratsa.com/events/botevi-dni-2026-programa/",
  },
  story: {
    opening: {
      title: t("Два плана за поход", "Two plans for a hike"),
      body: t("Класът готви излет към Вратцата. Прогнозата се мени и трябва резервна програма.", "Your class is planning an outing to Vratsata Gorge. The forecast keeps changing, so you need a backup."),
      task: t("Направи резервен план", "Make a backup plan"),
      outcome: t("Приготви маршрут за навън и музейна задача. Когато заваля, групата знаеше какво да прави.", "You drew up an outdoor route and a museum activity. When rain came, the group knew what to do."),
    },
    continuation: {
      title: t("Следващата група към Вратцата", "The next group at the gorge"),
      body: t("Ръководителката те кани да покажеш на новите ученици как се прави маршрут с резервен вариант.", "The leader asks you to show new students how to make a route with a backup."),
      task: t("Подготви групата", "Prepare the group"),
      outcome: t("Даде им картата и ги остави да изберат. Върнаха ти я с отбелязана още една спирка.", "You gave them the map and let them choose. They returned it with one more stop marked."),
    },
  },
  community: {
    title: t("Пресичане до парка", "A crossing to the park"),
    body: t("Съседи предлагат пешеходната пътека до парка да стане по-видима в сумрак.", "Neighbours suggest making the crossing to the park easier to see at dusk."),
  },
} satisfies CityLifeProfile;

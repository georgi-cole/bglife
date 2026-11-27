import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 322683,
  climate: "coast",
  places: [t("Фестивалният и конгресен център", "the Festival and Congress Centre"), t("Аспаруховият парк", "Asparuhovo Park")],
  childhood: {
    body: t("Пред Фестивалния център оглеждаш афишите и се опитваш да познаеш кой концерт ще е най-шумен.", "Outside the Festival Centre, you study the posters and try to guess which concert will be loudest."),
    line: t("„Виж кое е следващото. Има ли нещо за нас?“", "“See what’s next. Is there anything for us?”"),
  },
  occasion: {
    months: [6, 7, 8],
    body: t("По време на „Варненско лято“ доброволци упътват публика между залите. Можеш да се включиш за един концерт.", "During Varna Summer, volunteers guide listeners between venues. You can join them for one concert."),
    source: "https://varnasummerfest.org/%D0%BF%D1%80%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%B0",
  },
  story: {
    through: 45,
    opening: {
      title: t("План на Морска гара", "A plan for the Marine Station"),
      body: t("Клуб по корабоплаване дава на начинаещите карта и разписание. Пита как екипажът би прекарал свободния си ден на брега.", "A navigation club gives newcomers a map and a timetable. They ask how the crew could spend a day ashore."),
      task: t("Направи маршрута", "Plot the route"),
      outcome: t("Съобрази плана с часа за връщане. Ръководителката поиска да го запази за следващата група.", "You planned around the return time. The instructor asked to keep it for the next group."),
    },
    continuation: {
      title: t("Следващият екипаж", "The next crew"),
      body: t("Клубът те кани да покажеш на новите участници как преценяваш времето за придвижване.", "The club invites you back to show new participants how you estimate travel time."),
      task: t("Води занятието", "Run the workshop"),
      outcome: t("Показа два маршрута и остави групата да спори. Измислиха трети, по-добър от твоите.", "You presented two routes and let the group argue. They devised a third that worked better."),
    },
  },
  community: {
    title: t("Път до Морска гара", "A route to the Marine Station"),
    body: t("Родители с колички и пешеходци искат по-ясни пресичания между спирките и крайбрежието.", "Parents with prams and people on foot ask for clearer crossings between the stops and the waterfront."),
  },
} satisfies CityLifeProfile;

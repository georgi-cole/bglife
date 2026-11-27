import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 64171,
  climate: "foothills",
  places: [t("площад „Георги Измирлиев“", "Georgi Izmirliev Square"), t("алеята край Бистрица", "the path along the Bistritsa")],
  childhood: {
    body: t("На площада броиш колко гълъба ще се вдигнат, ако някой изпусне троха.", "In the square, you count how many pigeons take off when someone drops a crumb."),
    line: t("„Айде до реката. Който стигне втори, черпи с боза.“", "“Race you to the river. Last one there buys the boza.”"),
  },
  occasion: {
    months: [5], day: 24,
    body: t("За шествието на 24 май доброволци правят табели с имената на училищата. Хора от квартала ти питат дали ще помогнеш.", "Volunteers are making school signs for the May 24 parade. People from your neighbourhood ask if you can help."),
    source: "https://blagoevgrad.bg/news/blagoevgrad-otbeliazva-24-mai-s-praznichna-programa-posvetena-na-svetite-bratia-kiril-i-metodii-i-praznika-na-grada",
  },
  story: {
    opening: {
      title: t("Гласове от Вароша", "Voices from Varosha"),
      body: t("Студентски клуб събира истории от Вароша. Търси човек, който да почука на първата врата.", "A student club is collecting stories in Varosha. Someone has to knock on the first door."),
      task: t("Запиши първото интервю", "Record the first interview"),
      outcome: t("Върна се с глас на човек, който помни улицата, преди по нея да има кафенета.", "You came back with the voice of someone who remembers the street before it had cafés."),
    },
    continuation: {
      title: t("Аудиоразходка във Вароша", "An audio walk in Varosha"),
      body: t("Клубът пази твоя запис. Предлага разходка със слушалки покрай старите дворове.", "The club still has your recording. They propose an audio walk past the old courtyards."),
      task: t("Подреди аудиоразходката", "Put the audio walk together"),
      outcome: t("Избра къде да прозвучи всеки глас. Един от участниците доведе децата си да чуят квартала.", "You picked where each voice would play. One participant brought their children to listen to the neighbourhood."),
    },
  },
  community: {
    title: t("Зала за ученически и студентски клубове", "A room for school and university clubs"),
    body: t("Ученици и студенти искат място за репетиции. Живеещите наоколо предлагат общ график, за да имат спокойни вечери.", "School and university students want a rehearsal room. Nearby residents propose a shared schedule so evenings stay quiet."),
  },
} satisfies CityLifeProfile;

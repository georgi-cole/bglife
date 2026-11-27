import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 333994,
  climate: "plain",
  places: [t("квартал „Тракия“", "Trakia district"), t("Гребната база", "the Rowing Canal")],
  childhood: {
    body: t("В „Тракия“ се договаряте до коя пейка стига кварталът на вашата игра. Картата е нарисувана с тебешир.", "In Trakia you agree which bench is the edge of your game’s territory. The map is drawn in chalk."),
    line: t("„Айде, майна, до Гребната и се връщаме.“", "“Come on, let’s go as far as the rowing canal and back.”"),
  },
  occasion: {
    title: t("Празник на Пловдив и Съединението", "Plovdiv City Day and Unification Day"),
    months: [9], day: 6,
    body: t("На 6 септември центърът е пълен. Познати от клуб по история правят малък маршрут между местата за честването.", "The centre fills up on September 6. People from your history club are making a short route between the celebration venues."),
    source: "https://www.plovdiv.bg/140-godishnina-saedinenie-programa/",
  },
  story: {
    opening: {
      title: t("След час в Капана", "After class in Kapana"),
      body: t("В ателие в Капана подготвят ученическа изложба. Трябва някой да реши как рисунките и малките конструкции ще се поберат заедно.", "A studio in Kapana is preparing a student exhibition. Someone has to work out how to fit drawings and small constructions together."),
      task: t("Подреди изложбата", "Arrange the exhibition"),
      outcome: t("Остави място посетителите да заобикалят предметите. Един автор за първи път видя работата си от другата страна.", "You left room for visitors to walk around the objects. One maker saw their work from the other side for the first time."),
    },
    continuation: {
      title: t("Портфолио и път до стажа", "A portfolio and a route to an internship"),
      body: t("Контакт от ателието предлага да покажеш проекта на технически екип. Срещата съвпада с друга възможност в центъра.", "A contact from the studio offers to show the project to a technical team. The meeting clashes with another opportunity in the centre."),
      task: t("Представи проекта си", "Present your project"),
      outcome: t("Подготви кратко портфолио и стигна навреме. Екипът поиска да чуе как си решил въпроса с пространството.", "You put together a short portfolio and arrived on time. The team asked how you solved the layout problem."),
    },
  },
  community: {
    title: t("Път от „Тракия“ до работа", "Getting to work from Trakia"),
    body: t("Жители сравняват връзките между квартала, центъра и работните места извън града. Късният курс е най-спорният.", "Residents compare connections between the district, the centre and jobs outside the city. The late service is the most contentious."),
  },
} satisfies CityLifeProfile;

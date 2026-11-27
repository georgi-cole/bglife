import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 77832,
  climate: "foothills",
  places: [t("площад „Хаджи Димитър“", "Hadzhi Dimitar Square"), t("Карандила над Сливен", "Karandila above Sliven")],
  childhood: {
    body: t("На площада опитвате да отгатнете каква ще е гледката към Сините камъни, като се вдигнат облаците.", "In the square, you try to guess what the Blue Rocks will look like once the clouds lift."),
    line: t("„Като се оправи времето, ще идем горе. Засега ела по-близо.“", "“We’ll go up when the weather clears. Stay close for now.”"),
  },
  occasion: {
    months: [10], day: 26,
    body: t("За Димитровден се готви градска програма. Познат от училище кани хората да споделят снимки от предишни празници.", "Sliven is preparing its St Demetrius Day programme. Someone you know from school invites people to share photos from past celebrations."),
    source: "https://mun.sliven.bg/news/484664",
  },
  story: {
    opening: {
      title: t("Плат, който разказва", "A fabric with a story"),
      body: t("В проекта за текстилния музей класът трябва да обясни защо две на вид сходни тъкани се износват различно.", "For a textile museum project, the class has to explain why two similar-looking fabrics wear differently."),
      task: t("Подреди пробите", "Arrange the samples"),
      outcome: t("Направи малка демонстрация, която хората разбраха, след като пипнаха и двата плата.", "You made a small demonstration people understood after handling both fabrics."),
    },
    continuation: {
      title: t("Проби за ателието", "Samples for a workshop"),
      body: t("Човек от проекта те кани в ателие. Искат да използват твоите проби, за да обучат новите помощници.", "Someone from the project invites you to a workshop. They want to use your samples to train new helpers."),
      task: t("Обясни какво се променя", "Explain what changes"),
      outcome: t("Сравнихте два подхода и оставихте табло, което екипът използва и след срещата.", "You compared two approaches and left a board the team used after the session."),
    },
  },
  community: {
    title: t("Път до планината", "Getting to the mountain"),
    body: t("Разхождащи се и пътуващи за работа обсъждат дали допълнителен курс през почивните дни ще е полезен.", "Walkers and commuters discuss whether an extra weekend service would help."),
  },
} satisfies CityLifeProfile;

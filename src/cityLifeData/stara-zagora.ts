import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 120976,
  climate: "plain",
  places: [t("парк „Артилерийски“", "Artileriyski Park"), t("алеите на „Бедечка“", "the paths in Bedechka Park")],
  childhood: {
    body: t("В парка наблюдаваш как хората водят кучетата си по различни маршрути. Всяко куче има любимо място за спиране.", "In the park you watch people walk their dogs along different routes. Every dog has a favourite place to stop."),
    line: t("„Мини после през Аязмото. Там има място да поседнем.“", "“Come by Ayazmoto later. There’s room to sit there.”"),
  },
  occasion: {
    months: [10], day: 5,
    body: t("На 5 октомври се подготвя обща програма в центъра. Познат от университета пита дали ще помогнеш на щанда на клуба им.", "There’s a public programme in the centre on October 5. A university contact asks if you can help at their club’s stall."),
    source: "https://www.starazagora.bg/bg/obyavleniya-na-obshtinski-savet/pokana-za-tarzhestveno-zasedanie-na-obshtinski-savet-stara-zagora-po-povod-praznika-na-stara-zagora-5-ti-oktomvri-1",
  },
  story: {
    opening: {
      title: t("Наблюдения в парка", "Observations in the park"),
      body: t("Студенти подготвят образователен проект за грижа за животни. Имат карта и искат да проверят какво действително се случва на всяко място.", "Students are preparing an educational project about animal care. They have a map and want to see what happens at each spot."),
      task: t("Запиши наблюденията", "Record the observations"),
      outcome: t("Добави час, място и какво видя при всяка разходка. Екипът намери модел, който беше пропуснал.", "You added time, place and what you saw on each walk. The team spotted a pattern they had missed."),
    },
    continuation: {
      title: t("Самостоятелна задача с наставник", "An independent task with a mentor"),
      body: t("Студент от проекта те кани за следващото издание. Иска да направиш упражнение за нови доброволци.", "A student from the project invites you back for the next round. They want you to make an exercise for new volunteers."),
      task: t("Подготви задачата за доброволците", "Prepare the volunteer activity"),
      outcome: t("Даде им карта с две места, които изглеждат еднакво. След разходката те сами обясниха разликата.", "You gave them a map with two places that looked the same. After the walk they explained the difference themselves."),
    },
  },
  community: {
    title: t("Вода и сянка в парка", "Water and shade in the park"),
    body: t("Хора, които тренират, и семейства с малки деца обсъждат къде чешма и сянка ще са най-полезни.", "People exercising and families with young children discuss where a drinking fountain and shade would help most."),
  },
} satisfies CityLifeProfile;

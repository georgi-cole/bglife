import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 23741,
  climate: "mountain",
  places: [t("площад „Захарий Зограф“", "Zahari Zograf Square"), t("алеите край Искъра", "the paths by the Iskar")],
  childhood: {
    body: t("Край Голямата чешма се опитваш да пренесеш вода в чаша, без да полееш обувките си. Пробвате отново.", "By the Great Fountain, you try to carry a cup of water without spilling it on your shoes. You try again."),
    line: t("„Утре ще идем по Искъра. Ако вали, ще останем тука.“", "“We’ll go along the Iskar tomorrow. If it rains we’ll stay here.”"),
  },
  occasion: {
    months: [8], day: 21,
    body: t("За празника на Самоков на 21 август познати се събират в центъра. Някой предлага да помогнете за детските занимания.", "People you know meet in the centre for Samokov City Day on August 21. Someone suggests helping with children’s activities."),
    source: "https://www.samokov.bg/samokov_praznik",
  },
  story: {
    from: 16,
    opening: {
      months: [12, 1, 2],
      title: t("Зимна смяна към Боровец", "A winter shift near Borovets"),
      body: t("В обект край Боровец търсят помощник за зимата. Трябва да стигаш навреме от града и да знаеш какво да правиш при спрян курс.", "A venue near Borovets needs winter help. You have to get there from town and know what to do if a service is cancelled."),
      task: t("Поеми зимната смяна", "Take the winter shift"),
      outcome: t("Съгласува графика и си остави резервен маршрут. Получи първото си заплащане в края на смяната.", "You agreed a schedule and kept a backup route. You got your first pay at the end of the shift."),
      pay: 4500,
    },
    continuation: {
      months: [12, 1, 2],
      title: t("Следващият зимен сезон", "Next winter’s season"),
      body: t("Екипът те кани отново. Нов човек започва работа и се чуди как да стига, когато закъснее автобусът.", "The team invites you back. A new starter wonders how to get there when the bus is late."),
      task: t("Направи общ план за смените", "Make a shared shift plan"),
      outcome: t("Събрахте маршрутите на едно място. Екипът намери човек, с когото новият колега може да пътува.", "You collected the journeys in one place. The team found someone the new colleague could travel with."),
      pay: 7000,
    },
  },
  community: {
    title: t("Пътуване в два сезона", "Getting around in two seasons"),
    body: t("Събират се предложения за връзките между Самоков и Боровец през зимата и в по-спокойните месеци.", "Suggestions are being collected for links between Samokov and Borovets in winter and the quieter months."),
  },
} satisfies CityLifeProfile;

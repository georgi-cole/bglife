import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 189086,
  climate: "coast",
  places: [t("Моста", "the pier"), t("Атанасовско езеро край града", "Lake Atanasovsko on the edge of town")],
  childhood: {
    body: t("На Моста ти показват как да познаеш откъде духа, като гледаш знамената.", "On the pier, someone shows you how to tell where the wind is coming from by looking at the flags."),
    line: t("„Вземи си горнище. На Моста духа.“", "“Bring a jacket. It’s windy on the pier.”"),
  },
  occasion: {
    months: [12], day: 6,
    body: t("За Никулден се подготвя обща трапеза. Съседката пита дали можете да помогнете преди концертите.", "The neighbours are setting up a communal table for St Nicholas Day. One asks if you can help before the concerts."),
    source: "https://www.burgas.bg/bg/praznitsi-i-chestvaniya/",
  },
  story: {
    from: 16,
    opening: {
      months: [6, 7, 8],
      title: t("Лятна смяна край морето", "A summer shift by the sea"),
      body: t("Екипът на крайбрежна сцена има нужда от помощник. Трябва да подредиш реквизита и да отбележиш кое се прибира при силен вятър.", "A seaside stage needs another pair of hands. You’ll sort the props and mark what to move indoors in heavy wind."),
      task: t("Поеми смяната", "Take the shift"),
      outcome: t("Сцената беше готова, преди публиката да се събере. Организаторката запази телефона ти.", "The stage was ready before the crowd arrived. The organizer kept your number."),
      pay: 5500,
    },
    continuation: {
      months: [6, 7, 8],
      title: t("Отново на лятната сцена", "Back at the summer stage"),
      body: t("Организаторката от миналото лято се обади. Този път можеш да ръководиш двама нови помощници.", "Last summer’s organizer called. This time you can lead two new helpers."),
      task: t("Води подготовката", "Lead the setup"),
      outcome: t("Разпредели задачите и откри, че вече умееш да успокоиш цял екип за пет минути.", "You divided up the tasks and discovered you could calm an entire crew in five minutes."),
      pay: 8000,
    },
  },
  community: {
    title: t("Велосипеди край езерото", "Bikes by the lake"),
    body: t("Край езерото се търси място за веломаршрут. Пътуващите до работа и пешеходците имат различни идеи.", "A lakeside cycle route is up for discussion. Commuters and people out walking have different ideas."),
  },
} satisfies CityLifeProfile;

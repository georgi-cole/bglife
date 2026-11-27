import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 66399,
  climate: "plateau",
  places: [t("площад „Кристал“", "Kristal Square"), t("лесопарк „Кьошковете“", "Kyoshkovete Forest Park")],
  childhood: {
    body: t("На площада се опитваш да познаеш кой музикант репетира наоколо. След малко звукът идва от друг прозорец.", "In the square you try to guess which musician is practising nearby. A moment later, the sound comes from another window."),
    line: t("„Ще качим платото, ако не завали. Първо се виждаме на Кристал.“", "“We’ll go up to the plateau if it doesn’t rain. First we meet at Kristal.”"),
  },
  occasion: {
    title: t("Празник на Шумен", "Shumen City Day"),
    months: [5], day: 11,
    body: t("На 11 май градът има празнична програма. Ученическият театрален клуб подготвя кратък откъс за среща с публиката.", "On May 11 the city has a programme of celebrations. The school theatre club is preparing a short excerpt for an audience."),
    source: "https://www.shumen.bg/bg/novini/shumen-otbelyazva-11-may-s-aktsent-varhu-kulturata-i-traditsiite",
  },
  story: {
    opening: {
      title: t("Зад кулисите", "Backstage"),
      body: t("В театралната група са оставили дълъг списък с реквизит. Трябва да подредиш предметите по реда, в който ще трябват.", "The theatre group has left a long props list. You need to arrange things in the order they’ll be needed."),
      task: t("Подреди реквизита", "Set the props in order"),
      outcome: t("Даде знак на точния човек, преди да е станало тъмно. След представлението ти предложиха да си водиш свои бележки.", "You cued the right person before the lights went out. After the show they suggested keeping notes of your own."),
    },
    continuation: {
      title: t("Въвеждане на нов помощник", "Showing a new helper the ropes"),
      body: t("От трупата те канят, защото идва нов човек зад кулисите. Питат дали ще покажеш коя част е най-трудна.", "The troupe calls because someone new is joining backstage. They ask you to show what’s hardest."),
      task: t("Подготви пробната вечер", "Prepare a practice evening"),
      outcome: t("Направихте суха репетиция с празна сцена. На истинското представление помощникът знаеше кога да действа.", "You practised with an empty stage. At the real performance the helper knew when to act."),
    },
  },
  community: {
    title: t("Достъп до културен маршрут", "Access to a heritage route"),
    body: t("Обсъжда се пешеходен маршрут между старите сгради и Томбул джамия. Семейства искат обозначения и места за почивка.", "A walking route between historic buildings and Tombul Mosque is being discussed. Families want signs and places to rest."),
  },
} satisfies CityLifeProfile;

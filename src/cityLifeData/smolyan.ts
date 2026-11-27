import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 24028,
  climate: "mountain",
  places: [t("квартал „Райково“", "Raykovo district"), t("алеите край Смолянските езера", "the paths around the Smolyan Lakes")],
  childhood: {
    body: t("В Райково питаш защо следобед слънцето се скрива зад склона, а отсрещните къщи още светят.", "In Raykovo, you ask why the sun disappears behind the slope while the houses opposite are still lit."),
    line: t("„Прибери се по светло. Сабале пак ще идем.“", "“Come home while it’s light. We’ll go back in the morning.”"),
  },
  occasion: {
    title: t("Празник на Смолян", "Smolyan City Day"),
    months: [10], day: 21,
    body: t("На 21 октомври Планетариумът е част от празничната програма в града. Ученици се канят да занесат рисунки за общо табло.", "On October 21 the Planetarium is part of the city’s celebrations. Pupils want to bring drawings for a shared display."),
    source: "https://www.smolyan.bg/bg/news/view/7094",
  },
  story: {
    opening: {
      title: t("Вечер с телескоп", "An evening with a telescope"),
      body: t("Клуб в Планетариума подготвя наблюдение. Трябва да има занимание и ако облаците скрият небето.", "A club at the Planetarium plans a stargazing session. They also need something to do if clouds hide the sky."),
      task: t("Приготви резервно занимание", "Prepare a backup activity"),
      outcome: t("Нарисува карта на съзвездията. Когато небето се затвори, децата намериха същите звезди по картата.", "You drew a constellation map. When the sky clouded over, the children found the same stars on it."),
    },
    continuation: {
      title: t("Наблюдение с новата група", "Stargazing with a new group"),
      body: t("От клуба те канят пак. Този път искат да обясниш как се намира първото съзвездие.", "The club invites you back. This time they want you to explain how to find the first constellation."),
      task: t("Покажи откъде се започва", "Show where to start"),
      outcome: t("Даде картата на едно от децата и го остави да води останалите. После само поиска бинокъл.", "You gave the map to one child and let them guide the others. Afterwards they asked for binoculars without prompting."),
    },
  },
  community: {
    title: t("Вечерен автобус между кварталите", "An evening bus between districts"),
    body: t("Родители и хора след смяна предлагат последният автобус да минава след края на заниманията.", "Parents and shift workers suggest running the last bus after evening activities end."),
  },
} satisfies CityLifeProfile;

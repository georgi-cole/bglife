import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 65317,
  climate: "basin",
  places: [t("площад „Кракра“", "Krakra Square"), t("парк „Кракра“", "Krakra Park")],
  childhood: {
    body: t("На площада виждаш как двама участници придържат огромен калпак, докато третият си връзва обувките.", "In the square, you see two performers holding an enormous headdress while a third ties their shoes."),
    line: t("„Ела насам. Оттука ще видиш маските, без да те бутат.“", "“Come here. You’ll see the masks without getting jostled.”"),
  },
  occasion: {
    months: [1],
    body: t("За международния фестивал „Сурва“ група подготвя маските и чака ред за репетиция на площада.", "For the Surva international festival, a group gets its masks ready and waits for a rehearsal slot in the square."),
    source: "https://surva.org/",
  },
  story: {
    opening: {
      title: t("Маска за първото дефиле", "A mask for the first parade"),
      body: t("В работилницата остава място за ученик. Има образец за маска, но трябва да я нагласите за конкретен човек.", "There’s room for a learner in the workshop. There’s a pattern for the mask, but it has to fit the person wearing it."),
      task: t("Работи с майстора", "Work with the maker"),
      outcome: t("Мерихте, променяхте и най-накрая я пробвахте. Майсторът запази твоята скица.", "You measured, adjusted and finally tried it on. The maker kept your sketch."),
    },
    continuation: {
      title: t("Следващата маска", "The next mask"),
      body: t("Майсторът посреща нов ученик. Поверява ти да разкажеш как се стига от скица до проба.", "The maker welcomes a new learner and asks you to explain how a sketch becomes a fitting."),
      task: t("Води първата проба", "Lead the first fitting"),
      outcome: t("Новият ученик видя грешка, която и двамата бяхте пропуснали. Заедно я поправихте.", "The new learner spotted a mistake you’d both missed. You fixed it together."),
    },
  },
  community: {
    title: t("Последен влак до вкъщи", "The last train home"),
    body: t("Пътуващи след вечерна смяна и хора, които ходят на събития в София, обсъждат удобни връзки до кварталите.", "Evening shift workers and people going to events in Sofia discuss connections to their neighbourhoods."),
  },
  events: [
    {
      id: "surova-village", ages: [8, 131], months: [1], day: 13, repeatAfter: 9,
      source: "https://ich.unesco.org/en/RL/surova-folk-feast-in-pernik-region-00968",
      title: t("Гостуване за Сурова", "A visit for Surova"),
      body: t("На 13 януари познати те канят да видиш сурвакарите в тяхното село в Пернишко. Питат дали искаш да чуеш как се готвят за обреда.", "On 13 January, friends invite you to watch the masked performers in their village in the Pernik region. They ask if you’d like to hear how they prepare for the custom."),
      choices: [
        { id: "visit", label: t("Отиди на гости", "Visit"), outcome: t("Остана да чуеш историята на една от маските. Следващия път вече знаеше кого да попиташ.", "You stayed to hear one mask’s story. Next time you knew whom to ask."), stats: { joy: 3, brains: 2 }, withFriend: true },
        { id: "listen", label: t("Помоли за разказ", "Ask for the story"), outcome: t("По-късно си разменихте снимки и си записа две подробности, които иначе би пропуснал.", "Later you swapped photos and wrote down two details you would have missed."), stats: { brains: 2 } },
      ],
    },
  ],
} satisfies CityLifeProfile;

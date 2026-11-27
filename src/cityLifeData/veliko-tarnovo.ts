import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 60067,
  climate: "foothills",
  places: [t("площад „Майка България“", "Mayka Bulgaria Square"), t("парк „Света гора“", "Sveta Gora Park")],
  childhood: {
    body: t("Показват ти завой, при който една улица се вижда чак от другата страна на Янтра.", "Someone shows you a turn where a street comes into view all the way across the Yantra."),
    line: t("„Внимавай по стълбите. Оттук е по-късо, ама има повече качване.“", "“Watch the steps. It’s shorter this way, but there’s more climbing.”"),
  },
  occasion: {
    months: [3], day: 22,
    body: t("За празника на града предстои шествие. Познат от групата по история събира участници край центъра.", "A procession is coming up for City Day. Someone from your history group is gathering people near the centre."),
    source: "https://www.veliko-tarnovo.bg/bg/aktsenti/praznik-na-veliko-tarnovo-22-mart-2026g-programa/",
  },
  story: {
    through: 55,
    opening: {
      title: t("Табелки за чаршията", "Signs for the market street"),
      body: t("На Самоводската чаршия двама занаятчии се чудят как да обяснят работата си на посетителите в два реда.", "Two craftspeople on Samovodska Charshia wonder how to explain their work to visitors in two lines."),
      task: t("Предложи два надписа", "Draft two signs"),
      outcome: t("Опита ги върху минувач, който зададе полезен въпрос. Може ли да види как се прави?", "You tried them on a passer-by who asked a useful question. Could they watch it being made?"),
    },
    continuation: {
      title: t("Разходка с въпроси", "A tour full of questions"),
      body: t("Единият занаятчия предлага обиколка с демонстрации и ти поверява началото.", "One craftsperson suggests a short tour with demonstrations and asks you to lead the opening."),
      task: t("Води първата група", "Lead the first group"),
      outcome: t("Събра въпроси за втори маршрут. Един посетител остана, за да пробва занаята.", "You collected enough questions for a second route. One visitor stayed to try the craft."),
    },
  },
  community: {
    title: t("Стъпалата към Янтра", "The steps towards the Yantra"),
    body: t("Хора от стръмна улица обсъждат осветление и парапет по маршрута до спирката.", "Residents of a steep street discuss lights and a handrail for the route to the bus stop."),
  },
} satisfies CityLifeProfile;

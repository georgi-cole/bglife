import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 33127,
  climate: "danube",
  places: [t("площад „Бдинци“", "Bdintsi Square"), t("Дунавският кей във Видин", "Vidin’s Danube quay")],
  childhood: {
    body: t("По кея намираш пръчка и мериш докъде е стигнала водата от последната ви разходка.", "On the quay you find a stick and measure how far the water has risen since your last walk."),
    line: t("„Стой тука. Ще мине кораб и ще видиш вълната.“", "“Stay here. A boat will pass, and you’ll see its wake.”"),
  },
  occasion: {
    months: [8],
    body: t("Панаирът отваря близо до Баба Вида. Семейство от съседната улица помага с щанд и търси още един човек.", "The fair opens near Baba Vida. A family from the next street is helping on a stall and needs another pair of hands."),
    source: "https://www.bta.bg/bg/news/lik/1191198-s-izpalnenie-na-gradskiya-duhov-orkestar-i-kontsert-na-diana-ekspres-beshe-otk",
  },
  story: {
    opening: {
      title: t("Крепостта през обектива", "The fortress through a lens"),
      body: t("Учител предлага да снимате Баба Вида и кея за училищен проект за всекидневието край Дунав.", "A teacher suggests photographing Baba Vida and the quay for a school project about life by the Danube."),
      task: t("Направи поредица снимки", "Shoot a photo series"),
      outcome: t("Събра кадри на семейства, рибари и човек, който всеки ден записва нивото на реката.", "You photographed families, anglers and someone who notes the water level every day."),
    },
    continuation: {
      title: t("Съобщение от Видин", "A message from Vidin"),
      body: t("Учителят още пази снимките. Предлага да ги сравните с нови кадри и да поканите хората от тях.", "The teacher still has the photos. They suggest comparing them with new pictures and inviting the people in them."),
      task: t("Събери хората от снимките", "Bring the people in the photos together"),
      outcome: t("Двама гости се запознаха. Оказа се, че от години стоят на едно и също място по различно време.", "Two guests met for the first time. They had been standing in the same spot at different times for years."),
    },
  },
  community: {
    title: t("Свободен час край Дунав", "An hour by the Danube"),
    body: t("Съседи от две поколения сравняват идеи за достъпна алея и места за сядане по кея.", "Neighbours from two generations compare ideas for an accessible walkway and seats along the quay."),
  },
} satisfies CityLifeProfile;

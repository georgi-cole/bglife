import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 32524,
  climate: "foothills",
  places: [t("площад „Свобода“ в Търговище", "Targovishte’s Svoboda Square"), t("Мисионис край Търговище", "Missionis near Targovishte")],
  childhood: {
    body: t("Отивате до „Борово око“ и спорите коя пътека е по-кратка. На връщане искате да измерите и другата.", "You go to Borovo Oko and argue about which path is shorter. On the way back you want to measure the other one too."),
    line: t("„Ела до площада. Оттам тръгваме към панаира.“", "“Come to the square. We’ll head to the fair from there.”"),
  },
  occasion: {
    months: [5],
    body: t("По време на Пролетния панаир майстори отварят щандове. Познат иска помощ да подреди реда на демонстрациите.", "Craftspeople open their stalls during the Spring Fair. Someone you know asks for help scheduling the demonstrations."),
    source: "https://tg.government.bg/docu/kulturen_kalendar_trg_2026.pdf",
  },
  story: {
    from: 16,
    opening: {
      title: t("Демонстрация на панаира", "A demonstration at the fair"),
      body: t("Семеен щанд предлага да покажете как се прави един предмет. Имате малко място и много хора, които искат да гледат.", "A family stall wants to show how an object is made. There’s little room and lots of people who want to watch."),
      task: t("Подготви демонстрацията", "Prepare the demonstration"),
      outcome: t("Подреди действията в кратък ред и остави място за въпроси. Посетителите останаха и след края.", "You arranged the steps in a short sequence and left room for questions. Visitors stayed after it ended."),
    },
    continuation: {
      title: t("Собствен час на щанда", "Your own slot at the stall"),
      body: t("За следващия панаир семейството предлага самостоятелен час. Трябва да решиш какво ще може да пробва посетителят.", "For the next fair, the family offers you a slot of your own. You decide what visitors can try."),
      task: t("Води своя час", "Run your slot"),
      outcome: t("Остави хората да пробват и да си разменят местата. Семейството запази твоите материали за следващата група.", "You let people try it and change places. The family kept your materials for the next group."),
      pay: 4000,
    },
  },
  community: {
    title: t("Проход между щандовете", "A clear way between stalls"),
    body: t("Търговци и посетители обсъждат как да има повече място за разминаване, без да се губят демонстрации.", "Vendors and visitors discuss how to leave more space to pass without losing demonstrations."),
  },
} satisfies CityLifeProfile;

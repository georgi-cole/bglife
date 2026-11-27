import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 120282,
  climate: "danube",
  places: [t("площад „Свобода“ в Русе", "Ruse’s Svoboda Square"), t("Лесопарк „Липник“ край Русе", "Lipnik Forest Park near Ruse")],
  childhood: {
    body: t("От площада се опитвате да стигнете до кея по улица, по която още не сте минавали.", "From the square you try to reach the quay along a street you haven’t taken before."),
    line: t("„Първо до реката. На връщане ще минем по площада.“", "“First the river. We’ll come back through the square.”"),
  },
  occasion: {
    months: [3],
    body: t("За „Мартенски музикални дни“ се събира публика пред Доходното здание. Познат има нужда от помощ да упъти гости.", "For March Music Days, audiences gather by the Revenue Building. Someone you know needs help directing visitors."),
    source: "https://obshtinaruse.bg/krasimira-stoyanova-lyuka-debarg-i-rusenskiyat-festivalen-orkestar-otkrivat-65-ite-martenski-muzikalni-dni-v-ruse",
  },
  story: {
    from: 16,
    opening: {
      title: t("Разписание край Дунав", "A timetable by the Danube"),
      body: t("На среща за транспорт ти дават учебен казус с часове за автобус, склад и доставка. Трябва да намериш връзка, която спестява чакане.", "At a transport workshop you get a case study with bus, warehouse and delivery times. You have to find a connection that cuts waiting."),
      task: t("Подреди връзките", "Arrange the connections"),
      outcome: t("Отбеляза къде се губи половин час. Наставникът поиска да види дали същата идея работи при ново разписание.", "You marked where half an hour goes missing. The mentor wants to see whether the idea works with a new timetable."),
    },
    continuation: {
      title: t("Две точки по реката", "Two stops along the river"),
      body: t("Наставникът ти праща проект, в който две места по Дунав трябва да обменят материали в един ден.", "The mentor sends you a project where two places along the Danube need to exchange materials in one day."),
      task: t("Направи общ график", "Make a shared schedule"),
      outcome: t("Намери вариант, който работи и при закъснение на единия екип. Двата екипа използваха твоя план.", "You found a route that worked even if one team ran late. Both teams used your plan."),
      pay: 6500,
    },
  },
  community: {
    title: t("Връзка от центъра до кея", "A link from the centre to the quay"),
    body: t("Предлага се пешеходен маршрут за хора, които идват за събития и не познават улиците край реката.", "A walking route is proposed for people coming to events who don’t know the streets near the river."),
  },
} satisfies CityLifeProfile;

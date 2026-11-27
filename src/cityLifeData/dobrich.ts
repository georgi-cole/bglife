import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 68573,
  climate: "plain",
  places: [t("площад „Свобода“", "Svoboda Square"), t("парк „Кобаклъка“ край Добрич", "Kobaklaka Park near Dobrich")],
  childhood: {
    body: t("Дават ти да носиш торбата след пазара. Много сериозно обясняваш защо крушите трябва да са най-отгоре.", "You get to carry the bag after the market. You explain very seriously why the pears must go on top."),
    line: t("„Ей тия вземи. От нашта градина са.“", "“Take these ones. They’re from our garden.”"),
  },
  occasion: {
    months: [9], day: 25,
    body: t("В деня на града на площада ще се срещнат ученически състави. Познати разпределят кой ще помага с посрещането.", "School groups will meet in the square on City Day. People you know are deciding who’ll help welcome them."),
    source: "https://dobrich.bg/bg/den-na-dobrich",
  },
  story: {
    from: 16,
    opening: {
      months: [3, 4],
      title: t("Ден с агромеханик", "A day with a farm mechanic"),
      body: t("Механик от района предлага да покаже как проверява малка машина преди сезона. Пита какво искаш да научиш.", "A local mechanic offers to show how a small machine is checked before the season. They ask what you want to learn."),
      task: t("Помогни с проверката", "Help with the inspection"),
      outcome: t("Научи защо проверката почва с най-очевидното. Механикът ти даде да допълниш списъка.", "You learned why the inspection starts with the obvious. The mechanic let you add to the checklist."),
    },
    continuation: {
      months: [3, 4],
      title: t("Работа преди сезона", "Work before the season"),
      body: t("Механикът те кани отново. Нов помощник може да подготви инструментите, а ти да покажеш реда.", "The mechanic invites you back. A new helper can get the tools ready while you show them the order."),
      task: t("Обучи новия помощник", "Train the new helper"),
      outcome: t("Върнахте всеки инструмент на място. Помощникът поиска копие от твоя списък.", "You returned every tool to its place. The helper asked for a copy of your list."),
      pay: 4500,
    },
  },
  community: {
    title: t("Спирка за ранните смени", "A stop for early shifts"),
    body: t("Работещи извън центъра искат по-ранен автобус. Учениците от същия маршрут също имат нужда от място в сутрешния курс.", "Workers outside the centre want an earlier bus. Students on the same route also need room on the morning service."),
  },
} satisfies CityLifeProfile;

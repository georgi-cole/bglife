import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 34063,
  climate: "basin",
  places: [t("площад „Велбъжд“", "Velbazhd Square"), t("овощни градини край Кюстендил", "orchards near Kyustendil")],
  childhood: {
    body: t("Виждаш кошница с череши на площада. Учат те да питаш откъде са, преди да посегнеш към най-лъскавата.", "You see a basket of cherries in the square. Someone teaches you to ask where they came from before reaching for the shiniest one."),
    line: t("„Тия са за вкъщи. От другите можеш да опиташ.“", "“These are for home. You can try the others.”"),
  },
  occasion: {
    months: [6],
    body: t("За Празника на черешата производителка подготвя изложение. Пита дали ще подредите табелките със сортовете.", "For the Cherry Festival, a grower is preparing a display. She asks if you’ll arrange the signs naming the varieties."),
    source: "https://kustendil.com/bg/culture/view/1/4/%D0%9F%D1%80%D0%B0%D0%B7%D0%BD%D0%B8%D0%BA-%D0%BD%D0%B0-%D1%87%D0%B5%D1%80%D0%B5%D1%88%D0%B0%D1%82%D0%B0",
  },
  story: {
    from: 16,
    opening: {
      months: [6, 7],
      title: t("Три кошници за пазара", "Three baskets for the market"),
      body: t("В овощна градина край Кюстендил искат помощ с три щайги за пазара. Всяка е за различен купувач.", "An orchard near Kyustendil needs help with three crates for the market. Each is for a different buyer."),
      task: t("Сортирай плодовете", "Sort the fruit"),
      outcome: t("Научи кои плодове стигат най-добре до пазара. Производителката поиска да се върнеш за следващата беритба.", "You learned which fruit travels best. The grower asked you back for the next harvest."),
    },
    continuation: {
      months: [6, 7],
      title: t("Бележки от беритбата", "Notes from harvest"),
      body: t("Производителката предлага поръчки по списък, с час за получаване. Иска да наредиш първия ден.", "The grower suggests pre-orders with collection times. She asks you to lay out the first day."),
      task: t("Подреди поръчките", "Line up the orders"),
      outcome: t("Поръчките излязоха навреме. Запазихте списъка за остатъка от сезона.", "The orders went out on time. You kept the list for the rest of the season."),
      pay: 5000,
    },
  },
  community: {
    title: t("Сянка при пазара", "Shade at the market"),
    body: t("Производители и купувачи обсъждат къде да има покрит участък в жегите и свободен проход за колички.", "Growers and buyers discuss where to put cover for hot days and keep a clear path for trolleys."),
  },
} satisfies CityLifeProfile;

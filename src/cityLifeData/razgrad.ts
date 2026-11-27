import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 27517,
  climate: "plateau",
  places: [t("площад „Независимост“", "Nezavisimost Square"), t("местност „Пчелина“ край Разград", "the Pchelina area near Razgrad")],
  childhood: {
    body: t("На площада търсите къде в сянката да седнете за закуска. Всеки носи по нещо различно.", "In the square, you look for a shady spot for a snack. Everyone brought something different."),
    line: t("„Запази малко. След разходката пак ще огладнееш.“", "“Save some. You’ll be hungry again after the walk.”"),
  },
  occasion: {
    months: [7],
    body: t("На Панаира на киселото мляко отбори подготвят дегустации. Едни искат да обяснят съставките, други разказват откъде е рецептата.", "Teams at the Yogurt Fair prepare tastings. Some want to explain the ingredients, others tell the story of the recipe."),
    source: "https://www.razgrad.bg/kultura/zayavka-panair-na-kiseloto-mlyako-2026",
  },
  story: {
    opening: {
      title: t("Как се описва вкус", "How to describe a taste"),
      body: t("Училищен клуб сравнява проби от различни рецепти. Ти записваш наблюденията, без да знаеш коя рецепта е на кого.", "A school club compares samples from different recipes. You record what people notice without knowing whose recipe is whose."),
      task: t("Събери наблюденията", "Collect the observations"),
      outcome: t("Видя как една и съща проба получи противоположни описания. Запази и двете и попита как са решили.", "You saw the same sample receive opposite descriptions. You kept both and asked how people had decided."),
    },
    continuation: {
      title: t("Демонстрация на панаира", "A demonstration at the fair"),
      body: t("Ръководителят предлага да обясните метода на посетителите. Иска да направиш дегустацията разбираема и за деца.", "The club leader suggests explaining the method to visitors. They want you to make it clear for children too."),
      task: t("Води дегустацията", "Lead the tasting"),
      outcome: t("Хората започнаха да си сравняват бележките и поискаха да опитат и следващата проба.", "Visitors began comparing notes and asked to try the next sample."),
    },
  },
  community: {
    title: t("Център за ученически проекти", "A centre for school projects"),
    body: t("Учители предлагат споделено място за опити и изложби. Търсят график, който работи и за малките училища.", "Teachers propose a shared room for experiments and exhibitions. They need a schedule that can work for small schools too."),
  },
} satisfies CityLifeProfile;

import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 26693,
  climate: "foothills",
  places: [t("Младежкият дом", "the Youth Centre"), t("алеята край Осъм", "the path along the Osam")],
  childhood: {
    body: t("След разходката по Покрития мост питаш защо магазините имат река под пода. Никой вкъщи не намира кратък отговор.", "After crossing the Covered Bridge, you ask why shops have a river under their floor. No one at home has a short answer."),
    line: t("„Да минем по моста. Още има време да видим сергиите.“", "“Let’s cross the bridge. There’s still time to see the stalls.”"),
  },
  occasion: {
    months: [4],
    body: t("За Цветница край реката подготвят занаятчийски щандове. Позната от работилницата предлага да опитате една техника заедно.", "Craft stalls are going up by the river for Palm Sunday. Someone from the workshop offers to try a technique with you."),
    source: "https://www.lovech.bg/bg/novini/tsvetnitsa-v-lovech-2026-e-ofitsialno-otkrita",
  },
  story: {
    opening: {
      title: t("Щанд до Покрития мост", "A stall by the Covered Bridge"),
      body: t("Майсторка иска да покани хората да пробват занаята си. Търси прост начин да обясни първата стъпка.", "A craftswoman wants visitors to try her craft. She needs a simple way to explain the first step."),
      task: t("Подготви демонстрация", "Prepare a demonstration"),
      outcome: t("Направи образец за първия посетител. След час вече го пробваше цяла група.", "You made a sample for the first visitor. An hour later a whole group was trying it."),
    },
    continuation: {
      title: t("Твое място на щанда", "Your own place at the stall"),
      body: t("Майсторката предлага ъгъл за нещо, което ти си направил. Имаш време да подготвиш само една серия.", "The craftswoman offers a corner for something you made. You have time to prepare only one batch."),
      task: t("Представи своята работа", "Present your own work"),
      outcome: t("Хората се заговориха за материала. Двама поискаха да видят как ще изглежда следващата ти серия.", "Visitors talked about the material. Two asked what your next batch would look like."),
    },
  },
  community: {
    title: t("Място за панаир край Осъм", "Space for a fair by the Osam"),
    body: t("Организаторите искат повече щандове, а хората с колички настояват да остане свободен проход.", "Organizers want more stalls, and people with prams want a route that stays clear."),
  },
} satisfies CityLifeProfile;

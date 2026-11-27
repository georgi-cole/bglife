import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 58997,
  climate: "plain",
  places: [t("площад „Освобождение“", "Osvobozhdenie Square"), t("алеята край Тунджа", "the path along the Tundzha")],
  childhood: {
    body: t("На площада все още има парчета цветна хартия от украса. Познаваш коя е твоята по петното от лепило.", "Pieces of coloured paper from the decorations are still in the square. You recognize yours by a spot of glue."),
    line: t("„Прибери се покрай Тунджа. Ще те чакам там, дето се вижда мостът.“", "“Come home along the Tundzha. I’ll wait where you can see the bridge.”"),
  },
  occasion: {
    months: [2, 3],
    body: t("За „Кукерландия“ участници репетират с костюми. Група приятели иска да документирате как изглежда подготовката.", "Performers rehearse in costume for Kukerlandia. Your friends want to document what goes into the preparations."),
    source: "https://yambol.bg/news/zapochva-priemat-na-zayavki-za-uchastie-v-kukerlandia-yambol",
  },
  story: {
    opening: {
      title: t("Кукерски звън в запис", "Mummers’ bells on tape"),
      body: t("Групата иска кратко видео за подготовката. Можеш да започнеш от един човек и една репетиция.", "Your group wants a short video about the preparations. You can start with one person and one rehearsal."),
      task: t("Снимай репетицията", "Film the rehearsal"),
      outcome: t("Запази момента, в който се чуват само хлопките. Човекът от групата поиска да покаже записа на семейството си.", "You kept the moment when you could hear only the bells. One performer asked to show the recording to their family."),
    },
    continuation: {
      title: t("Кино след дефилето", "A screening after the parade"),
      body: t("Приятел от проекта предлага да покажете записа заедно със снимки на други участници.", "A friend from the project suggests showing the film with photographs from other participants."),
      task: t("Подреди общата прожекция", "Arrange the shared screening"),
      outcome: t("Събра гласове от няколко семейства. После едно от децата поиска да снима следващата репетиция.", "You collected voices from several families. Afterwards, a child asked to film the next rehearsal."),
    },
  },
  community: {
    title: t("Алея за общо ползване", "Sharing the riverside path"),
    body: t("Бегачи, колоездачи и хора с кучета обсъждат къде има нужда от повече място по алеята.", "Runners, cyclists and dog walkers discuss where the path needs more space."),
  },
} satisfies CityLifeProfile;

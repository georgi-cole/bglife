import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 43229,
  climate: "foothills",
  places: [t("площад „Възраждане“", "Vazrazhdane Square"), t("парк „Маркотея“", "Markoteya Park")],
  childhood: {
    body: t("Прибираш картонена опашка от репетиция и я носиш през площада като главен реквизитор.", "You salvage a cardboard tail after rehearsal and carry it across the square like the head props manager."),
    line: t("„Дръж котката за опашката. Така поне няма да падне.“", "“Hold the cat by the tail. At least it won’t fall.”"),
  },
  occasion: {
    months: [5],
    body: t("Преди карнавала в квартала боядисват реквизита. Някой току-що е объркал реда на табелите.", "The neighbourhood is painting props before Carnival. Someone has just mixed up the signs."),
    source: "https://carnival.gabrovo.bg/bg/program/",
  },
  story: {
    opening: {
      title: t("Реквизит, който се движи", "A prop that moves"),
      body: t("В карнавалната работилница искат лек реквизит с подвижна част. Имаш остатъци от материали и помощ от човек, който ремонтира машини.", "The Carnival workshop wants a light prop with a moving part. You have leftover materials and help from someone who repairs machinery."),
      task: t("Сглоби пробен механизъм", "Build a prototype"),
      outcome: t("Направи го да се движи, без да тежи на човека, който го носи. Екипът запази чертежа ти.", "You made it move without weighing down the person carrying it. The team kept your drawing."),
    },
    continuation: {
      title: t("Механизмът оживява", "The mechanism comes to life"),
      body: t("Екипът готви нов модел. Иска да покажеш на участниците как да повторят сглобяването.", "The team is making a new model. They want you to show participants how to build it again."),
      task: t("Води сглобяването", "Lead the build"),
      outcome: t("Първата група намери по-евтин начин. Записахте го до чертежа.", "The first group found a cheaper way. You put the tip next to the drawing."),
    },
  },
  community: {
    title: t("Място за работилница", "A place for a workshop"),
    body: t("Събират се идеи свободно помещение да се ползва за ремонти и занаяти. Съседите питат как ще се ограничи шумът.", "Ideas are being collected for using a vacant room for repairs and crafts. Neighbours ask how noise will be limited."),
  },
} satisfies CityLifeProfile;

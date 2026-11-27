import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 88058,
  climate: "plain",
  places: [t("площад „Възраждане“", "Vazrazhdane Square"), t("алеите в Скобелевия парк", "the trails in Skobelev Park")],
  childhood: {
    body: t("На площада си измисляте задача да минете, без да стъпвате в очертанията на плочките.", "In the square, you invent a game where you can’t step on any paving lines."),
    line: t("„Първо отиваме до парка. Панорамата ще я видим после.“", "“We’ll go to the park first. We can see the Panorama later.”"),
  },
  occasion: {
    months: [5], day: 15,
    body: t("За 15 май има празнична програма. Ученическият клуб предлага да помогнете да ориентирате хората между събитията.", "There’s a programme of events for May 15. Your school club suggests helping people find their way between them."),
    source: "https://www.pleven.bg/bg/novini/pleven-praznuva-tarzhestvena-sesiya-ritual-i-kontserti-v-pleven-v-praznichniya-15-may",
  },
  story: {
    opening: {
      title: t("Демонстрация по науки", "A science demonstration"),
      body: t("Група студенти от Медицинския университет подготвя занимание за ученици. Иска да пробва обясненията пред някого.", "A group from the Medical University is preparing a workshop for pupils. They need someone to try the explanations on."),
      task: t("Пробвай заниманието", "Try the activity"),
      outcome: t("Зададе въпроса, който екипът беше забравил да покрие. Добавиха го в началото на демонстрацията.", "You asked the question the team had forgotten to cover. They put it at the start of the demonstration."),
    },
    continuation: {
      title: t("Въпроси за следващия клас", "Questions for the next class"),
      body: t("Същият екип те кани да подготвиш материали за следващата група.", "The same team invites you to prepare materials for the next group."),
      task: t("Направи учебните материали", "Make the learning materials"),
      outcome: t("Добави карти за различни възрасти. Учениците започнаха да си задават въпроси едни на други.", "You made cards for different ages. Soon the pupils were asking each other questions."),
    },
  },
  community: {
    title: t("Достъп до Кайлъка", "Access to Kaylaka"),
    body: t("На квартална среща се обсъждат пейки и спирка близо до входа, за да могат повече хора да стигат до парка.", "A neighbourhood meeting discusses benches and a stop near the entrance so more people can reach the park."),
  },
} satisfies CityLifeProfile;

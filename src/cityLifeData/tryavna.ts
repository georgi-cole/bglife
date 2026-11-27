import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 6809,
  climate: "foothills",
  places: [t("каменният мост в Трявна", "Tryavna’s stone bridge"), t("пътеката към Боженци", "the trail towards Bozhentsi")],
  childhood: {
    body: t("На каменния мост се спираш да гледаш как водата минава под арката. Оставаш последен, защото все искаш още малко.", "On the stone bridge you stop to watch the water pass under the arch. You’re always last because you want one more minute."),
    line: t("„Оттука се вижда часовникът. Туй е нашата уговорка за среща.“", "“You can see the clock from here. This is where we agreed to meet.”"),
  },
  occasion: {
    months: [6],
    body: t("За Славейковите празници в града се прави четене. Съсед предлага да донесете любимо стихотворение и да разкажете защо сте го избрали.", "There is a reading for the Slaveykov celebrations. A neighbour suggests bringing a favourite poem and saying why you picked it."),
    source: "https://tryavna.bg/ot-18-do-21-yuni-v-tryavna-shte-se-provedat-prestizhnite-natsionalni-slavejkovi-praznitsi-2026/",
  },
  story: {
    opening: {
      title: t("Първо изделие в Трявна", "A first piece in Tryavna"),
      body: t("Майстор в Трявна ти показва как една линия ляга по дървото. Дава ти парче за проба и време след училище.", "A woodcarver in Tryavna shows you how a line follows the grain. You get a scrap to practise on and some time after school."),
      task: t("Довърши изделието", "Finish the piece"),
      outcome: t("Изпили ръба и запази скицата. Майсторът предложи да занесеш изделието, когато пак се срещнете.", "You filed the edge and kept the sketch. The woodcarver asked you to bring the piece to your next meeting."),
    },
    continuation: {
      title: t("Изделие за изложба", "A piece for an exhibition"),
      body: t("Майсторът помни първото ти изделие. Кани те да го покажеш редом с едно от новите неща, които правиш.", "The woodcarver remembers your first piece and invites you to show it alongside something newer."),
      task: t("Подготви двете изделия", "Prepare both pieces"),
      outcome: t("Показа ги с първата скица. Някой забеляза каква грешка вече не допускаш и те попита как си я поправил.", "You showed them with the original sketch. Someone noticed a mistake you no longer make and asked how you fixed it."),
    },
  },
  community: {
    title: t("Място за ученици в ателиетата", "Room for learners in the workshops"),
    body: t("Майстори и семейства обсъждат часове, когато младежите могат да пробват занаят след училище.", "Craftspeople and families discuss times when young people could try a craft after school."),
  },
} satisfies CityLifeProfile;

import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 26470,
  climate: "danube",
  places: [t("площад „Свобода“ в Силистра", "Silistra’s Svoboda Square"), t("езерото Сребърна край Силистра", "Lake Srebarna near Silistra")],
  childhood: {
    body: t("Край Дунавския парк възрастен ти показва снимка на същия бряг от преди много години. Търсите кое дърво още е там.", "By Danube Park, an adult shows you a picture of the same bank from years ago. You look for a tree that’s still there."),
    line: t("„Туй дърво е същото. Виж как се е извило.“", "“That’s the same tree. Look how it’s bent.”"),
  },
  occasion: {
    months: [9], day: 14,
    body: t("На Кръстовден има градски празник. Някои семейства се срещат след службата, други отиват направо на общата програма.", "On the Feast of the Cross, there’s a City Day celebration. Some families meet after the service and others go straight to the public events."),
    source: "https://obs-silistra.com/2026/09/14/privetstvie-po-povod-praznika-na-grad-silistra-krastovden-2/",
  },
  story: {
    opening: {
      title: t("Реката в семейния албум", "The river in the family album"),
      body: t("Близък предлага да запишете разказ как се е променил брегът, преди снимките да се разпилеят.", "Someone close suggests recording how the riverbank changed before the photographs are scattered."),
      task: t("Запиши разказа", "Record the story"),
      outcome: t("Постави снимките една до друга и добави по едно изречение от човека, който ги помни.", "You laid out the photos and added a sentence from the person who remembers them."),
    },
    continuation: {
      title: t("Албум от два бряга", "An album from two banks"),
      body: t("В читалището научиха за снимките и предложиха среща, на която други хора да добавят свои.", "The community centre heard about the pictures and suggested a meet-up where others could add their own."),
      task: t("Събери снимките на едно място", "Bring the photos together"),
      outcome: t("По две снимки открихте един и същ ден от различни места. Някой най-сетне позна човека на заден план.", "Two pictures showed the same day from different spots. Someone finally recognized the person in the background."),
    },
  },
  community: {
    title: t("Къде да има пейки", "Where to put the benches"),
    body: t("Възрастни хора и млади семейства предлагат различни места за почивка по пътя към Дунавския парк.", "Older residents and young families propose different places to rest on the way to Danube Park."),
  },
} satisfies CityLifeProfile;

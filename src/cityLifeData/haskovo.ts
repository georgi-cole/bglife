import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 62923,
  climate: "plain",
  places: [t("парк „Ямача“", "Yamacha Park"), t("парк „Лебеда“", "Lebeda Park")],
  childhood: {
    body: t("От Ямача се опитваш да познаеш кой покрив е на човека, който те чака долу. Всички покриви изведнъж си приличат.", "From Yamacha, you try to pick out the roof of the person waiting below. Suddenly every roof looks alike."),
    line: t("„Ще минем през Кенана, ама първо да пием вода.“", "“We’ll go through Kenana, but let’s get some water first.”"),
  },
  occasion: {
    months: [9], day: 8,
    body: t("За Деня на Хасково някои семейства се събират след църковния празник. Други се срещат направо на площад „Свобода“ за общата програма.", "On Haskovo City Day, some families gather after the church celebration. Others meet straight at Svoboda Square for the public programme."),
    source: "https://www.haskovo.bg/bg/novini/haskovo-praznuva-prez-septemvri-gradskite-prostranstva-se-prevrashtat-v-stseni-po-povod-8-septemvri-rozhdestvo-na-presveta-bogoroditsa-i-den-na-haskovo",
  },
  story: {
    from: 16,
    opening: {
      title: t("Занимание в Кенана", "An activity in Kenana"),
      body: t("Група приятели планира игри за различни възрасти. Търсят човек да направи правила, които се обясняват за минута.", "Friends are planning games for different ages. They need rules they can explain in a minute."),
      task: t("Направи бързи правила", "Write quick rules"),
      outcome: t("Пробвахте ги с децата и се наложи да смените едно правило на място. След това никой не искаше да спира.", "You tried them with the children and changed one on the spot. After that nobody wanted to stop."),
    },
    continuation: {
      title: t("Клуб с редовни срещи", "A club with regular meet-ups"),
      body: t("Организаторите искат да направят срещите редовни. Молят те да подготвиш първото занимание, за което поемат разходите.", "The organizers want to meet regularly. They ask you to make the first session and offer to cover expenses."),
      task: t("Организирай първата среща", "Organize the first meet-up"),
      outcome: t("Отбеляза какво може да се ползва повторно. На финала вече имаше доброволец да води следващата среща.", "You marked what could be reused. By the end, someone had volunteered to lead the next session."),
      pay: 3500,
    },
  },
  community: {
    title: t("Място за занимания в жегите", "A place for activities in the heat"),
    body: t("Спортна група и родители търсят общо място на сянка. Обсъждат и различни часове за ползване.", "A sports group and parents want a shaded space they can share. They also discuss using it at different times."),
  },
} satisfies CityLifeProfile;

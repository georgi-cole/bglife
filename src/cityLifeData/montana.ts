import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 34614,
  climate: "plain",
  places: [t("Младежкият дом в Монтана", "Montana Youth Centre"), t("язовир „Огоста“ край Монтана", "Ogosta Reservoir near Montana")],
  childhood: {
    body: t("Отворен прозорец на Младежкия дом пуска няколко ноти навън. Опитваш се да ги повториш като подсвиркване.", "An open window at the Youth Centre lets a few notes out. You try to whistle them back."),
    line: t("„Чуй пак. Първата нота още не се получава.“", "“Listen again. That first note isn’t quite right yet.”"),
  },
  occasion: {
    months: [5],
    body: t("За празниците на духовите оркестри „Дико Илиев“ има репетиция и среща с гостуващи състави.", "The Diko Iliev wind band festival brings a rehearsal and a chance to meet visiting groups."),
    source: "https://montana-wof.eu/index.php?page=bg-left-menu-diko-program",
  },
  story: {
    opening: {
      title: t("Първата репетиция", "The first rehearsal"),
      body: t("Младежки състав търси помощ за репетициите. Графикът им се засича с други ангажименти и някой трябва да подреди часовете.", "A youth ensemble needs help scheduling rehearsals. Their times clash with other commitments and someone has to sort it out."),
      task: t("Подреди репетициите", "Arrange the rehearsals"),
      outcome: t("Намери час, в който успяха да дойдат и хората от по-далеч. Прибраха твоя график за следващите изяви.", "You found a time that worked for players from farther away. They kept your schedule for future performances."),
    },
    continuation: {
      title: t("Ансамбъл с нови хора", "An ensemble with new faces"),
      body: t("Същият състав посреща нови участници. Искат да измислиш по-лесен начин хората да се запознаят.", "The same ensemble is welcoming newcomers. They ask you to find an easier way for people to get to know one another."),
      task: t("Организирай обща репетиция", "Set up a joint rehearsal"),
      outcome: t("Смеси групите по двойки. Накрая новите участници сами предложиха следващата среща.", "You paired up people from both groups. At the end, the newcomers suggested the next meeting themselves."),
    },
  },
  community: {
    title: t("Зала за репетиции", "A rehearsal hall"),
    body: t("Музиканти и спортни групи искат да ползват едно помещение. Общият проблем е кой има достъп вечер.", "Musicians and sports groups want to use the same room. Access in the evenings is the sticking point."),
  },
} satisfies CityLifeProfile;

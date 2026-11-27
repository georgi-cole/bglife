import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 53693,
  climate: "plain",
  places: [t("градският пазар в Пазарджик", "Pazardzhik’s city market"), t("крайбрежната алея покрай Марица", "the path along the Maritsa")],
  childhood: {
    body: t("При пазара различаваш два продавача само по начина, по който викат цената на доматите.", "At the market you can tell two vendors apart by the way they call out the price of tomatoes."),
    line: t("„До Острова ще минем по-късно, първо да оставим торбите.“", "“We’ll go to Ostrova later. Let’s drop the bags off first.”"),
  },
  occasion: {
    months: [5], day: 21,
    body: t("За 21 май предстои градски празник. Семейство от квартала кани децата да занесат рисунки за общо табло.", "City Day is coming on May 21. A neighbourhood family invites children to bring drawings for a shared display."),
    source: "https://pazardzhik.bg/bg/sabitiya/pazardzhik-otbelyazva-praznika-na-grada-s-bogata-praznichna-programa-na-21-may",
  },
  story: {
    opening: {
      title: t("Събота на Острова", "Saturday on Ostrova Island"),
      body: t("Приятели готвят спортен ден в парк „Острова“. Едни искат състезание, други идват за игра без класиране.", "Friends are planning a sports day in Ostrova Park. Some want a competition and others just want to play without rankings."),
      task: t("Планирай игрите", "Plan the games"),
      outcome: t("Подреди двете занимания по различно време. Накрая участниците си размениха отборите.", "You scheduled the two activities at different times. By the end, participants had swapped teams."),
    },
    continuation: {
      title: t("Спортен ден за целия квартал", "Sports day for the neighbourhood"),
      body: t("Познат от първата среща предлага второ издание и иска да включите по-малки деца и възрастни.", "Someone from the first meet-up suggests another one, with younger children and older neighbours included."),
      task: t("Направи различни маршрути", "Plan different routes"),
      outcome: t("Подготви къса и дълга обиколка с общ финал. Повече семейства останаха до края.", "You planned a short and a long route with a shared finish. More families stayed until the end."),
    },
  },
  community: {
    title: t("Безопасен път до Острова", "A safer route to Ostrova"),
    body: t("Велообщността и съседите, които се придвижват по-бавно предлагат различно разпределение на пространството по алеята.", "Cyclists and slower walkers suggest different ways to share space on the path."),
  },
} satisfies CityLifeProfile;

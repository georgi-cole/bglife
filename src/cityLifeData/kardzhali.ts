import { t, type CityLifeProfile } from "../cityLifeModel.ts";

export default {
  population: 42250,
  climate: "foothills",
  places: [t("централният пазар в Кърджали", "Kardzhali’s central market"), t("алеите край Водното огледало", "the paths by the Water Mirror")],
  childhood: {
    body: t("На пазара се чудиш как да огледаш чушките между толкова хора. Един продавач се усмихва и те пуска отпред.", "At the market you wonder how to see the peppers through the crowd. A vendor smiles and lets you go ahead."),
    line: t("„След пазара ела край Арда. Ще сме на алеята.“", "“Come down to the Arda after the market. We’ll be on the path.”"),
  },
  occasion: {
    months: [10], day: 21,
    body: t("Денят на града събира семейства в центъра. Някой предлага да запишете поздрави на езиците, на които хората сами искат да говорят.", "City Day brings families to the centre. Someone suggests recording greetings in the languages people choose to speak."),
    source: "https://kardjali.bg/index.php?id_news=9837&pid=2%2C2",
  },
  story: {
    opening: {
      title: t("История от музейния двор", "A story from the museum courtyard"),
      body: t("Класът подготвя проект в Регионалния исторически музей. Можеш да сравниш семейни разкази с експозицията.", "Your class has a project at the regional history museum. You can compare family stories with the exhibition."),
      task: t("Запиши два разказа", "Record two stories"),
      outcome: t("Двата спомена за едно и също място се разминаха. Запази ги и двата, за да ги обсъдите в час.", "The two memories of the same place disagreed. You kept both to discuss in class."),
    },
    continuation: {
      title: t("Един ден край Перперикон", "A day near Perperikon"),
      body: t("Уредникът предлага посещение на Перперикон извън града. Пита дали ще подготвиш въпроси за групата.", "The curator suggests a visit to Perperikon outside the city. They ask if you’ll prepare questions for the group."),
      task: t("Подготви въпросите", "Prepare the questions"),
      outcome: t("На терен разбра какво може да се провери на място. После го добави към проекта.", "On the visit you worked out what could be checked on site, then added it to the project."),
    },
  },
  community: {
    title: t("Алея край Арда", "A path along the Arda"),
    body: t("Бегачи, родители и възрастни хора обсъждат къде край реката има нужда от пейки и сянка.", "Runners, parents and older residents discuss where benches and shade are needed along the river."),
  },
} satisfies CityLifeProfile;

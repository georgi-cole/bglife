import { cities, type City } from "./cities.ts";
import type { Text } from "./engine.ts";
import { pathText as t } from "./pathCatalog.ts";
import type { Agenda, Office, Platform, SpecialCareerId, Sport } from "./specialCareerTypes.ts";

export const specialCareers = {
  creator: { title: t("Инфлуенсър", "Influencer"), summary: t("Канал, публика и партньорства", "Channels, audiences and partnerships"), minAge: 14 },
  actor: { title: t("Актьорство", "Acting"), summary: t("Прослушвания, сцена и екран", "Auditions, stage and screen"), minAge: 8 },
  athlete: { title: t("Спортист", "Athlete"), summary: t("Школа, клуб и състезания", "Academy, club and competition"), minAge: 7 },
  politics: { title: t("Политика", "Politics"), summary: t("Кампании, избори и мандати", "Campaigns, elections and public office"), minAge: 16 },
} satisfies Record<SpecialCareerId, { title: Text; summary: Text; minAge: number }>;
export const specialCareerIds: SpecialCareerId[] = ["creator", "actor", "athlete", "politics"];

export const platforms = {
  youtube: { title: t("YouTube", "YouTube"), format: t("Дълго видео", "Long-form video"), short: t("Shorts", "Shorts"), reach: 1.05 },
  instagram: { title: t("Instagram", "Instagram"), format: t("Reel", "Reel"), short: t("История", "Story"), reach: 1 },
  tiktok: { title: t("TikTok", "TikTok"), format: t("Кратко видео", "Short video"), short: t("Серия от клипове", "Video series"), reach: 1.35 },
} satisfies Record<Platform, { title: Text; format: Text; short: Text; reach: number }>;

export const actingMedia = {
  theatre: t("Театър", "Theatre"), film: t("Кино", "Film"), series: t("Сериал", "TV series"), voice: t("Озвучаване", "Voice acting"),
};
type Medium = keyof typeof actingMedia;
export type Project = {
  id: string; city: City; venue: Text; title: Text; medium: Medium;
  role: "debut" | "support" | "lead"; skill: number; years: number; pay: number;
};
const project = (id: string, city: City, venue: Text, title: Text, medium: Medium,
  role: Project["role"], skill: number, years: number, pay: number): Project =>
  ({ id, city, venue, title, medium, role, skill, years, pay });
const studio = t("Независима продукция", "Independent production");
const voiceStudio = t("Студио за дублаж", "Dubbing studio");
// Production titles and open roles are simulated. Venue names locate the scene.
export const actingProjects = [
  project("sofia-background", "sofia", studio, t("Под последния мост", "Under the Last Bridge"), "film", "debut", 12, 1, .54),
  project("sofia-dub", "sofia", voiceStudio, t("Парцаленият дракон", "The Rag Dragon"), "voice", "support", 30, 1, .77),
  project("sofia-series", "sofia", studio, t("Смяна след полунощ", "Shift After Midnight"), "series", "support", 43, 2, 1.16),
  project("sofia-national", "sofia", t("Народен театър „Иван Вазов“", "Ivan Vazov National Theatre"), t("Чуждият прозорец", "The Stranger's Window"), "theatre", "lead", 70, 2, 1.27),
  project("sofia-film", "sofia", studio, t("След ехо", "After the Echo"), "film", "lead", 78, 1, 1.95),
  project("plovdiv-extra", "plovdiv", studio, t("Улицата на липите", "Linden Street"), "series", "debut", 12, 1, .58),
  project("plovdiv-stage", "plovdiv", t("Драматичен театър – Пловдив", "Drama Theatre Plovdiv"), t("Репетиция за сбогуване", "Rehearsal for Goodbye"), "theatre", "support", 37, 2, .95),
  project("varna-stage", "varna", t("ДТ „Стоян Бъчваров“", "Stoyan Bachvarov Drama Theatre"), t("В хотел „Бриз“", "At the Breeze Hotel"), "theatre", "support", 36, 2, .91),
  project("varna-camera", "varna", studio, t("Фарът не спи", "The Lighthouse Stays Awake"), "film", "lead", 67, 1, 1.46),
  project("ruse-stage", "ruse", t("ДТ „Сава Огнянов“", "Sava Ognyanov Drama Theatre"), t("Корабът в шест", "The Boat at Six"), "theatre", "support", 33, 2, .87),
  project("burgas-film", "burgas", studio, t("Последният плаж", "The Last Beach"), "film", "support", 35, 1, .9),
  project("burgas-stage", "burgas", t("ДТ „Адриана Будевска“", "Adriana Budevska Drama Theatre"), t("Година на вятъра", "A Year of Wind"), "theatre", "lead", 64, 2, 1.08),
  project("gabrovo-stage", "gabrovo", t("ДТ „Рачо Стоянов“", "Racho Stoyanov Drama Theatre"), t("Номер на дома", "The House Number"), "theatre", "debut", 18, 1, .66),
  project("tarnovo-stage", "veliko-tarnovo", t("МДТ „Константин Кисимов“", "Konstantin Kisimov Music and Drama Theatre"), t("Зелената стая", "The Green Room"), "theatre", "support", 34, 2, .89),
];
export const findProject = (id: string) => actingProjects.find(p => p.id === id);

export const sports: Record<Sport, { title: Text; league: Text; team: boolean; peak: number }> = {
  football: { title: t("Футбол", "Football"), league: t("Футболно първенство", "Football league"), team: true, peak: 32 },
  volleyball: { title: t("Волейбол", "Volleyball"), league: t("Волейболно първенство", "Volleyball league"), team: true, peak: 33 },
  tennis: { title: t("Тенис", "Tennis"), league: t("Турнири и ранглиста", "Tournaments and ranking"), team: false, peak: 31 },
};
type Division = "male" | "female" | "open";
export type Club = { id: string; city: City; name: Text; sport: Sport; division: Division; level: 1 | 2; strength: number };
const club = (id: string, city: City, name: Text, sport: Sport, division: Division, level: Club["level"], strength: number): Club =>
  ({ id, city, name, sport, division, level, strength });
const football = (id: string, city: City, bg: string, en: string, strength: number, level: Club["level"] = 1, division: Division = "male") =>
  club(id, city, t(bg, en), "football", division, level, strength);
const volley = (id: string, city: City, bg: string, en: string, strength: number, division: Division) =>
  club(id, city, t(bg, en), "volleyball", division, 1, strength);

export const clubs = [
  football("levski", "sofia", "Левски София", "Levski Sofia", 90),
  football("cska", "sofia", "ЦСКА София", "CSKA Sofia", 89),
  football("cska-1948", "sofia", "ЦСКА 1948", "CSKA 1948", 76),
  football("loko-sofia", "sofia", "Локомотив София", "Lokomotiv Sofia", 66),
  football("slavia", "sofia", "Славия", "Slavia", 69),
  football("septemvri", "sofia", "Септември София", "Septemvri Sofia", 60),
  football("ludogorets", "razgrad", "Лудогорец", "Ludogorets", 92),
  football("botev-plovdiv", "plovdiv", "Ботев Пловдив", "Botev Plovdiv", 78),
  football("loko-plovdiv", "plovdiv", "Локомотив Пловдив", "Lokomotiv Plovdiv", 74),
  football("cherno-more", "varna", "Черно море", "Cherno More", 79),
  football("spartak-varna", "varna", "Спартак Варна", "Spartak Varna", 65),
  football("botev-vratsa", "vratsa", "Ботев Враца", "Botev Vratsa", 64),
  football("arda", "kardzhali", "Арда Кърджали", "Arda Kardzhali", 76),
  football("beroe", "stara-zagora", "Берое", "Beroe", 68),
  football("dunav", "ruse", "Дунав Русе", "Dunav Ruse", 62),
  football("dobrudja", "dobrich", "Добруджа", "Dobrudzha", 61),
  football("etar", "veliko-tarnovo", "Етър", "Etar", 59, 2),
  football("pirin", "blagoevgrad", "Пирин Благоевград", "Pirin Blagoevgrad", 63, 2),
  football("yantra", "gabrovo", "Янтра Габрово", "Yantra Gabrovo", 58, 2),
  football("nsa-w", "sofia", "НСА", "NSA", 84, 1, "female"),
  football("ofk-sofia-w", "sofia", "ОФК София 1992", "OFK Sofia 1992", 75, 1, "female"),
  football("paldin-w", "plovdiv", "Пълдин", "Paldin", 74, 1, "female"),
  football("ludogorets-w", "razgrad", "Лудогорец 1945", "Ludogorets 1945", 81, 1, "female"),
  football("etar-w", "veliko-tarnovo", "Етър ВТ", "Etar VT", 69, 1, "female"),
  football("pirin-w", "blagoevgrad", "Пирин 22", "Pirin 22", 68, 1, "female"),
  volley("levski-v", "sofia", "Левски София", "Levski Sofia", 91, "male"),
  volley("loko-avia-v", "plovdiv", "Локомотив Авиа", "Lokomotiv Avia", 87, "male"),
  volley("neftohimik-v", "burgas", "Нефтохимик 2010", "Neftohimik 2010", 84, "male"),
  volley("beroe-v", "stara-zagora", "Берое 2016", "Beroe 2016", 75, "male"),
  volley("maritsa-v", "plovdiv", "Марица Пловдив", "Maritsa Plovdiv", 91, "female"),
  volley("maritsa-2022-v", "plovdiv", "Марица 2022", "Maritsa 2022", 72, "female"),
  volley("levski-wv", "sofia", "Левски София", "Levski Sofia", 83, "female"),
  volley("cska-wv", "sofia", "ЦСКА", "CSKA", 79, "female"),
  club("levski-tennis", "sofia", t("ТК „Левски“", "TC Levski"), "tennis", "open", 1, 78),
  club("lokomotiv-tennis", "plovdiv", t("ТК „Локомотив“", "TC Lokomotiv"), "tennis", "open", 1, 77),
  club("more-tennis", "varna", t("ТК „Черно море Елит“", "TC Cherno More Elite"), "tennis", "open", 1, 76),
];
export const findClub = (id: string) => clubs.find(item => item.id === id);
export function clubLeague(item: Club): Text {
  if (item.sport === "football") return item.division === "female" ? t("Държавно първенство за жени", "Women's national championship")
    : item.level === 1 ? t("Първа лига", "First League") : t("Втора лига", "Second League");
  if (item.sport === "volleyball") return item.division === "female" ? t("Демакс+ лига", "Demax+ League") : t("Суперволей", "Super Volley");
  return sports.tennis.league;
}

export const agendas: Record<Agenda, Text> = {
  education: t("Образование", "Education"), transport: t("Транспорт", "Transport"), economy: t("Икономика", "Economy"),
};

export const offices = {
  council: { title: t("Общински съветник", "Municipal councillor"), employer: t("Общински съвет", "Municipal council"), minAge: 18, years: 4, phase: 3, local: true, pay: .54, backing: 14 },
  mayor: { title: t("Кмет", "Mayor"), employer: t("Община", "Municipality"), minAge: 18, years: 4, phase: 3, local: true, pay: 1.55, backing: 35 },
  assembly: { title: t("Народен представител", "Member of Parliament"), employer: t("Народно събрание", "National Assembly"), minAge: 21, years: 4, phase: 2, local: false, pay: 2.5, backing: 36 },
  president: { title: t("Президент", "President"), employer: t("Президентство", "Presidency"), minAge: 40, years: 5, phase: 1, local: false, pay: 4.1, backing: 62 },
  premier: { title: t("Министър-председател", "Prime Minister"), employer: t("Министерски съвет", "Council of Ministers"), minAge: 21, years: 4, phase: 2, local: false, pay: 3.35, backing: 58 },
} satisfies Record<Office, { title: Text; employer: Text; minAge: number; years: number; phase: number; local: boolean; pay: number; backing: number }>;
export function officeEmployer(office: Office, city: City): Text {
  const item = offices[office];
  return item.local ? t(item.employer.bg + " · " + cities[city].name.bg, item.employer.en + " · " + cities[city].name.en) : item.employer;
}

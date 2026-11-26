import type { District } from "./mortalityData.ts";

type CityProfile = {
  name: { bg: string; en: string };
  district: District;
  landscape: "mountain" | "coast" | "danube" | "inland" | "capital";
  landmark: { bg: string; en: string };
  districtCentre?: false;
};

function city(bg: string, en: string, district: District, landscape: CityProfile["landscape"],
  landmarkBg: string, landmarkEn: string, districtCentre?: false): CityProfile {
  return { name: { bg, en }, district, landscape, landmark: { bg: landmarkBg, en: landmarkEn }, districtCentre };
}

// NSI settlement register. Sofia is the administrative centre of both SOF and SFO.
// https://www.nsi.bg/nrnm/special/ekatte/regions
export const cities = {
  blagoevgrad: city("Благоевград", "Blagoevgrad", "BLG", "mountain", "Вароша", "Varosha"),
  burgas: city("Бургас", "Burgas", "BGS", "coast", "Морската градина", "the Sea Garden"),
  varna: city("Варна", "Varna", "VAR", "coast", "Морската градина", "the Sea Garden"),
  "veliko-tarnovo": city("Велико Търново", "Veliko Tarnovo", "VTR", "mountain", "Самоводската чаршия", "Samovodska Charshia"),
  vidin: city("Видин", "Vidin", "VID", "danube", "Баба Вида", "Baba Vida"),
  vratsa: city("Враца", "Vratsa", "VRC", "mountain", "Вратцата", "Vratsata Gorge"),
  gabrovo: city("Габрово", "Gabrovo", "GAB", "mountain", "Домът на хумора и сатирата", "the Museum of Humour and Satire"),
  dobrich: city("Добрич", "Dobrich", "DOB", "inland", "Старият Добрич", "Old Dobrich"),
  kardzhali: city("Кърджали", "Kardzhali", "KRZ", "mountain", "парк „Арпезос“", "Arpezos Park"),
  kyustendil: city("Кюстендил", "Kyustendil", "KNL", "mountain", "Хисарлъка", "Hisarlaka"),
  lovech: city("Ловеч", "Lovech", "LOV", "mountain", "Покритият мост", "the Covered Bridge"),
  montana: city("Монтана", "Montana", "MON", "inland", "парк „Слънчевата градина“", "Sunny Garden"),
  pazardzhik: city("Пазарджик", "Pazardzhik", "PAZ", "inland", "парк „Острова“", "Ostrova Park"),
  pernik: city("Перник", "Pernik", "PER", "mountain", "крепостта Кракра", "Krakra Fortress"),
  pleven: city("Плевен", "Pleven", "PVN", "inland", "Кайлъка", "Kaylaka Park"),
  plovdiv: city("Пловдив", "Plovdiv", "PDV", "inland", "Старият град", "the Old Town"),
  razgrad: city("Разград", "Razgrad", "RAZ", "inland", "парк „Градската градина“", "the City Garden"),
  ruse: city("Русе", "Ruse", "RSE", "danube", "кеят на Дунав", "the Danube quay"),
  silistra: city("Силистра", "Silistra", "SLS", "danube", "Дунавският парк", "Danube Park"),
  sliven: city("Сливен", "Sliven", "SLV", "mountain", "Сините камъни", "the Blue Rocks"),
  smolyan: city("Смолян", "Smolyan", "SML", "mountain", "Смолянските езера", "the Smolyan Lakes"),
  sofia: city("София", "Sofia", "SOF", "capital", "Южният парк", "South Park"),
  "stara-zagora": city("Стара Загора", "Stara Zagora", "SZR", "inland", "Аязмото", "Ayazmoto Park"),
  targovishte: city("Търговище", "Targovishte", "TGV", "inland", "парк „Борово око“", "Borovo Oko Park"),
  haskovo: city("Хасково", "Haskovo", "HKV", "inland", "Кенана", "Kenana Park"),
  shumen: city("Шумен", "Shumen", "SHU", "mountain", "Шуменското плато", "the Shumen Plateau"),
  yambol: city("Ямбол", "Yambol", "JAM", "inland", "Безистенът", "the Bezisten"),
  samokov: city("Самоков", "Samokov", "SFO", "mountain", "Голямата чешма", "the Great Fountain", false),
  tryavna: city("Трявна", "Tryavna", "GAB", "mountain", "Часовниковата кула", "the Clock Tower", false),
} satisfies Record<string, CityProfile>;

export type City = keyof typeof cities;
export const cityIds = Object.keys(cities) as City[];
export const isCity = (value: unknown): value is City => typeof value === "string" && Object.hasOwn(cities, value);
export function inCityBg(id: City): string {
  const name = cities[id].name.bg;
  return (/^[ВФ]/.test(name) ? "във " : "в ") + name;
}

export const cityArt = (id: City): "tryavna" | "sofia" | undefined =>
  id === "tryavna" || id === "sofia" ? id : undefined;

import type { City } from "./cities.ts";
import type { Text } from "./engine.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

export const studyFields = {
  sport: t("Спорт", "Sport"),
  general: t("Общо образование", "General education"),
  stem: t("Математика и природни науки", "Mathematics and natural sciences"),
  humanities: t("Хуманитарни науки", "Humanities"),
  tourism: t("Туризъм", "Tourism"),
  construction: t("Строителство и архитектура", "Construction and architecture"),
  languages: t("Чужди езици", "Foreign languages"),
  business: t("Икономика и бизнес", "Economics and business"),
  engineering: t("Инженерство", "Engineering"),
  textiles: t("Текстил и облекло", "Textiles and apparel"),
  music: t("Музика и изкуства", "Music and arts"),
  woodcarving: t("Дърворезба", "Woodcarving"),
  economics: t("Икономика", "Economics"),
  computing: t("Информатика", "Computer science"),
  navigation: t("Корабоводене", "Navigation"),
  medicine: t("Медицина", "Medicine"),
  history: t("История", "History"),
  nursing: t("Медицинска сестра", "Nursing"),
  pedagogy: t("Педагогика", "Education"),
  agronomy: t("Агрономство", "Agronomy"),
  biotech: t("Биотехнологии", "Biotechnology"),
  transport: t("Транспорт", "Transport"),
  architecture: t("Архитектура", "Architecture"),
  veterinary: t("Ветеринарна медицина", "Veterinary medicine"),
};
export type StudyField = keyof typeof studyFields;
export type SchoolLevel = "primary" | "secondary" | "higher";
export type Enrollment = { city: City; index: number; graduationAge: number };
export type School = { name: Text; level: SchoolLevel; field: StudyField };

export const jobTypes = {
  "university": { label: t("Сътрудник в университетски кампус", "Campus assistant"), pay: 1090000 },
  "hotel": { label: t("Рецепционист", "Hotel receptionist"), pay: 1150000 },
  "electronics": { label: t("Техник електроника", "Electronics technician"), pay: 1410000 },
  "port": { label: t("Сътрудник пристанищна логистика", "Port logistics assistant"), pay: 1280000 },
  "food": { label: t("Оператор в хранително производство", "Food production operator"), pay: 1130000 },
  "shipping": { label: t("Сътрудник в корабна агенция", "Shipping agency assistant"), pay: 1360000 },
  "software": { label: t("Младши софтуерен тестер", "Junior software tester"), pay: 1720000 },
  "become-guide": { label: t("Туристически гид", "Tour guide"), pay: 1150000 },
  "publishing": { label: t("Сътрудник в издателство", "Publishing assistant"), pay: 1190000 },
  "studio": { label: t("Сътрудник в дизайнерско ателие", "Design studio assistant"), pay: 1210000 },
  "border": { label: t("Сътрудник международен транспорт", "International transport assistant"), pay: 1290000 },
  "heritage": { label: t("Музеен сътрудник", "Museum assistant"), pay: 1030000 },
  "agriculture": { label: t("Техник в земеделско стопанство", "Farm technician"), pay: 1150000 },
  "clinic": { label: t("Администратор в здравен център", "Health centre administrator"), pay: 1170000 },
  "building": { label: t("Чертожник в проектантско бюро", "Drafting assistant"), pay: 1260000 },
  "machine": { label: t("Оператор на машини", "Machine operator"), pay: 1300000 },
  "craft": { label: t("Помощник в занаятчийско ателие", "Craft workshop assistant"), pay: 1070000 },
  "machinery": { label: t("Механик на земеделска техника", "Farm machinery mechanic"), pay: 1320000 },
  "trade": { label: t("Сътрудник в търговска фирма", "Trading company assistant"), pay: 1150000 },
  "orchard": { label: t("Организатор на сезонна реколта", "Seasonal harvest coordinator"), pay: 1070000 },
  "spa": { label: t("Рецепционист в балнеохотел", "Spa hotel receptionist"), pay: 1110000 },
  "events": { label: t("Организатор на събития", "Events coordinator"), pay: 1140000 },
  "warehousing": { label: t("Складов координатор", "Warehouse coordinator"), pay: 1240000 },
  "rail": { label: t("Сътрудник железопътна логистика", "Rail logistics assistant"), pay: 1260000 },
  "laboratory": { label: t("Асистент по контрол на качеството", "Quality control assistant"), pay: 1290000 },
  "education": { label: t("Организатор в учебен център", "Education centre coordinator"), pay: 1090000 },
  "textiles": { label: t("Техник в текстилно производство", "Textile technician"), pay: 1120000 },
  "outdoors": { label: t("Сътрудник в център за планински услуги", "Outdoor centre assistant"), pay: 1120000 },
  "metro": { label: t("Координатор в градския транспорт", "Urban transport coordinator"), pay: 1440000 },
  "energy": { label: t("Техник енергийни системи", "Energy systems technician"), pay: 1450000 },
  "animal": { label: t("Администратор във ветеринарна клиника", "Veterinary clinic administrator"), pay: 1090000 },
  "glass": { label: t("Оператор в стъкларско производство", "Glass production operator"), pay: 1190000 },
  "woodcarving": { label: t("Чирак дърворезбар", "Woodcarving apprentice"), pay: 1040000 },
};
export type JobId = keyof typeof jobTypes;

type Path = { schools: readonly School[]; jobs: readonly JobId[] };

function school(raw: string, level: SchoolLevel): School {
  const [bg, en, field = "general"] = raw.split("|");
  return { name: t(bg,en), level, field: field as StudyField };
}
function path(primary: string, first: string, second: string, programs: readonly string[], jobs: readonly JobId[]): Path {
  return { schools: [school(primary, "primary"), school(first, "secondary"), school(second, "secondary"),
    ...programs.map(program => school(program, "higher"))], jobs };
}

// Named institutions are examples for the game. Fields describe the displayed
// study paths. Salaries are annual net amounts in cents for gameplay balancing.
export const cityPaths: Record<City, Path> = {
  "blagoevgrad": path("II ОУ „Димитър Благоев“|Dimitar Blagoev Primary School", "ППМГ „Акад. Сергей Корольов“|Sergey Korolyov Mathematics and Science School|stem", "НХГ „Св. св. Кирил и Методий“|St Cyril and Methodius Humanities School|humanities", ["ЮЗУ „Неофит Рилски“|South-West University|economics","Американски университет в България|American University in Bulgaria|computing"], ["university","hotel","electronics"]),
  "burgas": path("ОУ „Александър Георгиев-Коджакафалията“|Aleksandar Georgiev-Kodzhakafaliyata Primary School", "ППМГ „Акад. Никола Обрешков“|Nikola Obreshkov Mathematics and Science School|stem", "ПГ по туризъм „Проф. д-р Асен Златаров“|Asen Zlatarov Tourism School|tourism", ["Бургаски държавен университет „Проф. д-р Асен Златаров“|Burgas State University|engineering","Бургаски свободен университет|Burgas Free University|computing"], ["port","hotel","food"]),
  "varna": path("ОУ „Петко Р. Славейков“|Petko R. Slaveykov Primary School", "МГ „Д-р Петър Берон“|Petar Beron Mathematics School|stem", "ПГ по туризъм „Проф. д-р Асен Златаров“|Asen Zlatarov Tourism School|tourism", ["ВВМУ „Н. Й. Вапцаров“|Nikola Vaptsarov Naval Academy|navigation","Технически университет – Варна|Technical University of Varna|engineering","Медицински университет – Варна|Medical University of Varna|medicine"], ["shipping","hotel","software"]),
  "veliko-tarnovo": path("ОУ „Бачо Киро“|Bacho Kiro Primary School", "ПМГ „Васил Друмев“|Vasil Drumev Mathematics and Science School|stem", "ПГ по туризъм „Д-р Васил Берон“|Vasil Beron Tourism School|tourism", ["ВТУ „Св. св. Кирил и Методий“|St Cyril and Methodius University of Veliko Tarnovo|history"], ["become-guide","publishing","studio"]),
  "vidin": path("ОУ „Любен Каравелов“|Lyuben Karavelov Primary School", "ППМГ „Екзарх Антим I“|Exarch Antim I Mathematics and Science School|stem", "ПГ по туризъм „Михалаки Георгиев“|Mihalaki Georgiev Tourism School|tourism", [], ["border","heritage","agriculture"]),
  "vratsa": path("НУ „Иванчо Младенов“|Ivancho Mladenov Elementary School", "ППМГ „Акад. Иван Ценов“|Ivan Tsenov Mathematics and Science School|stem", "ПГСА „Димитраки Хаджитошин“|Dimitraki Hadzhitoshin Construction and Architecture School|construction", ["МУ – София, филиал „Проф. д-р Иван Митев“ – Враца|Medical University of Sofia, Vratsa Branch|nursing"], ["clinic","building","become-guide"]),
  "gabrovo": path("ОУ „Неофит Рилски“|Neofit Rilski Primary School", "Национална Априловска гимназия|National Aprilov High School|humanities", "ПМГ „Акад. Иван Гюзелев“|Ivan Gyuzelev Mathematics and Science School|stem", ["Технически университет – Габрово|Technical University of Gabrovo|engineering"], ["machine","electronics","craft"]),
  "dobrich": path("ОУ „Стефан Караджа“|Stefan Karadzha Primary School", "ПМГ „Иван Вазов“|Ivan Vazov Mathematics and Science School|stem", "ЕГ „Гео Милев“|Geo Milev Language School|languages", [], ["agriculture","food","machinery"]),
  "kardzhali": path("ОУ „Пейо Крачолов Яворов“|Peyo Yavorov Primary School", "ЕГ „Христо Ботев“|Hristo Botev Language School|languages", "ПГ по икономика „Алеко Константинов“|Aleko Konstantinov Economics School|business", ["ПУ „Паисий Хилендарски“, филиал „Любен Каравелов“|University of Plovdiv, Lyuben Karavelov Branch|pedagogy"], ["heritage","machine","trade"]),
  "kyustendil": path("II ОУ „Даскал Димитри“|Daskal Dimitri Primary School", "ПМГ „Проф. Емануил Иванов“|Emanuil Ivanov Mathematics and Science School|stem", "ЕГ „Д-р Петър Берон“|Petar Beron Language School|languages", [], ["orchard","heritage","spa"]),
  "lovech": path("ОУ „Васил Левски“|Vasil Levski Primary School", "ПЕГ „Екзарх Йосиф I“|Exarch Joseph I Language School|languages", "ПГ по механоелектротехника|Mechanical and Electrical Engineering School|engineering", [], ["machine","heritage","trade"]),
  "montana": path("I ОУ „Христо Ботев“|Hristo Botev Primary School", "ПМПГ „Св. Климент Охридски“|St Kliment Ohridski Mathematics and Science School|stem", "ГПЧЕ „Петър Богдан“|Petar Bogdan Language School|languages", [], ["machine","food","events"]),
  "pazardzhik": path("ОУ „Проф. Иван Батаклиев“|Ivan Batakliev Primary School", "ПМГ „Константин Величков“|Konstantin Velichkov Mathematics and Science School|stem", "ЕГ „Бертолт Брехт“|Bertolt Brecht Language School|languages", [], ["warehousing","food","clinic"]),
  "pernik": path("VIII ОУ „Кракра Пернишки“|Krakra Pernishki Primary School", "ГПЧЕ „Симеон Радев“|Simeon Radev Language School|languages", "ПМГ „Христо Смирненски“|Hristo Smirnenski Mathematics and Science School|stem", [], ["machine","rail","events"]),
  "pleven": path("ОУ „Д-р Петър Берон“|Petar Beron Primary School", "МГ „Гео Милев“|Geo Milev Mathematics School|stem", "ДФСГ „Интелект“|Intelect Finance and Business School|business", ["Медицински университет – Плевен|Medical University of Pleven|medicine"], ["clinic","warehousing","food"]),
  "plovdiv": path("ОУ „Душо Хаджидеков“|Dusho Hadzhidekov Primary School", "МГ „Акад. Кирил Попов“|Kiril Popov Mathematics School|stem", "ФЕГ „Антоан дьо Сент-Екзюпери“|Antoine de Saint-Exupéry French Language School|languages", ["ПУ „Паисий Хилендарски“|University of Plovdiv|computing","Аграрен университет – Пловдив|Agricultural University of Plovdiv|agronomy","Медицински университет – Пловдив|Medical University of Plovdiv|medicine"], ["electronics","studio","warehousing"]),
  "razgrad": path("ОУ „Иван Сергеевич Тургенев“|Ivan Turgenev Primary School", "ПГПЧЕ „Екзарх Йосиф“|Exarch Joseph Language School|languages", "ППМГ „Акад. Никола Обрешков“|Nikola Obreshkov Mathematics and Science School|stem", ["Русенски университет, филиал Разград|University of Ruse, Razgrad Branch|biotech"], ["food","laboratory","agriculture"]),
  "ruse": path("ОУ „Отец Паисий“|Father Paisiy Primary School", "МГ „Баба Тонка“|Baba Tonka Mathematics School|stem", "АЕГ „Гео Милев“|Geo Milev English Language School|languages", ["Русенски университет „Ангел Кънчев“|University of Ruse|transport"], ["port","machine","events"]),
  "silistra": path("ОУ „Св. св. Кирил и Методий“|St Cyril and Methodius Primary School", "ПМГ „Св. Климент Охридски“|St Kliment Ohridski Mathematics and Science School|stem", "ЕГ „Пейо Яворов“|Peyo Yavorov Language School|languages", ["Русенски университет, филиал Силистра|University of Ruse, Silistra Branch|pedagogy"], ["agriculture","port","education"]),
  "sliven": path("VIII ОУ „Юрий Гагарин“|Yuri Gagarin Primary School", "ППМГ „Добри Чинтулов“|Dobri Chintulov Mathematics and Science School|stem", "ПГТО „Добри Желязков“|Dobri Zhelyazkov Textile and Apparel School|textiles", ["Технически университет – София, ИПФ Сливен|Technical University of Sofia, Sliven Faculty|engineering"], ["textiles","orchard","machine"]),
  "smolyan": path("ОУ „Иван Вазов“|Ivan Vazov Primary School", "ППМГ „Васил Левски“|Vasil Levski Mathematics and Science School|stem", "ЕГ „Иван Вазов“|Ivan Vazov Language School|languages", ["ПУ „Паисий Хилендарски“, филиал Смолян|University of Plovdiv, Smolyan Branch|pedagogy"], ["hotel","craft","outdoors"]),
  "sofia": path("144. СУ „Народни будители“|Narodni Buditeli Secondary School", "СМГ „Паисий Хилендарски“|Sofia Mathematics School|stem", "91. НЕГ „Проф. Константин Гълъбов“|Konstantin Galabov German Language School|languages", ["СУ „Св. Климент Охридски“|Sofia University|computing","Медицински университет – София|Medical University of Sofia|medicine","УНСС|University of National and World Economy|economics","УАСГ|University of Architecture, Civil Engineering and Geodesy|architecture"], ["software","metro","publishing"]),
  "stara-zagora": path("ОУ „Кирил Христов“|Kiril Hristov Primary School", "ППМГ „Гео Милев“|Geo Milev Mathematics and Science School|stem", "ГПЧЕ „Ромен Ролан“|Romain Rolland Language School|languages", ["Тракийски университет|Trakia University|veterinary"], ["energy","clinic","animal"]),
  "targovishte": path("I ОУ „Христо Ботев“|Hristo Botev Primary School", "I СУ „Св. Седмочисленици“|St Sedmochislenitsi Secondary School|general", "ПГИЧЕ „Митрополит Андрей“|Metropolitan Andrey Language School|languages", [], ["glass","trade","warehousing"]),
  "haskovo": path("ОУ „Св. Иван Рилски“|St Ivan Rilski Primary School", "ПМГ „Акад. Боян Петканчин“|Boyan Petkanchin Mathematics and Science School|stem", "ЕГ „Проф. д-р Асен Златаров“|Asen Zlatarov Language School|languages", ["УНСС, Регионален център – Хасково|University of National and World Economy, Haskovo Centre|economics"], ["border","textiles","food"]),
  "shumen": path("II ОУ „Д-р Петър Берон“|Petar Beron Primary School", "ППМГ „Нанчо Попович“|Nancho Popovich Mathematics and Science School|stem", "СУ „Сава Доброплодни“|Sava Dobroplodni Secondary School|music", ["ШУ „Епископ Константин Преславски“|Shumen University|pedagogy"], ["heritage","education","machine"]),
  "yambol": path("ОУ „Любен Каравелов“|Lyuben Karavelov Primary School", "ПМГ „Атанас Радев“|Atanas Radev Mathematics and Science School|stem", "ЕГ „Васил Карагьозов“|Vasil Karagyozov Language School|languages", ["Тракийски университет, Факултет „Техника и технологии“ – Ямбол|Trakia University, Faculty of Engineering and Technology in Yambol|engineering"], ["electronics","agriculture","events"]),
  "samokov": path("СУ „Отец Паисий“|Father Paisiy Secondary School", "Спортно училище „Никола Велчев“|Nikola Velchev Sports School|sport", "ПГ по туризъм|Samokov Tourism School|tourism", [], ["hotel","outdoors","orchard"]),
  "tryavna": path("СУ „Петко Р. Славейков“|Petko R. Slaveykov Secondary School", "СУ „Петко Р. Славейков“|Petko R. Slaveykov Secondary School|general", "НГПИ „Тревненска школа“|Tryavna School of Applied Arts|woodcarving", [], ["woodcarving","heritage","hotel"]),
};

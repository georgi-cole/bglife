import type { City, Text } from "./engine.ts";

export const pathText = (bg: string, en: string): Text => ({ bg, en });
const t = pathText;
export const pathMoney = (euros: number): number => Math.round(euros * 100);

export const subjects = {
  bulgarian: t("Български език и литература", "Bulgarian language and literature"),
  math: t("Математика", "Mathematics"),
  english: t("Английски език", "English"),
  german: t("Немски език", "German"),
  spanish: t("Испански език", "Spanish"),
  french: t("Френски език", "French"),
  homeland: t("Родинознание", "My community and the world"),
  world: t("Човекът и природата", "Science and nature"),
  history: t("История и цивилизации", "History and civilizations"),
  geography: t("География и икономика", "Geography and economics"),
  biology: t("Биология", "Biology"),
  chemistry: t("Химия", "Chemistry"),
  computing: t("Информатика и ИТ", "Computer science and IT"),
  art: t("Изобразително изкуство", "Visual arts"),
  craft: t("Дърворезба и практика", "Woodcarving and workshop practice"),
  pe: t("Физическо възпитание", "Physical education"),
} satisfies Record<string, Text>;
export type Subject = keyof typeof subjects;
export type Field = "art" | "tech" | "business" | "law" | "medicine" | "nursing";
export const fields: Record<Field, Text> = {
  art: t("Приложни изкуства", "Applied arts"), tech: t("Информатика и технологии", "Computing and technology"),
  business: t("Икономика", "Economics"), law: t("Право", "Law"), medicine: t("Медицина", "Medicine"),
  nursing: t("Здравни грижи", "Nursing"),
};

export type School = {
  id: string;
  name: Text;
  zone: string;
  primary?: true;
  profile?: Text;
  focus?: readonly Subject[];
  admission?: { cutoff: number; focus: "math" | "bulgarian" | "art" | "balanced" };
  vocational?: Field;
};

export type Program = {
  id: string;
  institution: Text;
  title: Text;
  field: Field;
  years: number;
  fee: { state?: number; paid?: number };
  admission: { subject: Subject; exam?: readonly Subject[]; state?: number; paid?: number };
};
type JobRequirement = "none" | "secondary" | "art" | "tech" | "business" | "law" | "medicine" | "nursing";
export type Job = {
  id: string;
  title: Text;
  employer: Text;
  requirement: JobRequirement;
  wageRatio: number;
  hours: 4 | 8;
  termMonths?: number;
  youth?: true;
};

type CityCatalog = {
  name: Text;
  district: Text;
  benchmark: number;
  essentials: number;
  zones: Readonly<Record<string, Text>>;
  schools: readonly School[];
  programs: readonly Program[];
  jobs: readonly Job[];
};

const su = t("СУ „Св. Климент Охридски“", "Sofia University");
const tu = t("Технически университет – София", "Technical University of Sofia");
const unwe = t("УНСС", "University of National and World Economy");
const mu = t("Медицински университет – София", "Medical University of Sofia");
const nbu = t("Нов български университет", "New Bulgarian University");
const vocationalArts = t("Дърворезба", "Woodcarving");

function job(
  id: string, title: Text, employer: Text, requirement: JobRequirement, wageRatio: number,
  hours: 4 | 8 = 8, termMonths?: number, youth?: true,
): Job {
  return { id, title, employer, requirement, wageRatio, hours, termMonths, youth };
}

// Extend this record when adding a playable City. Salary anchors are NSI district averages,
// Q3 2026, in EUR/month. Institution names are real; admissions, wages and fees are tuned for play.
export const pathCities: Record<City, CityCatalog> = {
  tryavna: {
    name: t("Трявна", "Tryavna"), district: t("област Габрово", "Gabrovo district"),
    benchmark: pathMoney(1134), essentials: pathMoney(425),
    zones: { town: t("Град Трявна", "Tryavna") },
    schools: [
      { id: "slaveykov", zone: "town", name: t("СУ „Петко Р. Славейков“", "Petko R. Slaveykov School"),
        primary: true, profile: t("Общообразователна паралелка", "General studies"), admission: { cutoff: 0, focus: "balanced" } },
      { id: "raykov", zone: "town", name: t("ОУ „Проф. Пенчо Райков“", "Prof. Pencho Raykov Primary School"), primary: true },
      { id: "art-tryavna", zone: "town", name: t("НГПИ „Тревненска школа“", "Tryavna School of Applied Arts"),
        profile: vocationalArts, focus: ["art", "craft"], admission: { cutoff: 58, focus: "art" }, vocational: "art" },
    ],
    programs: [],
    jobs: [
      job("tryavna-library", t("Летен помощник в библиотека", "Summer library assistant"), t("Читалищна библиотека", "Community library"), "none", .62, 4, 2, true),
      job("tryavna-museum", t("Помощник в музей", "Museum assistant"), t("Къща музей", "Historic house museum"), "none", .68, 4, 3, true),
      job("tryavna-shop", t("Продавач-консултант", "Shop assistant"), t("Магазин на площада", "Shop on the square"), "none", .73),
      job("tryavna-hotel", t("Служител в семеен хотел", "Hotel attendant"), t("Семеен хотел", "Family-run hotel"), "none", .72, 8, 12),
      job("tryavna-reception", t("Рецепционист", "Receptionist"), t("Къща за гости", "Guesthouse"), "secondary", .84),
      job("tryavna-workshop", t("Чирак дърворезбар", "Woodcarving apprentice"), t("Работилницата на Стефан", "Stefan’s workshop"), "none", .76),
      job("tryavna-carver", t("Дърворезбар", "Woodcarver"), t("Ателие за дърворезба", "Woodcarving studio"), "art", 1.03),
      job("tryavna-accountant", t("Младши счетоводител", "Junior accountant"), t("Местна счетоводна кантора", "Local accounting firm"), "business", 1.08),
      job("tryavna-nurse", t("Медицинска сестра", "Nurse"), t("Местно лечебно заведение", "Local healthcare provider"), "nursing", 1.09),
    ],
  },
  sofia: {
    name: t("София", "Sofia"), district: t("София (столица)", "Sofia (capital)"),
    benchmark: pathMoney(1932), essentials: pathMoney(550),
    zones: {
      mladost: t("Младост", "Mladost"), lozenets: t("Лозенец", "Lozenets"),
      izgrev: t("Изгрев", "Izgrev"), lyulin: t("Люлин", "Lyulin"),
      center: t("Централни райони", "Central districts"),
    },
    schools: [
      { id: "125-su", zone: "mladost", name: t("125. СУ „Боян Пенев“", "125th Boyan Penev School"), primary: true,
        profile: t("Общообразователна паралелка", "General studies"), admission: { cutoff: 0, focus: "balanced" } },
      { id: "81-su", zone: "mladost", name: t("81. СУ „Виктор Юго“", "81st Victor Hugo School"), primary: true,
        profile: t("Чужди езици", "Languages"), focus: ["english"], admission: { cutoff: 53, focus: "bulgarian" } },
      { id: "118-su", zone: "mladost", name: t("118. СУ „Акад. Людмил Стоянов“", "118th Lyudmil Stoyanov School"), primary: true },
      { id: "107-ou", zone: "lozenets", name: t("107. ОУ „Хан Крум“", "107th Han Krum Primary School"), primary: true },
      { id: "120-ou", zone: "lozenets", name: t("120. ОУ „Георги С. Раковски“", "120th Georgi S. Rakovski Primary School"), primary: true },
      { id: "119-su", zone: "izgrev", name: t("119. СУ „Акад. Михаил Арнаудов“", "119th Mihail Arnaudov School"), primary: true,
        profile: t("Природни науки", "Natural sciences"), focus: ["biology", "chemistry"], admission: { cutoff: 63, focus: "balanced" } },
      { id: "33-ou", zone: "lyulin", name: t("33. ОУ „Санкт Петербург“", "33rd Saint Petersburg Primary School"), primary: true },
      { id: "6-ou", zone: "center", name: t("6. ОУ „Граф Н. Игнатиев“", "6th Count N. Ignatiew Primary School"), primary: true },
      { id: "9-feg", zone: "center", name: t("9. ФЕГ „Алфонс дьо Ламартин“", "9th Alphonse de Lamartine French School"),
        profile: t("Френски език", "French"), focus: ["french", "history"], admission: { cutoff: 72, focus: "bulgarian" } },
      { id: "smg", zone: "center", name: t("СМГ „Паисий Хилендарски“", "Sofia High School of Mathematics"),
        profile: t("Математика", "Mathematics"), focus: ["math", "computing"], admission: { cutoff: 78, focus: "math" } },
      { id: "91-neg", zone: "center", name: t("91. НЕГ „Проф. Константин Гълъбов“", "91st Konstantin Galabov German School"),
        profile: t("Немски език", "German"), focus: ["german", "history"], admission: { cutoff: 74, focus: "bulgarian" } },
      { id: "164-gpie", zone: "center", name: t("164. ГПИЕ „Мигел де Сервантес“", "164th Miguel de Cervantes Spanish School"),
        profile: t("Испански език", "Spanish"), focus: ["spanish", "history"], admission: { cutoff: 73, focus: "bulgarian" } },
      { id: "tues", zone: "mladost", name: t("ТУЕС към ТУ – София", "Technology School Electronic Systems"),
        profile: t("Системно програмиране", "Systems programming"), focus: ["computing", "math"], admission: { cutoff: 73, focus: "math" }, vocational: "tech" },
    ],
    programs: [
      { id: "su-computing", institution: su, title: t("Информатика", "Computer science"), field: "tech", years: 4,
        fee: { state: 450, paid: 2150 }, admission: { subject: "math", state: 4.75, paid: 3.9 } },
      { id: "su-law", institution: su, title: t("Право", "Law"), field: "law", years: 5,
        fee: { state: 510, paid: 2450 }, admission: { subject: "bulgarian", state: 4.95, paid: 4.2 } },
      { id: "tu-software", institution: tu, title: t("Компютърно и софтуерно инженерство", "Computer and software engineering"), field: "tech", years: 4,
        fee: { state: 485, paid: 2300 }, admission: { subject: "math", state: 4.6, paid: 3.75 } },
      { id: "unwe-econ", institution: unwe, title: t("Икономика", "Economics"), field: "business", years: 4,
        fee: { state: 420, paid: 2000 }, admission: { subject: "math", state: 4.45, paid: 3.55 } },
      { id: "mu-medicine", institution: mu, title: t("Медицина", "Medicine"), field: "medicine", years: 6,
        fee: { state: 620, paid: 6300 }, admission: { subject: "biology", exam: ["biology", "chemistry"], state: 5.1, paid: 4.45 } },
      { id: "mu-nursing", institution: mu, title: t("Медицинска сестра", "Nursing"), field: "nursing", years: 4,
        fee: { state: 390, paid: 2000 }, admission: { subject: "biology", state: 4.15, paid: 3.45 } },
      { id: "nbu-visual", institution: nbu, title: t("Визуални изкуства", "Visual arts"), field: "art", years: 4,
        fee: { paid: 2850 }, admission: { subject: "art", exam: ["art"], paid: 3.65 } },
    ],
    jobs: [
      job("sofia-library", t("Летен помощник в библиотека", "Summer library assistant"), t("Квартална библиотека", "Neighbourhood library"), "none", .51, 4, 2, true),
      job("sofia-bookshop", t("Помощник в книжарница", "Bookshop assistant"), t("Квартална книжарница", "Neighbourhood bookshop"), "none", .56, 4, 3, true),
      job("sofia-cafe", t("Бариста", "Barista"), t("Кафене до метрото", "Café by the metro"), "none", .56, 4),
      job("sofia-shop", t("Продавач-консултант", "Shop assistant"), t("Квартален супермаркет", "Neighbourhood supermarket"), "none", .58),
      job("sofia-warehouse", t("Складов служител", "Warehouse associate"), t("Логистичен център", "Logistics centre"), "none", .63, 8, 12),
      job("sofia-support", t("Оператор обслужване на клиенти", "Customer support agent"), t("Център за клиенти", "Customer service centre"), "secondary", .78),
      job("sofia-qa-trainee", t("Стажант по софтуерно тестване", "Software QA trainee"), t("Софтуерен екип в Младост", "Software team in Mladost"), "secondary", .75, 4, 12),
      job("sofia-qa", t("Младши софтуерен тестер", "Junior software tester"), t("Софтуерен екип в Младост", "Software team in Mladost"), "tech", 1.08),
      job("sofia-developer", t("Младши разработчик", "Junior developer"), t("Продуктова компания", "Product company"), "tech", 1.22),
      job("sofia-finance", t("Младши финансов анализатор", "Junior financial analyst"), t("Финансов отдел", "Finance department"), "business", 1.05),
      job("sofia-law", t("Правен сътрудник", "Legal assistant"), t("Правен отдел", "Legal department"), "law", .96),
      job("sofia-nurse", t("Медицинска сестра", "Nurse"), t("Многопрофилна болница", "General hospital"), "nursing", .97),
      job("sofia-doctor", t("Лекар специализант", "Resident physician"), t("Университетска болница", "University hospital"), "medicine", 1.16),
      job("sofia-design", t("Асистент в дизайнерско студио", "Design studio assistant"), t("Дизайнерско студио", "Design studio"), "art", .91),
    ],
  },
};

export const playableCities = Object.keys(pathCities) as City[];

export function schoolSubjects(grade: number, school?: School): Subject[] {
  let common: Subject[];
  if (grade <= 2) common = ["bulgarian", "math", "homeland", "art", "pe"];
  else if (grade <= 4) common = ["bulgarian", "math", "english", "world", "art", "pe"];
  else if (grade <= 6) common = ["bulgarian", "math", "english", "world", "history", "geography", "pe"];
  else common = ["bulgarian", "math", "english", "history", "biology", "chemistry", "art", "pe"];
  return [...new Set([...common, ...(grade >= 8 ? school?.focus ?? [] : [])])];
}

export function fallbackSchool(city: City, grade: number, zone: string): School {
  const schools = pathCities[city].schools.filter(school => grade <= 7 ? school.primary : school.admission?.cutoff === 0);
  return schools.find(school => school.zone === zone) ?? schools[0];
}

export const fieldSubject: Record<Field, Subject> = {
  art: "art", tech: "math", business: "math", law: "bulgarian", medicine: "biology", nursing: "biology",
};

export const programSubjects: Record<Field, readonly Text[]> = {
  art: [t("Рисуване", "Drawing"), t("Композиция", "Composition")],
  tech: [t("Програмиране", "Programming"), t("Алгоритми", "Algorithms")],
  business: [t("Микроикономика", "Microeconomics"), t("Статистика", "Statistics")],
  law: [t("Теория на правото", "Legal theory"), t("Гражданско право", "Civil law")],
  medicine: [t("Анатомия", "Anatomy"), t("Физиология", "Physiology")],
  nursing: [t("Анатомия", "Anatomy"), t("Клинична практика", "Clinical practice")],
};

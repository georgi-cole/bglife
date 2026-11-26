import type { City, GameState, Text } from "./engine.ts";
import { closeEmploymentYear, employmentIncome, findJob, insuranceView, startEmployment, workView, type EmploymentState } from "./employment.ts";
import { limit, type PathAction, type PathEvent } from "./pathActions.ts";
import { pathCities, pathMoney, pathText as t, playableCities } from "./pathCatalog.ts";
import { relocationBlock } from "./pathPolicy.ts";
import { closeSchoolYear, moveSchool, schoolView, startSchool, type SchoolState } from "./school.ts";
import { beginUniversity, closeUniversityYear, universityCosts, universityView, type UniversityState } from "./university.ts";

export type LifeOpening = { age: 7 | 16; city: City };
export type LifePath = {
  school: SchoolState;
  university: UniversityState;
  work: EmploymentState;
  used: string[];
};
export const LAST_LIFE_AGE = 100;
export const isSchoolAge = (age: number) => age < 18;

export function startPath(s: GameState, legacy: boolean): LifePath {
  return {
    school: startSchool(s.city, s.age), university: beginUniversity(),
    work: startEmployment(s, legacy ? s.career : null), used: [],
  };
}

export function studying(s: GameState) {
  const path = s.path;
  return path ? (path.school.grade !== null && !path.school.left) || Boolean(path.university.student && !path.university.student.paused)
    : s.career === "student";
}

export function hasSteadyIncome(s: GameState) {
  if (!s.path) return s.career !== "student";
  const job = s.path.work.job;
  return Boolean(s.path.work.pension || (job && (job.monthsLeft ?? 12) >= 12));
}

export function pathOccupation(s: GameState): Text | null {
  const path = s.path;
  if (!path) return null;
  const masculine = s.avatar?.presentation === "male";
  if (path.work.job) return findJob(path.work.job.city, path.work.job.job)?.title ?? t("На работа", "Employed");
  if (path.work.pension) return t(masculine ? "Пенсионер" : "Пенсионерка", "Pensioner");
  if (path.university.student && !path.university.student.paused) return t(masculine ? "Студент" : "Студентка", "University student");
  if (path.school.grade !== null && !path.school.left) return t(masculine ? "Ученик" : "Ученичка", "School student");
  return s.age < 18 ? t("Извън училище", "Out of school") : t("Без работа", "Between jobs");
}

export function pathActionBlock(s: GameState, action: Pick<PathAction<unknown>, "id" | "blocked">) {
  if (s.finished) return t("Историята е приключила.", "This life has ended.");
  if (s.path?.used.includes(action.id)) return t("Вече е направено тази година.", "Already done this year.");
  return action.blocked;
}

export function moveOptions(s: GameState): PathAction<LifePath>[] {
  const path = s.path;
  if (!path || s.age < 18) return [];
  return playableCities.filter(city => city !== s.city).map(city => ({
    id: "path.move." + city, label: t("Премести се в " + pathCities[city].name.bg, "Move to " + pathCities[city].name.en),
    blocked: relocationBlock(s, city),
    run: () => ({ state: path, moveTo: city, note: t("Премести се в " + pathCities[city].name.bg + ".",
      "You moved to " + pathCities[city].name.en + ".") }),
  }));
}

export function resolvePathAction(s: GameState, id: string) {
  const path = s.path;
  if (!path) return;
  function resolve<K extends keyof Pick<LifePath, "school" | "university" | "work">>(key: K, actions: PathAction<LifePath[K]>[]) {
    const action = actions.find(option => option.id === id);
    if (!action || pathActionBlock(s, action)) return;
    const { state, ...result } = action.run();
    return { ...result, state: { ...path!, [key]: state }, label: action.label };
  }
  if (id.startsWith("school.")) return resolve("school", schoolView(s, path.school).actions);
  if (id.startsWith("university.")) return resolve("university", universityView(s, path.university, path.school.diploma).actions);
  if (id.startsWith("work.")) return resolve("work", workView(s, path.work).actions);
  if (id.startsWith("insurance.")) return resolve("work", insuranceView(s, path.work).actions);
  const action = moveOptions(s).find(option => option.id === id);
  return action && !pathActionBlock(s, action) ? { ...action.run(), label: action.label } : undefined;
}

export function pathBudget(s: GameState, path: LifePath) {
  const employment = employmentIncome(s, path.work);
  const study = universityCosts(path.university);
  const pay = employment.wage + employment.benefit + employment.pension + study.scholarship;
  const dependent = s.age < 18 || (s.age < 20 && path.school.grade !== null && !path.school.left && s.housing === "home");
  const student = path.university.student && !path.university.student.paused;
  const essentialsDue = dependent ? 0 : Math.round(pathCities[s.city].essentials * 12 * (student ? .48 : 1));
  const housingDue = dependent || (s.housing === "home" && s.lifeSystems.bank.ownsHome) ? 0
    : { home: student ? 0 : pathMoney(1500), rumi: pathMoney(1800), shared: pathMoney(3600) }[s.housing];
  const available = Math.max(0, s.cash + pay);
  const tuitionPaid = study.due <= available;
  const tuition = tuitionPaid ? study.due : 0;
  const healthDue = employment.health + path.work.healthDebt;
  const health = Math.min(healthDue, available - tuition);
  const housing = Math.min(housingDue, available - tuition - health);
  const essentials = Math.min(essentialsDue, available - tuition - health - housing);
  const net = pay - essentials - housing - tuition - health;
  return {
    ...employment, health, healthDue,
    scholarship: study.scholarship, pay, tuition, tuitionPaid, housing, essentials, net,
    shortfall: limit(essentialsDue + housingDue - essentials - housing, 0, essentialsDue + housingDue),
  };
}

export function closePathYear(s: GameState, path: LifePath) {
  const budget = pathBudget(s, path);
  const school = closeSchoolYear(s, path.school);
  const university = closeUniversityYear(s, path.university, path.school.diploma, budget.tuitionPaid);
  const employment = closeEmploymentYear(s, path.work);
  const events: PathEvent[] = [...school.events, ...university.events, ...employment.events];
  if (budget.shortfall) events.push({
    id: "living-costs-" + s.age, title: t("Тесен бюджет", "A tight budget"),
    note: t("Намали разходите и разчиташ на помощ от близките за част от издръжката.", "You cut costs and relied on help from people close to you."),
  });
  if (budget.healthDue > budget.health) events.push({
    id: "health-contributions-" + s.age, title: t("Здравни вноски", "Health contributions"),
    note: t("Бюджетът не стигна за всички лични здравни вноски.", "You could not cover all personal health contributions."),
  });
  return { path: { school: school.school, university: university.university, work: { ...employment.work, healthDebt: budget.healthDue - budget.health }, used: [] }, events };
}

export function relocatePath(path: LifePath, city: City): LifePath {
  return { ...path, school: moveSchool(path.school, city), work: { ...path.work, applications: {} } };
}

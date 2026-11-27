import { pocketMoney, type City, type GameState, type Text } from "./engine.ts";
import { closeEmploymentYear, employmentIncome, findJob, insuranceView, startEmployment, workView, type EmploymentState } from "./employment.ts";
import { limit, type PathAction, type PathEvent } from "./pathActions.ts";
import { onMaternityLeave } from "./maternity.ts";
import { pathCities, pathMoney, pathText as t } from "./pathCatalog.ts";
import { closeSchoolYear, moveSchool, schoolView, startSchool, type SchoolState } from "./school.ts";
import { closeUniversityYear, startUniversity, universityCosts, universityView, type UniversityState } from "./university.ts";

export type LifePath = {
  school: SchoolState;
  university: UniversityState;
  work: EmploymentState;
  used: string[];
};
export const isSchoolAge = (age: number) => age < 18;

export function startPath(s: GameState): LifePath {
  return { school: startSchool(s), university: startUniversity(s), work: startEmployment(s), used: [] };
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
  if (onMaternityLeave(s)) return t("В майчинство", "On maternity leave");
  const path = s.path;
  if (!path || s.age < 7) return null;
  const masculine = s.avatar?.presentation === "male";
  if (path.work.job) return findJob(path.work.job.city, path.work.job.job)?.title ?? t("На работа", "Employed");
  if (path.work.pension) return t(masculine ? "Пенсионер" : "Пенсионерка", "Pensioner");
  if (path.university.student && !path.university.student.paused) return t(masculine ? "Студент" : "Студентка", "University student");
  if (path.school.grade !== null && !path.school.left) return t(masculine ? "Ученик" : "Ученичка", "School student");
  return s.age < 18 ? t("Извън училище", "Out of school") : t("Без работа", "Between jobs");
}

export function pathActionBlock(s: GameState, action: Pick<PathAction<unknown>, "id" | "blocked">) {
  if (s.finished) return t("Историята е приключила.", "This life has ended.");
  if (s.lifeSystems.reproduction.naming) return t("Първо запиши името на бебето.", "Name the new baby first.");
  if (s.path?.used.includes(action.id)) return t("Вече е направено тази година.", "Already done this year.");
  return action.blocked;
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

}

export function pathBudget(s: GameState, path: LifePath) {
  const employment = employmentIncome(s, path.work);
  const study = universityCosts(path.university);
  const pocket = pocketMoney(s);
  const pay = pocket + employment.wage + employment.maternity + employment.benefit + employment.pension + study.scholarship;
  const dependent = s.age < 18 || (s.age < 20 && path.school.grade !== null && !path.school.left && s.housing === "home");
  const student = path.university.student && !path.university.student.paused;
  const retired = path.work.pension !== null && !path.work.job;
  const essentialsDue = dependent ? 0 : Math.round(pathCities[s.city].essentials * 12 * (student ? .48 : retired ? .78 : 1));
  const ownsLocalHome = s.lifeSystems.bank.ownsHome && (s.lifeSystems.bank.homeCity ?? "tryavna") === s.city;
  const housingDue = dependent || (s.housing === "home" && ownsLocalHome) ? 0
    : Math.round({ home: student ? 0 : pathMoney(1500), rumi: pathMoney(1800), shared: pathMoney(3600) }[s.housing] * (retired ? .80 : 1));
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
    pocket, scholarship: study.scholarship, pay, tuition, tuitionPaid, housing, essentials, net,
    shortfall: limit(essentialsDue + housingDue - essentials - housing, 0, essentialsDue + housingDue),
  };
}

export function closePathYear(s: GameState, path: LifePath, budget: ReturnType<typeof pathBudget>, finished: boolean) {
  const school = s.age === 6 && !finished ? { school: startSchool({ ...s, age: 7 }), events: [] } : closeSchoolYear(s, path.school);
  const university = closeUniversityYear(s, path.university, path.school.diploma, budget.tuitionPaid);
  const employment = closeEmploymentYear(s, path.work);
  const events: PathEvent[] = [...school.events, ...university.events, ...employment.events];
  if (budget.shortfall) events.push({
    id: "living-costs-" + s.age, title: t("Тесен бюджет", "A tight budget"),
    note: t("Намали разходите, за да се вместиш в бюджета.", "You cut back to stay within your budget."),
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

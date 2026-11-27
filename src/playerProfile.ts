import { getAvatarStage } from "./avatar.ts";
import { cityPaths, jobTypes } from "./cityPaths.ts";
import { findJob } from "./employment.ts";
import type { GameState, Text } from "./engine.ts";
import { pathOccupation } from "./lifePath.ts";
import { HEIR_CASH } from "./lifeProfile.ts";
import { lifeDraw } from "./mortality.ts";
import { currentSchool, gradeName } from "./school.ts";
import { findProgram } from "./university.ts";

const t = (bg: string, en: string): Text => ({ bg, en });
const calendarStartYear = 2026;

const signs = [
  [120, t("Козирог", "Capricorn")], [219, t("Водолей", "Aquarius")], [321, t("Риби", "Pisces")],
  [420, t("Овен", "Aries")], [521, t("Телец", "Taurus")], [621, t("Близнаци", "Gemini")],
  [723, t("Рак", "Cancer")], [823, t("Лъв", "Leo")], [923, t("Дева", "Virgo")],
  [1023, t("Везни", "Libra")], [1122, t("Скорпион", "Scorpio")], [1222, t("Стрелец", "Sagittarius")],
] as const;

// The simulation calendar starts in 2026. Earlier chapter saves open at sixteen.
export function playerBirthday(life: Pick<GameState, "seed" | "origin">) {
  const year = calendarStartYear - (life.origin === "chapter" ? 16 : 0);
  const start = Date.UTC(year, 0, 1);
  const days = (Date.UTC(year + 1, 0, 1) - start) / 86_400_000;
  return new Date(Date.UTC(year, 0, 1 + Math.floor(lifeDraw(life.seed, 0, 0x4dcb462f) * days)));
}

export function zodiacFor(date: Date): Text {
  const day = (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
  return (signs.find(([boundary]) => day < boundary) ?? signs[0])[1];
}

export function playerJob(life: GameState): Text | null {
  const contract = life.path?.work.job;
  if (contract) return findJob(contract.city, contract.job)?.title ?? t("На работа", "Employed");
  if (life.path || life.retirement) return null;
  if (life.localJob) return jobTypes[life.localJob].label;
  if (life.career === "qa") return t("Софтуерно тестване", "Software QA");
  if (life.career === "woodcarver") return t(life.avatar?.presentation === "male" ? "Дърворезбар" : "Дърворезбарка", "Woodcarver");
  return life.career === "local-job" ? t("Работа в града", "Local job") : null;
}

export function playerEducation(life: GameState): Text {
  const path = life.path;
  if (path) {
    const { student, degrees } = path.university;
    const program = student && findProgram(student.city, student.program);
    if (program) return t(
      program.title.bg + " · " + program.institution.bg + (student.paused ? " · прекъснато" : ""),
      program.title.en + " · " + program.institution.en + (student.paused ? " · on leave" : ""),
    );
    const degree = degrees.at(-1);
    const completed = degree && findProgram(degree.city, degree.program);
    if (completed) return t(completed.title.bg + " · завършено", completed.title.en + " · completed");
    const { school } = path;
    if (school.grade !== null && !school.left) {
      const grade = gradeName(school.grade);
      if (!school.enrolled) return t(grade.bg + " · предстои записване", grade.en + " · enrolment pending");
      const institution = currentSchool(life, school).name;
      return t(grade.bg + " · " + institution.bg, grade.en + " · " + institution.en);
    }
    if (school.diploma) return t("Завършено средно образование", "Secondary school diploma");
    if (school.left) return t("Прекъснато училище", "Left school");
  } else if (life.enrollment) {
    const enrollment = life.enrollment;
    const school = cityPaths[enrollment.city].schools[enrollment.index];
    return life.age < enrollment.graduationAge ? school.name
      : t(school.name.bg + " · завършено", school.name.en + " · completed");
  }
  if (life.age < 4) return t("Предучилищна възраст", "Below school age");
  if (life.age < 7) return t("Предучилищна подготовка", "Preschool");
  return t("Няма записано образование", "No education recorded");
}

export function playerStatus(life: GameState): Text {
  const male = life.avatar?.presentation === "male";
  if (life.finished) return t("Животът приключи", "Life ended");
  const job = playerJob(life);
  if (job) return job;
  if (life.path?.work.pension || life.retirement) return t(male ? "Пенсионер" : "Пенсионерка", "Retired");
  if (life.path?.university.student && !life.path.university.student.paused) return pathOccupation(life)!;
  if (life.path?.school.enrolled && life.path.school.grade !== null && !life.path.school.left) return pathOccupation(life)!;
  if (!life.path && life.enrollment && life.age < life.enrollment.graduationAge) {
    return cityPaths[life.enrollment.city].schools[life.enrollment.index].level === "higher"
      ? t(male ? "Студент" : "Студентка", "University student") : t(male ? "Ученик" : "Ученичка", "School student");
  }
  if (life.profile?.wealthy) return t(male ? "Богат наследник" : "Богата наследница", male ? "Wealthy heir" : "Wealthy heiress");
  const { bank } = life.lifeSystems;
  if (life.cash + bank.balance - bank.loan - bank.mortgage >= HEIR_CASH) {
    return t(male ? "Самостоятелно забогатял" : "Самостоятелно забогатяла", "Self-made millionaire");
  }
  if (life.age < 7) return getAvatarStage(life.age).label;
  if (!life.path && life.age < 19) return t(male ? "Ученик" : "Ученичка", "School student");
  if (life.path && life.path.school.grade !== null && !life.path.school.left) return t("Предстои записване", "Enrolment pending");
  return pathOccupation(life) ?? t("Без работа", "Between jobs");
}

export function maritalStatus(life: GameState): Text {
  const male = life.avatar?.presentation === "male";
  switch (life.lifeSystems.family.stage) {
    case "married": return t(male ? "Женен" : "Омъжена", "Married");
    case "engaged": return t(male ? "Сгоден" : "Сгодена", "Engaged");
    case "dating": return t("Излиза на срещи", "Dating");
    case "committed": return t("Във връзка", "In a relationship");
    default: return t(male ? "Необвързан" : "Необвързана", "Single");
  }
}

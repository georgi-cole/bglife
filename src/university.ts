import { moveBlocker, type City, type GameState } from "./engine.ts";
import { cityPaths } from "./cityPaths.ts";
import { average, mark, pathRoll, roundMark, type PathAction, type PathEvent } from "./pathActions.ts";
import { fieldSubject, legacyProgramId, pathCities, pathMoney, pathText as t, playableCities, programSubjects, subjects, type Field, type Program, type Subject } from "./pathCatalog.ts";
import type { Diploma } from "./school.ts";

export type Funding = "state" | "paid";
type Application = { outcome: Funding | "refused"; score: number };
type Student = {
  program: string;
  city: City;
  funding: Funding;
  yearsPassed: number;
  marks: number[];
  paused: boolean;
  study: boolean;
  coursework: boolean;
  session: number | null;
  scholarship: "awarded" | "refused" | null;
  legacyFeeWaiver?: true;
};
export type Degree = { program: string; city: City; field: Field; mark: number; age: number };
export type UniversityState = {
  student: Student | null;
  applications: Record<string, Application>;
  preparation: string | null;
  entrance: Record<string, number[]>;
  degrees: Degree[];
};
export const fundingName: Record<Funding, ReturnType<typeof t>> = {
  state: t("Държавна поръчка", "State-funded"), paid: t("Платено обучение", "Tuition-funded"),
};
export const scholarshipAmount = pathMoney(900);

export const allPrograms = playableCities.flatMap(city => pathCities[city].programs.map(program => ({ city, program })));
export const findProgram = (city: City, id: string) => pathCities[city].programs.find(program => program.id === id);

export function startUniversity(s: GameState): UniversityState {
  const state: UniversityState = { student: null, applications: {}, preparation: null, entrance: {}, degrees: [] };
  const recorded = s.enrollment;
  if (!recorded || cityPaths[recorded.city].schools[recorded.index].level !== "higher") return state;
  const program = findProgram(recorded.city, legacyProgramId(recorded));
  if (!program) return state;
  if (s.age >= recorded.graduationAge) return { ...state,
    degrees: [{ program: program.id, city: recorded.city, field: program.field, mark: 4.1, age: recorded.graduationAge }] };
  const yearsPassed = Math.max(0, program.years - (recorded.graduationAge - s.age));
  return { ...state, student: {
    program: program.id, city: recorded.city, funding: program.fee.state !== undefined ? "state" : "paid",
    yearsPassed, marks: Array<number>(yearsPassed).fill(4.1), paused: s.city !== recorded.city,
    study: false, coursework: false, session: null, scholarship: null, legacyFeeWaiver: true,
  } };
}
export const marksFor = (diploma: Diploma, subject: Subject): number => subject === "bulgarian" ? diploma.bulgarian
  : subject === diploma.second.subject ? diploma.second.mark : diploma.marks[subject] ?? diploma.average;

function examGrade(s: GameState, diploma: Diploma, program: Program, state: UniversityState, subject: Subject) {
  return roundMark(marksFor(diploma, subject) * .52 + diploma.average * .22 + (2.15 + s.stats.brains * .041) * .26
    + Number(state.preparation === program.id) * .55 + (pathRoll(s, program.id + "." + subject) - .5) * .95);
}

function admission(s: GameState, diploma: Diploma, program: Program, state: UniversityState): Application {
  const entrance = state.entrance[program.id];
  const subject = marksFor(diploma, program.admission.subject);
  const eligibility = program.admission.practical && entrance ? average(entrance)
    : entrance ? average(entrance) * .63 + subject * .15 + diploma.average * .22
    : subject * .55 + diploma.bulgarian * .18 + diploma.average * .27;
  const score = roundMark(eligibility + (pathRoll(s, "admission." + program.id) - .5) * .3);
  const requirementsMet = !entrance || entrance.every(exam => exam >= 3);
  const outcome = requirementsMet && program.admission.state !== undefined && score >= program.admission.state
    ? "state" : requirementsMet && program.admission.paid !== undefined && score >= program.admission.paid ? "paid" : "refused";
  return { outcome, score };
}

export function universityCosts(state: UniversityState): { due: number; scholarship: number } {
  const student = state.student;
  if (!student || student.paused) return { due: 0, scholarship: 0 };
  const fee = student.legacyFeeWaiver ? 0 : findProgram(student.city, student.program)?.fee[student.funding] ?? 0;
  return { due: pathMoney(fee), scholarship: student.scholarship === "awarded" ? scholarshipAmount : 0 };
}

function sessionMark(s: GameState, student: Student, program: Program, diploma: Diploma | null) {
  const fullTime = s.path?.work.job?.hours === 8;
  return roundMark(2.32 + s.stats.brains * .020 + (diploma ? marksFor(diploma, fieldSubject[program.field]) - 3 : 0) * .23
    + Number(student.study) * .68 + Number(student.coursework) * .4 - Number(fullTime) * .48
    + (pathRoll(s, "session." + program.id) - .5) * .85);
}

export function universityView(s: GameState, university: UniversityState, diploma: Diploma | null) {
  const actions: PathAction<UniversityState>[] = [];
  const student = university.student;
  const active = student && findProgram(student.city, student.program);
  if (student && active) {
    actions.push({
      id: student.paused ? "university.resume" : "university.pause",
      label: student.paused ? t("Възобнови обучението", "Resume your studies") : t("Прекъсни за година", "Take a study break"),
      blocked: student.paused && student.city !== s.city ? t("Върни се в града на университета.", "Return to your university’s city first.") : undefined,
      run: () => ({ state: { ...university, student: { ...student, paused: !student.paused } },
        note: student.paused ? t("Върна се към обучението си.", "You resumed your studies.")
          : t("Прекъсна временно. Курсът и оценките ти се пазят.", "You took a break. Your progress is kept.") }),
    });
    actions.push({
      id: "university.withdraw", label: t("Отпиши се", "Withdraw"),
      run: () => ({ state: { ...university, student: null },
        note: t("Прекрати следването. Можеш да кандидатстваш отново.", "You withdrew. You can apply again.") }),
    });
    if (student.paused) return { active, actions };
    for (const task of ["study", "coursework"] as const) {
      actions.push({
        id: "university." + task,
        label: task === "study" ? t("Учи за сесия", "Study for finals") : t("Направи курсов проект", "Finish a course project"),
        blocked: student[task] || student.session !== null ? t("Приключено за този курс.", "Done for this course.") : undefined,
        run: () => ({ state: { ...university, student: { ...student, [task]: true } }, stats: { brains: task === "study" ? 2 : 1 },
          note: task === "study" ? t("Груповият чат най-сетне се разбра какво влиза в сесията.", "The group chat finally agreed on what’s on the exam.")
            : t("Предаде проекта. Файлът „последен_наистина“ най-сетне е последен.", "Project submitted. “final-for-real” can finally retire.") }),
      });
    }
    actions.push({
      id: "university.session", label: t("Яви се на сесия", "Sit finals"),
      blocked: student.session !== null ? t("Резултатът за курса е отчетен.", "This year’s result has been recorded.") : undefined,
      run: () => {
        const score = sessionMark(s, student, active, diploma);
        return { state: { ...university, student: { ...student, session: score } },
          note: t("Успех от сесията " + mark(score, "bg") + ".", "Finals average " + mark(score, "en") + ".") };
      },
    });
    if (student.funding === "state" && student.yearsPassed > 0 && student.scholarship === null) {
      const previous = student.marks.at(-1)!;
      actions.push({
        id: "university.scholarship", label: t("Кандидатствай за стипендия", "Apply for a scholarship"),
        blocked: previous < 5 ? t("Нужен е успех поне 5,00 от последния завършен курс.", "You need at least 5.00 in your most recent completed year.") : undefined,
        run: () => {
          const awarded = previous >= 5.5 || pathRoll(s, "scholarship." + student.program) < .64 + (previous - 5) * .6;
          return { state: { ...university, student: { ...student, scholarship: awarded ? "awarded" : "refused" } },
            note: awarded ? t("Класира се. Стипендията ще влезе в бюджета за годината.", "You qualified. The scholarship will be paid into this year’s budget.")
              : t("Покри условията, но местата свършиха по-нагоре в класирането.", "You met the requirements, but other applicants ranked higher.") };
        },
      });
    }
    return { active, actions };
  }

  if (!diploma || s.age < 18) return { active: null, actions };
  for (const { city, program } of allPrograms) {
    if (university.degrees.some(degree => degree.program === program.id)) continue;
    const application = university.applications[program.id];
    if (application && application.outcome !== "refused") {
      const funding = application.outcome;
      const move = city !== s.city;
      actions.push({
        id: "university.enroll." + program.id,
        label: move ? t("Запиши се и се премести", "Enroll and move") : t("Запиши се", "Enroll"),
        blocked: move ? moveBlocker(s, city) ?? undefined : undefined,
        run: () => ({
          state: { ...university, student: { program: program.id, city, funding, yearsPassed: 0, marks: [], paused: false,
            study: false, coursework: false, session: null, scholarship: null } },
          moveTo: move ? city : undefined,
          note: t(program.title.bg + " · " + fundingName[funding].bg + ". Таксата влиза в годишния бюджет.",
            program.title.en + " · " + fundingName[funding].en + ". Tuition is due from this year’s budget."),
        }),
      });
      continue;
    }
    if (application) continue;
    const practical = program.admission.practical;
    const rounds = university.entrance[program.id] ?? [];
    const round = practical?.[rounds.length];
    if (round) {
      if (rounds.length === 0 && university.preparation !== program.id) actions.push({
        id: "university.prepare." + program.id, label: t("Подготви сценичен репертоар", "Prepare your audition material"),
        blocked: university.preparation ? t("Вече избра приемен изпит за подготовка.", "You picked another exam to prepare for.") : undefined,
        run: () => ({ state: { ...university, preparation: program.id },
          note: t("Подготвих текстове и етюди за първия кръг.", "I prepared texts and scenes for the first round.") }),
      });
      const number = rounds.length + 1;
      const cost = pathMoney(round.fee);
      actions.push({
        id: "university.practical-" + number + "." + program.id,
        label: t("Кръг " + number + " · " + round.title.bg + " · " + round.fee + " €",
          "Round " + number + " · " + round.title.en + " · €" + round.fee),
        blocked: s.cash < cost ? t("Нямаш достатъчно пари за този кръг.", "You don't have enough cash for this round.") : undefined,
        run: () => {
          const preparation = university.preparation === program.id ? .6 : 0;
          const skill = s.path?.special?.actor.skill ?? 0;
          const score = roundMark(2 + skill * .035 + s.stats.influence * .013 + preparation
            - (number - 1) * .16 + (pathRoll(s, program.id + ".practical." + number) - .5) * .9);
          const entrance = { ...university.entrance, [program.id]: [...rounds, score] };
          const applications = score >= 3 ? university.applications
            : { ...university.applications, [program.id]: { outcome: "refused" as const, score } };
          return { state: { ...university, entrance, applications }, cash: -cost,
            note: t("Кръг " + number + " · " + mark(score, "bg") + (score < 3 ? ". Не продължих напред." : "."),
              "Round " + number + " · " + mark(score, "en") + (score < 3 ? ". I did not advance." : ".")) };
        },
      });
      continue;
    }
    const exam = program.admission.exam;
    if (exam && !university.entrance[program.id]) {
      actions.push({
        id: "university.prepare." + program.id, label: t("Подготви се за изпита", "Prepare for the entrance exam"),
        blocked: university.preparation ? t("Вече избра за кой изпит да се подготвяш тази година.", "You already picked an entrance exam to prepare for.") : undefined,
        run: () => ({ state: { ...university, preparation: program.id }, stats: { brains: 1 },
          note: t("Реши пробни задачи за " + program.title.bg + ".", "You practised for " + program.title.en + ".") }),
      });
      actions.push({
        id: "university.exam." + program.id, label: t("Яви се на приемния изпит", "Sit the entrance exam"),
        run: () => {
          const grades = exam.map(subject => examGrade(s, diploma, program, university, subject));
          return { state: { ...university, entrance: { ...university.entrance, [program.id]: grades } },
            note: t(exam.map((subject, i) => subjects[subject].bg + " " + mark(grades[i], "bg")).join(" · "),
              exam.map((subject, i) => subjects[subject].en + " " + mark(grades[i], "en")).join(" · ")) };
        },
      });
      continue;
    }
    actions.push({
      id: "university.apply." + program.id, label: t("Кандидатствай", "Apply"),
      run: () => {
        const result = admission(s, diploma, program, university);
        const label = result.outcome === "refused" ? t("Не си класиран за място", "No place offered") : fundingName[result.outcome];
        return { state: { ...university, applications: { ...university.applications, [program.id]: result } },
          note: t(program.title.bg + " · " + label.bg + ". Бал " + mark(result.score, "bg") + ".",
            program.title.en + " · " + label.en + ". Admission score " + mark(result.score, "en") + ".") };
      },
    });
  }
  return { active: null, actions };
}

export function closeUniversityYear(s: GameState, university: UniversityState, diploma: Diploma | null, tuitionPaid: boolean) {
  const student = university.student;
  const program = student && findProgram(student.city, student.program);
  const cleared = { ...university, applications: {}, preparation: null, entrance: {} };
  const events: PathEvent[] = [];
  if (!student || !program || student.paused) return { university: cleared, events };
  const nextStudent = { ...student, study: false, coursework: false, session: null, scholarship: null };
  if (!tuitionPaid) {
    events.push({ id: "tuition-" + s.age, title: t("Неплатена такса за обучение", "Unpaid tuition"),
      note: t("Бюджетът не стигна за таксата. Оставаш в същия курс.", "You could not cover tuition. You stay in the same year of study.") });
    return { university: { ...cleared, student: nextStudent }, events };
  }

  const score = student.session ?? sessionMark(s, student, program, diploma);
  const passed = score >= 3;
  const completed = student.yearsPassed + Number(passed);
  events.push({
    id: "university-year-" + s.age, title: program.title,
    note: t(passed ? "Завършен курс " + completed + " · успех " + mark(score, "bg") + "."
      : "Поправителна сесия. Успех " + mark(score, "bg") + ". Повтаряш курса.",
    passed ? "Year " + completed + " passed · grade " + mark(score, "en") + "."
      : "Resits ahead. Grade " + mark(score, "en") + ". You repeat the year."),
  });
  if (student.scholarship === "awarded") events.push({
    id: "scholarship-" + s.age, title: t("Получена студентска стипендия", "Student scholarship paid"),
    note: t("Стипендията е отчетена в годишния бюджет.", "The scholarship is included in your annual budget."),
  });
  const marks = passed ? [...student.marks, score] : student.marks;
  if (completed >= program.years) {
    const degree = { program: program.id, city: student.city, field: program.field, mark: roundMark(average(marks)), age: s.age };
    events.push({ id: "degree-" + s.age, title: t("Диплома за висше образование", "University degree"),
      note: t(program.title.bg + " · " + program.institution.bg + ". Квалификацията вече влиза в кандидатурите ти.",
        program.title.en + " · " + program.institution.en + ". Your qualification is now included in job applications.") });
    return { university: { ...cleared, student: null, degrees: [...university.degrees, degree] }, events };
  }
  return { university: { ...cleared, student: { ...nextStudent, yearsPassed: completed, marks } }, events };
}

export function universityCoursework(program: Program) {
  return program.coursework ?? programSubjects[program.field];
}

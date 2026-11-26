import type { City, GameState, Text } from "./engine.ts";
import { fallbackSchool, pathCities, pathText as t, schoolSubjects, subjects, type Field, type School, type Subject } from "./pathCatalog.ts";
import { average, limit, mark, pathRoll, roundMark, type PathAction, type PathEvent } from "./pathActions.ts";

type Subjects<T> = Partial<Record<Subject, T>>;
type Assessments = Partial<Record<"test" | "classwork", number>>;
type GradeReport = { grade: number; marks: Subjects<number>; average: number; passed: boolean };
type NationalExam = { grade: number; bulgarian: number; math: number };
type FinalExam = { kind: "bulgarian" | "second"; subject: Subject; mark: number; age: number };
export type Diploma = { average: number; marks: Subjects<number>; bulgarian: number; second: FinalExam; vocational?: Field };
export type SchoolState = {
  grade: number | null;
  zone: string;
  schoolId: string;
  enrolled: boolean;
  enrollment: Record<string, "offer" | "refused">;
  left: boolean;
  used: string[];
  effort: number;
  prep: Subjects<number>;
  assessments: Subjects<Assessments>;
  report: GradeReport | null;
  transcript: GradeReport[];
  nvo: NationalExam | null;
  finals: FinalExam[];
  finalSubject: Subject | null;
  diploma: Diploma | null;
};
export const SCHOOL_EFFORT = 5;
const CLASSWORK = new Set<Subject>(["bulgarian", "math", "english", "german", "spanish", "french"]);
const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
export const gradeName = (grade: number) => t(roman[grade] + " клас", "Grade " + grade);

export function startSchool(city: City, age: number): SchoolState {
  const grade = age < 19 ? Math.max(1, age - 6) : null;
  const zone = Object.keys(pathCities[city].zones)[0];
  const legacyDiploma: Diploma | null = age >= 19 ? {
    average: 4.1, marks: { bulgarian: 4.2, math: 4, biology: 4, art: 4.2 },
    bulgarian: 4.2, second: { kind: "second", mark: 4, subject: "math", age: 18 },
  } : null;
  return {
    grade, zone, schoolId: fallbackSchool(city, grade ?? 12, zone).id,
    enrolled: grade !== 1 && grade !== 8, enrollment: {}, left: false, used: [], effort: 0, prep: {}, assessments: {},
    report: null, transcript: [], nvo: null, finals: [], finalSubject: null, diploma: legacyDiploma,
  };
}

export function currentSchool(s: GameState, school: SchoolState): School {
  return pathCities[s.city].schools.find(item => item.id === school.schoolId)
    ?? fallbackSchool(s.city, school.grade ?? 12, school.zone);
}

export function moveSchool(school: SchoolState, city: City): SchoolState {
  const zone = Object.keys(pathCities[city].zones)[0];
  return { ...school, zone, schoolId: fallbackSchool(city, school.grade ?? 12, zone).id, enrollment: {} };
}

function baseline(s: GameState, school: SchoolState, subject: Subject) {
  const stat = subject === "pe" ? s.stats.health : s.stats.brains;
  const fullTime = s.path?.work.job?.hours === 8;
  const prep = (school.prep[subject] ?? 0) * .135;
  if (subject === "pe") return 3.35 + stat * .018 + prep;
  return 2.3 + stat * .024 + prep - Number(fullTime) * .24;
}

function yearMark(s: GameState, school: SchoolState, subject: Subject) {
  const current = baseline(s, school, subject);
  const assessments = school.assessments[subject];
  const test = assessments?.test ?? current + (pathRoll(s, "test." + subject) - .5) * .7;
  const classwork = assessments?.classwork ?? (CLASSWORK.has(subject) ? current + (pathRoll(s, "class." + subject) - .5) * .8 : test);
  return roundMark(current * .38 + test * .29 + classwork * .33);
}

function nationalExam(s: GameState, school: SchoolState): NationalExam {
  function score(subject: "bulgarian" | "math") {
    return Math.round(limit((yearMark(s, school, subject) - 2) * 25 + (pathRoll(s, "nvo." + subject) - .5) * 15, 0, 100));
  }
  return { grade: school.grade!, bulgarian: score("bulgarian"), math: score("math") };
}

function nationalNote(exam: NationalExam, suffix?: Text): Text {
  return t(
    "БЕЛ " + exam.bulgarian + "/100 · Математика " + exam.math + "/100." + (suffix ? " " + suffix.bg : ""),
    "Bulgarian " + exam.bulgarian + "/100 · Mathematics " + exam.math + "/100." + (suffix ? " " + suffix.en : ""),
  );
}

function finalSubject(s: GameState, school: SchoolState): Subject {
  const entry = currentSchool(s, school);
  return school.finalSubject ?? entry.focus?.[0] ?? "math";
}

function sitFinal(s: GameState, school: SchoolState, kind: FinalExam["kind"]): FinalExam {
  const subject = kind === "bulgarian" ? "bulgarian" : finalSubject(s, school);
  const score = yearMark(s, school, subject) + (pathRoll(s, "final." + kind + "." + subject) - .5) * .85;
  return { kind, subject, mark: roundMark(score), age: s.age };
}

function finalLabel(s: GameState, school: SchoolState, kind: FinalExam["kind"]): Text {
  if (kind === "bulgarian") return t("Матура по БЕЛ", "Bulgarian matriculation exam");
  return currentSchool(s, school).vocational
    ? t("Държавен изпит за професионална квалификация", "State vocational qualification exam")
    : t("Втора матура", "Second matriculation exam");
}

function formatMarks(title: Text, score: number): Text {
  return t(title.bg + " · " + mark(score, "bg"), title.en + " · " + mark(score, "en"));
}

function highSchoolScore(s: GameState, state: SchoolState, school: School) {
  const exam = state.nvo;
  if (school.admission?.cutoff === 0) return 100;
  if (!exam || exam.grade !== 7) return 0;
  const grades = state.report?.marks;
  const gradePoints = ((grades?.math ?? 3) + (grades?.bulgarian ?? 3) - 4) * 12.5;
  if (school.admission?.focus === "art") {
    const art = (grades?.art ?? 3.9) * 12 + pathRoll(s, "drawing-admission") * 32;
    return exam.bulgarian * .15 + exam.math * .1 + gradePoints * .15 + art * .6;
  }
  const mathWeight = school.admission?.focus === "math" ? .55 : school.admission?.focus === "bulgarian" ? .25 : .4;
  return exam.math * mathWeight + exam.bulgarian * (.8 - mathWeight) + gradePoints * .2;
}

export function schoolView(s: GameState, school: SchoolState) {
  const grade = school.grade;
  const active = currentSchool(s, school);
  const actions: PathAction<SchoolState>[] = [];
  if (grade === null) return { active, actions, subjects: [], admissions: [] };

  if (school.left) {
    actions.push({
      id: "school.return", label: t("Продължи средното образование", "Resume secondary school"),
      run: () => ({ state: { ...school, left: false }, note: t("Върна се в училище в същия клас.", "You returned to school in the same grade.") }),
    });
    return { active, actions, subjects: [], admissions: [] };
  }
  if (s.age >= 16) actions.push({
    id: "school.leave", label: t("Прекъсни училище", "Leave school"),
    run: () => ({ state: { ...school, left: true }, note: t("Прекъсна училище. Можеш да се върнеш, за да довършиш класа.", "You left school. You can return to finish this grade.") }),
  });

  const admissions = school.enrolled ? [] : pathCities[s.city].schools.filter(candidate => grade === 1 ? candidate.primary : candidate.admission);
  if (grade === 1 && !school.enrolled && school.used.length === 0 && Object.keys(school.enrollment).length === 0) {
    for (const [zone, label] of Object.entries(pathCities[s.city].zones)) {
      if (zone === school.zone) continue;
      actions.push({
        id: "school.zone." + zone, label,
        run: () => ({
          state: { ...school, zone, schoolId: fallbackSchool(s.city, grade, zone).id },
          note: t("Район за първи клас: " + label.bg + ".", "First-grade catchment: " + label.en + "."),
        }),
      });
    }
  }
  for (const candidate of admissions) {
    const result = school.enrollment[candidate.id];
    if (!result) {
      actions.push({
        id: "school.apply." + candidate.id,
        label: grade === 1 ? t("Подай заявление", "Apply for a place") : t("Кандидатствай", "Apply"),
        run: () => {
          const score = grade === 8 ? highSchoolScore(s, school, candidate) : 0;
          const admitted = grade === 1 ? school.zone === candidate.zone || pathRoll(s, "catchment." + candidate.id) < .35
            : score >= candidate.admission!.cutoff;
          const reason = grade === 1
            ? (school.zone === candidate.zone
              ? t("Адресът е в района на училището.", "Your address is in the school’s catchment.")
              : t(admitted ? "Имаше свободно място извън района." : "Местата се запълниха с деца от района.",
                admitted ? "There was a place outside your catchment." : "Places filled with pupils from the catchment."))
            : t("Игрови бал " + Math.round(score) + "/100.", "Game admission score " + Math.round(score) + "/100.");
          return {
            state: { ...school, enrollment: { ...school.enrollment, [candidate.id]: admitted ? "offer" : "refused" } },
            note: t(candidate.name.bg + " · " + (admitted ? "има място. " : "няма място. ") + reason.bg,
              candidate.name.en + " · " + (admitted ? "place offered. " : "no place. ") + reason.en),
          };
        },
      });
    }
    if (result === "offer") actions.push({
      id: "school.enroll." + candidate.id, label: t("Запиши се", "Enroll"),
      run: () => ({
        state: { ...school, schoolId: candidate.id, enrolled: true },
        note: t("Записа се в " + candidate.name.bg + ".", "You enrolled at " + candidate.name.en + "."),
      }),
    });
  }

  const curriculum = schoolSubjects(grade, active);
  for (const subject of curriculum) {
    for (const action of ["study", "homework", "test", "classwork"] as const) {
      if (action === "classwork" && (grade < 5 || !CLASSWORK.has(subject))) continue;
      const id = "school." + action + "." + subject;
      const preparation = action === "study" || action === "homework";
      const label = {
        study: subject === "pe" ? t("Тренирай", "Train") : t("Учи", "Study"),
        homework: subject === "pe" ? t("Направи упражненията", "Do the exercises") : t("Направи домашното", "Do homework"),
        test: t("Контролно", "Take a test"), classwork: t("Класна работа", "Sit written exam"),
      }[action];
      actions.push({
        id, label,
        blocked: school.used.includes(id) ? t("Приключено за тази година.", "Done for this year.")
          : preparation && school.effort >= SCHOOL_EFFORT ? t("Използва учебното си време.", "You used your study time.") : undefined,
        run: () => {
          const used = [...school.used, id];
          const title = subjects[subject];
          if (preparation) {
            const gain = action === "study" ? 5 : 3;
            const state = { ...school, used, effort: school.effort + 1, prep: { ...school.prep, [subject]: (school.prep[subject] ?? 0) + gain } };
            const note = subject === "pe" ? t("Вече ти е по-лесно да завършиш упражненията.", "You can finish the exercises more comfortably.")
              : action === "homework"
              ? t(title.bg + " · Домашното е готово. Този път раницата няма да го „изяде“.", title.en + " · Homework done. The dog gets the day off.")
              : t(title.bg + " · Вече знаеш откъде идва отговорът.", title.en + " · You can now explain how you got the answer.");
            return { state, note, stats: subject === "pe" ? { health: 1 } : { brains: 1 } };
          }
          const score = roundMark(baseline(s, school, subject) + (pathRoll(s, id) - .5) * .9);
          const assessments = { ...school.assessments, [subject]: { ...school.assessments[subject], [action]: score } };
          return { state: { ...school, used, assessments }, note: formatMarks(title, score), stats: { joy: score >= 5 ? 1 : 0 } };
        },
      });
    }
  }
  if ([4, 7, 10].includes(grade) && school.nvo?.grade !== grade) actions.push({
    id: "school.nvo", label: t("Яви се на НВО", "Sit the national assessment"),
    run: () => {
      const exam = nationalExam(s, school);
      return { state: { ...school, nvo: exam }, note: nationalNote(exam) };
    },
  });
  if (grade === 12) for (const kind of ["bulgarian", "second"] as const) {
    const existing = school.finals.find(exam => exam.kind === kind);
    if (existing?.mark && (existing.mark >= 3 || existing.age === s.age)) continue;
    actions.push({
      id: "school.final." + kind, label: finalLabel(s, school, kind),
      run: () => {
        const exam = sitFinal(s, school, kind);
        return { state: { ...school, finals: [...school.finals.filter(entry => entry.kind !== kind), exam] }, note: formatMarks(subjects[exam.subject], exam.mark) };
      },
    });
  }
  if (grade === 12 && !active.vocational && !school.finals.some(exam => exam.kind === "second")) {
    for (const subject of (active.focus?.length ? active.focus : ["math", "english", "history"] as const)) {
      if (subject === "bulgarian" || subject === finalSubject(s, school)) continue;
      actions.push({
        id: "school.final-subject." + subject, label: subjects[subject],
        run: () => ({ state: { ...school, finalSubject: subject }, note: t("Предмет за втора матура: " + subjects[subject].bg + ".", "Second matriculation subject: " + subjects[subject].en + ".") }),
      });
    }
  }
  return { active, actions, subjects: curriculum, admissions };
}

export function closeSchoolYear(s: GameState, school: SchoolState): { school: SchoolState; events: PathEvent[] } {
  const grade = school.grade;
  if (grade === null || school.left) return { school, events: [] };
  const institution = currentSchool(s, school);
  const marks = Object.fromEntries(schoolSubjects(grade, institution).map(subject => [subject, yearMark(s, school, subject)])) as Subjects<number>;
  const gradeMarks = Object.values(marks);
  const weak = (Object.keys(marks) as Subject[]).filter(subject => (marks[subject] ?? 0) < 3);
  const report: GradeReport = { grade, marks, average: roundMark(average(gradeMarks)), passed: weak.length === 0 };
  const events: PathEvent[] = [{
    id: "school-report-" + s.age, title: t("Годишен успех · " + gradeName(grade).bg, "Annual results · " + gradeName(grade).en),
    note: report.passed ? formatMarks(t("Среден успех", "Average grade"), report.average)
      : t("Оставаш в класа. Поправка по " + weak.map(id => subjects[id].bg).join(", ") + ".",
        "You repeat this grade. Resits: " + weak.map(id => subjects[id].en).join(", ") + "."),
  }];
  let nvo = !report.passed && school.nvo?.grade === grade ? null : school.nvo;
  if ([4, 7, 10].includes(grade) && report.passed && nvo?.grade !== grade) {
    nvo = nationalExam(s, school);
    events.push({ id: "school-nvo-" + s.age, title: t("НВО · " + gradeName(grade).bg, "National assessment · " + gradeName(grade).en), note: nationalNote(nvo) });
  }

  let finals = school.finals;
  if (grade === 12 && report.passed) {
    finals = (["bulgarian", "second"] as const).map(kind => {
      const old = school.finals.find(exam => exam.kind === kind);
      return old && (old.mark >= 3 || old.age === s.age) ? old : sitFinal(s, school, kind);
    });
    events.push({
      id: "school-finals-" + s.age, title: t("Държавни изпити", "State examinations"),
      note: t(finals.map(exam => formatMarks(finalLabel(s, school, exam.kind), exam.mark).bg).join(" · ") + ".",
        finals.map(exam => formatMarks(finalLabel(s, school, exam.kind), exam.mark).en).join(" · ") + "."),
    });
  }
  const graduates = grade === 12 && report.passed && finals.every(exam => exam.mark >= 3);
  const nextGrade = graduates ? null : report.passed && grade < 12 ? grade + 1 : grade;
  const transcript = report.passed ? [...school.transcript.filter(year => year.grade !== grade), report] : school.transcript;
  let diploma = school.diploma;
  if (graduates) {
    const [bulgarian, second] = finals;
    const secondary = transcript.filter(year => year.grade >= 8);
    const subjectNames = [...new Set(secondary.flatMap(year => Object.keys(year.marks) as Subject[]))];
    const diplomaMarks = Object.fromEntries(subjectNames.map(subject => [
      subject, roundMark(average(secondary.flatMap(year => year.marks[subject] === undefined ? [] : [year.marks[subject]!]))),
    ])) as Subjects<number>;
    diploma = { average: roundMark(average(secondary.map(year => year.average))), marks: diplomaMarks,
      bulgarian: bulgarian.mark, second, vocational: institution.vocational };
    events.push({ id: "school-diploma-" + s.age, title: t("Диплома за средно образование", "Secondary school diploma"),
      note: t("Можеш да кандидатстваш във висше училище и за позиции със средно образование.",
        "You can apply to universities and jobs that require secondary education.") });
  } else if (grade === 12 && report.passed) {
    events.push({ id: "school-resit-" + s.age, title: t("Поправителна сесия", "Exam resits"),
      note: t("Успешните държавни изпити се пазят. Яви се отново на останалите.", "Passed state exams carry over. Retake the remaining exams.") });
  }
  const stepIntoHighSchool = nextGrade === 8 && grade === 7;
  return {
    school: { ...school, grade: nextGrade, report, transcript, diploma, nvo, finals, used: [], effort: 0, prep: {}, assessments: {}, enrollment: {},
      enrolled: stepIntoHighSchool ? false : true,
      schoolId: stepIntoHighSchool ? fallbackSchool(s.city, 8, school.zone).id : institution.id },
    events,
  };
}

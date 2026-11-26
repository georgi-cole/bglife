import { useState, type ReactNode } from "react";
import type { GameState } from "./engine.ts";
import { applicationLabel, employmentIncome, findJob, healthCoverage, insuranceView, jobGross, recentInsuredMonths, requirementName, workView } from "./employment.ts";
import { isSchoolAge, pathActionBlock } from "./lifePath.ts";
import { mark, type PathAction } from "./pathActions.ts";
import { fields, pathCities, pathMoney, playableCities, subjects } from "./pathCatalog.ts";
import { netMonthly, PATH_POLICY_YEAR, policy, relocation } from "./pathPolicy.ts";
import { gradeName, SCHOOL_EFFORT, schoolView } from "./school.ts";
import type { Language } from "./session.ts";
import { Icon, MenuTitle, copy, money } from "./ui.tsx";
import { allPrograms, findProgram, fundingName, scholarshipAmount, universityCosts, universityCoursework, universityView } from "./university.ts";
import "./career.css";

type Props = {
  s: GameState;
  l: Language;
  onAction: (id: string) => void;
  onClose: () => void;
};
type TrackProps = Pick<Props, "s" | "l" | "onAction">;
type Control = Pick<PathAction<unknown>, "id" | "label" | "blocked">;

function Action({ s, l, onAction, action, showReason = true }: TrackProps & { action: Control; showReason?: boolean }) {
  const blocked = pathActionBlock(s, action);
  return <div className="career-action">
    <button type="button" className="secondary-button" data-career-action={action.id} disabled={Boolean(blocked)}
      title={blocked?.[l]} onClick={() => onAction(action.id)}>{action.label[l]}</button>
    {blocked && showReason && <small>{blocked[l]}</small>}
  </div>;
}

function Actions({ items, showReason, ...track }: TrackProps & { items: Control[]; showReason?: boolean }) {
  return items.length > 0 && <div className="career-actions">
    {items.map(action => <Action key={action.id} {...track} action={action} showReason={showReason}/>)}
  </div>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="career-row"><span>{label}</span><strong>{children}</strong></div>;
}

function ToggleStrip<T extends string>({ options, selected, onSelect, label }: {
  options: readonly { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
  label: string;
}) {
  return <div className="career-toggles" role="group" aria-label={label}>
    {options.map(option => <button type="button" aria-pressed={option.id === selected}
      key={option.id} onClick={() => onSelect(option.id)}>{option.label}</button>)}
  </div>;
}

function SchoolCatalog({ track, actions }: { track: TrackProps; actions: Control[] }) {
  const { s, l } = track;
  const t = (bg: string, en: string) => copy(l, bg, en);
  const school = s.path!.school;
  const city = pathCities[s.city];
  const [zone, setZone] = useState("all");
  const grade = school.grade!;
  const candidates = city.schools.filter(item => grade <= 7 ? item.primary : item.admission);
  const zones = Object.entries(city.zones).filter(([id]) => candidates.some(school => school.zone === id));
  const admissionOpen = !school.enrolled && (grade === 1 || grade === 8);
  return <details className="career-card career-fold" open={admissionOpen || undefined}>
    <summary>
      <strong>{grade === 8 && admissionOpen ? t("Прием след VII клас", "High school admissions") : grade <= 7 ? t("Училища по райони", "Schools by district") : t("Гимназии по райони", "High schools by district")}</strong>
      <Icon name="down" size={16}/>
    </summary>
    <div className="career-fold-content">
      {grade === 1 && !school.enrolled && <div className="career-address">
        <p>{t("Адрес за прием", "Admission catchment")} · <strong>{city.zones[school.zone][l]}</strong></p>
        <Actions {...track} items={actions.filter(action => action.id.startsWith("school.zone."))} showReason={false}/>
      </div>}
      {zones.length > 1 && <ToggleStrip label={t("Филтър по район", "Filter by district")} selected={zone} onSelect={setZone}
        options={[{ id: "all", label: t("Всички", "All") }, ...zones.map(([id, text]) => ({ id, label: text[l] }))]}/>}
      {admissionOpen && grade === 8 && <p>{t("Балът в играта съчетава НВО и оценки. За изкуствата участва и изпит по рисуване.",
        "The game combines national assessment scores and grades. Arts admissions include a drawing exam.")}</p>}
      <div className="career-list">
        {candidates.filter(item => zone === "all" || item.zone === zone).map(item => {
          const result = school.enrollment[item.id];
          return <article className="career-list-item" key={item.id}>
            <h3>{item.name[l]}</h3>
            <p>{city.zones[item.zone][l]}{item.profile && " · " + item.profile[l]}</p>
            {item.id === school.schoolId && <span className="career-badge">{t("Твоето училище", "Your school")}</span>}
            {admissionOpen && result && <span className={"career-badge " + (result === "refused" ? "career-badge--closed" : "")}>
              {result === "offer" ? t("Прием с място", "Place offered") : t("Няма място", "No place")}
            </span>}
            <Actions {...track} items={actions.filter(action => action.id === "school.apply." + item.id || action.id === "school.enroll." + item.id)}/>
          </article>;
        })}
      </div>
    </div>
  </details>;
}

function School({ s, l, onAction }: TrackProps) {
  const school = s.path!.school;
  const t = (bg: string, en: string) => copy(l, bg, en);
  const view = schoolView(s, school);
  const track = { s, l, onAction };
  const diploma = school.diploma;
  if (diploma) return <section className="career-card" aria-label={t("Диплома за средно образование", "Secondary school diploma")}>
    <div className="career-card-title"><Icon name="check"/><h2>{t("Диплома за средно образование", "Secondary school diploma")}</h2></div>
    <Row label={t("Успех", "Average grade")}>{mark(diploma.average, l)}</Row>
    <Row label={t("Матура по БЕЛ", "Bulgarian matriculation exam")}>{mark(diploma.bulgarian, l)}</Row>
    <Row label={diploma.vocational ? t("Изпит за квалификация", "Vocational examination") : subjects[diploma.second.subject][l]}>{mark(diploma.second.mark, l)}</Row>
    {diploma.vocational && <Row label={t("Квалификация", "Qualification")}>{fields[diploma.vocational][l]}</Row>}
  </section>;

  const grade = school.grade!;
  const report = school.report;
  const exams = view.actions.filter(action => action.id === "school.nvo" || action.id.startsWith("school.final."));
  const secondSubject = view.actions.filter(action => action.id.startsWith("school.final-subject."));
  return <>
    <section className="career-card">
      <div className="career-card-title"><Icon name="journal"/><h2>{school.left ? t("Прекъснато обучение", "School interrupted") : gradeName(grade)[l]}</h2></div>
      <p>{view.active.name[l]}{view.active.profile && grade >= 8 && " · " + view.active.profile[l]}</p>
      {!school.left && <div className="career-progress">
        <Row label={t("Учебно време", "Study time")}>{school.effort}/{SCHOOL_EFFORT}</Row>
        <progress max={SCHOOL_EFFORT} value={school.effort} aria-label={t("Използвано учебно време", "Study time used")}/>
      </div>}
      <Actions {...track} items={view.actions.filter(action => action.id === "school.return")}/>
    </section>
    {!school.left && <>
      <SchoolCatalog key={s.city + "." + grade} track={track} actions={view.actions}/>
      <section className="career-card career-subjects">
        <h2>{t("Предмети", "Subjects")}</h2>
        <div className="career-list">
          {view.subjects.map(subject => {
            const latest = school.assessments[subject];
            return <details className="career-fold career-subject" key={subject}>
              <summary><strong>{subjects[subject][l]}</strong><span>{latest?.classwork ? mark(latest.classwork, l) : latest?.test ? mark(latest.test, l) : ""}</span>
                <Icon name="down" size={16}/></summary>
              <div className="career-fold-content">
                {Boolean(school.prep[subject]) && <Row label={t("Подготовка по предмета", "Subject preparation")}>{school.prep[subject]} / 8</Row>}
                {latest?.test !== undefined && <Row label={t("Контролно", "Test")}>{mark(latest.test, l)}</Row>}
                {latest?.classwork !== undefined && <Row label={t("Класна работа", "Written exam")}>{mark(latest.classwork, l)}</Row>}
                <Actions {...track} items={view.actions.filter(action => action.id.endsWith("." + subject) && /^school\.(study|homework|test|classwork)\./.test(action.id))}/>
              </div>
            </details>;
          })}
        </div>
      </section>
      {(exams.length > 0 || (grade === 12 && school.finals.length > 0) || school.nvo) && <section className="career-card">
        <h2>{grade === 12 ? t("Държавни изпити", "State examinations") : t("Национално външно оценяване", "National assessment")}</h2>
        {school.nvo && grade !== 12 && <Row label={gradeName(school.nvo.grade)[l]}>
          {t("БЕЛ", "Bulgarian")} {school.nvo.bulgarian}/100 · {t("Математика", "Mathematics")} {school.nvo.math}/100</Row>}
        {grade === 12 && school.finals.map(exam => <Row key={exam.kind} label={subjects[exam.subject][l]}>{mark(exam.mark, l)}</Row>)}
        {secondSubject.length > 0 && <><p>{t("Друг предмет за втора матура", "Other subjects for your second exam")}</p><Actions {...track} items={secondSubject}/></>}
        <Actions {...track} items={exams}/>
      </section>}
      {report && <details className="career-card career-fold">
        <summary><strong>{t("Последен годишен успех", "Latest school report")} · {gradeName(report.grade)[l]}</strong><span>{mark(report.average, l)}</span><Icon name="down" size={16}/></summary>
        <div className="career-fold-content">
          {Object.entries(report.marks).map(([subject, score]) => <Row key={subject} label={subjects[subject as keyof typeof subjects][l]}>{mark(score, l)}</Row>)}
        </div>
      </details>}
      {view.actions.some(action => action.id === "school.leave") && <details className="career-card career-fold">
        <summary><strong>{t("Ученически статус", "Enrollment status")}</strong><Icon name="down" size={16}/></summary>
        <div className="career-fold-content"><Actions {...track} items={view.actions.filter(action => action.id === "school.leave")}/></div>
      </details>}
    </>}
  </>;
}

function University({ s, l, onAction }: TrackProps) {
  const { university, school } = s.path!;
  const student = university.student;
  const view = universityView(s, university, school.diploma);
  const t = (bg: string, en: string) => copy(l, bg, en);
  const track = { s, l, onAction };
  const [city, setCity] = useState(s.city);
  const fundingFees = universityCosts(university);
  return <>
    {university.degrees.length > 0 && <section className="career-card">
      <h2>{t("Висше образование", "University degrees")}</h2>
      {university.degrees.map(degree => {
        const program = findProgram(degree.city, degree.program);
        return <Row key={degree.program} label={program ? program.title[l] + " · " + program.institution[l] : fields[degree.field][l]}>{mark(degree.mark, l)}</Row>;
      })}
    </section>}
    {student && view.active ? <section className="career-card">
      <div className="career-card-title"><Icon name="journal"/><h2>{view.active.title[l]}</h2></div>
      <p>{view.active.institution[l]} · {fundingName[student.funding][l]}</p>
      <Row label={t("Курс", "Year of study")}>{student.yearsPassed + 1} / {view.active.years}</Row>
      {student.paused ? <p>{t("Временно прекъсване", "Studies paused")}</p> : <>
        <Row label={t("Годишна такса", "Annual tuition")}>{money(fundingFees.due, l)}</Row>
        <Row label={t("Предмети в програмата", "Coursework")}>{universityCoursework(view.active).map(subject => subject[l]).join(" · ")}</Row>
        {student.session !== null && <Row label={t("Успех от сесията", "Finals result")}>{mark(student.session, l)}</Row>}
        {student.scholarship && <Row label={t("Стипендия", "Scholarship")}>
          {student.scholarship === "awarded" ? money(scholarshipAmount, l) : t("Извън класирането", "No award")}</Row>}
      </>}
      <Actions {...track} items={view.actions.filter(action => action.id !== "university.withdraw" && action.id !== "university.pause")}/>
      <details className="career-fold career-subject">
        <summary><strong>{t("Студентски статус", "Enrollment status")}</strong><Icon name="down" size={16}/></summary>
        <div className="career-fold-content"><Actions {...track} items={view.actions.filter(action => ["university.withdraw", "university.pause"].includes(action.id))}/></div>
      </details>
    </section> : school.diploma && s.age >= 18 ? <section className="career-card">
      <h2>{t("Кандидатстване в университет", "University admissions")}</h2>
      <ToggleStrip label={t("Град на университета", "University city")} selected={city} onSelect={setCity}
        options={playableCities.map(id => ({ id, label: pathCities[id].name[l] }))}/>
      {pathCities[city].programs.length === 0 && <p>{t("Тук няма университетски програми. Избери друг град за кандидатстване.",
        "There are no university programs here. Choose another city to apply.")}</p>}
      <div className="career-list">
        {allPrograms.filter(item => item.city === city && !university.degrees.some(degree => degree.program === item.program.id)).map(({ program }) => {
          const outcome = university.applications[program.id];
          const exams = university.entrance[program.id];
          const moveCost = city === s.city ? 0 : -relocation(s, city).cashDelta;
          return <article className="career-list-item" key={program.id}>
            <h3>{program.title[l]}</h3>
            <p>{program.institution[l]} · {program.years} {t("години", "years")}</p>
            <p>{program.admission.exam ? t("Приемен изпит", "Entrance exam") + " · " + program.admission.exam.map(subject => subjects[subject][l]).join(", ")
              : t("Бал от диплома и матури", "Diploma and matriculation grades") + " · " + subjects[program.admission.subject][l]}</p>
            {exams && <Row label={t("Оценки от приемния изпит", "Entrance exam results")}>{exams.map(score => mark(score, l)).join(" · ")}</Row>}
            {outcome && <span className={"career-badge " + (outcome.outcome === "refused" ? "career-badge--closed" : "")}>
              {outcome.outcome === "refused" ? t("Извън класирането", "No place offered") : fundingName[outcome.outcome][l]} · {mark(outcome.score, l)}
            </span>}
            {Object.entries(program.fee).map(([funding, fee]) => <Row key={funding} label={fundingName[funding as keyof typeof fundingName][l]}>{money(pathMoney(fee), l)} {t("/ год.", "/ year")}</Row>)}
            {moveCost > 0 && <Row label={t("Преместване при записване", "Move upon enrollment")}>{money(moveCost, l)}</Row>}
            <Actions {...track} items={view.actions.filter(action => action.id.endsWith("." + program.id))}/>
          </article>;
        })}
      </div>
    </section> : <section className="career-card">
      <h2>{t("Университет", "University")}</h2>
      <p>{t("За кандидатстване ти трябва диплома за средно образование.", "You need a secondary school diploma to apply.")}</p>
    </section>}
  </>;
}

function Work({ s, l, onAction }: TrackProps) {
  const work = s.path!.work;
  const view = workView(s, work);
  const city = pathCities[s.city];
  const track = { s, l, onAction };
  const t = (bg: string, en: string) => copy(l, bg, en);
  const current = work.job;
  const job = current && findJob(current.city, current.job);

  return <>
    {current && job && <section className="career-card">
      <div className="career-card-title"><Icon name="bag"/><h2>{job.title[l]}</h2></div>
      <p>{job.employer[l]} · {current.monthsLeft !== null ? t("Срочен договор", "Fixed-term contract") : t("Безсрочен договор", "Permanent contract")}</p>
      <Row label={t("Брутно / месец", "Gross / month")}>{money(current.gross, l)}</Row>
      <Row label={t("Нетно / месец", "Estimated take-home / month")}>{money(netMonthly(current.gross), l)}</Row>
      <Row label={t("Работно време", "Working hours")}>{current.hours} {t("ч. на ден", "h/day")}</Row>
      <div className="career-progress"><p>{t("Представяне", "Performance")}</p>
        <progress max={100} value={current.performance} aria-label={t("Представяне на работа", "Job performance")}/></div>
      <Actions {...track} items={view.actions.filter(action => ["work.practice", "work.raise"].includes(action.id))}/>
      <details className="career-fold career-subject">
        <summary><strong>{t("Трудов договор", "Employment contract")}</strong><Icon name="down" size={16}/></summary>
        <div className="career-fold-content"><Actions {...track} items={view.actions.filter(action => action.id === "work.leave")}/></div>
      </details>
    </section>}
    <section className="career-card">
      <h2>{t("Свободни позиции", "Vacancies")} · {city.name[l]}</h2>
      {s.age < 18 && <p>{t("Само леки летни позиции. Работодателят урежда разрешение от Инспекцията по труда и медицински преглед.",
        "Light summer jobs only. The employer arranges a Labour Inspectorate permit and a medical check.")}</p>}
      {work.prepared ? <span className="career-badge">{t("CV и интервю · подготвени", "CV and interview · ready")}</span>
        : <Actions {...track} items={view.actions.filter(action => action.id === "work.prepare")}/>}
      <Actions {...track} items={view.actions.filter(action => action.id.startsWith("work.register."))}/>
      {view.vacancies.length === 0 && <p>{t("Летни позиции се появяват от 16 г.", "Summer roles unlock at 16.")}</p>}
      {([false, true] as const).map(qualified => {
        const vacancies = view.vacancies.filter(item => (item.requirement !== "none") === qualified);
        return vacancies.length > 0 && <div className="career-vacancies" key={String(qualified)}>
          <h3>{qualified ? t("С изисквана квалификация", "With qualification requirements") : t("Без изисквана квалификация", "No qualification required")}</h3>
          <div className="career-list">
            {vacancies.map(vacancy => {
              const status = work.applications[vacancy.id];
              const gross = jobGross(s, vacancy);
              const controls = view.actions.filter(action => action.id.endsWith("." + vacancy.id) || action.id.startsWith("work.interview." + vacancy.id + "."));
              return <article className="career-list-item" key={vacancy.id}>
                <h4>{vacancy.title[l]}</h4>
                <p>{vacancy.employer[l]} · {vacancy.hours} {t("ч. на ден", "h/day")}{vacancy.termMonths && " · " + vacancy.termMonths + t(" месеца", " months")}</p>
                {qualified && <p>{requirementName(vacancy)[l]}</p>}
                <Row label={t("Брутно / месец", "Gross / month")}>{money(gross, l)}</Row>
                <Row label={t("Прибл. нетно / месец", "Estimated take-home / month")}>{money(netMonthly(gross), l)}</Row>
                {status && <span className={"career-badge " + (status.includes("failed") || status === "no-callback" ? "career-badge--closed" : "")}>{applicationLabel[status][l]}</span>}
                <Actions {...track} items={controls}/>
              </article>;
            })}
          </div>
        </div>;
      })}
      <p className="career-source">{t("Игрови заплати по средната брутна заплата на НСИ", "Game salaries based on the NSI gross wage average")} · {city.district[l]} · {t("III трим. 2026", "Q3 2026")}</p>
    </section>
  </>;
}

function duration(months: number, l: Language) {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return [years ? years + copy(l, " г.", " y") : "", remainder || years === 0 ? remainder + copy(l, " м.", " mo") : ""].filter(Boolean).join(" ");
}

function Insurance({ s, l, onAction }: TrackProps) {
  const work = s.path!.work;
  const view = insuranceView(s, work);
  const { pension } = view;
  const t = (bg: string, en: string) => copy(l, bg, en);
  const track = { s, l, onAction };
  const health = healthCoverage(s, work);
  const healthDue = employmentIncome(s, work).health;
  const coverage = {
    public: t("За сметка на държавата", "State-covered"),
    employee: t("По трудов договор за месеците на работа", "Payroll contributions for months worked"),
    pension: t("Като пенсионер", "Pensioner coverage"),
    benefit: t("За периода с обезщетение", "Covered during unemployment benefits"),
    own: t("За твоя сметка", "Self-paid contributions"),
  }[health];
  return <>
    <section className="career-card">
      <div className="career-card-title"><Icon name="heart"/><h2>{t("Здравно осигуряване", "Health insurance")}</h2></div>
      <p>{coverage}</p>
      {work.healthDebt > 0 && <Row label={t("Неплатени вноски", "Outstanding contributions")}>{money(work.healthDebt, l)}</Row>}
      {healthDue > 0 && <Row label={t("Лични вноски за годината", "Personal contributions this year")}>{money(healthDue, l)}</Row>}
    </section>
    <section className="career-card">
      <h2>{t("Безработица", "Unemployment")}</h2>
      <Row label={t("Осигурени от последните 18 месеца", "Insured within the last 18 months")}>{recentInsuredMonths(work)} / 18</Row>
      {work.benefit && <Row label={t("Отпуснато обезщетение", "Benefit awarded")}>
        {money(work.benefit.daily, l)} {t("/ ден", "/ day")} · {duration(work.benefit.months, l)}</Row>}
      <Actions {...track} items={view.actions.filter(action => action.id === "insurance.unemployment")}/>
    </section>
    <section className="career-card">
      <h2>{t("Пенсия", "Pension")}</h2>
      <Row label={t("Осигурителен стаж", "Insurance service")}>{duration(pension.service, l)}</Row>
      <Row label={t("Възраст и стаж при общия ред", "Standard age and service requirements")}>
        {duration(pension.standard.age, l)} · {duration(pension.standard.service, l)}</Row>
      <Row label={t("При непълен стаж · възраст и действителен стаж", "Reduced service · age and actual service")}>
        {duration(policy.reduced.age, l)} · {duration(policy.reduced.service, l)}</Row>
      {work.pension && <Row label={t("Пенсия на месец", "Monthly pension")}>{money(work.pension.monthly, l)}</Row>}
      <Actions {...track} items={view.actions.filter(action => action.id === "insurance.pension")}/>
      <p className="career-source">{t("Игрови правила по действащите през", "Game rules based on")} {PATH_POLICY_YEAR} {t("г.", "rules")}</p>
    </section>
  </>;
}

type Panel = "education" | "work" | "insurance";

export function Career({ s, l, onAction, onClose }: Props) {
  const t = (bg: string, en: string) => copy(l, bg, en);
  const path = s.path;
  const child = isSchoolAge(s.age);
  const [selected, setSelected] = useState<Panel>(child || (path?.school.grade != null && !path.school.left) || path?.university.student ? "education" : "work");
  const panels: { id: Panel; label: string }[] = [{ id: "education", label: child ? t("Училище", "School") : t("Образование", "Education") }];
  if (s.age >= 16) panels.push({ id: "work", label: child ? t("Лятна работа", "Summer jobs") : t("Работа", "Work") });
  if (!child) panels.push({ id: "insurance", label: t("Осигуряване", "Social insurance") });
  const panel = panels.some(item => item.id === selected) ? selected : panels[0].id;
  const track = { s, l, onAction };
  const last = s.history.at(-1);
  const feedback = last?.age === s.age && last.kind === "path" ? last : null;
  return <section className="career-view" aria-labelledby="career-title">
    <header className="career-heading">
      <MenuTitle onClose={onClose} closeLabel={t("Към дневника", "Back to journal")} back>
        <h1 id="career-title">{child ? t("Даскало", "Education") : t("Кариера", "Career")}</h1>
      </MenuTitle>
      <span><Icon name="pin" size={15}/>{pathCities[s.city].name[l]}</span>
    </header>
    {path ? <>
      {panels.length > 1 && <ToggleStrip selected={panel} options={panels} onSelect={setSelected} label={t("Образование и работа", "Education and work")}/>}
      {feedback && <div className="career-feedback" role="status" data-testid="career-feedback">
        <Icon name="check" size={18}/><p>{feedback.text[l]}</p>
      </div>}
      {panel === "education" ? <><School {...track}/>{!child && <University {...track}/>}</>
        : panel === "work" ? <Work {...track}/> : <Insurance {...track}/>}
    </> : <section className="career-card"><p>{t("Тази история е приключила. Можеш да разгледаш дневника ѝ.", "This life has ended. You can still read its journal.")}</p></section>}
  </section>;
}

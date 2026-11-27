import { cities, type City } from "./cities.ts";
import { jobTypes, type JobId } from "./cityPaths.ts";
import type { Career, GameState, Text } from "./engine.ts";
import { maternityPay, onMaternityLeave } from "./maternity.ts";
import { average, limit, pathRoll, type PathAction, type PathEvent } from "./pathActions.ts";
import { fields, legacyGenericJob, legacyLocalJobId, pathCities, pathMoney, pathText as t, type Field, type Job } from "./pathCatalog.ts";
import { netMonthly, policy } from "./pathPolicy.ts";
import type { WorkplaceProgress } from "./workplace.ts";

type Contract = {
  job: string;
  city: City;
  gross: number;
  hours: 4 | 8;
  monthsLeft: number | null;
  tenure: number;
  performance: number;
  startedAt: number;
  workplace?: WorkplaceProgress;
};
type Application = "interview" | "offer" | "no-callback" | "interview-failed" | "declined" | "accepted";
type Separation = { age: number; reason: "leave" | "expiry" | "dismissal" };
type Benefit = { months: number; daily: number };
type RegulatedField = "medicine" | "nursing";
type Pension = { kind: "full" | "reduced"; monthly: number };
export type EmploymentState = {
  job: Contract | null;
  applications: Record<string, Application>;
  prepared: boolean;
  worked: boolean;
  serviceCredits: number;
  recentGross: number[];
  incomeTotal: number;
  insuredMonths: number;
  separation: Separation | null;
  benefit: Benefit | null;
  pension: Pension | null;
  healthDebt: number;
  registrations: { field: RegulatedField; city: City }[];
};
export type HealthCoverage = "public" | "employee" | "benefit" | "pension" | "own";
export const applicationLabel: Record<Application, Text> = {
  interview: t("Покана за интервю", "Interview invitation"), offer: t("Предложение за договор", "Job offer"),
  "no-callback": t("Без покана", "No callback"), "interview-failed": t("Интервюто не мина", "Unsuccessful interview"),
  declined: t("Отказано предложение", "Offer declined"), accepted: t("Подписан договор", "Contract signed"),
};

const SERVICE_PER_MONTH = 14;
const WORKDAYS_PER_MONTH = 21;
const MIN_YOUTH_AGE = 16;
export const serviceMonths = (employment: EmploymentState) => Math.floor(employment.serviceCredits / SERVICE_PER_MONTH);
export const recentInsuredMonths = (employment: EmploymentState) => employment.recentGross.slice(-18).filter(Boolean).length;
export const findJob = (city: City, id: string) => id === legacyGenericJob.id ? legacyGenericJob : pathCities[city].jobs.find(job => job.id === id);
const activeMonths = (job: Contract) => Math.min(12, job.monthsLeft ?? 12);

function legacyGross(city: City, career: Career, local?: JobId | null): number {
  const annualNet = career === "qa" ? 1_080_000 : career === "woodcarver" ? 840_000
    : career === "local-job" ? local ? jobTypes[local].pay : city === "sofia" ? 1_380_000 : 1_110_000 : 0;
  const preTax = annualNet / (12 * (1 - policy.incomeTax));
  return Math.round(preTax + Math.min(preTax / (1 - policy.employeeInsurance), policy.insuranceCeiling) * policy.employeeInsurance);
}

function legacyWorkHistory(s: GameState) {
  let role: Career = "student", gross = 0, tenure = 0;
  const months: number[] = [];
  for (const event of s.history) {
    if (event.id === "life.retire" || (event.id.startsWith("move.") && role === "local-job")) {
      role = "student";
      gross = 0;
      tenure = 0;
    }
    if (event.startedCareer || event.id.startsWith("life.work.")) {
      role = event.startedCareer ?? "local-job";
      const local = event.id.startsWith("life.work.") ? event.id.slice(10) as JobId : null;
      gross = legacyGross(event.city, role, local);
      tenure = 0;
    }
    if (event.kind === "year" && event.age >= 19) {
      months.push(...Array<number>(12).fill(Math.min(gross, policy.insuranceCeiling)));
      if (gross > 0) tenure += 12;
    }
  }
  return { months, tenure };
}

export function startEmployment(s: GameState): EmploymentState {
  const id = s.localJob ? legacyLocalJobId(s.city, s.localJob)
    : s.career === "qa" && s.city === "sofia" ? "sofia-qa"
    : s.career === "woodcarver" && s.city === "tryavna" ? "tryavna-workshop" : legacyGenericJob.id;
  const placed = s.retirement === null && s.career !== "student" ? findJob(s.city, id) ?? legacyGenericJob : null;
  const gross = legacyGross(s.city, s.career, s.localJob);
  const { months, tenure } = legacyWorkHistory(s);
  const insuredMonths = s.serviceYears * 12;
  const recorded = months.filter(Boolean).slice(0, insuredMonths);
  const missing = Math.max(0, insuredMonths - recorded.length);
  const incomeTotal = recorded.reduce((total, value) => total + value, 0)
    + missing * (gross || pathCities[s.city].benchmark);
  const pension = s.retirement ? {
    kind: s.serviceYears * 12 >= (s.avatar?.presentation === "male" ? policy.men : policy.women).service
      ? "full" as const : "reduced" as const, monthly: Math.round(s.retirement.payment / 12),
  } : null;
  return {
    job: placed ? { job: placed.id, city: s.city, gross, hours: 8, monthsLeft: null, tenure, performance: 55, startedAt: s.age - Math.floor(tenure / 12) } : null,
    applications: {}, prepared: false, worked: false,
    serviceCredits: insuredMonths * SERVICE_PER_MONTH, recentGross: months.slice(-24), incomeTotal,
    insuredMonths, benefit: null, separation: null, pension, healthDebt: 0, registrations: [],
  };
}

export function requirementName(job: Job): Text {
  return job.requirement === "none" ? t("Без изисквана квалификация", "No formal qualifications")
    : job.requirement === "secondary" ? t("Средно образование", "Secondary school diploma") : fields[job.requirement];
}

function qualification(s: GameState, requirement: Job["requirement"]) {
  const diploma = s.path?.school.diploma;
  if (requirement === "none") return 4;
  if (requirement === "secondary") return diploma?.average;
  const degree = s.path?.university.degrees.filter(item => item.field === requirement).map(item => item.mark) ?? [];
  if (diploma?.vocational === requirement) degree.push(diploma.average);
  return degree.length ? Math.max(...degree) : undefined;
}

export function jobGross(s: GameState, job: Job): number {
  const scale = job.hours / (s.age < 18 ? 7 : 8);
  const fluctuation = .93 + pathRoll(s, "gross." + job.id) * .14;
  const fullTime = Math.round(pathCities[s.city].benchmark * job.wageRatio * fluctuation / 1000) * 1000;
  return Math.max(Math.ceil(policy.minimumWage * scale), Math.round(fullTime * scale));
}

function callbackChance(s: GameState, work: EmploymentState, job: Job, credential: number) {
  const referral = Number(job.id === "tryavna-workshop" && s.flags.includes("apprentice")
    || job.id === "sofia-qa-trainee" && s.flags.includes("qaTrial"));
  return limit(.56 + (credential - 4) * .1 + (s.stats.influence - 28) * .005 + Number(work.prepared) * .18
    + Math.min(work.insuredMonths, 30) * .004 + referral * .16 + Number(job.requirement === "none") * .14, .18, .97);
}

const interviewAnswers = {
  learn: t("Обясни как би навлязъл в работата", "Explain how you would learn the job"),
  example: t("Дай конкретен пример от практика", "Give an example from experience"),
  task: t("Поискай практическа задача", "Ask for a practical task"),
} as const;

function interviewChance(s: GameState, work: EmploymentState, job: Job, answer: keyof typeof interviewAnswers, credential: number) {
  const approach = {
    learn: (s.stats.influence - 24) * .006 + (job.requirement === "none" ? .12 : -.04),
    example: Math.min(work.insuredMonths, 36) * .004 + (credential - 4) * .1,
    task: (s.stats.brains - 52) * .006 + (job.requirement === "tech" ? .08 : 0),
  }[answer];
  return limit(.67 + approach + Number(work.prepared) * .11 + (s.stats.health - 65) * .002, .2, .97);
}

const register = {
  medicine: t("Регистрация в районната колегия на БЛС", "Register with the local Bulgarian Medical Association chapter"),
  nursing: t("Вписване в регистъра на БАПЗГ", "Register with the Bulgarian Association of Health Professionals"),
};

function registered(s: GameState, work: EmploymentState, field: RegulatedField) {
  const district = cities[s.city].district;
  return work.registrations.some(item => item.field === field && cities[item.city].district === district);
}

export function currentJobActions(s: GameState, work: EmploymentState): PathAction<EmploymentState>[] {
  const actions: PathAction<EmploymentState>[] = [];
  if (onMaternityLeave(s)) return actions;
  const current = work.job;
  const job = current && findJob(current.city, current.job);
  if (current && job) {
    actions.push({
      id: "work.practice", label: t("Поеми отговорност на работа", "Take on responsibility"),
      blocked: work.worked ? t("Приключено за тази година.", "Done for this year.") : undefined,
      run: () => ({ state: { ...work, worked: true, job: { ...current, performance: Math.min(current.performance + 14, 100) } },
        stats: { influence: 2, joy: -2 },
        note: t("Колегите забелязаха, че могат да разчитат на теб.", "Your coworkers noticed they can count on you.") }),
    });
    const salaryLimit = Math.max(policy.minimumWage, pathCities[current.city].benchmark * job.wageRatio) * current.hours / 8 * 1.6;
    if (s.age >= 18 && current.monthsLeft === null) actions.push({
      id: "work.raise", label: t("Поискай увеличение", "Ask for a raise"),
      blocked: current.tenure < 12 ? t("Нужни са поне 12 месеца на тази позиция.", "You need at least 12 months in this role.")
        : current.gross >= salaryLimit ? t("Достигна горната граница за тази позиция.", "You reached the upper pay band for this role.")
        : current.performance < 70 ? t("Нужно е по-добро представяне на работа.", "You need a stronger performance record.") : undefined,
      run: () => {
        const bossBond = current.workplace?.bonds.boss ?? 55;
        const accepted = current.performance >= 88 || pathRoll(s, "raise." + current.job) < limit(.78 + (bossBond - 55) * .004, .6, .95);
        return { state: { ...work, job: { ...current, gross: accepted ? Math.round(Math.min(current.gross * 1.08, salaryLimit)) : current.gross,
          performance: accepted ? current.performance - 10 : current.performance } },
          note: accepted ? t("Договори увеличение на брутната заплата.", "You negotiated a gross pay raise.")
            : t("Началникът отложи разговора за следващия бюджет.", "Your manager put it off until the next budget.") };
      },
    });
    actions.push({
      id: "work.leave", label: t("Напусни", "Resign"),
      run: () => ({ state: { ...work, job: null, separation: { age: s.age, reason: "leave" } },
        note: t("Напусна по собствено желание. Правото на обезщетение зависи от осигуряването ти.",
          "You resigned voluntarily. Any benefit depends on your insurance record.") }),
    });
  }

  return actions;
}

export function workView(s: GameState, work: EmploymentState) {
  if (onMaternityLeave(s)) return { actions: [], vacancies: [] };
  const actions = currentJobActions(s, work);
  const vacancies = s.age < MIN_YOUTH_AGE ? [] : pathCities[s.city].jobs.filter(job => s.age >= 18 || job.youth);
  if (s.age < MIN_YOUTH_AGE) return { actions, vacancies };
  const current = work.job;
  if (!work.prepared) actions.push({
    id: "work.prepare", label: t("Подготви CV и интервю", "Prepare your CV and interview"),
    run: () => ({ state: { ...work, prepared: true },
      note: t("Подреди опита си и репетира отговор за „Разкажи ми за себе си“.", "You organised your experience and rehearsed “Tell me about yourself.”") }),
  });
  for (const field of ["medicine", "nursing"] as const) {
    if (qualification(s, field) === undefined || registered(s, work, field)) continue;
    actions.push({
      id: "work.register." + field, label: register[field],
      run: () => ({
        state: { ...work, registrations: [...work.registrations, { field, city: s.city }] },
        note: t("Професионалната регистрация е вписана. Можеш да кандидатстваш за позиции в района.",
          "Your professional registration was recorded. You can now apply for jobs in the district."),
      }),
    });
  }
  for (const job of vacancies) {
    const status = work.applications[job.id];
    const credential = qualification(s, job.requirement);
    const field = job.requirement;
    const missingRegistration = (field === "medicine" || field === "nursing") && !registered(s, work, field) ? register[field] : undefined;
    if (!status) {
      actions.push({
        id: "work.apply." + job.id, label: t("Изпрати кандидатура", "Submit application"),
        blocked: credential === undefined ? t("Изисква се " + requirementName(job).bg.toLowerCase() + ".", "Requires " + requirementName(job).en.toLowerCase() + ".")
          : missingRegistration ?? (current?.job === job.id ? t("Вече си на тази позиция.", "You already hold this role.") : undefined),
        run: () => {
          const called = pathRoll(s, "callback." + job.id) < callbackChance(s, work, job, credential!);
          return { state: { ...work, applications: { ...work.applications, [job.id]: called ? "interview" : "no-callback" } },
            note: called ? t(job.employer.bg + " те покани на интервю.", job.employer.en + " invited you to interview.")
              : t(job.employer.bg + " продължава с други кандидати.", job.employer.en + " is moving forward with other candidates.") };
        },
      });
      continue;
    }
    if (status === "interview") for (const answer of Object.keys(interviewAnswers) as (keyof typeof interviewAnswers)[]) {
      actions.push({
        id: "work.interview." + job.id + "." + answer, label: interviewAnswers[answer],
        run: () => {
          const pass = pathRoll(s, "interview." + job.id) < interviewChance(s, work, job, answer, credential ?? 4);
          return { state: { ...work, applications: { ...work.applications, [job.id]: pass ? "offer" : "interview-failed" } },
            stats: { influence: 1 }, note: pass ? t("Интервюто мина. Получи предложение за договор.", "You passed the interview and received a job offer.")
              : t("Не получи предложение. Можеш да опиташ на друга позиция.", "You did not receive an offer. You can try another role.") };
        },
      });
    }
    if (status !== "offer") continue;
    actions.push({
      id: "work.accept." + job.id, label: t("Подпиши договора", "Sign the contract"),
      blocked: current ? t("Първо приключи настоящия си договор.", "End your current contract first.") : undefined,
      run: () => ({
        state: { ...work, job: { job: job.id, city: s.city, gross: jobGross(s, job), hours: job.hours,
          monthsLeft: job.termMonths ?? null, tenure: 0, performance: 56, startedAt: s.age },
          applications: { ...work.applications, [job.id]: "accepted" }, worked: false, benefit: null, separation: null },
        note: s.age < 18
          ? t(job.title.bg + " · 4 часа. Работодателят уреди разрешението от Инспекцията по труда и прегледа.",
            job.title.en + " · four-hour shifts. The employer arranged the Labour Inspectorate permit and medical check.")
          : t("Подписа трудов договор за „" + job.title.bg + "“. Заплатата и стажът се отчитат в края на годината.",
            "You signed a contract as " + job.title.en + ". Pay and service are recorded at year-end."),
      }),
    }, {
      id: "work.decline." + job.id, label: t("Откажи", "Decline"),
      run: () => ({ state: { ...work, applications: { ...work.applications, [job.id]: "declined" } },
        note: t("Отказа предложението за „" + job.title.bg + "“.", "You declined the offer for " + job.title.en + ".") }),
    });
  }
  return { actions, vacancies };
}

export function pensionRequirements(s: GameState, work: EmploymentState) {
  const standard = s.avatar?.presentation === "male" ? policy.men : policy.women;
  const service = serviceMonths(work);
  const full = s.age * 12 >= standard.age && service >= standard.service;
  const reduced = s.age * 12 >= policy.reduced.age && service >= policy.reduced.service;
  return { standard, service, eligible: full ? "full" as const : reduced ? "reduced" as const : null };
}

function unemploymentDuration(months: number) {
  if (months <= 36) return 4;
  if (months <= 84) return 6;
  if (months <= 132) return 8;
  if (months <= 180) return 10;
  return 12;
}

export function insuranceView(s: GameState, work: EmploymentState) {
  const actions: PathAction<EmploymentState>[] = [];
  const pension = pensionRequirements(s, work);
  if (!work.pension) {
    actions.push({
      id: "insurance.pension", label: t("Подай заявление за пенсия", "Apply for your pension"),
      blocked: !pension.eligible ? t("Възрастта и стажът още не покриват условията.", "You do not yet meet the age and service criteria.") : undefined,
      run: () => {
        const kind = pension.eligible!;
        const mean = work.incomeTotal / Math.max(1, work.insuredMonths);
        const floor = kind === "reduced" ? Math.round(policy.pensionMin * .85) : policy.pensionMin;
        const monthly = Math.round(limit(mean * (pension.service / 12) * .0135, floor, policy.pensionCeiling));
        return { state: { ...work, pension: { kind, monthly }, benefit: null, separation: null },
          note: t(kind === "full" ? "НОИ отпусна пенсия за осигурителен стаж и възраст." : "НОИ отпусна пенсия при непълен стаж.",
            kind === "full" ? "Your old-age and insurance pension was awarded." : "You were awarded an old-age pension with reduced service.") };
      },
    });
  }
  if (s.age >= 18 && !work.job && !work.pension && !work.benefit) {
    const separation = work.separation;
    actions.push({
      id: "insurance.unemployment", label: t("Регистрирай се и подай заявление до НОИ", "Register and apply for unemployment benefit"),
      blocked: !separation || separation.age !== s.age ? t("Подай заявление в първата игрова година без този договор.", "Apply in the first in-game year without this contract.")
        : recentInsuredMonths(work) < 12 ? t("Нужни са 12 месеца с осигуряване за безработица от последните 18.", "You need 12 insured months out of the last 18.") : undefined,
      run: () => {
        const voluntary = separation!.reason === "leave";
        const wages = work.recentGross.map(value => value || policy.minimumWage);
        const history = [...Array<number>(24 - wages.length).fill(policy.minimumWage), ...wages];
        const daily = voluntary ? policy.unemploymentMin
          : Math.round(limit(average(history) * .6 / WORKDAYS_PER_MONTH, policy.unemploymentMin, policy.unemploymentMax));
        const months = voluntary ? 4 : unemploymentDuration(work.insuredMonths);
        return { state: { ...work, benefit: { months, daily } },
          note: t("Отпуснаха обезщетение за " + months + " месеца.", "You were awarded " + months + " months of unemployment benefit.") };
      },
    });
  }
  return { actions, pension };
}

export function healthCoverage(s: GameState, work: EmploymentState): HealthCoverage {
  if (work.job) return "employee";
  if (work.pension) return "pension";
  if (work.benefit) return "benefit";
  const school = s.path?.school;
  const student = s.path?.university.student;
  if (s.age < 18 || (s.age < 22 && school?.grade != null && !school.left) || (s.age < 26 && student && !student.paused)) return "public";
  return "own";
}

export function employmentIncome(s: GameState, work: EmploymentState) {
  const maternity = maternityPay(s, work);
  const wage = work.job && !onMaternityLeave(s) ? activeMonths(work.job) * netMonthly(work.job.gross) : 0;
  const benefit = work.benefit ? work.benefit.daily * WORKDAYS_PER_MONTH * work.benefit.months : 0;
  const pension = work.pension ? work.pension.monthly * 12 : 0;
  const coverage = healthCoverage(s, work);
  const health = coverage === "own" ? 12 * policy.ownHealth
    : coverage === "benefit" ? (12 - work.benefit!.months) * policy.ownHealth
    : coverage === "employee" && s.age >= 18 && !work.pension && work.job
      && !(s.age < 26 && s.path?.university.student && !s.path.university.student.paused)
      && !(s.age < 22 && s.path?.school.grade != null && !s.path.school.left) ? (12 - activeMonths(work.job)) * policy.ownHealth
      : 0;
  return { wage, benefit, pension, health, maternity };
}

export function closeEmploymentYear(s: GameState, work: EmploymentState) {
  const current = work.job;
  const months = current ? activeMonths(current) : 0;
  const insuredGross = current ? Math.min(current.gross, policy.insuranceCeiling) : 0;
  const recent = [...Array<number>(12 - months).fill(0), ...Array<number>(months).fill(insuredGross)];
  const credits = current ? months * (current.hours === 8 ? SERVICE_PER_MONTH : s.age < 18 ? 8 : 7) : 0;
  const next: EmploymentState = {
    ...work, applications: {}, prepared: false, worked: false, benefit: null,
    separation: null, recentGross: [...work.recentGross, ...recent].slice(-24),
    serviceCredits: work.serviceCredits + credits,
    insuredMonths: work.insuredMonths + months,
    incomeTotal: work.incomeTotal + insuredGross * months,
  };
  const events: PathEvent[] = [];
  if (current) {
    const onLeave = onMaternityLeave(s);
    const performance = onLeave ? current.performance : limit(current.performance + (work.worked ? 1 : s.stats.health < 50 ? -5 : -2), 0, 100);
    const remaining = current.monthsLeft === null ? null : current.monthsLeft - months;
    const expired = remaining !== null && remaining === 0;
    const dismissed = !onLeave && !expired && performance < 35 && pathRoll(s, "dismissal." + current.job) < .48;
    next.job = expired || dismissed ? null : { ...current, monthsLeft: remaining, tenure: current.tenure + months, performance };
    const title = findJob(current.city, current.job)?.title ?? t("Трудов договор", "Employment contract");
    if (!onLeave) events.push({ id: "work-year-" + s.age, title,
      note: t(months + " месеца с трудов договор. Отчетени са заплатата и осигуровките.", months + " months on contract. Pay and contributions have been recorded.") });
    if (expired || dismissed) {
      next.separation = { age: s.age + 1, reason: expired ? "expiry" : "dismissal" };
      events.push({ id: "work-end-" + s.age, title: expired ? t("Срокът на договора изтече", "Your contract expired") : t("Договорът беше прекратен", "Your contract was terminated"),
        note: t("Виж „Осигуряване“, за да провериш дали имаш право на обезщетение.", "Check Social insurance to see if you qualify for benefits.") });
    }
  }
  if (work.benefit) events.push({
    id: "benefit-" + s.age, title: t("Обезщетение за безработица", "Unemployment benefit"),
    note: t("Обезщетението за " + work.benefit.months + " месеца е в годишния бюджет.",
      "The " + work.benefit.months + "-month benefit is included in your annual budget."),
  });
  return { work: next, events };
}

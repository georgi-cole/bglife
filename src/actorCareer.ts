import { cities, type City } from "./cities.ts";
import { moveBlocker, type Text } from "./engine.ts";
import { onMaternityLeave } from "./maternity.ts";
import { limit, pathRoll, type PathEvent } from "./pathActions.ts";
import { pathCities, pathText as t } from "./pathCatalog.ts";
import { netMonthly, policy } from "./pathPolicy.ts";
import { actingMedia, actingProjects, findProject, type Project } from "./specialCareerCatalog.ts";
import {
  action, change, currentRole, endsContract, euros, independentPay, needsAdult, needsFreeContract,
  onlyOneOffer, range, signContract, type SpecialAction, type SpecialContext, type SpecialView,
} from "./specialCareerTypes.ts";

const roleNames = {
  debut: t("Дебютна роля", "Debut role"), support: t("Поддържаща роля", "Supporting role"), lead: t("Главна роля", "Lead role"),
};
const skillName = t("Актьорско майсторство", "Acting skill");
const youthPermit = t("Продукцията трябва да уреди разрешението и медицинския преглед.", "The production needs to arrange the permit and medical check.");
const natfiz = t("НАТФИЗ „Кръстьо Сарафов“", "Krastyo Sarafov National Academy for Theatre and Film Arts");

export function projectsFor(city: City): Project[] {
  const local = actingProjects.filter(p => p.city === city);
  const localEntry: Project = { id: "local-" + city, city, venue: t("Независима трупа", "Independent theatre company"),
    title: t("След последния автобус", "After the Last Bus"), medium: "theatre", role: "debut", skill: 17, years: 1, pay: .57 };
  return local.some(item => item.role === "debut") ? local : [localEntry, ...local];
}

export function actorProject(id: string, city: City): Project | undefined {
  return findProject(id) ?? projectsFor(city).find(item => item.id === id);
}

function grossFor(project: Project, license: boolean, youth: boolean) {
  return Math.max(youth ? Math.ceil(policy.minimumWage * 4 / 7) : policy.minimumWage,
    Math.round(pathCities[project.city].benchmark * project.pay * (license ? .89 : 1) * (youth ? .65 : 1)));
}

export function actorView(ctx: SpecialContext): SpecialView {
  const { life, progress } = ctx;
  const actor = progress.actor;
  const contract = currentRole(ctx, "actor");
  const youth = life.age < 18;
  const actingEducation = ctx.path.university.degrees.some(degree => degree.program === "natfiz-acting");
  const dramaStudent = ctx.path.university.student?.program === "natfiz-acting" && !ctx.path.university.student.paused;
  const offer = actor.offer?.age === life.age ? actor.offer : undefined;
  const study: SpecialAction[] = [
    action("actor", "drama", life.age < 18 ? t("Школа по театър", "Drama club") : t("Упражнявай монолог", "Practise a monologue"), () =>
      change(ctx, { actor: { ...actor, skill: range(actor.skill + (dramaStudent ? 13 : 9) + Number(life.profile?.talent === "music") * 2) } },
        t("Репетирах сценична реч и монолог.", "I practised a monologue and worked on delivery."), { stats: { influence: 1 } })),
    action("actor", "camera", t("Упражнение пред камера", "On-camera practice"), () =>
      change(ctx, { actor: { ...actor, skill: range(actor.skill + 7) } }, t("Заснех сцена и прегледах дублите.", "I filmed a scene and reviewed the takes."))),
  ];
  if (!actor.portfolio) study.push(action("actor", "portfolio", t("Направи видео портфолио", "Make a showreel"),
    () => change(ctx, { actor: { ...actor, portfolio: true } }, t("Подготвих портфолио със сцени.", "I put together a showreel.")),
    actor.skill < 20 ? t("Трябват 20% актьорско майсторство.", "Requires 20% acting skill.") : undefined));
  if (!actor.agent && life.age >= 18) study.push(action("actor", "agent", t("Намери агент", "Find an agent"), () =>
    change(ctx, { actor: { ...actor, agent: true } }, t("Намерих агент, който ме насочва към роли.", "An agent agreed to put me forward for roles.")),
    !actor.portfolio || actor.credits < 1 ? t("Трябват портфолио и поне една завършена роля.", "Requires a showreel and a completed credit.") : undefined));

  const candidates = [...projectsFor(life.city), ...actingProjects.filter(p => p.city !== life.city)];
  const attempts = ctx.path.used.filter(id => id.startsWith("special.actor.audition.")).length;
  const listings = candidates.map(project => {
    const local = project.city === life.city;
    const available = offer?.project === project.id;
    const weight = actor.skill + (actor.portfolio ? 7 : 0) + (actor.agent ? 7 : 0) + (actingEducation ? 10 : 0)
      + Math.min(actor.credits * 3, 15) + Math.floor(progress.fame / 12);
    const id = project.id;
    const actions: SpecialAction[] = [];
    if (available) {
      if (youth && offer && !offer.permit) actions.push(action("actor", "permit." + id, t("Уреди разрешение през продукцията", "Arrange the permit through the production"),
        () => change(ctx, { actor: { ...actor, offer: { ...offer, permit: true } } },
          t("Продукцията уреди разрешение от Инспекцията по труда и медицински преглед.",
            "The production arranged a Labour Inspectorate permit and a medical check.")),
        life.stats.health < 45 ? t("Първо се възстанови.", "Recover before the medical check.") : undefined));
      for (const license of youth || project.medium === "theatre" ? [false] : [false, true]) actions.push(action("actor", "sign." + id + (license ? ".license" : ".fixed"),
        license ? t("Подпиши с отчисления при използване", "Sign with reuse royalties")
          : local ? t("Подпиши за ролята", "Sign for the role") : t("Подпиши и се премести", "Sign and move"),
        () => change(ctx, { actor: { ...actor, offer: undefined } },
          t("Подписах за „" + project.title.bg + "“" + (license ? " с отчисления за използване на записа." : " с фиксиран хонорар."),
            "I signed for " + project.title.en + (license ? " with reuse royalties." : " for a fixed fee.")),
          local ? {} : { moveTo: project.city },
          signContract(ctx, { kind: "actor", project: id, license }, grossFor(project, license, youth), youth ? 2 : project.years * 12, 52, youth ? 4 : 8)),
        ctx.path.work.job ? needsFreeContract : youth && !offer?.permit ? youthPermit : local ? undefined : moveBlocker(life, project.city) ?? undefined));
      actions.push(action("actor", "decline." + id, t("Откажи ролята", "Decline the role"), () => change(ctx, { actor: { ...actor, offer: undefined } },
        t("Отказах предложената роля.", "I turned down the role."))));
    } else {
      actions.push(action("actor", "audition." + id, project.medium === "theatre" ? t("Яви се на прослушване", "Attend the audition")
        : t("Изпрати запис за кастинг", "Send a self-tape"),
      () => {
        const chance = limit(.66 + (weight - project.skill) * .012 + (life.stats.influence - 40) * .002, .25, .96);
        const cast = pathRoll(life, "casting." + id) < chance;
        return change(ctx, cast ? { actor: { ...actor, offer: { project: id, age: life.age } } } : {},
          cast ? t("Кастингът мина добре. Предложиха ми роля в „" + project.title.bg + "“.", "I got a role offer for " + project.title.en + ".")
            : t("За „" + project.title.bg + "“ избраха друг актьор.", "The team cast someone else for " + project.title.en + "."));
      }, life.age < 16 ? t("Платените дебютни роли в играта са от 16 г.", "Paid debut roles in the game start at 16.")
        : youth && (!local || project.role !== "debut") ? needsAdult : offer ? onlyOneOffer : contract?.special.project === id ? t("Вече си в тази продукция.", "You're already in this production.")
        : attempts >= 3 ? t("Изчерпа трите прослушвания за годината.", "You have used three auditions this year.")
        : weight < project.skill ? t("Нужно майсторство за ролята " + project.skill + "%.", "Skill target for this role is " + project.skill + "%.") : undefined));
    }
    return {
      id, city: project.city, title: project.title,
      detail: t(actingMedia[project.medium].bg + " · " + roleNames[project.role].bg + " · " + cities[project.city].name.bg,
        actingMedia[project.medium].en + " · " + roleNames[project.role].en + " · " + cities[project.city].name.en),
      facts: [{ label: t("Продукция", "Production"), value: project.venue },
        { label: t("Нетно на месец", "Net per month"), value: netMonthly(grossFor(project, false, youth)), money: true as const },
        { label: t("Месеци по договор", "Contract months"), value: youth ? 2 : project.years * 12 },
        ...(available && !youth && project.medium !== "theatre" ? [{ label: t("Нетно с отчисления", "Net per month with royalties"), value: netMonthly(grossFor(project, true, false)), money: true as const }] : [])],
      actions, fold: available ? undefined : true as const,
    };
  });
  const project = contract && actorProject(contract.special.project, contract.city);
  const work: SpecialView["work"] = [];
  if (contract && project) {
    const tasks: { id: string; label: Text; note: Text; boost: number }[] = [
      { id: "rehearse", label: project.medium === "voice" ? t("Запиши пробен дубъл", "Record a practice take") : t("Репетирай с партньора", "Rehearse with your scene partner"),
        note: t("Изчистих най-трудната сцена с партньора си.", "I worked through the toughest scene with my partner."), boost: 12 },
      { id: "director", label: t("Поискай бележки от режисьора", "Ask the director for notes"),
        note: t("Режисьорът ми даде насока, която подобри изпълнението ми.", "The director's notes improved my performance."), boost: 8 },
    ];
    work.push({ id: "production", title: project.title, detail: project.venue,
      facts: [{ label: t("Роля", "Role"), value: roleNames[project.role] },
        { label: t("Нетно на месец", "Net per month"), value: netMonthly(contract.gross), money: true },
        { label: t("Месеци до края", "Months remaining"), value: contract.monthsLeft ?? 12 }],
      meters: [{ label: t("Представяне", "Performance"), value: contract.performance }],
      actions: [
        ...tasks.map(task => action("actor", "work." + task.id, task.label, () =>
          change(ctx, { actor: { ...actor, skill: range(actor.skill + 3) } }, task.note, {},
            { ...ctx.path.work, worked: true, job: { ...contract, performance: range(contract.performance + task.boost) } }))),
        action("actor", "work.press", t("Интервю за премиерата", "Give a premiere interview"),
          () => change(ctx, { fame: range(progress.fame + 3) }, t("Разказах за ролята си пред публика.", "I talked about my role in the press."), { stats: { influence: 1 } })),
      ],
    }, { id: "exit", title: t("Договор", "Contract"), fold: true,
      actions: [action("actor", "work.leave", t("Прекрати договора", "Leave the production"), () =>
        change(ctx, {}, t("Прекратих договора си с продукцията.", "I left the production before the contract ended."), {}, endsContract(ctx)))] });
  }
  return {
    cards: [{
      id: "practice", title: t("Подготовка", "Training"),
      detail: actingEducation ? natfiz : t("Тренирай сценична реч и камера. Кастингите оценяват уменията и опита.", "Practise stage and screen skills. Casting considers skill and experience."),
      facts: [{ label: t("Завършени роли", "Completed credits"), value: actor.credits }, { label: t("Награди", "Awards"), value: actor.awards },
        ...(actor.agent ? [{ label: t("Представителство", "Representation"), value: t("Имам агент", "Represented by an agent") }] : [])],
      meters: [{ label: skillName, value: actor.skill }], actions: study,
    }, ...listings.filter(item => item.id === offer?.project),
    ...listings.filter(item => item.id !== offer?.project && (life.age >= 18 || item.id === candidates[0].id))],
    work,
  };
}

export function closeActorYear(ctx: SpecialContext) {
  const { life, progress } = ctx;
  const actor = progress.actor;
  const job = currentRole(ctx, "actor");
  const completed = job && job.monthsLeft !== null && job.monthsLeft <= 12 && !onMaternityLeave(life);
  const project = completed && actorProject(job.special.project, job.city);
  const events: PathEvent[] = [];
  const gross = actor.licenses.filter(license => license.until >= life.age).reduce((sum, license) => sum + license.gross, 0);
  const licenses = actor.licenses.filter(license => license.until > life.age);
  let fame = 0, award = 0;
  if (project) {
    const performance = job.performance;
    const success = performance >= 55;
    fame = success ? project.role === "lead" ? 11 : 5 : 0;
    if (success && job.special.license) licenses.push({ project: project.id, until: life.age + 2, gross: euros(220 + performance * 9) });
    events.push({ id: "special.actor.release." + project.id, title: project.title, note: success
      ? t("Завърших ролята си в „" + project.title.bg + "“.", "I finished my role in " + project.title.en + ".")
      : t("Приключих участието си в „" + project.title.bg + "“. Отзивите бяха хладни.", "My work on " + project.title.en + " wrapped to a cool reception.") });
    const awardName = project.medium === "theatre" ? t("ИКАР", "Icarus") : project.medium === "film" ? t("„Златна роза“", "Golden Rose") : null;
    if (awardName && project.role !== "debut" && performance >= 79 && pathRoll(life, "awards." + project.id) < .28 + (performance - 79) * .018) {
      award = 1;
      fame += 10;
      events.push({ id: "special.actor.award", title: awardName,
        note: t("Спечелих награда за участието си в „" + project.title.bg + "“.", "I won an award for " + project.title.en + ".") });
    }
  }
  if (gross) events.push({ id: "special.actor.royalties", title: t("Отчисления за използване", "Reuse royalties"),
    note: t("Получих отчисления за записани изпълнения.", "I received royalties for recorded performances.") });
  return { actor: { ...actor, offer: undefined, credits: actor.credits + Number(Boolean(project)), awards: actor.awards + award, licenses },
    events, pay: independentPay(gross), fame };
}

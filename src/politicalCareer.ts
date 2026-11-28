import { cities } from "./cities.ts";
import type { GameState, Text } from "./engine.ts";
import { onMaternityLeave } from "./maternity.ts";
import { limit, pathRoll, type PathEvent } from "./pathActions.ts";
import { pathCities, pathText as t } from "./pathCatalog.ts";
import { netMonthly, policy } from "./pathPolicy.ts";
import { agendas, officeEmployer, offices } from "./specialCareerCatalog.ts";
import {
  action, change, currentRole, endsContract, euros, fundsRequired, needsFreeContract, range, signContract,
  type Agenda, type Campaign, type ElectiveOffice, type Nomination, type Office, type PoliticalProgress,
  type SpecialAction, type SpecialCard, type SpecialContext, type SpecialView,
} from "./specialCareerTypes.ts";

const electedOffices: ElectiveOffice[] = ["council", "mayor", "assembly", "president"];
const electionRules: Record<ElectiveOffice, Text> = {
  council: t("Общинска квота и уседналост · 6 месеца", "Municipal quota and six months' residence"),
  mayor: t("Уседналост · 6 месеца. Възможен балотаж.", "Six months' residence. Runoff possible."),
  assembly: t("Партийна листа · национален праг 4%. Независим кандидат · районна квота.", "Party list · 4% nationwide threshold. Independent · district quota."),
  president: t("Пряк избор с вицепрезидент. До два мандата.", "Direct election on a ticket with a vice president. Up to two terms."),
};
const approval = t("Одобрение", "Approval");
const standing = t("Обществена подкрепа", "Public support");
const integrity = t("Почтеност", "Integrity");
const campaignTitle = t("Предизборна кампания", "Election campaign");
const housingRequirement = t("Изчакай следващата година след преместване. Играта отчита 6 месеца уседналост на годишен ход.",
  "Wait until the year after a move. The game represents six months' residence on annual turns.");
const nominationName: Record<Nomination, Text> = { list: t("Партия или коалиция", "Party or coalition"),
  independent: t("Независима кандидатура", "Independent candidacy") };

function localResident(life: GameState) {
  return !life.history.some(entry => entry.age === life.age && entry.movedTo);
}

export function nextElectionAge(age: number, office: ElectiveOffice) {
  const { years, phase } = offices[office];
  const offset = ((phase - (age - 18)) % years + years) % years;
  return age + offset;
}

function eligibility(ctx: SpecialContext, office: ElectiveOffice) {
  const { life, progress: { politics } } = ctx, rule = offices[office];
  if (life.age < rule.minAge) return t("Минимална възраст " + rule.minAge + " г.", "Minimum age " + rule.minAge + ".");
  if (rule.local && !localResident(life)) return housingRequirement;
  if (office === "president" && politics.presidentialTerms >= 2) return t("Вече имаш два президентски мандата.", "You have already served two presidential terms.");
  return undefined;
}

function electionWhen(life: GameState, election: number) {
  const delta = election - life.age;
  return delta === 0 ? t("Тази година", "This year") : t("На " + election + " г.", "At age " + election);
}

function executivePay(office: Office, ctx: SpecialContext) {
  const { local, pay } = offices[office];
  return Math.max(office === "council" ? Math.ceil(policy.minimumWage / 2) : policy.minimumWage,
    Math.round((local ? pathCities[ctx.life.city].benchmark : pathCities.sofia.benchmark) * pay));
}

function campaignActions(ctx: SpecialContext, campaign: Campaign): SpecialAction[] {
  const { life, progress: { politics } } = ctx;
  const commit = (id: string, label: Text, patch: Partial<Campaign>, note: Text, blocked?: Text, cash?: number) =>
    action("politics", "campaign." + id, label, () => change(ctx, { politics: { ...politics, campaign: { ...campaign, ...patch } } }, note, { cash }), blocked);
  const actions: SpecialAction[] = [];
  if (!campaign.registered) {
    if (campaign.office === "president" && !campaign.runningMate) {
      for (const issue of Object.keys(agendas) as Agenda[]) actions.push(
        commit("ticket." + issue, t("Покани вицепрезидент · " + agendas[issue].bg, "Invite a running mate · " + agendas[issue].en),
          { runningMate: issue }, t("Съставих обща кандидатска двойка за президентските избори.", "I formed a joint presidential ticket.")));
    }
    for (const issue of Object.keys(agendas) as Agenda[]) if (issue !== campaign.agenda) actions.push(
      commit("agenda." + issue, agendas[issue], { agenda: issue }, t("Промених приоритета на кампанията.", "I changed my campaign priority.")));
    actions.push(commit("field", campaign.nomination === "independent" ? t("Организирай подписка", "Organize a petition") : t("Потърси подкрепа за листата", "Build support for the list"),
      { fieldwork: Math.min(10, campaign.fieldwork + 2) },
      t("Събрах подкрепа за регистрацията.", "I gathered support for registration.")));
    const rule = offices[campaign.office];
    const missing = campaign.nomination === "list" ? politics.standing < rule.backing : campaign.fieldwork < (rule.local ? 2 : 4);
    actions.push(commit("register", t("Регистрирай кандидатурата", "Register your candidacy"), { registered: true },
      t("Кандидатурата ми беше регистрирана.", "My candidacy was registered."),
      eligibility(ctx, campaign.office) ?? (life.age !== campaign.election ? t("Регистрацията е в годината на изборите.", "Registration opens in the election year.")
        : campaign.office === "president" && !campaign.runningMate ? t("Първо състави кандидатска двойка.", "Choose a running mate first.") : missing ? campaign.nomination === "list"
        ? t("В играта са нужни " + rule.backing + "% подкрепа за тази листа.", "The game requires " + rule.backing + "% support for this list.")
        : t("Първо събери подкрепа за подписката.", "Build petition support first.") : undefined)));
  } else {
    actions.push(commit("meeting", t("Срещни се с избиратели", "Meet voters"), { fieldwork: Math.min(10, campaign.fieldwork + 2) },
      t("Изслушах избирателите и представих програмата си.", "I listened to voters and presented my programme.")));
    const debate = life.stats.brains > 55 || pathRoll(life, "campaign.debate." + campaign.office) > .35;
    actions.push(commit("debate", t("Участвай в дебат", "Take part in a debate"), { fieldwork: Math.min(10, campaign.fieldwork + (debate ? 3 : 1)) },
      debate ? t("Защитих програмата си убедително в дебата.", "I made a persuasive case for my programme in the debate.")
        : t("Дебатът беше труден, но изясних позицията си.", "The debate was difficult, but I clarified my position.")));
    if (!campaign.funded) for (const budget of ["basic", "expanded"] as const) {
      const cost = euros((offices[campaign.office].local ? 300 : 1200) * (budget === "expanded" ? 3 : 1));
      actions.push(commit("fund." + budget, budget === "basic" ? t("Финансирай местни срещи", "Fund outreach") : t("Финансирай по-широка кампания", "Fund broader outreach"),
        { funded: cost }, t("Записах разхода в сметката на кампанията.", "I recorded the expense in the campaign ledger."),
        life.cash < cost ? fundsRequired : undefined, -cost));
    }
  }
  actions.push(action("politics", "campaign.withdraw", t("Оттегли кандидатурата", "Withdraw your candidacy"), () =>
    change(ctx, { politics: { ...politics, campaign: undefined } }, t("Оттеглих кандидатурата си.", "I withdrew my candidacy."))));
  return actions;
}

const duties: Record<Office, { id: string; label: Text; note: Text; effect: number }[]> = {
  council: [
    { id: "ordinance", label: t("Предложи общинска наредба", "Propose a local ordinance"), note: t("Внесох предложение в общинския съвет.", "I filed a proposal with the municipal council."), effect: 7 },
    { id: "vote", label: t("Участвай в заседание и гласувай", "Attend a sitting and vote"), note: t("Защитих позицията си и гласувах на заседанието.", "I spoke on the motion and voted in the sitting."), effect: 6 },
  ],
  mayor: [
    { id: "budget", label: t("Внеси проект за общински бюджет", "Submit a draft municipal budget"), note: t("Представих бюджета пред общинския съвет.", "I presented the draft budget to the municipal council."), effect: 8 },
    { id: "project", label: t("Провери изпълнението на общински проект", "Review a municipal project"), note: t("Проверих сроковете и публичния отчет на проекта.", "I checked the project's schedule and public report."), effect: 7 },
  ],
  assembly: [
    { id: "bill", label: t("Внеси законопроект", "Introduce a bill"), note: t("Внесох законопроект за обсъждане.", "I submitted a bill for debate."), effect: 8 },
    { id: "committee", label: t("Работи в парламентарна комисия", "Work in a parliamentary committee"), note: t("Изслушах заинтересованите страни в комисията.", "I heard stakeholders in committee."), effect: 7 },
  ],
  president: [
    { id: "review", label: t("Прецени дали да върнеш закон за ново обсъждане", "Review a bill for reconsideration"), note: t("Прегледах закона и обсъдих мотивите с юридическия екип.", "I reviewed the bill and consulted the legal team."), effect: 7 },
    { id: "consultation", label: t("Проведи институционални консултации", "Hold institutional consultations"), note: t("Проведох консултации и представих публично изводите.", "I held consultations and published the conclusions."), effect: 7 },
  ],
  premier: [
    { id: "cabinet", label: t("Председателствай Министерския съвет", "Chair the Council of Ministers"), note: t("Съгласувахме решенията и графика на кабинета.", "We agreed the cabinet's decisions and schedule."), effect: 8 },
    { id: "control", label: t("Отговори при парламентарен контрол", "Answer parliamentary questions"), note: t("Отговорих на въпросите за работата на кабинета.", "I answered questions about the cabinet's work."), effect: 7 },
  ],
};

export function politicsView(ctx: SpecialContext): SpecialView {
  const { life, progress } = ctx, politics = progress.politics;
  const job = currentRole(ctx, "politics");
  const civic: SpecialAction[] = [
    action("politics", "civic", t("Организирай гражданска среща", "Organize a community meeting"), () =>
      change(ctx, { politics: { ...politics, standing: range(politics.standing + 9) } },
        t("Събрах съседи за обсъждане на местен проблем.", "I brought neighbours together to discuss a local issue."),
        { stats: { influence: 1 } })),
    action("politics", "volunteer", t("Помогни на гражданска инициатива", "Volunteer on a civic initiative"), () =>
      change(ctx, { politics: { ...politics, standing: range(politics.standing + 6), integrity: range(politics.integrity + 3) } },
        t("Подкрепих гражданска инициатива и се запознах с организаторите.", "I supported a civic initiative and met its organizers."))),
  ];
  const cards: SpecialCard[] = [{
    id: "civic", title: t("Гражданска дейност", "Civic activity"),
    facts: [{ label: t("Години на публична длъжност", "Years in public office"), value: politics.service },
      { label: t("Приоритети с напредък", "Commitments advanced"), value: politics.delivered }],
    meters: [{ label: standing, value: politics.standing }, { label: integrity, value: politics.integrity }], actions: civic,
  }];
  const pending = politics.offer?.age === life.age ? politics.offer : undefined;
  const camp = politics.campaign;
  if (pending) {
    const office = offices[pending.office];
    cards.unshift({ id: "mandate", title: office.title, detail: t("Избран мандат · встъпване тази година", "Won the election · take office this year"),
      facts: [{ label: t("Срок", "Term in years"), value: office.years },
        { label: t("Нетно на месец", "Net per month"), value: netMonthly(executivePay(pending.office, ctx)), money: true }],
      actions: [action("politics", "swear." + pending.office, t("Встъпи в длъжност", "Take office"),
        () => change(ctx, { politics: { ...politics, offer: undefined, approval: 53,
          presidentialTerms: politics.presidentialTerms + Number(pending.office === "president") } },
        t("Встъпих в длъжност с мандат от " + office.years + " години.", "I took office for a " + office.years + "-year term."),
        { stats: { influence: 3 } }, signContract(ctx, { kind: "politics", office: pending.office, agenda: pending.agenda },
          executivePay(pending.office, ctx), office.years * 12, 55, pending.office === "council" ? 4 : 8)),
        ctx.path.work.job ? needsFreeContract : office.local && pending.city !== life.city ? housingRequirement : eligibility(ctx, pending.office))] });
  }
  const previous = politics.last;
  if (previous) cards.push({ id: "last", title: t("Последни избори", "Last election"),
    detail: t(offices[previous.office].title.bg + (previous.won ? " · избран мандат" : " · загуба"),
      offices[previous.office].title.en + (previous.won ? " · mandate won" : " · lost")),
    facts: [{ label: t("Дял от гласовете", "Vote share"), value: t(previous.share + "%", previous.share + "%") },
      ...(previous.listShare === undefined ? [] : [{ label: t("Национален резултат на листата", "Nationwide list vote"), value: t(previous.listShare + "%", previous.listShare + "%") }]),
      ...(previous.turnout === undefined ? [] : [{ label: t("Избирателна активност", "Turnout"), value: t(previous.turnout + "%", previous.turnout + "%") }]),
      ...(previous.runoff === undefined ? [] : [{ label: t("Балотаж", "Runoff"), value: t(previous.runoff + "%", previous.runoff + "%") }])],
  });
  if (camp) cards.unshift({ id: "campaign", title: campaignTitle,
    detail: t(offices[camp.office].title.bg + " · " + nominationName[camp.nomination].bg, offices[camp.office].title.en + " · " + nominationName[camp.nomination].en),
    facts: [{ label: t("Избори", "Election"), value: electionWhen(life, camp.election) },
      { label: t("Приоритет", "Priority"), value: agendas[camp.agenda] },
      { label: t("Регистрация", "Registration"), value: camp.registered ? t("Потвърдена", "Confirmed") : t("В подготовка", "Preparing") },
      { label: t("Отчетени разходи", "Reported spending"), value: camp.funded, money: true },
      ...(camp.runningMate ? [{ label: t("Фокус на вицепрезидента", "Running mate's focus"), value: agendas[camp.runningMate] }] : [])],
    meters: [{ label: t("Кампания на терен", "Field campaign"), value: camp.fieldwork * 10 }],
    actions: campaignActions(ctx, camp),
  });
  else if (!pending) for (const id of electedOffices) {
    const office = offices[id], election = nextElectionAge(life.age, id);
    cards.push({ id, title: office.title, fold: true, detail: electionWhen(life, election),
      facts: [{ label: t("Правило", "Rule"), value: electionRules[id] }, { label: t("Минимална възраст", "Minimum age"), value: office.minAge }, { label: t("Мандат в години", "Term in years"), value: office.years }],
      actions: (Object.keys(nominationName) as Nomination[]).map(nomination => action("politics", "run." + id + "." + nomination,
        nominationName[nomination], () => change(ctx, { politics: { ...politics, campaign: {
          office: id, city: life.city, election, nomination, agenda: "education", fieldwork: 0, funded: 0, registered: false,
        } } }, t("Започнах подготовка за изборите.", "I began preparing for the election.")), eligibility(ctx, id))),
    });
  }

  const work: SpecialCard[] = [];
  if (job) {
    const { office, agenda } = job.special;
    const dutiesHere = duties[office].map(duty => action("politics", "work." + duty.id, duty.label,
      () => change(ctx, { politics: { ...politics, approval: range(politics.approval + duty.effect), standing: range(politics.standing + 2) } },
        duty.note, {}, { ...ctx.path.work, worked: true, job: { ...job, performance: range(job.performance + duty.effect) } })));
    dutiesHere.push(action("politics", "work.priority", t("Отчети напредъка по приоритета", "Report progress on your priority"),
      () => change(ctx, { politics: { ...politics, approval: range(politics.approval + 6), delivered: politics.delivered + 1 } },
        t("Обявих какво свърших по обещанията си.", "I reported progress on my pledges."), {},
        { ...ctx.path.work, worked: true, job: { ...job, performance: range(job.performance + 4) } }),
      !ctx.path.work.worked ? t("Изпълни поне една задача по мандата.", "Complete an official duty first.") : undefined));
    if (office === "assembly") {
      dutiesHere.push(action("politics", "work.cabinet-mandate", t("Поеми мандат за кабинет", "Seek a mandate to form a cabinet"), () => {
        const passed = pathRoll(life, "confidence." + job.startedAt) < limit(.45 + (politics.approval - 70) * .013 + (politics.standing - 58) * .008, .3, .96);
        return change(ctx, { politics: politics,
          fame: range(progress.fame + (passed ? 7 : 1)) }, passed
          ? t("След консултациите Народното събрание избра предложения кабинет. Станах министър-председател.",
            "After consultations, the National Assembly elected the proposed cabinet. I became Prime Minister.")
          : t("Предложеният кабинет не получи мнозинство. Оставам народен представител.",
            "The proposed cabinet did not secure a majority. I remain an MP."), {},
        passed ? { ...ctx.path.work, job: { ...job, special: { ...job.special, office: "premier" }, gross: executivePay("premier", ctx) } } : undefined);
      }, politics.standing < 58 || politics.approval < 70 || job.tenure < 12 ? t("Трябват година в парламента, 58% подкрепа и 70% одобрение.",
        "Requires one year in parliament, 58% support and 70% approval.") : undefined));
    }
    work.push({ id: "office", title: offices[office].title, detail: officeEmployer(office, job.city),
      facts: [{ label: t("Приоритет", "Priority"), value: agendas[agenda] },
        { label: t("До края на мандата", "Months to term end"), value: job.monthsLeft ?? 12 },
        { label: t("Нетно на месец", "Net per month"), value: netMonthly(job.gross), money: true }],
      meters: [{ label: approval, value: politics.approval }, { label: integrity, value: politics.integrity }],
      actions: dutiesHere,
    }, { id: "mandate-exit", title: t("Мандат", "Mandate"), fold: true,
      actions: [action("politics", "work.resign", t("Подай оставка", "Resign from office"), () =>
        change(ctx, {}, t("Подадох оставка от публичната длъжност.", "I resigned from public office."), {}, endsContract(ctx)))],
    });
  }
  return { cards, work };
}

function electionResult(ctx: SpecialContext, campaign: Campaign): NonNullable<PoliticalProgress["last"]> {
  const { life, progress } = ctx, politics = progress.politics, office = campaign.office;
  const roll = pathRoll(life, "vote." + office);
  const support = politics.standing * .38 + politics.integrity * .10 + progress.fame * .12
    + life.stats.influence * .09 + campaign.fieldwork * 2.5 + Math.min(8, Math.sqrt(campaign.funded / euros(30)))
    + (politics.service ? (politics.approval - 44) * .21 : 0) + (roll - .5) * 21
    + (campaign.runningMate && campaign.runningMate !== campaign.agenda ? 4 : 0);
  const result = { office, age: life.age };
  if (office === "council" || office === "assembly") {
    const share = Math.round(limit((support - 12) * (office === "council" ? .56 : .48), 1, 68));
    const metro = campaign.city === "sofia" || campaign.city === "plovdiv" || campaign.city === "varna";
    const quota = office === "council" ? metro ? 5 : 8 : metro ? 9 : 14;
    if (campaign.nomination === "independent") return { ...result, share, won: share >= quota };
    const listShare = office === "assembly"
      ? Math.round(limit(1 + politics.standing * .22 + pathRoll(life, "party.result") * 24 - 9, 1, 50) * 10) / 10 : undefined;
    const won = share >= quota && (listShare === undefined || listShare >= 4);
    return { ...result, share, listShare, won };
  }
  const share = Math.round(limit((support - (office === "president" ? 4 : 0)) * .72, 4, 71));
  const turnout = office === "president" ? 42 + Math.round(pathRoll(life, "turnout") * 25) : undefined;
  const firstRound = share > 50 && (turnout === undefined || turnout > 50);
  if (firstRound || share < 24) return { ...result, share, turnout, won: firstRound };
  const runoff = Math.round(limit(50 + (support - 57) * .67 + (pathRoll(life, "runoff." + office) - .5) * 20, 12, 88));
  return { ...result, share, turnout, runoff, won: runoff > 50 };
}

export function closePoliticalYear(ctx: SpecialContext) {
  const { life, progress } = ctx, politics = progress.politics;
  const job = currentRole(ctx, "politics");
  const camp = politics.campaign;
  const events: PathEvent[] = [];
  const thisYear = camp?.election === life.age;
  const eligible = camp && thisYear && (!offices[camp.office].local || (life.city === camp.city && localResident(life)));
  const result = eligible && camp.registered ? electionResult(ctx, camp) : undefined;
  const offer = result?.won && camp ? { office: camp.office, city: camp.city, agenda: camp.agenda, age: life.age + 1 } : undefined;
  let fame = 0;
  if (result) {
    const share = result.share + "%" + (result.runoff === undefined ? "" : " · " + result.runoff + "%");
    events.push({ id: "special.politics.result", title: offices[result.office].title, note: result.won
      ? t("Спечелих изборите. Резултат " + share + ".", "I won the election. Result " + share + ".")
      : t("Загубих изборите. Резултат " + share + ".", "I lost the election. Result " + share + ".") });
    fame = result.won ? result.office === "president" ? 20 : 7 : 1;
  } else if (thisYear && camp) {
    events.push({ id: "special.politics.missed", title: campaignTitle, note: eligible
      ? t("Изборите минаха преди да регистрирам кандидатурата.", "The election passed before I registered my candidacy.")
      : t("Кандидатурата не отговори на изискването за адрес.", "My candidacy did not meet the residence requirement.") });
  }
  if (job?.monthsLeft === 12) events.push({ id: "special.politics.term-end", title: offices[job.special.office].title,
    note: t("Мандатът ми приключи.", "My term in office ended.") });
  return {
    politics: { ...politics, campaign: thisYear ? undefined : camp, offer, last: result ?? politics.last,
      service: politics.service + Number(Boolean(job)), approval: job && !onMaternityLeave(life) && !ctx.path.work.worked
        ? range(politics.approval - 9) : politics.approval },
    events, fame,
  };
}

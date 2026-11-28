import { cities } from "./cities.ts";
import { moveBlocker, type Text } from "./engine.ts";
import { onMaternityLeave } from "./maternity.ts";
import { limit, pathRoll, type PathEvent } from "./pathActions.ts";
import { pathCities, pathText as t } from "./pathCatalog.ts";
import { netMonthly, policy } from "./pathPolicy.ts";
import { clubLeague, clubs, findClub, sports, type Club } from "./specialCareerCatalog.ts";
import {
  action, change, currentRole, endsContract, euros, inUse, needsAdult, needsFreeContract, needsWorkingHealth,
  onlyOneOffer, range, signContract, type SpecialAction, type SpecialContext, type SpecialView, type Sport,
} from "./specialCareerTypes.ts";

const sportIds = Object.keys(sports) as Sport[];
const technique = t("Техника", "Technique");
const form = t("Форма", "Form");
const fatigue = t("Натоварване", "Fatigue");
const title = t("Спортна кариера", "Sporting career");

function eligibleClubs(ctx: SpecialContext, sport: Sport) {
  const division = ctx.life.avatar?.presentation ?? "female";
  return clubs.filter(club => club.sport === sport && (club.division === "open" || club.division === division));
}

function grossFor(club: Club) {
  const multiplier = club.sport === "tennis" ? .65 : club.sport === "volleyball" ? .83 : club.level === 2 ? .8 : 1;
  return Math.max(policy.minimumWage, Math.round(pathCities[club.city].benchmark * club.strength / 63 * multiplier));
}

function rulesFor(ctx: SpecialContext, club: Club, skill: number) {
  const { life, progress: { sport } } = ctx;
  const target = club.level === 2 ? 38 : Math.round(club.strength * .58);
  if (life.age < 18) return needsAdult;
  if (sport.retired) return t("Спортната ти кариера е приключила.", "You retired from competition.");
  if (sport.injury || life.stats.health < 45) return needsWorkingHealth;
  return skill < target ? t("Трябват " + target + "% техника за проби.", "Requires " + target + "% technique for trials.") : undefined;
}

export function sportView(ctx: SpecialContext): SpecialView {
  const { life, progress } = ctx, sport = progress.sport;
  const job = currentRole(ctx, "athlete");
  const club = job && findClub(job.special.club);
  if (sport.retired) return { work: [], cards: [{
    id: "retired", title: t("След състезателната кариера", "After competition"),
    facts: [{ label: t("Сезони", "Seasons"), value: sport.seasons }, { label: t("Титли", "Titles"), value: sport.titles },
      { label: t("Национални участия", "International appearances"), value: sport.caps }],
    actions: [action("athlete", "mentor", t("Сподели опит с юношите", "Mentor youth athletes"), () =>
      change(ctx, {}, t("Разказах на младите спортисти как се готвех за състезания.", "I shared how I prepared for competition with the youth team."),
        { stats: { influence: 2, joy: 2 } }))],
  }] };
  const selected = sport.sport;
  const selection = {
    id: "sports", title: selected ? t("Смени спорта", "Change sport") : t("Избери спорт", "Choose a sport"),
    detail: life.age < 18 ? t("Започни в школа или местна тренировъчна група.", "Start at an academy or a local training group.") : undefined,
    fold: selected ? true as const : undefined,
    actions: sportIds.filter(id => id !== selected).map(id => action("athlete", "select." + id, sports[id].title, () =>
      change(ctx, { sport: { ...sport, sport: id, academy: undefined, offer: undefined, form: 50, fatigue: 0 } },
        t("Избрах да тренирам " + sports[id].title.bg.toLowerCase() + ".", "I chose to train in " + sports[id].title.en.toLowerCase() + ".")),
      job ? needsFreeContract : sport.injury ? needsWorkingHealth : ctx.path.used.some(id => id.startsWith("special.athlete.select."))
        ? t("Вече избра спорт тази година.", "You already chose a sport this year.") : undefined)),
  };
  if (!selected) return { work: [], cards: [selection] };
  const skill = sport.skills[selected] ?? 0;
  const track = sports[selected];
  const offer = sport.offer?.age === life.age ? sport.offer : undefined;
  const academyHere = sport.academy === life.city;
  const exercise: SpecialAction[] = [];
  if (!academyHere && !job) exercise.push(action("athlete", "academy", life.age < 18
    ? t("Запиши се в школа", "Join an academy") : t("Влез в тренировъчна група", "Join a training group"), () =>
    change(ctx, { sport: { ...sport, academy: life.city, skills: { ...sport.skills, [selected]: range(skill + 8) } } },
      t("Включих се в тренировките в " + cities[life.city].name.bg + ".", "I joined training in " + cities[life.city].name.en + "."))));
  const train = (id: string, label: Text, boost: number, load: number, performance: number) => action("athlete", id, label, () => {
    const updated = { ...sport, skills: { ...sport.skills, [selected]: range(skill + boost + Number(life.profile?.talent === "sport") * 2) },
      form: range(sport.form + 12), fatigue: range(sport.fatigue + load) };
    const work = job ? { ...ctx.path.work, worked: true, job: { ...job, performance: range(job.performance + performance) } } : undefined;
    return change(ctx, { sport: updated }, t("Завърших тренировъчния блок.", "I completed the training block."), { stats: { health: 1 } }, work);
  }, sport.injury ? needsWorkingHealth : !job && !academyHere ? t("Присъедини се към местна група.", "Join the local training group first.") : undefined);
  const recovery = action("athlete", "recover", sport.injury ? t("Рехабилитация с физиотерапевт", "Rehabilitate with the physio")
    : t("Планирай възстановяване", "Plan recovery"), () =>
    change(ctx, { sport: { ...sport, fatigue: range(sport.fatigue - 32), injury: Math.max(0, sport.injury - 1), form: range(sport.form + 3) } },
      t("Намалих натоварването и дадох време за възстановяване.", "I eased off and made time for recovery."), { stats: { health: 2 } }));
  if (!job) exercise.push(train("train", t("Тренирай техника", "Train technique"), 11, 18, 0),
    train("fitness", t("Тренирай издръжливост", "Build endurance"), 6, 23, 0), recovery);
  else exercise.push(recovery);
  if (!job && !sport.injury && (sport.seasons > 0 || life.age >= 16)) exercise.push(action("athlete", "amateur",
    t("Участвай в местно състезание", "Enter a local competition"), () => {
      const placed = skill >= 32 && pathRoll(life, "amateur." + selected) + skill / 100 > .88;
      return change(ctx, { sport: { ...sport, skills: { ...sport.skills, [selected]: range(skill + 5) }, fatigue: range(sport.fatigue + 12) },
        fame: range(progress.fame + Number(placed) * 2) }, placed
        ? t("Класирах се сред първите в местното състезание.", "I placed among the leaders at a local competition.")
        : t("Натрупах опит в местно състезание.", "I gained experience at a local competition."));
    }, !academyHere ? t("Присъедини се към местна група.", "Join the local training group first.") : undefined));
  if (sport.seasons > 0 && !job) exercise.push(action("athlete", "retire", t("Приключи състезателната кариера", "Retire from competition"),
    () => change(ctx, { sport: { ...sport, offer: undefined, retired: true } },
      t("Приключих състезателната си кариера.", "I retired from competition."))));

  const roster = eligibleClubs(ctx, selected).filter(item => club?.id !== item.id)
    .sort((a, b) => Number(b.id === offer?.club) - Number(a.id === offer?.club)
      || Number(b.city === life.city) - Number(a.city === life.city) || a.strength - b.strength);
  const listings: SpecialView["cards"] = life.age < 18 ? [] : roster.map(item => {
    const local = item.city === life.city;
    const trialCount = ctx.path.used.filter(id => id.startsWith("special.athlete.trial.")).length;
    const medical = inUse(ctx, "athlete.medical");
    const transfer = Boolean(job && local && job.startedAt < life.age && (job.monthsLeft ?? 12) <= 12 && job.performance >= 62);
    const actions = offer?.club === item.id ? [
      action("athlete", "sign." + item.id, transfer ? t("Подпиши трансфера", "Sign the transfer")
        : local ? t("Подпиши договора", "Sign the contract") : t("Подпиши и се премести", "Sign and move"), () =>
        change(ctx, { sport: { ...sport, offer: undefined, clubs: [...sport.clubs, item.id], form: 60 } },
          t("Подписах писмен договор с " + item.name.bg + ".", "I signed a written contract with " + item.name.en + "."),
          local ? {} : { moveTo: item.city },
          signContract(ctx, { kind: "athlete", club: item.id, captain: false }, grossFor(item), 24, 54)),
        sport.injury || life.stats.health < 45 ? needsWorkingHealth
          : job && !transfer ? needsFreeContract
          : !medical ? t("Необходим е медицински преглед.", "You need a medical examination.")
          : local ? undefined : moveBlocker(life, item.city) ?? undefined),
      action("athlete", "decline." + item.id, t("Откажи офертата", "Decline the offer"), () =>
        change(ctx, { sport: { ...sport, offer: undefined } }, t("Отказах клубната оферта.", "I declined the club's offer."))),
    ] : [action("athlete", "trial." + item.id, track.team ? t("Кандидатствай за проби", "Apply for trials") : t("Кандидатствай за клубна подкрепа", "Apply for club support"), () => {
      const agePenalty = Math.max(0, life.age - track.peak) * 3;
      const score = skill + sport.form * .18 + Math.min(sport.seasons * 3, 16) + life.stats.health * .12 - agePenalty;
      const accepted = pathRoll(life, "trial." + item.id) < limit(.56 + (score - item.strength * .77) * .012, .035, .97);
      return change(ctx, accepted ? { sport: { ...sport, offer: { club: item.id, age: life.age } } } : {},
        accepted ? t(item.name.bg + " ми предложи договор.", item.name.en + " offered me a contract.")
          : t("Пробите в " + item.name.bg + " приключиха без договор.", "My trials at " + item.name.en + " ended without an offer."));
    }, offer ? onlyOneOffer : rulesFor(ctx, item, skill) ?? (job && !transfer ? t("Трансферът изисква последна година от договора, 62% представяне и клуб в същия град.",
      "A contracted transfer requires the final year, 62% performance and a club in the same city.")
      : trialCount >= 3 ? t("Изчерпа трите проби за сезона.", "You've used your three trials this season.") : undefined))];
    return {
      id: item.id, city: item.city, title: item.name, fold: offer?.club !== item.id ? true : undefined,
      detail: t(clubLeague(item).bg + " · " + cities[item.city].name.bg, clubLeague(item).en + " · " + cities[item.city].name.en),
      facts: [{ label: t("Нетно на месец", "Net per month"), value: netMonthly(grossFor(item)), money: true }],
      actions,
    };
  });
  const status = {
    id: "training", title: track.title, detail: job ? club?.name
      : academyHere ? t("Местна школа · " + cities[life.city].name.bg, "Training group · " + cities[life.city].name.en) : undefined,
    facts: [
      { label: t("Сезони", "Seasons"), value: sport.seasons }, { label: t("Титли", "Titles"), value: sport.titles },
      { label: t("Национални участия", "International appearances"), value: sport.caps },
      ...(sport.last ? [{ label: t("Последно класиране", "Last standing"), value: t(sport.last.rank + " от " + sport.last.field, sport.last.rank + " of " + sport.last.field) }] : []),
      ...(sport.last?.points ? [{ label: t("Точки в ранглистата", "Ranking points"), value: sport.last.points }] : []),
      ...(sport.injury ? [{ label: t("Състояние", "Condition"), value: t("Контузия", "Injured") }] : []),
    ],
    meters: [{ label: technique, value: skill }, { label: form, value: sport.form }, { label: fatigue, value: sport.fatigue }],
    actions: exercise,
  };
  const work: SpecialView["work"] = [];
  if (job && club) {
    const drills = selected === "football" ? t("Тренирай завършващ удар", "Practise finishing")
      : selected === "volleyball" ? t("Тренирай сервис и блокада", "Practise serves and blocks") : t("Тренирай сервис и ретур", "Practise serves and returns");
    const tasks = [
      train("work.drills", drills, 7, 17, 10),
      train("work.match", track.team ? t("Подготви се тактически с отбора", "Prepare tactics with the team") : t("Участвай в подготвителен турнир", "Enter a warm-up tournament"), 4, 25, 12),
      recovery,
    ];
    if (track.team && !job.special.captain) tasks.push(action("athlete", "work.captain", t("Кандидатствай за капитан", "Put yourself forward as captain"),
      () => change(ctx, {}, t("Треньорът ми повери капитанската лента.", "The coach gave me the captain's armband."), { stats: { influence: 2 } },
        { ...ctx.path.work, job: { ...job, special: { ...job.special, captain: true } } }),
      sport.seasons < 2 || job.tenure < 12 || job.performance < 76 ? t("Трябват два сезона, година в клуба и 76% представяне.",
        "Requires two seasons, a year at the club and 76% performance.") : undefined));
    tasks.push(action("athlete", "work.selection", t("Яви се за национална селекция", "Attend national selection"), () => {
      const chosen = pathRoll(life, "selection." + selected) < .4 + (skill - 74) * .017 + (job.performance - 72) * .009;
      return change(ctx, chosen ? { sport: { ...sport, caps: sport.caps + 1, fatigue: range(sport.fatigue + 15) }, fame: range(progress.fame + 8) } : {},
        chosen ? t("Представих България с националния отбор.", "I represented Bulgaria on the national team.")
          : t("Селекционерът избра друг състав.", "The selector named a different squad."));
    }, sport.injury || life.stats.health < 55 ? needsWorkingHealth : skill < 74 || job.performance < 72
      ? t("Трябват 74% техника и 72% представяне.", "Requires 74% technique and 72% performance.") : undefined));
    work.push({ id: "club", title: club.name, detail: clubLeague(club),
      facts: [{ label: t("Нетно на месец", "Net per month"), value: netMonthly(job.gross), money: true },
        { label: t("Месеци до края", "Months remaining"), value: job.monthsLeft ?? 12 },
        ...(job.special.captain ? [{ label: t("Роля", "Role"), value: t("Капитан", "Captain") }] : [])],
      meters: [{ label: t("Представяне", "Performance"), value: job.performance }, { label: fatigue, value: sport.fatigue }],
      actions: tasks,
    }, { id: "contract", title: t("Договор", "Contract"), fold: true,
      actions: [
        action("athlete", "work.renew", t("Поискай удължаване", "Ask to renew"), () =>
          change(ctx, {}, t("Клубът удължи договора ми с един сезон.", "The club extended my contract by one season."), {},
            { ...ctx.path.work, job: { ...job, monthsLeft: (job.monthsLeft ?? 12) + 12, gross: Math.min(Math.round(job.gross * 1.07), Math.round(grossFor(club) * 1.45)) } }),
        job.monthsLeft !== 12 || job.tenure < 12 || job.performance < 60 ? t("В последната година на договора, с поне 60% представяне.",
          "In the final contract year, with at least 60% performance.") : undefined),
        action("athlete", "work.leave", t("Освободи се от клуба", "Leave the club"), () =>
          change(ctx, {}, t("Прекратих договора си с клуба.", "I ended my club contract."), {}, endsContract(ctx))),
      ] });
  }
  const preContract = offer ? [{
    id: "clearance", title: t("Картотекиране", "Registration"),
    detail: t("Професионалният договор е писмен. За състезанията се следват медицински и антидопингови правила.",
      "The professional contract is written. Medical and anti-doping rules apply in competition."),
    actions: [action("athlete", "medical", t("Премини медицински преглед", "Take the medical examination"), () =>
      change(ctx, {}, t("Лекарят потвърди, че мога да се състезавам.", "The physician cleared me to compete.")),
      sport.injury || life.stats.health < 45 ? needsWorkingHealth : undefined)],
  }] : [];
  const recentClubs = [...new Set(sport.clubs)].slice(-6).reverse();
  const history: SpecialView["cards"] = recentClubs.length ? [{
    id: "club-history", title: t("Клубна история", "Club history"), fold: true,
    facts: recentClubs.flatMap((id, i) => {
      const previous = findClub(id);
      return previous ? [{ label: t("Клуб " + (i + 1), "Club " + (i + 1)), value: previous.name }] : [];
    }),
  }] : [];
  return { cards: [status, ...preContract, ...listings, ...history, selection], work };
}

export function closeSportYear(ctx: SpecialContext) {
  const { life, progress } = ctx, sport = progress.sport;
  const job = currentRole(ctx, "athlete"), club = job && findClub(job.special.club);
  const rest = { ...sport, offer: undefined, fatigue: range(sport.fatigue - 36), form: range(sport.form - 9), injury: Math.max(0, sport.injury - 1) };
  const events: PathEvent[] = [];
  if (!job || !club || onMaternityLeave(life)) return { sport: rest, events, prize: 0, fame: 0 };
  const track = sports[club.sport], skill = sport.skills[club.sport] ?? 0;
  const rating = limit(skill * .37 + sport.form * .20 + job.performance * .28 + life.stats.health * .15
    - Math.max(0, life.age - track.peak) * 1.6 - (sport.injury ? 22 : 0) - sport.fatigue * .12, 8, 100);
  const opposition = eligibleClubs(ctx, club.sport).filter(item => item.id !== club.id && item.level === club.level);
  const own = (track.team ? club.strength * .5 : 33) + rating * .64 + pathRoll(life, "season." + club.id) * 20;
  const scores = track.team ? opposition.map(item => item.strength + pathRoll(life, "season." + item.id) * 21)
    : Array.from({ length: 15 }, (_, index) => 57 + index * 2 + pathRoll(life, "tennis.ranking." + index) * 22);
  const rank = 1 + scores.filter(score => score > own).length;
  const field = scores.length + 1;
  const appearances = Math.round((track.team ? 30 : 16) * (rating / 100) * (sport.injury ? .55 : 1));
  const points = track.team ? undefined : Math.max(10, (field - rank + 1) * 80 + appearances * 4);
  const champion = rank === 1 && rating >= 54;
  const injured = !sport.injury && pathRoll(life, "injury." + club.id) < .04 + Math.max(0, sport.fatigue - 27) * .006
    + Math.max(0, 65 - life.stats.health) * .003 + Math.max(0, life.age - track.peak) * .01;
  const result = rank + "/" + field;
  events.push({ id: "special.athlete.season", title: club.name, note: t(
    (track.team ? "Отборът завърши " : "Завърших на място ") + result + ". Участия " + appearances + (points ? " · " + points + " т." : "") + ".",
    (track.team ? "My team finished " : "I finished ") + result + ". Appearances " + appearances + (points ? " · " + points + " ranking points" : "") + ".") });
  if (champion) events.push({ id: "special.athlete.title", title: t("Титла", "Title"),
    note: t("Завърших сезона с титла и премия.", "I finished the season with a title and a bonus.") });
  if (injured) events.push({ id: "special.athlete.injury", title: t("Контузия", "Injury"),
    note: t("Получих контузия. За следващия сезон ще ми трябва възстановяване.", "I picked up an injury and will need recovery next season.") });
  if (job.monthsLeft === 12) events.push({ id: "special.athlete.contract-end", title,
    note: t("Договорът ми приключи. Мога да търся нов клуб.", "My contract ended. I can look for another club.") });
  return {
    sport: { ...rest, injury: injured ? 1 : rest.injury, seasons: sport.seasons + 1, titles: sport.titles + Number(champion),
      last: { age: life.age, rank, field, appearances, points: points ?? 0 } },
    events, prize: champion ? euros(350 + rating * 13) : !track.team && rank <= 2 ? euros(180 + rating * 3) : 0,
    fame: champion ? 9 : appearances >= 18 && rank <= 3 ? 3 : 0,
  };
}

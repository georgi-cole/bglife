import { actorProject, actorView, closeActorYear } from "./actorCareer.ts";
import { closeSportYear, sportView } from "./athleteCareer.ts";
import { closeCreatorYear, creatorView } from "./creatorCareer.ts";
import type { Contract } from "./employment.ts";
import type { GameState, Text } from "./engine.ts";
import type { LifePath } from "./lifePath.ts";
import { onMaternityLeave } from "./maternity.ts";
import { pathRoll, type PathEvent } from "./pathActions.ts";
import { pathText as t } from "./pathCatalog.ts";
import { closePoliticalYear, politicsView } from "./politicalCareer.ts";
import { findClub, officeEmployer, offices, platforms, specialCareers } from "./specialCareerCatalog.ts";
import {
  action, addPay, change, currentRole, initialSpecialProgress, range,
  type SpecialAction, type SpecialCareerId, type SpecialContext, type SpecialView, type SpecialYear,
} from "./specialCareerTypes.ts";

const empty: SpecialView = { cards: [], work: [] };

function context(life: GameState): SpecialContext | null {
  if (!life.path) return null;
  return { life, path: life.path, progress: life.path.special ?? initialSpecialProgress() };
}

export function specialCareerView(life: GameState, kind: SpecialCareerId): SpecialView {
  const ctx = context(life);
  if (!ctx || life.finished || life.age < specialCareers[kind].minAge) return empty;
  switch (kind) {
    case "creator": return { cards: creatorView(ctx), work: [] };
    case "actor": return actorView(ctx);
    case "athlete": return sportView(ctx);
    case "politics": return politicsView(ctx);
  }
}

export function specialOccupation(life: GameState, job: Contract): Text | undefined {
  const role = job.special;
  if (role?.kind === "politics") return offices[role.office].title;
  if (role?.kind === "athlete") return t(life.avatar?.presentation === "female" ? "Спортистка" : "Спортист", "Athlete");
  if (role?.kind === "actor") return t(life.avatar?.presentation === "male" ? "Актьор" : "Актриса", "Actor");
  return undefined;
}

export function specialEmployer(job: Contract): Text | undefined {
  const role = job.special;
  if (role?.kind === "politics") return officeEmployer(role.office, job.city);
  if (role?.kind === "athlete") return findClub(role.club)?.name;
  if (role?.kind === "actor") return actorProject(role.project, job.city)?.venue;
  return undefined;
}

export function settleSpecialYear(life: GameState, path: LifePath): SpecialYear | undefined {
  if (!path.special) return undefined;
  const progress = path.special, ctx = { life, path, progress };
  const creator = closeCreatorYear(ctx);
  const actor = closeActorYear(ctx);
  const sport = closeSportYear(ctx);
  const politics = closePoliticalYear(ctx);
  const independent = addPay(creator.pay, actor.pay);
  const events: PathEvent[] = [...creator.events, ...actor.events, ...sport.events, ...politics.events];
  if (progress.independentGross + independent.gross > 0) events.push({
    id: "special.receipts", title: t("Отчет на хонорарите", "Independent income ledger"),
    note: t("Записах рекламните приходи и отчисленията с резерв за данъци и вноски.",
      "I recorded advertising and royalty receipts with a reserve for tax and contributions."),
  });
  return {
    progress: {
      ...progress, channel: creator.channel, actor: actor.actor, sport: sport.sport, politics: politics.politics,
      fame: range(progress.fame + actor.fame + sport.fame + politics.fame - 1),
      independentGross: 0, careerReceipts: progress.careerReceipts + independent.net + sport.prize,
    },
    independent, prize: sport.prize, events,
  };
}

function promptKind(life: GameState): SpecialCareerId | undefined {
  const progress = life.path?.special;
  if (!progress || life.finished || onMaternityLeave(life) || life.age < 18
    || progress.decision && life.age - progress.decision.age < 2) return undefined;
  const role = life.path?.work.job;
  if (role?.special && role.tenure >= 12) return role.special.kind;
  if (progress.channel && progress.channel.followers >= 1500 && role?.special?.kind !== "politics") return "creator";
  return undefined;
}

export function openSpecialYear(life: GameState): GameState {
  const kind = promptKind(life), path = life.path;
  if (!kind || !path?.special || pathRoll(life, "special.event." + kind) > .4) return life;
  return { ...life, path: { ...path, special: { ...path.special, decision: { kind, age: life.age, alternative: pathRoll(life, "special.variant." + kind) < .5 } } } };
}

type Option = { id: string; label: Text; note: Text; effect: () => Partial<SpecialContext["progress"]>; performance?: number };
const creatorRule = t("Платено съдържание", "Paid content");

const workplaceDecisionCopy = {
  actor: { title: t("Сцената се променя", "A change of scene"),
    situation: t("В деня преди репетиция режисьорът променя най-трудната ти сцена.", "The director rewrites your toughest scene the day before rehearsal.") },
  athlete: { title: t("Последната тренировка", "The last practice"),
    situation: t("След натоварена седмица треньорът предлага още една тежка тренировка преди срещата.", "After a busy week, your coach proposes another hard session before the match.") },
  politics: { title: t("Искат отговор", "They want an answer"),
    situation: t("Гражданска група иска публичен отчет за забавен ангажимент.", "A civic group asks for a public report on a delayed commitment.") },
  creator: { title: creatorRule,
    situation: t("Партньор предлага кампания, но иска рекламата да се слее с обикновените публикации.", "A partner suggests a campaign that blends the ad into your ordinary posts.") },
};

function decisionOptions(ctx: SpecialContext, kind: SpecialCareerId): Option[] {
  const { actor, sport, politics, channel } = ctx.progress;
  switch (kind) {
    case "actor": return currentRole(ctx, "actor") ? [
      { id: "rehearse", label: t("Репетирай с партньора", "Rehearse with your scene partner"),
        note: t("Репетирах новата сцена. На следващия ден бях по-уверен на терен.", "I rehearsed the new scene and felt more confident the next day."),
        effect: () => ({ actor: { ...actor, skill: range(actor.skill + 4) } }), performance: 7 },
      { id: "ask", label: t("Изясни промяната с режисьора", "Clarify the change with the director"),
        note: t("Изясних защо сцената се променя и подготвих изпълнението си.", "I clarified the rewrite and prepared my performance."), effect: () => ({}), performance: 4 },
    ] : [];
    case "athlete": return currentRole(ctx, "athlete") ? [
      { id: "rest", label: t("Обсъди възстановяване", "Discuss recovery"),
        note: t("Съгласувах по-леко натоварване преди срещата.", "We agreed on a lighter workload before the match."),
        effect: () => ({ sport: { ...sport, fatigue: range(sport.fatigue - 18) } }) },
      { id: "train", label: t("Направи кратка тактическа тренировка", "Run a short tactical session"),
        note: t("Настроих техниката си, но усетих натрупаната умора.", "I refined my technique, but felt the extra fatigue."),
        effect: () => ({ sport: { ...sport, fatigue: range(sport.fatigue + 14), form: range(sport.form + 8) } }), performance: 5 },
    ] : [];
    case "politics": return currentRole(ctx, "politics") ? [
      { id: "publish", label: t("Публикувай сроковете и причините", "Publish the schedule and reasons"),
        note: t("Показах забавянето и поех конкретен ангажимент за отчет.", "I disclosed the delay and committed to a reporting date."),
        effect: () => ({ politics: { ...politics, integrity: range(politics.integrity + 6), approval: range(politics.approval + 3) } }) },
      { id: "meeting", label: t("Покани групата на открито обсъждане", "Invite the group to an open meeting"),
        note: t("Организирах обсъждане и чух предложенията.", "I organized an open meeting and heard the proposals."),
        effect: () => ({ politics: { ...politics, approval: range(politics.approval + 5), standing: range(politics.standing + 2) } }) },
    ] : [];
    case "creator": return channel ? [
      { id: "label", label: t("Постави условие за ясно обозначение", "Insist on a clear ad label"),
        note: t("Уточних, че приемам само ясно обозначена реклама.", "I agreed to consider a campaign only with clear disclosure."),
        effect: () => ({ channel: { ...channel, trust: range(channel.trust + 5) } }) },
      { id: "reject", label: t("Откажи партньорството", "Turn down the partnership"),
        note: t("Отказах предложението и запазих редакционната си свобода.", "I turned it down and kept editorial control."),
        effect: () => ({ channel: { ...channel, trust: range(channel.trust + 2) } }) },
    ] : [];
  }
}


const alternativeCopy = {
  actor: { title: t("Още едно заснемане", "One more shoot"),
    situation: t("Продуцентът иска допълнителен дубъл за рекламния клип на продукцията.", "The producer wants another take for the production's promotional clip.") },
  athlete: { title: t("Добавка преди състезание", "A pre-competition supplement"),
    situation: t("В съблекалнята се появява добавка с неясен състав. Утре има състезание.", "A supplement with unclear ingredients turns up in the changing room before tomorrow's competition.") },
  politics: { title: t("Конфликт на интереси", "A conflict of interest"),
    situation: t("Близък до теб човек има интерес от предложение, което влиза за обсъждане.", "Someone close to you has an interest in a proposal being discussed.") },
  creator: { title: t("Грешка в клипа", "A mistake in the video"),
    situation: t("Публиката забелязва грешка в клип, който тъкмо набира гледания.", "Viewers spot an error in a video that has just started getting traction.") },
};

function alternativeOptions(ctx: SpecialContext, kind: SpecialCareerId): Option[] {
  const { fame, actor, sport, politics, channel } = ctx.progress;
  switch (kind) {
    case "actor": return currentRole(ctx, "actor") ? [{
      id: "agreement", label: t("Изясни писмено използването на записа", "Clarify in writing how the recording can be used"),
      note: t("Уточнихме къде ще се използва клипът и продължих със снимките.", "We agreed where the clip would be used, then resumed filming."),
      effect: () => ({ fame: range(fame + 3) }), performance: 3,
    }, {
      id: "focus", label: t("Поискай време за основната сцена", "Ask to prioritize the main scene"),
      note: t("Отложих рекламния дубъл и довърших основната сцена.", "I deferred the promotional shoot and finished the main scene."),
      effect: () => ({ actor: { ...actor, skill: range(actor.skill + 2) } }), performance: 6,
    }] : [];
    case "athlete": return currentRole(ctx, "athlete") ? [{
      id: "check", label: t("Дай добавката за проверка на лекаря", "Ask the team doctor to check it"),
      note: t("Лекарят провери случая. Продължих с одобрената подготовка.", "The doctor checked it. I stuck to the approved preparation."),
      effect: () => ({ sport: { ...sport, form: range(sport.form + 4) } }),
    }, {
      id: "refuse", label: t("Откажи добавката и си почини", "Decline it and rest"),
      note: t("Пропуснах добавката и си дадох повече време за възстановяване.", "I declined the supplement and took more time to recover."),
      effect: () => ({ sport: { ...sport, fatigue: range(sport.fatigue - 9) } }),
    }] : [];
    case "politics": return currentRole(ctx, "politics") ? [{
      id: "recuse", label: t("Обяви интереса и се отведи", "Declare the interest and recuse yourself"),
      note: t("Декларирах връзката и се отведох от решението.", "I disclosed the relationship and recused myself from the decision."),
      effect: () => ({ politics: { ...politics, integrity: range(politics.integrity + 9) } }),
    }, {
      id: "review", label: t("Поискай становище и пауза", "Request a review and pause"),
      note: t("Спрях участието си, докато получа становище. Обясних защо пред гражданите.", "I paused my involvement pending a review and explained it publicly."),
      effect: () => ({ politics: { ...politics, integrity: range(politics.integrity + 4), approval: range(politics.approval + 4) } }),
    }] : [];
    case "creator": return channel ? [{
      id: "correction", label: t("Добави ясна поправка", "Publish a clear correction"),
      note: t("Поставих поправката до клипа, за да я видят всички.", "I put the correction next to the video so everyone could see it."),
      effect: () => ({ channel: { ...channel, trust: range(channel.trust + 8) } }),
    }, {
      id: "replace", label: t("Качи преработена версия", "Upload a revised version"),
      note: t("Поправих клипа и обясних промяната в новата версия.", "I fixed the video and explained the change in the replacement."),
      effect: () => ({ channel: { ...channel, trust: range(channel.trust + 4) }, fame: range(fame + 2) }),
    }] : [];
  }
}

function progressEffects(before: SpecialContext["progress"], patch: Partial<SpecialContext["progress"]>) {
  const after = { ...before, ...patch };
  const effects = [
    { label: t("Майсторство", "Acting skill"), delta: after.actor.skill - before.actor.skill },
    { label: t("Форма", "Form"), delta: after.sport.form - before.sport.form },
    { label: t("Натоварване", "Fatigue"), delta: after.sport.fatigue - before.sport.fatigue },
    { label: t("Одобрение", "Approval"), delta: after.politics.approval - before.politics.approval },
    { label: t("Почтеност", "Integrity"), delta: after.politics.integrity - before.politics.integrity },
    { label: t("Обществена подкрепа", "Public support"), delta: after.politics.standing - before.politics.standing },
    { label: t("Доверие", "Trust"), delta: (after.channel?.trust ?? 0) - (before.channel?.trust ?? 0) },
    { label: t("Известност", "Fame"), delta: after.fame - before.fame },
  ];
  return effects.filter(effect => effect.delta !== 0);
}

export type CareerDecision = {
  key: string; title: Text; situation: Text; employer: Text;
  choices: { id: string; label: Text }[]; dismiss: string;
};

function specialDecision(life: GameState): (CareerDecision & { actions: SpecialAction[] }) | null {
  const ctx = context(life), pending = ctx?.progress.decision;
  if (!ctx || !pending || pending.handled || pending.age !== life.age || life.finished || onMaternityLeave(life)
    || life.lifeSystems.reproduction.naming || life.lifeSystems.reproduction.notice) return null;
  const { kind, alternative } = pending;
  const copy = alternative ? alternativeCopy[kind] : workplaceDecisionCopy[kind];
  const options = alternative ? alternativeOptions(ctx, kind) : decisionOptions(ctx, kind);
  if (!options.length) return null;
  const key = "event." + life.age;
  const handled = { ...pending, handled: true as const };
  const job = ctx.path.work.job;
  const actions: SpecialAction[] = options.map(option => action(kind, key + "." + option.id, option.label, () => {
    const effect = option.performance && job ? range(job.performance + option.performance) - job.performance : 0;
    const work = job && effect ? { ...ctx.path.work, worked: true, job: { ...job, performance: job.performance + effect } } : ctx.path.work;
    const patch = option.effect();
    const career = progressEffects(ctx.progress, patch);
    return change(ctx, { ...patch, decision: handled }, option.note,
      { decision: copy, ...((effect || career.length > 0) && { workImpact: { performance: effect, career } }) }, work);
  }));
  const choices = actions.map(({ id, label }) => ({ id, label }));
  const skip = action(kind, key + ".skip", t("Пропусни", "Skip"), () => change(ctx, { decision: handled }, t("", ""), { silent: true }));
  const employer = kind === "creator" && ctx.progress.channel ? platforms[ctx.progress.channel.platform].title
    : job && specialEmployer(job) || specialCareers[kind].title;
  return { key: kind + "." + key, ...copy, employer, choices, dismiss: skip.id, actions: [...actions, skip] };
}

export const getSpecialDecision = (life: GameState): CareerDecision | null => specialDecision(life);

export function resolveSpecialAction(life: GameState, id: string): SpecialAction | undefined {
  const [, kind, mode] = id.split(".");
  if (onMaternityLeave(life) || !Object.hasOwn(specialCareers, kind)) return;
  if (mode === "event") return specialDecision(life)?.actions.find(item => item.id === id);
  const view = specialCareerView(life, kind as SpecialCareerId);
  return [...view.cards, ...view.work].flatMap(card => card.actions ?? []).find(item => item.id === id);
}


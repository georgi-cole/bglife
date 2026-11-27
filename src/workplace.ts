
import { currentJobActions, findJob, type EmploymentState } from "./employment.ts";
import type { GameState, Text } from "./engine.ts";
import { limit, pathRoll, type PathAction, type PathResult } from "./pathActions.ts";
import { pathText as t } from "./pathCatalog.ts";
import { workScenarios, workTrack, type WorkContactId, type WorkEffect } from "./workplaceContent.ts";

export type WorkplaceProgress = {
  bonds: Partial<Record<WorkContactId, number>>;
  event?: { id: string; age: number; handled?: true };
};
export type WorkImpact = { performance: number; relationship?: { name: Text; delta: number } };

const names = [
  t("Анна Василева", "Anna Vasileva"), t("Борис Маринов", "Boris Marinov"), t("Гергана Димова", "Gergana Dimova"),
  t("Даниел Костов", "Daniel Kostov"), t("Елица Тодорова", "Elitsa Todorova"), t("Зорница Николова", "Zornitsa Nikolova"),
  t("Ивайло Бояджиев", "Ivaylo Boyadzhiev"), t("Калина Георгиева", "Kalina Georgieva"), t("Мартин Илиев", "Martin Iliev"),
  t("Надя Петрова", "Nadya Petrova"), t("Николай Ангелов", "Nikolay Angelov"), t("Ралица Янкова", "Ralitsa Yankova"),
  t("Росен Христов", "Rosen Hristov"), t("Симона Михайлова", "Simona Mihaylova"), t("Теодор Стоянов", "Teodor Stoyanov"),
];

const contacts = ["boss", "colleague-1", "colleague-2"] as const;
const startingWorkBond = (id: WorkContactId) => id === "boss" ? 55 : 50;

function workplaceContext(s: GameState) {
  const work = s.path?.work;
  const contract = work?.job;
  const job = contract && findJob(contract.city, contract.job);
  if (!work || !contract || !job) return null;
  const track = workTrack(job);
  const key = ["workplace", contract.city, contract.job, contract.startedAt].join(".");
  const available = [...names];
  const staff = contacts.map(id => {
    const draw = pathRoll({ seed: s.seed, age: contract.startedAt }, key + "." + id);
    const name = available.splice(Math.floor(draw * available.length), 1)[0];
    const bond = contract.workplace?.bonds[id] ?? startingWorkBond(id);
    return { id, name, bond, role: id === "boss" ? track.boss : track.colleague };
  });
  return { key, work, contract, job, track, staff };
}
type Workplace = NonNullable<ReturnType<typeof workplaceContext>>;

function applyWorkEffect(place: Workplace, effect: WorkEffect, note: Text): PathResult<EmploymentState> {
  const { work, contract, staff } = place;
  const progress = contract.workplace ?? { bonds: {} };
  const contact = staff.find(person => person.id === effect.contact);
  const bonds = { ...progress.bonds };
  let relationship: WorkImpact["relationship"];
  if (contact && effect.relationship) {
    const next = limit(contact.bond + effect.relationship, 0, 100);
    bonds[contact.id] = next;
    if (next !== contact.bond) relationship = { name: contact.name, delta: next - contact.bond };
  }
  const performance = limit(contract.performance + (effect.performance ?? 0), 0, 100);
  return {
    state: { ...work, worked: work.worked || Boolean(effect.performance && effect.performance > 0),
      job: { ...contract, performance, workplace: { ...progress, bonds } } },
    note, cash: effect.cash, stats: effect.stats,
    workImpact: { performance: performance - contract.performance, ...(relationship && { relationship }) },
  };
}

function teamActions(place: Workplace, person: Workplace["staff"][number]): PathAction<EmploymentState>[] {
  const { key } = place;
  const id = key + ".person." + person.id;
  const first = { bg: person.name.bg.split(" ")[0], en: person.name.en.split(" ")[0] };
  if (person.id === "boss") return [{
    id: id + ".feedback", label: t("Поискай обратна връзка", "Ask for feedback"),
    run: () => applyWorkEffect(place, { performance: 5, contact: person.id, relationship: 6 },
      t("Обсъдих с " + first.bg + " какво да подобря в работата си.", "I talked with " + first.en + " about how to improve my work.")),
  }];
  return [{
    id: id + ".coffee", label: t("Пийте кафе в почивката", "Catch up over coffee"),
    run: () => applyWorkEffect(place, { contact: person.id, relationship: 5, stats: { joy: 2 } },
      t("В почивката пих кафе с " + first.bg + ".", "I had coffee with " + first.en + " on our break.")),
  }, {
    id: id + ".help", label: t("Помогни със задача", "Help with a task"),
    run: () => applyWorkEffect(place, { performance: 4, contact: person.id, relationship: 8 },
      t("Помогнах на " + first.bg + " да приключи навреме.", "I helped " + first.en + " finish on time.")),
  }];
}

export function workplaceView(s: GameState) {
  const place = workplaceContext(s);
  if (!place) return null;
  const contractActions = currentJobActions(s, place.work);
  return {
    ...place,
    tasks: place.track.tasks.map((task, i): PathAction<EmploymentState> => ({
      id: place.key + ".task." + i, label: task.label, run: () => applyWorkEffect(place, task, task.outcome),
    })),
    team: place.staff.map(person => ({
      ...person, actions: [...teamActions(place, person), ...contractActions.filter(action => person.id === "boss" && action.id === "work.raise")],
    })),
    contractActions: contractActions.filter(action => action.id === "work.leave"),
  };
}

function scenarioPool(place: Workplace) {
  return [place.track.scenario, ...workScenarios];
}

export function drawWorkEvent(s: GameState): string | undefined {
  const place = workplaceContext(s);
  if (!place || place.contract.tenure < 12 || s.age < 18) return;
  const previous = place.contract.workplace?.event;
  const gap = previous ? s.age - previous.age : Math.floor(place.contract.tenure / 12);
  if ((previous && gap < 2) || (gap < 4 && pathRoll(s, "work-event." + place.key) >= .32)) return;
  if (!previous) return place.track.scenario.id;
  const pool = scenarioPool(place).filter(scenario => scenario.id !== previous.id);
  return pool[Math.floor(pathRoll(s, "work-event-choice." + place.key) * pool.length)].id;
}

export function queueWorkEvent(s: GameState, id: string): GameState {
  const place = workplaceContext(s);
  if (!place || place.contract.tenure < 12 || s.age < 18 || s.finished || !scenarioPool(place).some(item => item.id === id)) return s;
  const progress = place.contract.workplace ?? { bonds: {} };
  if (progress.event && s.age - progress.event.age < 2) return s;
  const path = s.path!;
  return { ...s, path: { ...path, work: { ...place.work,
    job: { ...place.contract, workplace: { ...progress, event: { id, age: s.age } } },
  } } };
}

function decisionFor(s: GameState, place: Workplace) {
  const progress = place.contract.workplace;
  const event = progress?.event;
  if (s.finished || s.lifeSystems.reproduction.naming || !progress || !event || event.handled || event.age !== s.age) return null;
  const scenario = scenarioPool(place).find(item => item.id === event.id);
  if (!scenario) return null;
  const key = place.key + ".event." + scenario.id;
  const dismiss = key + ".dismiss";
  const handled = { ...event, handled: true as const };
  const actions: PathAction<EmploymentState>[] = scenario.choices.map(choice => ({
    id: key + "." + choice.id, label: choice.label,
    run: () => {
      const result = applyWorkEffect(place, choice, choice.outcome);
      const job = result.state.job!;
      return {
        ...result, state: { ...result.state, job: { ...job, workplace: { ...job.workplace!, event: handled } } },
        decision: { title: scenario.title, situation: scenario.situation },
      };
    },
  }));
  actions.push({
    id: dismiss, label: t("Пропусни ситуацията", "Skip this situation"),
    run: () => ({ state: { ...place.work, job: { ...place.contract, workplace: { ...progress, event: handled } } },
      note: t("", ""), silent: true }),
  });
  return {
    actions, dismiss, key, title: scenario.title, situation: scenario.situation, employer: place.job.employer,
    choices: scenario.choices.map(choice => ({ id: key + "." + choice.id, label: choice.label })),
  };
}

export function getWorkDecision(s: GameState) {
  if (s.path?.work.job?.workplace?.event?.age !== s.age) return null;
  const place = workplaceContext(s);
  return place && decisionFor(s, place);
}

export function resolveWorkplaceAction(s: GameState, id: string) {
  if (id.includes(".event.")) return getWorkDecision(s)?.actions.find(action => action.id === id);
  const view = workplaceView(s);
  return view && [...view.tasks, ...view.team.flatMap(person => person.actions)].find(action => action.id === id);
}

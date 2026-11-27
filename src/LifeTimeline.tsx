import React, { type ReactNode } from "react";
import type { GameState, Memory } from "./engine.ts";
import { isJournalMilestone, journalLine } from "./journalCopy.ts";
import { quietYear } from "./everydayEvents.ts";
import type { Language } from "./session.ts";
import { Icon, copy, lifeStatLabels, money, occupation, town } from "./ui.tsx";

const ageTitle = (age: number, l: Language) => l === "bg" ? age + (age === 1 ? " година" : " години") : "Age " + age;

function signedMoney(amount: number, l: Language) {
  return (amount > 0 ? "+" : "") + money(amount, l);
}

function StatChanges({ delta, l }: { delta: Memory["statsDelta"]; l: Language }) {
  if (!delta) return null;
  const labels = lifeStatLabels(l);
  return <>{(Object.keys(labels) as Array<keyof typeof labels>).map(key => {
    const change = delta[key];
    return change ? <span key={key} className={change > 0 ? "life-stat-up" : "life-stat-down"}>
      {labels[key]} {change > 0 ? "+" : ""}{change}
    </span> : null;
  })}</>;
}

const hasStatChanges = (delta: Memory["statsDelta"]) => Object.values(delta ?? {}).some(Boolean);

function LifeEvent({ event, l, life }: { event: Memory; l: Language; life: GameState }) {
  const personEvent = event.kind === "action" && event.id.startsWith("people.");
  const line = journalLine(event, l, life.birthFamily);
  const original = event.text[l];
  const showTitle = event.kind === "choice";
  const showOriginal = original !== line;
  const hasChanges = event.movedTo || event.startedCareer || event.cashDelta !== 0 || hasStatChanges(event.statsDelta);
  const content = isJournalMilestone(event) ? <strong>{line}</strong> : <span>{line}</span>;

  return <li className="life-event"
    id={personEvent ? "life-event-" + event.age + "-" + event.id : undefined}
    tabIndex={personEvent ? -1 : undefined} data-person-event={personEvent || undefined} data-event-id={event.id}>
    {showTitle || showOriginal || hasChanges ? <details className="life-event-disclosure">
      <summary className="life-event-line">{content}<Icon name="down" size={12}/></summary>
      <div className="life-event-detail">
        {showTitle && <p className="life-event-title">{event.title[l]}</p>}
        {showOriginal && <p>{original}</p>}
        {hasChanges && <div className="life-event-changes">
          {event.movedTo && <span>{copy(l, "Нов град", "New city")} · {town(event.movedTo, l)}</span>}
          {event.startedCareer && <span>{copy(l, "Нова работа", "New job")} · {occupation(event.startedCareer, l, life.avatar)}</span>}
          {event.cashDelta !== 0 && <span className={event.cashDelta > 0 ? "cash-in" : "cash-out"}>{signedMoney(event.cashDelta, l)}</span>}
          <StatChanges delta={event.statsDelta} l={l}/>
        </div>}
      </div>
    </details> : <p className="life-event-line">{content}</p>}
  </li>;
}

function groupLifeYears(s: GameState) {
  const entries = new Map<number, Memory[]>();
  let totalDelta = 0;
  for (const event of s.history) {
    totalDelta += event.cashDelta;
    const year = entries.get(event.age);
    if (year) year.push(event);
    else entries.set(event.age, [event]);
  }
  if (!entries.has(s.age)) entries.set(s.age, []);
  let balance = s.cash - totalDelta;
  return [...entries].sort(([a], [b]) => a - b).map(([age, year]) => {
    const cashDelta = year.reduce((sum, event) => sum + event.cashDelta, 0);
    balance += cashDelta;
    return { age, cashDelta, balance, events: year.filter(event => event.kind !== "year"),
      budget: year.find(event => event.kind === "year") };
  });
}

export function JournalFinances({ s, l }: { s: GameState; l: Language }) {
  const years = groupLifeYears(s).filter(year => year.budget).reverse();
  if (!years.length) return null;

  return <details className="journal-finances">
    <summary><Icon name="journal" size={16}/>{copy(l, "Сметки по години", "Yearly finances")}<Icon name="down" size={14}/></summary>
    {years.map(({ age, cashDelta, balance, budget }) => budget && <details className="life-year-budget" key={age}>
      <summary>
        <span>{ageTitle(age, l)}</span>
        {cashDelta !== 0 && <span className={cashDelta > 0 ? "cash-in" : "cash-out"}>{signedMoney(cashDelta, l)}</span>}
        <Icon name="down" size={12}/>
      </summary>
      <div className="life-event-detail">
        <p className="life-year-balance">{copy(l, "Краен баланс", "Closing balance")} <strong>{money(balance, l)}</strong></p>
        <p>{budget.text[l]}</p>
        {hasStatChanges(budget.statsDelta) && <div className="life-event-changes"><StatChanges delta={budget.statsDelta} l={l}/></div>}
      </div>
    </details>)}
  </details>;
}

export function LifeTimeline({ s, l, children }: { s: GameState; l: Language; children: ReactNode }) {
  return <section className="life-timeline" aria-labelledby="timeline-heading">
    <h1 id="timeline-heading" className="timeline-heading"><Icon name="journal" size={16}/>{copy(l, "Дневник", "Journal")}</h1>
    {groupLifeYears(s).map(({ age, events }) => {
      const latest = age === s.age;
      return <section className={"life-year" + (latest ? " life-year-latest" : "")} key={age} data-life-year={age} aria-labelledby={"life-year-" + age}>
        <h2 className="life-year-title" id={"life-year-" + age} tabIndex={-1} aria-current={latest && !s.finished ? "step" : undefined}>
          {ageTitle(age, l)}
        </h2>
        {events.length > 0 ? <ul className="life-entries" role="list">
          {events.map((event, index) => <LifeEvent key={event.kind + event.id + index} event={event} l={l} life={s}/>)}
        </ul> : <p className="life-quiet">{quietYear(s.seed, age)[l]}</p>}
        {latest && children}
      </section>;
    })}
  </section>;
}

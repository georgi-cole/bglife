import React, { type ReactNode } from "react";
import { getCityOpportunity, type GameState, type Memory } from "./engine.ts";
import { cityWeatherDate } from "./cityLife.ts";
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

function LifeEvent({ event, l, life, children }: { event: Memory; l: Language; life: GameState; children?: ReactNode }) {
  const personEvent = event.kind === "action" && event.id.startsWith("people.");
  const focusable = event.decision || personEvent || (event.kind === "action" && /^(city-life|asset|bank)\./.test(event.id));
  const eventDate = event.cityEvent && cityWeatherDate(event.cityEvent, l);
  const line = journalLine(event, l, life.birthFamily);
  const original = event.text[l];
  const showTitle = event.kind === "choice" || Boolean(event.decision);
  const showOriginal = original !== line;
  const impact = event.workImpact;
  const hasChanges = event.movedTo || event.startedCareer || event.cashDelta !== 0
    || hasStatChanges(event.statsDelta) || impact?.performance || impact?.relationship;
  const content = isJournalMilestone(event) ? <strong>{line}</strong> : <span>{line}</span>;

  return <li className="life-event"
    id={focusable ? "life-event-" + event.age + "-" + event.id : undefined}
    tabIndex={focusable ? -1 : undefined} data-person-event={personEvent || undefined} data-event-id={event.id}>
    {showTitle || showOriginal || eventDate || hasChanges ? <details className="life-event-disclosure">
      <summary className={"life-event-line" + (event.decision ? " work-decision-line" : "")}>
        {event.decision && <Icon name="bag" size={14}/>}
        {content}<Icon name="down" size={12}/>
      </summary>
      <div className="life-event-detail">
        {eventDate && <small className="city-event-date">{eventDate}</small>}
        {showTitle && <p className="life-event-title">{event.title[l]}</p>}
        {event.decision && <>
          <p>{event.decision.situation[l]}</p>
          <p className="work-journal-choice">{copy(l, "Избрах", "I chose")} · {event.decision.choice[l]}</p>
        </>}
        {showOriginal && <p>{original}</p>}
        {hasChanges && <div className="life-event-changes">
          {event.movedTo && <span>{copy(l, "Нов град", "New city")} · {town(event.movedTo, l)}</span>}
          {event.startedCareer && <span>{copy(l, "Нова работа", "New job")} · {occupation(event.startedCareer, l, life.avatar)}</span>}
          {event.cashDelta !== 0 && <span className={event.cashDelta > 0 ? "cash-in" : "cash-out"}>{signedMoney(event.cashDelta, l)}</span>}
          {impact?.performance ? <span className={impact.performance > 0 ? "life-stat-up" : "life-stat-down"}>
            {copy(l, "Представяне", "Performance")} {impact.performance > 0 ? "+" : ""}{impact.performance}
          </span> : null}
          {impact?.relationship && <span className={impact.relationship.delta > 0 ? "life-stat-up" : "life-stat-down"}>
            {impact.relationship.name[l]} {impact.relationship.delta > 0 ? "+" : ""}{impact.relationship.delta}
          </span>}
          <StatChanges delta={event.statsDelta} l={l}/>
        </div>}
      </div>
    </details> : <p className="life-event-line">{content}</p>}
    {children}
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

export function LifeTimeline({ s, l, children, onAction }: { s: GameState; l: Language; children: ReactNode; onAction: (id: string) => void }) {
  const opportunity = getCityOpportunity(s);
  return <section className="life-timeline" aria-labelledby="timeline-heading">
    <h1 id="timeline-heading" className="timeline-heading"><Icon name="journal" size={16}/>{copy(l, "Дневник", "Journal")}</h1>
    {groupLifeYears(s).map(({ age, events }) => {
      const latest = age === s.age;
      return <section className={"life-year" + (latest ? " life-year-latest" : "")} key={age} data-life-year={age} aria-labelledby={"life-year-" + age}>
        <h2 className="life-year-title" id={"life-year-" + age} tabIndex={-1} aria-current={latest && !s.finished ? "step" : undefined}>
          {ageTitle(age, l)}
        </h2>
        {events.length > 0 ? <ul className="life-entries" role="list">
          {events.map((event, index) => <LifeEvent key={event.kind + event.id + index} event={event} l={l} life={s}>
            {latest && opportunity?.id === event.id && <div className="city-event-actions" data-city-opportunity>
              {opportunity.options.map(({ option, blocked }) => <button key={option.id} type="button" className="secondary-button"
                data-action={option.id} disabled={blocked} onClick={() => onAction(option.id)}>
                <span>{option.label[l]}</span>
                {!!option.effect?.cash && <span className={option.effect.cash > 0 ? "cash-in" : "cash-out"}>{signedMoney(option.effect.cash, l)}</span>}
              </button>)}
            </div>}
          </LifeEvent>)}
        </ul> : <p className="life-quiet">{quietYear(s.seed, age)[l]}</p>}
        {latest && children}
      </section>;
    })}
  </section>;
}

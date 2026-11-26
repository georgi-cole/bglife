import React, {type ReactNode} from "react";
import { yearRecap, type GameState, type Memory } from "./engine.ts";
import type { Language } from "./session.ts";
import { Icon, copy, lifeStatLabels, money, occupation, town } from "./ui.tsx";

function signedMoney(amount: number, l: Language) {
  return (amount > 0 ? "+" : "") + money(amount, l);
}

function StatChanges({delta, l}: {delta: Memory["statsDelta"]; l: Language}) {
  if (!delta) return null;
  const labels = lifeStatLabels(l);
  return <>{(Object.keys(labels) as Array<keyof typeof labels>).map(key => {
    const change = delta[key];
    return change ? <span key={key} className={change > 0 ? "life-stat-up" : "life-stat-down"}>
      {labels[key]} {change > 0 ? "+" : ""}{change}
    </span> : null;
  })}</>;
}

function LifeEvent({event, l, avatar}: {event: Memory; l: Language; avatar: GameState["avatar"]}) {
  const action = event.kind === "action";
  const personEvent=action&&event.id.startsWith("people.");
  return <li className={"life-event " + (action ? "life-action" : "life-decision")}
    id={personEvent?"life-event-"+event.age+"-"+event.id:undefined} tabIndex={personEvent?-1:undefined} data-person-event={personEvent||undefined}>
    <span className="life-event-icon"><Icon name={action ? "clock" : event.kind === "end" ? "journal" : "check"} size={16}/></span>
    <div className="life-event-content">
      <h4>{event.title[l]}</h4>
      <p>{event.text[l]}</p>
      {(event.movedTo || event.startedCareer || event.cashDelta !== 0 || event.statsDelta) && <div className="life-event-changes">
        {event.movedTo && <span className="move-event"><Icon name="pin" size={13}/>{copy(l, "Нов град", "New city")} · {town(event.movedTo, l)}</span>}
        {event.startedCareer && <span className="career-event"><Icon name="bag" size={13}/>{copy(l, "Нова работа", "New job")} · {occupation(event.startedCareer, l, avatar)}</span>}
        {event.cashDelta !== 0 && <span className={event.cashDelta > 0 ? "cash-in" : "cash-out"}><Icon name="wallet" size={13}/>{signedMoney(event.cashDelta, l)}</span>}
        <StatChanges delta={event.statsDelta} l={l}/>
      </div>}
    </div>
  </li>;
}

export function LifeTimeline({s, l, children}: {s: GameState; l: Language; children: ReactNode}) {
  const eventsByAge = new Map<number, Memory[]>();
  for (const event of s.history) {
    const existing = eventsByAge.get(event.age);
    if (existing) existing.push(event);
    else eventsByAge.set(event.age, [event]);
  }
  if (!eventsByAge.has(s.age)) eventsByAge.set(s.age, []);

  return <section className="life-timeline" aria-labelledby="timeline-heading">
    <h2 id="timeline-heading" className="timeline-heading"><Icon name="journal" size={18}/>{copy(l, "Дневник на живота", "Life journal")}</h2>
    {[...eventsByAge].map(([age, events]) => {
      const latest = age === s.age;
      const recap = yearRecap(s, age);
      const eventsToShow = events.filter(event => event.kind !== "year");
      const budget = events.find(event => event.kind === "year");
      return <section className={"life-year" + (latest ? " life-year-latest" : "")} key={age} data-life-year={age} aria-labelledby={"life-year-" + age}>
        <h3 className="life-year-title" id={"life-year-" + age} tabIndex={-1}>
          <span>{copy(l, age + " години", "Age " + age)}</span>
          {latest && !s.finished && <small>{copy(l, "Сега", "Now")}</small>}
        </h3>
        {eventsToShow.length > 0 && <ul className="life-entries">
          {eventsToShow.map((event,index) => <LifeEvent key={event.kind + event.id + index} event={event} l={l} avatar={s.avatar}/>)}
        </ul>}
        {recap && budget && <details className="life-year-budget">
          <summary>
            <Icon name="wallet" size={16}/>
            <span>{copy(l, "Краен баланс", "Closing balance")}</span>
            <strong>{money(recap.closingCash, l)}</strong>
            {recap.cashDelta !== 0 && <span className={"year-delta " + (recap.cashDelta > 0 ? "cash-in" : "cash-out")}>{signedMoney(recap.cashDelta, l)}</span>}
            <Icon name="down" size={14}/>
          </summary>
          <p>{budget.text[l]}</p>
          {budget.statsDelta && <div className="life-event-changes life-year-stats"><StatChanges delta={budget.statsDelta} l={l}/></div>}
        </details>}
        {latest && children}
      </section>;
    })}
  </section>;
}

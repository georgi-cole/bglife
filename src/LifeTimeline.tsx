import React, {type ReactNode} from "react";
import { getCityOpportunity, type GameState, type Memory } from "./engine.ts";
import { cityWeatherDate } from "./cityLife.ts";
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

function LifeEvent({event, l, avatar, children}: {event: Memory; l: Language; avatar: GameState["avatar"]; children?: ReactNode}) {
  const action = event.kind === "action";
  const personEvent=action&&event.id.startsWith("people.");
  const localResult = action && event.id.startsWith("city-life.");
  const focusable = personEvent || localResult;
  const loss = event.kind === "end" || event.id.startsWith("loss-");
  const health = event.id.startsWith("health-");
  const education = event.kind === "path" && /^(school|university|degree|scholarship|tuition)/.test(event.id);
  return <li className={"life-event " + (loss ? "life-loss" : health ? "life-health" : action ? "life-action" : "life-decision")}
    id={focusable?"life-event-"+event.age+"-"+event.id:undefined} tabIndex={focusable?-1:undefined} data-person-event={personEvent||undefined}>
    <span className="life-event-icon"><Icon name={loss ? "journal" : health ? "heart" : education ? "school" : event.kind === "path" ? "bag" : event.cityEvent ? "pin" : action ? "clock" : event.kind === "event" ? "sparkle" : "check"} size={16}/></span>
    <div className="life-event-content">
      <h4>{event.title[l]}</h4>
      {event.cityEvent && <small className="city-event-date">{cityWeatherDate(event.cityEvent, l)}</small>}
      <p>{event.text[l]}</p>
      {children}
      {(event.movedTo || event.startedCareer || event.cashDelta !== 0 || event.statsDelta) && <div className="life-event-changes">
        {event.movedTo && <span className="move-event"><Icon name="pin" size={13}/>{copy(l, "Нов град", "New city")} · {town(event.movedTo, l)}</span>}
        {event.startedCareer && <span className="career-event"><Icon name="bag" size={13}/>{copy(l, "Нова работа", "New job")} · {occupation(event.startedCareer, l, avatar)}</span>}
        {event.cashDelta !== 0 && <span className={event.cashDelta > 0 ? "cash-in" : "cash-out"}><Icon name="wallet" size={13}/>{signedMoney(event.cashDelta, l)}</span>}
        <StatChanges delta={event.statsDelta} l={l}/>
      </div>}
    </div>
  </li>;
}

export function LifeTimeline({s, l, children, onAction}: {s: GameState; l: Language; children: ReactNode; onAction: (id: string) => void}) {
  const opportunity = getCityOpportunity(s);
  const eventsByAge = new Map<number, Memory[]>();
  let totalDelta = 0;
  for (const event of s.history) {
    totalDelta += event.cashDelta;
    const existing = eventsByAge.get(event.age);
    if (existing) existing.push(event);
    else eventsByAge.set(event.age, [event]);
  }
  if (!eventsByAge.has(s.age)) eventsByAge.set(s.age, []);
  let yearBalance = s.cash - totalDelta;

  return <section className="life-timeline" aria-labelledby="timeline-heading">
    <h2 id="timeline-heading" className="timeline-heading"><Icon name="journal" size={18}/>{copy(l, "Дневник на живота", "Life journal")}</h2>
    {[...eventsByAge].map(([age, events]) => {
      const latest = age === s.age;
      const cashDelta = events.reduce((sum, event) => sum + event.cashDelta, 0);
      yearBalance += cashDelta;
      const eventsToShow = events.filter(event => event.kind !== "year");
      const budget = events.find(event => event.kind === "year");
      return <section className={"life-year" + (latest ? " life-year-latest" : "")} key={age} data-life-year={age} aria-labelledby={"life-year-" + age}>
        <h3 className="life-year-title" id={"life-year-" + age} tabIndex={-1}>
          <span>{copy(l, age + " години", "Age " + age)}</span>
          {latest && !s.finished && <small>{copy(l, "Сега", "Now")}</small>}
        </h3>
        {eventsToShow.length > 0 && <ul className="life-entries">
          {eventsToShow.map((event,index) => <LifeEvent key={event.kind + event.id + index} event={event} l={l} avatar={s.avatar}>
            {latest && opportunity?.id === event.id && <div className="city-event-actions" data-city-opportunity>
              <small><Icon name="clock" size={13}/>{copy(l, "1 свободно време", "1 free-time slot")}</small>
              {opportunity.options.map(({option, blocked}) => <button key={option.id} type="button" className="secondary-button"
                data-action={option.id} disabled={blocked} onClick={() => onAction(option.id)}>
                <span>{option.label[l]}</span>
                {!!option.effect?.cash && <span className={option.effect.cash > 0 ? "cash-in" : "cash-out"}>{signedMoney(option.effect.cash, l)}</span>}
              </button>)}
            </div>}
          </LifeEvent>)}
        </ul>}
        {budget && <details className="life-year-budget">
          <summary>
            <Icon name="wallet" size={16}/>
            <span>{copy(l, "Краен баланс", "Closing balance")}</span>
            <strong>{money(yearBalance, l)}</strong>
            {cashDelta !== 0 && <span className={"year-delta " + (cashDelta > 0 ? "cash-in" : "cash-out")}>{signedMoney(cashDelta, l)}</span>}
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

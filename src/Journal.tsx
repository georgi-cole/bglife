import React from "react";
import {art} from "../scripts/art";
import {annualBudget, commitmentsLeft, defaultPlayChoice, getActions, getChoices, getScene, type GameState} from "./engine.ts";
import {LifeTimeline} from "./LifeTimeline.tsx";
import {endingCopy} from "./story.ts";
import type {Language} from "./session.ts";
import {Icon,PlaySymbol,copy,money,name,occupation,town} from "./ui.tsx";

export function Wallet({s,l}:{s:GameState;l:Language}) {
  const budget=annualBudget(s);
  return <><p className="balance-total">{money(s.cash,l)}</p><p className="muted">{copy(l,"Налични пари","Available cash")}</p>
    {s.deposit>0&&<div className="stat-row"><span>{copy(l,"Депозит за квартирата","Refundable rental deposit")}</span><b>{money(s.deposit,l)}</b></div>}
    <h3>{copy(l,"Годишен бюджет","Annual budget")}</h3>
    {s.age<19?<p>{copy(l,"Докато живееш у дома като ученичка, семейството поема основните разходи. Личните покупки се плащат от портфейла ти.","While you’re at school and living at home, your family covers the household bills. Your own purchases come out of your wallet.")}</p>:
    <><div className="stat-row"><span>{copy(l,"Доход","Income")}</span><b>{money(budget.pay,l)}</b></div><div className="stat-row"><span>{copy(l,"Всекидневни разходи","Living costs")}</span><b>−{money(budget.essentials,l)}</b></div><div className="stat-row"><span>{copy(l,"Жилище","Housing")}</span><b>−{money(budget.housing,l)}</b></div><div className="stat-row"><span>{copy(l,"Остатък за годината","Net for the year")}</span><b>{money(budget.net,l)}</b></div></>}
  </>;
}

type Props = {
  s: GameState;
  l: Language;
  onChoice: (id: string) => void;
  onAction: (id: string) => void;
  onReplay: () => void;
  onAlbum: () => void;
  onWallet: () => void;
};
export function Journal({s, l, onChoice, onAction, onReplay, onAlbum, onWallet}: Props) {
  const scene = getScene(s);
  const choices = getChoices(s);
  const actions = getActions(s);
  const fallback = defaultPlayChoice(s);
  const ending = s.finished ? endingCopy(s) : null;
  const time = commitmentsLeft(s);

  return <>
    <section className="hero life-stage" aria-label={town(s.city, l)}>
      <img className="hero-img" src={art[s.city]} alt="" draggable={false}/>
      <div className="age-counter" data-testid="chapter-age">
        <strong>{s.age}</strong><span>{copy(l, "години", "years old")}</span>
      </div>
      <div className="hero-content">
        <p className="location"><Icon name="pin" size={16}/>{town(s.city, l)}</p>
        <h1>{name(l)}</h1>
        <p className="hero-meta">{occupation(s.career, l)}</p>
      </div>
      <div className="year-track" aria-hidden="true">
        {Array.from({length:11}, (_, i) => <span key={i} className={i < s.age - 16 || s.finished ? "passed" : i === s.age - 16 ? "current" : ""}/>)}
      </div>
    </section>
    <div className="hud">
      <button className="hud-stat" onClick={onWallet}>
        <span className="hud-icon wallet"><Icon name="wallet" size={19}/></span>
        <span><small>{copy(l, "Портфейл", "Wallet")}</small><strong>{money(s.cash, l)}</strong></span>
        <Icon name="next" size={13}/>
      </button>
      <div className="hud-stat">
        <span className="hud-icon time"><Icon name="clock" size={19}/></span>
        <span><small>{copy(l, "Свободно време", "Free time")}</small><strong>{s.finished ? "—" : copy(l, time + " от 2", time + " of 2")}</strong></span>
        {!s.finished && <span className="time-ticks" aria-hidden="true"><i className={time >= 1 ? "lit" : ""}/><i className={time >= 2 ? "lit" : ""}/></span>}
      </div>
    </div>
    <LifeTimeline s={s} l={l}>
      {ending ? (
        <section className="story-card ending-card">
          <p className="section-kicker"><Icon name="album"/>{copy(l, "Епилог", "Epilogue")}</p>
          <h4>{ending.title[l]}</h4><p className="story-body">{ending.body[l]}</p>
          <div className="ending-actions">
            <button className="primary-button" onClick={onAlbum}>{copy(l, "Отвори албума", "Open your album")}<Icon name="right"/></button>
            <button className="secondary-button" data-testid="replay" onClick={onReplay}>{copy(l, "Изживей друга история", "Play another life")}</button>
          </div>
        </section>
      ) : scene && s.choiceId === null ? (
        <section className="story-card scene-card" aria-labelledby="scene-heading">
          <h4 id="scene-heading" tabIndex={-1}>{scene.title[l]}</h4>
          <p className="story-body">{scene.body[l]}</p>
          <div className="choices">
            {choices.map(option => <button className="choice" data-choice={option.id} key={option.id} onClick={() => onChoice(option.id)}>
              <span className="choice-copy"><strong>{option.label[l]}</strong></span><span className="choice-arrow"><Icon name="right"/></span>
            </button>)}
          </div>
          {fallback && <p className="play-default" id="play-default"><PlaySymbol/>{copy(l, "При продължаване Мила избира", "On Play, Mila chooses")} <strong>{fallback.label[l]}</strong></p>}
        </section>
      ) : actions.length > 0 && <details className="commitments">
        <summary><Icon name="clock" size={17}/>{copy(l, "Свободно време", "Free time")}<span>{time}/2</span><Icon name="down" size={15}/></summary>
        <div className="action-grid">{actions.map(action => <button className="secondary-button" key={action.id} data-action={action.id} onClick={() => onAction(action.id)}>{action.label[l]}</button>)}</div>
      </details>}
    </LifeTimeline>
  </>;
}

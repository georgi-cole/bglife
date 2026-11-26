import React from "react";
import {art} from "../scripts/art";
import {avatarStages} from "./avatar.ts";
import {cities,cityArt} from "./cities.ts";
import {cityPaths} from "./cityPaths.ts";
import {talents} from "./lifeProfile.ts";
import {conditionLabel} from "./lifeHealth.ts";
import {annualBudget, commitmentsLeft, defaultPlayChoice, getActions, getChoices, getEstate, getScene, lifeHeirLabel, type GameState, type LifeActivityCategory} from "./engine.ts";
import {LifeTimeline} from "./LifeTimeline.tsx";
import {pathBudget} from "./lifePath.ts";
import {currentSchool} from "./school.ts";
import {findProgram} from "./university.ts";
import {endingCopy} from "./story.ts";
import {adoptionStatus, pregnancyStatus} from "./reproduction.ts";
import type {Language} from "./session.ts";
import {Icon,PlaySymbol,copy,lifeName,lifeOccupation,money,town} from "./ui.tsx";

export function Wallet({s,l,onBank}:{s:GameState;l:Language;onBank:()=>void}) {
  const budget=annualBudget(s);
  const path=s.path&&pathBudget(s,s.path);
  const items: [string,number][] = path ? [
    [copy(l,"Джобни","Pocket money"),path.pocket],
    [copy(l,"Нетна заплата","Take-home pay"),path.wage],
    [copy(l,"Стипендия","Scholarship"),path.scholarship],
    [copy(l,"Обезщетение за безработица","Unemployment benefit"),path.benefit],
    [copy(l,"Пенсия","Pension"),path.pension],
    [copy(l,"Такса за обучение","Tuition"),-path.tuition],
    [copy(l,"Лични здравни вноски","Personal health contributions"),-path.health],
  ] : [];
  const bank=s.lifeSystems.bank;
  const obligations=budget.obligations>0&&<div className="stat-row"><span>{copy(l,"Годишни вноски и грижи","Yearly payments and care")}</span><b>−{money(budget.obligations,l)}</b></div>;
  return <><p className="balance-total">{money(s.cash,l)}</p><p className="muted">{copy(l,"Налични пари","Available cash")}</p>
    {s.deposit>0&&<div className="stat-row"><span>{copy(l,"Депозит за квартирата","Refundable rental deposit")}</span><b>{money(s.deposit,l)}</b></div>}
    {bank.accountOpen&&<div className="stat-row"><span>{copy(l,"Банкова сметка","Bank account")}</span><b>{money(bank.balance,l)}</b></div>}
    {bank.loan>0&&<div className="stat-row"><span>{copy(l,"Остатък по заема","Loan balance")}</span><b>{money(bank.loan,l)}</b></div>}
    {bank.mortgage>0&&<div className="stat-row"><span>{copy(l,"Остатък по ипотеката","Mortgage balance")}</span><b>{money(bank.mortgage,l)}</b></div>}
    <h3>{copy(l,"Годишен бюджет","Annual budget")}</h3>
    {!path&&s.age<19?<><p>{copy(l,"Докато живееш у дома и ходиш на училище, семейството поема основните разходи. Личните покупки се плащат от портфейла ти.","While you’re at school and living at home, your family covers the household bills. Your own purchases come out of your wallet.")}</p>{obligations}</>:
    <><div className="stat-row"><span>{copy(l,"Доход","Income")}</span><b>{money(budget.pay,l)}</b></div>
    {items.map(([label,amount])=>amount!==0&&<div className="stat-row" key={label}><span>{label}</span><b>{money(amount,l)}</b></div>)}
    <div className="stat-row"><span>{copy(l,"Всекидневни разходи","Living costs")}</span><b>−{money(budget.essentials,l)}</b></div><div className="stat-row"><span>{copy(l,"Жилище","Housing")}</span><b>−{money(budget.housing,l)}</b></div>{obligations}<div className="stat-row"><span>{copy(l,"Остатък за годината","Net for the year")}</span><b>{money(budget.net,l)}</b></div></>}
    <button className="secondary-button" onClick={onBank}><Icon name="wallet"/>{copy(l,"Към банката","Go to Bank")}</button>
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
  onMore: (category?: LifeActivityCategory) => void;
};
export function Journal({s, l, onChoice, onAction, onReplay, onAlbum, onWallet, onMore}: Props) {
  const scene = getScene(s);
  const choices = getChoices(s);
  const actions = getActions(s);
  const fallback = defaultPlayChoice(s);
  const ending = s.endReason === "chapter" ? endingCopy(s) : null;
  const artId = cityArt(s.city);
  const { healthCondition } = s.lifeSystems;
  const estate = s.finished ? getEstate(s) : null;
  const pregnancy = s.finished ? null : pregnancyStatus(s);
  const adoptionOffer = !s.finished && s.lifeSystems.reproduction.adoption?.stage === "offer" ? adoptionStatus(s) : null;
  const time = commitmentsLeft(s);
  const student = s.path?.university.student;
  const school = s.path?.school;
  const institution = s.path
    ? student && !student.paused ? findProgram(student.city, student.program)?.institution
      : school?.grade != null && !school.left ? currentSchool(s, school).name : null
    : s.enrollment && s.age < s.enrollment.graduationAge ? cityPaths[s.enrollment.city].schools[s.enrollment.index].name : null;

  return <>
    <section className="hero life-stage" data-landscape={artId ? undefined : cities[s.city].landscape} aria-label={town(s.city, l)}>
      {artId && <img className="hero-img" src={art[artId]} alt="" draggable={false}/>}
      {!artId && <div className="hero-landmark">{cities[s.city].landmark[l]}</div>}
      <div className="age-counter" data-testid="chapter-age">
        <strong>{s.age}</strong><span>{copy(l, "години", "years old")}</span>
      </div>
      <div className="hero-content">
        <p className="location"><Icon name="pin" size={16}/>{town(s.city, l)}</p>
        <h1>{lifeName(l,s)}</h1>
        <p className="hero-meta">{lifeOccupation(s, l)}</p>
        {institution && <p className="hero-detail">{institution[l]}</p>}
        {s.profile && s.profile.talent !== "none" && <p className="hero-detail">
          <Icon name="sparkle" size={14}/>{talents[s.profile.talent][l]}
        </p>}
      </div>
      <div className="year-track" aria-hidden="true">
        {s.lifespanStart === null
          ? Array.from({length:11}, (_, i) => <span key={i} className={i < s.age - 16 || s.endReason === "chapter" ? "passed" : i === s.age - 16 ? "current" : ""}/>)
          : avatarStages.map((stage, index) => <span key={stage.id} className={s.age >= (avatarStages[index + 1]?.from ?? Infinity)
            ? "passed" : s.age >= stage.from ? "current" : ""}/>)}
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
    {!s.finished && s.lifeSystems.medicalIssue && <div className={"journal-health-alert " + (s.lifeSystems.medicalIssue==="urgent"?"urgent":"")}>
      <span><strong>{healthCondition ? conditionLabel(healthCondition)[l] : s.lifeSystems.medicalIssue==="urgent"
        ? copy(l,"Спешен случай в историята","In-game emergency") : copy(l,"Здравословен проблем","Health concern")}</strong>
      <small>{s.lifeSystems.medicalIssue==="urgent" ? copy(l,"Спешната помощ в играта не отнема свободно време.","In-game emergency help uses no free time.") : copy(l,"В „Болница“ можеш да избереш преглед.","You can arrange a checkup in Hospital.")}</small></span>
      <button className="secondary-button" onClick={()=>onMore("hospital")}>{copy(l,"Болница","Hospital")}<Icon name="next" size={15}/></button>
    </div>}
    {pregnancy && <div className="journal-health-alert journal-family-alert">
      <span><strong>{copy(l,"Бременност","Pregnancy")}</strong><small>{pregnancy[l]}</small></span>
      <button className="secondary-button" onClick={()=>onMore("family")}>{copy(l,"Семейство","Family")}<Icon name="next" size={15}/></button>
    </div>}
    {adoptionOffer && <div className="journal-health-alert journal-family-alert">
      <span><strong>{copy(l,"Предложение за осиновяване","Adoption match")}</strong><small>{adoptionOffer[l]}</small></span>
      <button className="secondary-button" onClick={()=>onMore("adoption")}>{copy(l,"Виж","View")}<Icon name="next" size={15}/></button>
    </div>}
    <LifeTimeline s={s} l={l}>
      {s.finished ? (
        <section className="story-card ending-card">
          <p className="section-kicker"><Icon name="album"/>{copy(l, "Епилог", "Epilogue")}</p>
          <h4>{s.death ? lifeName(l,s) : ending?.title[l] ?? copy(l, "Историята приключи", "The story has ended")}</h4>
          <p className="story-body">{s.death
            ? copy(l, "Можеш да прегледаш всички години в албума.", "You can revisit every year in your album.")
            : ending?.body[l] ?? copy(l, "Дневникът пази твоята история до тази година.", "The journal keeps your story up to this year.")}</p>
          {estate && estate.shares.length > 0 && <div className="estate-summary">
            <h5>{copy(l, "Наследство", "Estate")}</h5>
            {estate.shares.map(({heir, amount}) => <div className="stat-row" key={heir}><span>{lifeHeirLabel(s,heir)[l]}</span><b>{money(amount,l)}</b></div>)}
          </div>}
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
          {fallback && <p className="play-default" id="play-default"><PlaySymbol/>{copy(l, "При продължаване избираш", "On Play, you choose")} <strong>{fallback.label[l]}</strong></p>}
        </section>
      ) : <details className="commitments" open={actions.some(action => action.id.startsWith("life.")) || undefined}>
        <summary><Icon name="clock" size={17}/>{copy(l, "Свободно време", "Free time")}<span>{time}/2</span><Icon name="down" size={15}/></summary>
        <div className="action-grid">
          {actions.map(action => <button className="secondary-button" key={action.id} data-action={action.id} onClick={() => onAction(action.id)}>{action.label[l]}</button>)}
          <button className="secondary-button" onClick={()=>onMore()}><Icon name="more" size={18}/>{copy(l,"Още дейности","More activities")}</button>
        </div>
      </details>}
    </LifeTimeline>
  </>;
}

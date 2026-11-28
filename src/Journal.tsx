import React from "react";
import {conditionLabel} from "./lifeHealth.ts";
import {getActions, getEstate, lifeHeirLabel, type GameState, type LifeActivityCategory} from "./engine.ts";
import {LifeTimeline} from "./LifeTimeline.tsx";
import {maternityStatus} from "./maternity.ts";
import {endingCopy} from "./story.ts";
import {adoptionStatus, pregnancyStatus} from "./reproduction.ts";
import {canEndPregnancy} from "./pregnancyTimeline.ts";
import type {Language} from "./session.ts";
import {Icon,copy,lifeName,money} from "./ui.tsx";

type Props = {
  s: GameState;
  l: Language;
  onCityDecision: () => void;
  onAction: (id: string) => void;
  onReplay: () => void;
  onAlbum: () => void;
  onMore: (category?: LifeActivityCategory) => void;
  onEndPregnancy: () => void;
  onCareer: () => void;
};
export function Journal({s, l, onCityDecision, onAction, onReplay, onAlbum, onMore, onEndPregnancy, onCareer}: Props) {
  const actions = getActions(s);
  const ending = s.endReason === "chapter" ? endingCopy(s) : null;
  const { healthCondition } = s.lifeSystems;
  const estate = s.finished ? getEstate(s) : null;
  const pregnancy = s.finished ? null : pregnancyStatus(s);
  const maternity = maternityStatus(s);
  const adoptionOffer = !s.finished && s.lifeSystems.reproduction.adoption?.stage === "offer" ? adoptionStatus(s) : null;

  return <>
    {!s.finished && s.lifeSystems.medicalIssue && <div className={"journal-health-alert " + (s.lifeSystems.medicalIssue==="urgent"?"urgent":"")}>
      <span><strong>{healthCondition ? conditionLabel(healthCondition)[l] : s.lifeSystems.medicalIssue==="urgent"
        ? copy(l,"Спешен случай в историята","In-game emergency") : copy(l,"Здравословен проблем","Health concern")}</strong>
      <small>{s.lifeSystems.medicalIssue==="urgent" ? copy(l,"В „Болница“ можеш да се обадиш на 112.","You can call 112 from Hospital.") : copy(l,"В „Болница“ можеш да избереш преглед.","You can arrange a checkup in Hospital.")}</small></span>
      <button className="secondary-button" onClick={()=>onMore("hospital")}>{copy(l,"Болница","Hospital")}<Icon name="next" size={15}/></button>
    </div>}
    {pregnancy && <div className="journal-health-alert journal-family-alert pregnancy-status">
      <span><strong>{pregnancy[l]}</strong></span>
      <div className="pregnancy-status-actions">
        <button className="secondary-button" onClick={()=>onMore("family")}>{copy(l,"Семейство","Family")}<Icon name="next" size={15}/></button>
        {canEndPregnancy(s) && <button className="secondary-button pregnancy-end" onClick={onEndPregnancy}>{copy(l,"Прекъсване по желание","End the pregnancy")}</button>}
      </div>
    </div>}
    {maternity && <div className="journal-health-alert journal-family-alert" data-maternity-status>
      <span><strong>{maternity[l]}</strong></span>
      <button className="secondary-button" onClick={onCareer}>{copy(l,"Кариера","Career")}<Icon name="next" size={15}/></button>
    </div>}
    {adoptionOffer && <div className="journal-health-alert journal-family-alert">
      <span><strong>{copy(l,"Предложение за осиновяване","Adoption match")}</strong><small>{adoptionOffer[l]}</small></span>
      <button className="secondary-button" onClick={()=>onMore("adoption")}>{copy(l,"Виж","View")}<Icon name="next" size={15}/></button>
    </div>}
    <LifeTimeline s={s} l={l} onCityDecision={onCityDecision}>
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
      ) : actions.length > 0 && <details className="journal-actions" open={actions.some(action => action.id.startsWith("life.")) || undefined}>
        <summary><Icon name="journal" size={17}/>{copy(l, "Действия", "Activities")}<Icon name="down" size={15}/></summary>
        <div className="journal-action-list">
          {actions.map(action => <button type="button" key={action.id} data-action={action.id} onClick={() => onAction(action.id)}>{action.label[l]}<Icon name="next" size={14}/></button>)}
          <button type="button" onClick={()=>onMore()}>{copy(l,"Още дейности","More activities")}<Icon name="next" size={14}/></button>
        </div>
      </details>}
    </LifeTimeline>
  </>;
}

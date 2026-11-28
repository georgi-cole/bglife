import {useLayoutEffect,useRef} from "react";
import {activityMoment} from "./activityMoments.ts";
import {getAvatarLook} from "./avatar.ts";
import {AvatarPortrait} from "./AvatarPortrait.tsx";
import {getPersonActivities,type GameState,type LifeActivityOption,type Memory,type Text} from "./engine.ts";
import {familyActivityLine,journalLine} from "./journalCopy.ts";
import type {ActivityBranch} from "./lifeActivities.ts";
import {personAge,personAvatarTraits,personName,type PeopleId} from "./peopleIdentity.ts";
import type {Language} from "./session.ts";
import {Icon,NavigationButton,copy,money} from "./ui.tsx";
import "./person-action.css";

export type PersonActionFlow = {
  contact:PeopleId; seed:number; age:number; ids:string[]; branch?:ActivityBranch;
  outcome:{entry:Memory;title:Text;relationship:{before:number;after:number}|null}|null;
};

export function BgLifeMark() {
  return <span className="game-brand" aria-label="BgLife">
    <svg viewBox="0 0 28 32" width="21" height="24" fill="none" aria-hidden="true">
      <path d="M3 5h22v12c0 6-4.5 10-11 13-6.5-3-11-7-11-13z" fill="#542d37" stroke="#ddb975" strokeWidth="1.2"/>
      <path d="m10 10 1-3 3 2 3-2 1 3zm5 3 4-1-1 4-2 2 2 3-1 3h-3l1-3-2-2-2 2v3H8l1-5 2-3-2-1-2 2-1-1 3-4 3 1 1-2zm4 6c3 0 3-2 2-3" fill="#e9bf74" stroke="#e9bf74" strokeWidth=".8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg><span aria-hidden="true">BgLife</span>
  </span>;
}

function SpendPreview({option,l}: {option:LifeActivityOption;l:Language}) {
  if (option.cashDelta >= 0) return null;
  return <span className="action-spend">
    <span><Icon name="wallet" size={14}/>{money(-option.cashDelta,l)}</span>
  </span>;
}
export function PersonActionDialog({flow,life,l,onClose,onChoose,onRepeat}: {
  flow:PersonActionFlow;life:GameState;l:Language;onClose:()=>void;onChoose:(id:string)=>void;onRepeat:(id:string)=>void;
}) {
  const ref=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null);
  const t=(bg:string,en:string)=>copy(l,bg,en);
  const options=life.seed===flow.seed&&life.age===flow.age
    ?getPersonActivities(life,flow.contact).filter(option=>flow.ids.includes(option.id)):[];
  const stage=flow.outcome?"outcome":"choose";
  const title=flow.outcome?.title[l]??flow.branch?.label[l]??t("Действие","Activity");
  const contact=personName(life,flow.contact)[l];
  const portrait=getAvatarLook(personAvatarTraits(life,flow.contact),personAge(life,flow.contact)??life.age);
  const outcome=flow.outcome?.entry;
  const repeat=outcome && options.find(option=>option.id===outcome.id&&option.repeatable&&!option.blocked);
  const prefix=contact+" · ";
  const original=outcome?.text[l];
  const result=outcome && (familyActivityLine(outcome,l,life) ?? activityMoment(outcome,life.seed,false)?.[l]
    ?? (flow.branch?.id==="conversation"||flow.branch?.id==="compliment" ? journalLine(outcome,l,life.birthFamily)
      : original?.startsWith(prefix) ? original.slice(prefix.length) : original));
  const relation=flow.outcome?.relationship;
  const wentDown=relation ? relation.after<relation.before : false;
  const reactionLabel=wentDown ? t("Връзката се влоши","Relationship worsened") : t("Връзката се подобри","Relationship improved");
  useLayoutEffect(()=>{
    const dialog=ref.current;
    if(!dialog)return;
    dialog.showModal();
    return ()=>{if(dialog.open)dialog.close();};
  },[]);
  useLayoutEffect(()=>{
    if(ref.current)ref.current.scrollTop=0;
    heading.current?.focus({preventScroll:true});
  },[stage,outcome]);

  return <dialog ref={ref} className="modal-card person-action-dialog" aria-labelledby="person-action-heading"
    aria-describedby={outcome ? "person-action-result" : undefined} data-action-phase={stage}
    onCancel={e=>{e.preventDefault();onClose();}}
    onClick={e=>{
      if(!outcome||e.target!==e.currentTarget)return;
      const {left,right,top,bottom}=e.currentTarget.getBoundingClientRect();
      if(e.clientX<left||e.clientX>right||e.clientY<top||e.clientY>bottom)onClose();
    }}>
    <header className="person-dialog-top">
      <div className="person-dialog-identity"><AvatarPortrait look={portrait} region="badge" className="person-dialog-avatar"/><span>{contact}</span></div>
      <NavigationButton label={t("Затвори","Close")} onClick={onClose}/>
    </header>
    <div className="person-dialog-body">
      <h2 id="person-action-heading" ref={heading} tabIndex={-1}>{title}</h2>
      {stage==="choose" && (options.length>0?<div className="person-action-options">{options.map(option=>
        <button type="button" key={option.id} className="person-action-option" data-person-option={option.id}
          disabled={Boolean(option.blocked)} onClick={()=>onChoose(option.id)}>
          <span><strong>{option.label[l]}</strong><small>{option.description[l]}</small>
            <SpendPreview option={option} l={l}/>
            {option.blocked&&<small className="person-dialog-lock">{option.blocked[l]}</small>}
          </span>
          <span className="person-option-arrow"><Icon name={option.blocked?"key":"next"} size={16}/></span>
        </button>)}</div>:<p className="person-dialog-lock">{t("Вариантите вече не са достъпни.","These choices are no longer available.")}</p>)}
      {outcome && <>
        <p id="person-action-result" className="person-dialog-result">{result}</p>
        {relation && <div className="person-reaction" data-direction={wentDown?"down":"up"}>
          <span id="person-reaction-label">{reactionLabel}</span>
          <meter aria-labelledby="person-reaction-label" min={0} max={100} value={relation.after}/>
        </div>}
        <div className="person-dialog-actions">
          {repeat&&<button type="button" className="secondary-button" onClick={()=>onRepeat(repeat.id)}>{t("Повтори","Repeat")}</button>}
          <button type="button" className="person-dialog-done" onClick={onClose}>{t("Продължи","Continue")}<Icon name="next" size={14}/></button>
        </div>
      </>}
    </div>
  </dialog>;
}

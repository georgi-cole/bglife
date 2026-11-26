import {useLayoutEffect,useRef} from "react";
import {getPersonActivities,type GameState,type LifeActivityOption,type Memory} from "./engine.ts";
import type {ActivityBranch} from "./lifeActivities.ts";
import {personName,type PeopleId} from "./peopleIdentity.ts";
import type {Language} from "./session.ts";
import {Icon,NavigationButton,copy,lifeStatLabels,money} from "./ui.tsx";
import "./person-action.css";

export type PersonActionFlow = {
  contact:PeopleId; seed:number; age:number; ids:string[]; branch?:ActivityBranch; selected:string|null;
  outcome:{entry:Memory;relationDelta:number|null}|null;
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
  return <span className="action-spend">
    {option.cashDelta<0&&<span><Icon name="wallet" size={14}/>{money(-option.cashDelta,l)}</span>}
    {option.timeCost>0&&<span><Icon name="clock" size={14}/>{option.timeCost} {copy(l,"ангажимент","time slot")}</span>}
  </span>;
}
const signed=(value:number)=>(value>0?"+":"−")+Math.abs(value);

export function PersonActionDialog({flow,life,l,onClose,onSelect,onConfirm}: {
  flow:PersonActionFlow;life:GameState;l:Language;onClose:()=>void;onSelect:(id:string|null)=>void;onConfirm:()=>void;
}) {
  const ref=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null);
  const t=(bg:string,en:string)=>copy(l,bg,en);
  const options=life.seed===flow.seed&&life.age===flow.age
    ?getPersonActivities(life,flow.contact).filter(option=>flow.ids.includes(option.id)):[];
  const selected=options.find(option=>option.id===flow.selected);
  const stage=flow.outcome?"outcome":flow.selected?"confirm":"choose";
  const title=flow.outcome?t("Как мина","How it went"):flow.branch?.label[l]??selected?.label[l]??t("Действие","Activity");
  const labels=lifeStatLabels(l);
  useLayoutEffect(()=>{const dialog=ref.current;if(dialog&&!dialog.open)dialog.showModal();},[]);
  useLayoutEffect(()=>{
    if(ref.current)ref.current.scrollTop=0;
    heading.current?.focus({preventScroll:true});
  },[stage]);

  return <dialog ref={ref} className="modal-card person-action-dialog" aria-labelledby="person-action-heading"
    data-action-phase={stage} onCancel={e=>{e.preventDefault();onClose();}}>
    <div className="person-dialog-top">
      {stage==="confirm"&&flow.branch ? <NavigationButton back label={t("Назад към вариантите","Back to choices")} onClick={()=>onSelect(null)}/> : <span/>}
      <BgLifeMark/>
      <NavigationButton label={t("Затвори","Close")} onClick={onClose}/>
    </div>
    <div className="person-dialog-body">
      <p className="person-dialog-contact">{personName(life,flow.contact)[l]}</p>
      <h2 id="person-action-heading" ref={heading} tabIndex={-1}>{title}</h2>
      {stage==="choose" && (options.length>0?<div className="person-action-options">{options.map(option=>
        <button type="button" key={option.id} className="person-action-option" data-person-option={option.id}
          onClick={()=>onSelect(option.id)}>
          <span><strong>{option.label[l]}</strong><small>{option.description[l]}</small>
            <SpendPreview option={option} l={l}/>
            {option.blocked&&<small className="person-dialog-lock">{option.blocked[l]}</small>}
          </span>
          <Icon name={option.blocked?"key":"next"} size={16}/>
        </button>)}</div>:<p className="person-dialog-lock">{t("Вариантите вече не са достъпни.","These choices are no longer available.")}</p>)}
      {stage==="confirm" && <>
        {flow.branch&&selected&&<h3>{selected.label[l]}</h3>}
        {selected&&<><p>{selected.description[l]}</p><SpendPreview option={selected} l={l}/></>}
        {(!selected||selected.blocked)&&<p className="person-dialog-lock">
          {selected?.blocked?.[l]??t("Действието вече не е достъпно.","This activity is no longer available.")}
        </p>}
        <div className="person-dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>{t("Отказ","Cancel")}</button>
          <button type="button" className="primary-button" disabled={!selected||!!selected.blocked} onClick={onConfirm}>{t("Потвърди","Confirm")}</button>
        </div>
      </>}
      {flow.outcome && <>
        <p className="person-dialog-result">{flow.outcome.entry.text[l]}</p>
        <div className="person-action-effects">
          {flow.outcome.relationDelta!==null&&flow.outcome.relationDelta!==0&&<span>{t("Връзка","Relationship")} {signed(flow.outcome.relationDelta)}</span>}
          {(Object.keys(labels) as Array<keyof typeof labels>).map(key=>{
            const delta=flow.outcome?.entry.statsDelta?.[key];
            return delta?<span key={key}>{labels[key]} {signed(delta)}</span>:null;
          })}
          {flow.outcome.entry.cashDelta!==0&&<span>{t("Портфейл","Cash")} {flow.outcome.entry.cashDelta>0?"+":"−"}{money(Math.abs(flow.outcome.entry.cashDelta),l)}</span>}
        </div>
        <button type="button" className="primary-button person-dialog-done" onClick={onClose}>{t("Към дневника","Go to journal")}</button>
      </>}
    </div>
  </dialog>;
}

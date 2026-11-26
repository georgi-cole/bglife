import React, {useState} from "react";
import {art} from "../scripts/art";
import {placeProfiles} from "./story.ts";
import {moveOptions,pathActionBlock} from "./lifePath.ts";
import {playableCities} from "./pathCatalog.ts";
import {relocation} from "./pathPolicy.ts";
import {type GameState} from "./engine.ts";
import type {Language} from "./session.ts";
import {LifePortrait} from "./AvatarPortrait.tsx";
import {Icon,MenuTitle,ageLabel,copy,money,town} from "./ui.tsx";

type MenuControls = {onClose:()=>void;closeLabel:string;back?:boolean};

export function Places({s,l,onHolidays,onMove,...menu}:MenuControls & {s:GameState;l:Language;onHolidays:()=>void;onMove:(id:string)=>void}) {
  const moves=moveOptions(s);
  return <><header className="page-head"><p className="section-kicker"><Icon name="places"/>{copy(l,"По картата","On the map")}</p><MenuTitle {...menu}><h1>{copy(l,"Места","Places")}</h1></MenuTitle><p>{s.path?copy(l,"Градът определя кои училища, университети и работни места са наблизо.","Your city determines which schools, universities and jobs are nearby."):s.age<19?copy(l,"На 19 ще решиш къде да живееш. Дотогава тук можеш да разгледаш двата града.","At nineteen you’ll decide where to live. Until then, get to know the two places in this chapter."):copy(l,"Двата града пазят различни части от историята ти.","These two places hold different parts of your story.")}</p></header>
    <div className="journal-links"><button className="secondary-button" onClick={onHolidays}><Icon name="places" size={17}/>{copy(l,"Почивки и пътувания","Holidays")}</button></div>
    <div className="panel-grid">{playableCities.map(id=>{const p=placeProfiles[id];return <article className="detail-card place-card" key={id}><img src={art[id]} alt=""/><div className="place-card-content"><p className="section-kicker"><Icon name={s.city===id?"home":"pin"}/>{s.city===id?copy(l,"Тук живееш","Your home"):copy(l,"В тази глава","In this chapter")}</p><h2>{p.name[l]}</h2><p>{p.detail[l]}</p>{id==="tryavna"&&s.lifeSystems.bank.ownsHome&&<p className="relation-evidence"><Icon name="home" size={16}/>{copy(l,"Притежаваш жилище тук","You own a home here")}</p>}<ul>{p.venues.map(v=><li key={v.en}>{v[l]}</li>)}</ul></div></article>})}</div>
    {moves.map(move=>{const target=playableCities.find(city=>move.id==="path.move."+city)!;
      const blocked=pathActionBlock(s,move),cost=relocation(s,target).cashDelta;
      return <article className="detail-card places-move" key={move.id}>
        <h2>{town(target,l)}</h2>
        <p>{cost<0?copy(l,"Път и преместване","Travel and moving costs"):copy(l,"Преместване и върнат депозит","Moving and returned deposit")} · {money(Math.abs(cost),l)}</p>
        <button className="secondary-button" type="button" disabled={Boolean(blocked)} data-career-action={move.id} onClick={()=>onMove(move.id)}>{move.label[l]}</button>
        {blocked&&<p>{blocked[l]}</p>}
      </article>;
    })}
  </>;
}

function Pages({s,l}:{s:GameState;l:Language}) {
  const years=[...new Set(s.history.map(m=>m.age))].reverse();
  if(!years.length)return <div className="detail-card"><Icon name="journal"/><h2>{copy(l,"Първата празна страница","The first blank page")}</h2><p>{copy(l,"Първото ти решение ще се появи тук.","Your first decision will appear here.")}</p></div>;
  return <div className="album-pages">{years.map((age,index)=><details className="detail-card year-page" key={age} open={index===0||undefined}><summary><span>{ageLabel(age,l)}</span><strong>{s.history.find(m=>m.age===age&&m.kind==="choice")?.title[l]}</strong><Icon name="down" size={16}/></summary>
    {s.history.filter(m=>m.age===age).map((m,i)=><article className="album-memory" key={m.kind+m.id+i}><Icon name={m.kind==="year"?"wallet":m.kind==="action"?"clock":"journal"} size={17}/><div><h3>{m.title[l]}</h3><p>{m.text[l]}</p>{m.cashDelta!==0&&<small>{m.cashDelta>0?"+":""}{money(m.cashDelta,l)}</small>}</div></article>)}</details>)}</div>;
}
export function Album({s,archive,l,...menu}:MenuControls & {s:GameState;archive:GameState[];l:Language}) {
  const [selected,setSelected]=useState<number|null>(null);
  const active=selected===null?s:archive[selected]||s;
  return <><header className="page-head"><p className="section-kicker"><Icon name="album"/>{copy(l,"Лични спомени","Personal memories")}</p><MenuTitle {...menu}><h1>{copy(l,"Албум","Album")}</h1></MenuTitle><p>{copy(l,"Решенията, срещите и сметките, които останаха в дневника.","The choices, encounters and bills that made it into the journal.")}</p></header>
    {archive.length>0&&<div className="runs"><button className={selected===null?"selected":""} onClick={()=>setSelected(null)}><LifePortrait life={s} region="badge" className="run-portrait"/>{copy(l,"Текущ живот","Current life")}</button>{archive.map((run,i)=><button className={i===selected?"selected":""} key={i} onClick={()=>setSelected(i)}><LifePortrait life={run} region="badge" className="run-portrait"/>{copy(l,"Живот ","Life ")}{i+1} · {town(run.city,l)}</button>)}</div>}
    <Pages key={selected??"current"} s={active} l={l}/></>;
}

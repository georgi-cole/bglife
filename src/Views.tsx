import React, {useState} from "react";
import {art} from "../scripts/art";
import {personProfiles,placeProfiles} from "./story.ts";
import type {City,GameState,PersonId} from "./engine.ts";
import type {Language} from "./session.ts";
import {Icon,ageLabel,copy,money,town} from "./ui.tsx";

export function People({s,l}:{s:GameState;l:Language}) {
  return <><header className="page-head"><p className="section-kicker"><Icon name="people"/>{copy(l,"Кръгът на Мила","Mila’s circle")}</p><h1>{copy(l,"Хора","People")}</h1></header>
    <div className="panel-grid">{(Object.keys(personProfiles) as PersonId[]).map((id,i)=>{
      const p=personProfiles[id],mem=s.history.filter(m=>m.person===id).slice().reverse();
      return <article className="detail-card person-card" key={id}><div className="profile-head"><span className={"avatar colour-"+i}>{p.name[l].split(" ").slice(-1)[0][0]}</span><div><small>{p.role[l]} · {town(p.city,l)}</small><h2>{p.name[l]}</h2></div></div>
      <p>{p.detail[l]}</p><div className="relation-evidence"><Icon name="key" size={16}/>{s.trust[id]>=70?copy(l,"Много доверие","Strong trust"):s.trust[id]>=50?copy(l,"Разчита на теб","Counts on you"):s.trust[id]>=35?copy(l,"Опознавате се","Getting to know you"):copy(l,"Има дистанция","Keeping some distance")}</div>
      {mem.length>0&&<details className="mem-details"><summary>{copy(l,"Спомени с Мила","Memories with Mila")} <span>{mem.length}</span></summary>{mem.map(m=><div className="small-memory" key={m.age+m.kind+m.id}><small>{ageLabel(m.age,l)}</small><p>{m.text[l]}</p></div>)}</details>}</article>;
    })}</div></>;
}
export function Places({s,l}:{s:GameState;l:Language}) {
  return <><header className="page-head"><p className="section-kicker"><Icon name="places"/>{copy(l,"По картата","On the map")}</p><h1>{copy(l,"Места","Places")}</h1><p>{s.age<19?copy(l,"На 19 ще решиш къде да живееш. Дотогава тук можеш да разгледаш двата града.","At nineteen you’ll decide where to live. Until then, get to know the two places in this chapter."):copy(l,"Двата града пазят различни части от историята ти.","These two places hold different parts of your story.")}</p></header>
    <div className="panel-grid">{(["tryavna","sofia"] as City[]).map(id=>{const p=placeProfiles[id];return <article className="detail-card place-card" key={id}><img src={art[id]} alt=""/><div className="place-card-content"><p className="section-kicker"><Icon name={s.city===id?"home":"pin"}/>{s.city===id?copy(l,"Тук живееш","Your home"):copy(l,"В тази глава","In this chapter")}</p><h2>{p.name[l]}</h2><p>{p.detail[l]}</p><ul>{p.venues.map(v=><li key={v.en}>{v[l]}</li>)}</ul></div></article>})}</div></>;
}

function Pages({s,l}:{s:GameState;l:Language}) {
  const years=[...new Set(s.history.map(m=>m.age))].reverse();
  if(!years.length)return <div className="detail-card"><Icon name="journal"/><h2>{copy(l,"Първата празна страница","The first blank page")}</h2><p>{copy(l,"Първото ти решение ще се появи тук.","Your first decision will appear here.")}</p></div>;
  return <div className="album-pages">{years.map((age,index)=><details className="detail-card year-page" key={age} open={index===0||undefined}><summary><span>{ageLabel(age,l)}</span><strong>{s.history.find(m=>m.age===age&&m.kind==="choice")?.title[l]}</strong><Icon name="down" size={16}/></summary>
    {s.history.filter(m=>m.age===age).map((m,i)=><article className="album-memory" key={m.kind+m.id+i}><Icon name={m.kind==="year"?"wallet":m.kind==="action"?"clock":"journal"} size={17}/><div><h3>{m.title[l]}</h3><p>{m.text[l]}</p>{m.cashDelta!==0&&<small>{m.cashDelta>0?"+":""}{money(m.cashDelta,l)}</small>}</div></article>)}</details>)}</div>;
}
export function Album({s,archive,l}:{s:GameState;archive:GameState[];l:Language}) {
  const [selected,setSelected]=useState<number|null>(null);
  const active=selected===null?s:archive[selected]||s;
  return <><header className="page-head"><p className="section-kicker"><Icon name="album"/>{copy(l,"Лични спомени","Personal memories")}</p><h1>{copy(l,"Албумът на Мила","Mila’s album")}</h1><p>{copy(l,"Решенията, срещите и сметките, които останаха в дневника.","The choices, encounters and bills that made it into the journal.")}</p></header>
    {archive.length>0&&<div className="runs"><button className={selected===null?"selected":""} onClick={()=>setSelected(null)}>{copy(l,"Текущ живот","Current life")}</button>{archive.map((run,i)=><button className={i===selected?"selected":""} key={i} onClick={()=>setSelected(i)}>{copy(l,"Живот ","Life ")}{i+1} · {town(run.city,l)}</button>)}</div>}
    <Pages key={selected??"current"} s={active} l={l}/></>;
}

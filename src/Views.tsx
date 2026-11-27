import React, {useState} from "react";
import {art} from "../scripts/art";
import {placeProfiles} from "./story.ts";
import {hasStartedLife,moveBlocker,movingCost,type City,type GameState} from "./engine.ts";
import {cities,cityArt} from "./cities.ts";
import {CityPicker} from "./CityPicker.tsx";
import {cityCulture,voices} from "./cityCulture.ts";
import {cityEvents, cityPlaces, occasionDate} from "./cityLife.ts";
import {cityLifeData} from "./cityLifeData/index.ts";
import {cityLifeSources, climates} from "./cityLifeModel.ts";
import {pathCities} from "./pathCatalog.ts";
import type {Language} from "./session.ts";
import {LifePortrait} from "./AvatarPortrait.tsx";
import {Icon,MenuTitle,ageLabel,copy,money,town} from "./ui.tsx";

type MenuControls = {onClose:()=>void;closeLabel:string;back?:boolean};

export function Places({s,l,onHolidays,onMove,...menu}: MenuControls & {
  s: GameState; l: Language; onHolidays: () => void; onMove: (city: City) => void;
}) {
  const [selected, setSelected] = useState(s.city);
  const profile = cities[selected];
  const artId = cityArt(selected);
  const place = artId && placeProfiles[artId];
  const culture = cityCulture[selected];
  const path = pathCities[selected];
  const voice = voices[culture.voice];
  const local = cityLifeData[selected];
  const population = new Intl.NumberFormat(l === "bg" ? "bg-BG" : "en-GB").format(local.population);
  const populationYear = cityLifeSources.population.date.slice(0, 4);
  const atHome = s.city === selected;
  const blocked = moveBlocker(s, selected);
  const t = (bg: string, en: string) => copy(l, bg, en);
  return <>
    <header className="page-head"><MenuTitle {...menu}><h1>{t("Места", "Places")}</h1></MenuTitle></header>
    <div className="places-controls">
      <div className="city-field">
        <label htmlFor="places-city">{t("Град", "City")}</label>
        <CityPicker id="places-city" city={selected} language={l} onChange={setSelected}/>
      </div>
      <button className="secondary-button" onClick={onHolidays}><Icon name="places" size={17}/>{t("Почивки", "Holidays")}</button>
    </div>
    <article className="detail-card place-card places-card">
      {artId ? <img src={art[artId]} alt=""/> : <div className="place-landscape" data-landscape={profile.landscape} aria-hidden="true"><Icon name="pin" size={26}/></div>}
      <div className="place-card-content">
        {atHome && <p className="section-kicker"><Icon name="home"/>{t("Тук живееш", "Your home")}</p>}
        <h2>{profile.name[l]}</h2>
        {place ? <><p>{place.detail[l]}</p><ul>{place.venues.map(venue => <li key={venue.en}>{venue[l]}</li>)}</ul></>
          : <p>{profile.landmark[l]}</p>}
        {s.lifeSystems.bank.ownsHome && selected === (s.lifeSystems.bank.homeCity ?? "tryavna") && <p className="relation-evidence"><Icon name="home" size={16}/>{t("Притежаваш жилище тук", "You own a home here")}</p>}
        {!atHome && !s.finished && <div className="place-move">
          {s.age < 18 ? <p>{blocked?.[l]}</p> : <>
            <button className="primary-button" type="button" disabled={!!blocked} onClick={() => onMove(selected)}>
              {t("Премести се", "Move here")}{movingCost(s) > 0 && " · " + money(movingCost(s), l)}<Icon name="right" size={17}/>
            </button>
            {blocked && <p>{blocked[l]}</p>}
          </>}
        </div>}
      </div>
    </article>
    <details className="detail-card city-details" open>
      <summary><Icon name="places" size={17}/>{t("Места и местен живот","Places and local life")}</summary>
      <div className="city-details-body">
        <ul>{cityPlaces(selected).map(point => <li key={point.en}>{point[l]}</li>)}</ul>
        <dl>
          <div><dt>{t("Население на града · НСИ","City population · NSI")} {populationYear}</dt><dd>{population}</dd></div>
          <div><dt>{t("Климат в играта","In-game climate")}</dt><dd>{climates[local.climate].label[l]}</dd></div>
          {cityEvents(selected).map(event => event.months && event.source && !event.retired &&
            <div key={event.id}><dt>{occasionDate({months:event.months,day:event.day},l)}</dt><dd>{event.title[l]}</dd></div>)}
          <div><dt>{t("На масата","At the table")}</dt><dd>{culture.food[l]}</dd></div>
          <div><dt>{t("Всекидневие","Everyday life")}</dt><dd>{culture.habit[l]}</dd></div>
          <div><dt>{t("Облик на града","City character")}</dt><dd>{culture.style[l]}</dd></div>
          <div><dt>{t("Говор","Speech")}</dt><dd>{voice.region[l]}<p className="city-speech-sample">{local.childhood.line[l]}</p></dd></div>
        </dl>
      </div>
    </details>
    <details className="detail-card city-details">
      <summary><Icon name="journal" size={17}/>{t("Училища и специалности","Schools and courses")}</summary>
      <div className="city-details-body">
        <div className="city-school-list"><h3>{t("Начало на училище","Starting school")}</h3><ul>
          {path.schools.filter(school=>school.primary).map(school=><li key={school.id}><strong>{school.name[l]}</strong><small>{path.zones[school.zone][l]}</small></li>)}
        </ul></div>
        <div className="city-school-list"><h3>{t("След VII клас","Secondary school")}</h3><ul>
          {path.schools.filter(school=>school.admission).map(school=><li key={school.id}><strong>{school.name[l]}</strong><small>{school.profile?.[l]}</small></li>)}
        </ul></div>
        {path.programs.length>0&&<div className="city-school-list"><h3>{t("Висше образование","Higher education")}</h3><ul>
          {path.programs.map(program=><li key={program.id}><strong>{program.institution[l]}</strong><small>{program.title[l]}</small></li>)}
        </ul></div>}
      </div>
    </details>
    <details className="detail-card city-details">
      <summary><Icon name="bag" size={17}/>{t("Работа в града","Local jobs")}</summary>
      <div className="city-details-body">
        <ul>{path.jobs.map(job => <li key={job.id}>{job.title[l]}</li>)}</ul>
      </div>
    </details>
  </>;
}

function Pages({s,l}:{s:GameState;l:Language}) {
  const years=hasStartedLife(s)?[...new Set(s.history.map(m=>m.age))].reverse():[];
  if(!years.length)return <div className="detail-card"><Icon name="journal"/><h2>{copy(l,"Първата празна страница","The first blank page")}</h2><p>{copy(l,"Първото ти решение ще се появи тук.","Your first decision will appear here.")}</p></div>;
  return <div className="album-pages">{years.map((age,index)=><details className="detail-card year-page" key={age} open={index===0||undefined}><summary><span>{ageLabel(age,l)}</span><strong>{s.history.find(m=>m.age===age&&(m.kind==="choice"||m.kind==="event"))?.title[l]}</strong><Icon name="down" size={16}/></summary>
    {s.history.filter(m=>m.age===age).map((m,i)=><article className="album-memory" key={m.kind+m.id+i}><Icon name={m.kind==="year"?"wallet":m.kind==="action"?"clock":"journal"} size={17}/><div><h3>{m.title[l]}</h3><p>{m.text[l]}</p>{m.cashDelta!==0&&<small>{m.cashDelta>0?"+":""}{money(m.cashDelta,l)}</small>}</div></article>)}</details>)}</div>;
}
export function Album({s,archive,l,...menu}:MenuControls & {s:GameState;archive:GameState[];l:Language}) {
  const [selected,setSelected]=useState<number|null>(null);
  const active=selected===null?s:archive[selected]||s;
  return <><header className="page-head"><p className="section-kicker"><Icon name="album"/>{copy(l,"Лични спомени","Personal memories")}</p><MenuTitle {...menu}><h1>{copy(l,"Албум","Album")}</h1></MenuTitle><p>{copy(l,"Решенията, срещите и сметките, които останаха в дневника.","The choices, encounters and bills that made it into the journal.")}</p></header>
    {archive.length>0&&<div className="runs"><button className={selected===null?"selected":""} onClick={()=>setSelected(null)}><LifePortrait life={s} region="badge" className="run-portrait"/>{copy(l,"Текущ живот","Current life")}</button>{archive.map((run,i)=><button className={i===selected?"selected":""} key={i} onClick={()=>setSelected(i)}><LifePortrait life={run} region="badge" className="run-portrait"/>{copy(l,"Живот ","Life ")}{i+1} · {town(run.city,l)}</button>)}</div>}
    <Pages key={selected??"current"} s={active} l={l}/></>;
}

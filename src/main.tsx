import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {choose,defaultPlayChoice,doAction,newLife,playYear,yearRecap,type GameState} from "./engine.ts";
import {Album,People,Places} from "./Views.tsx";
import {Journal,Recap,Wallet} from "./Journal.tsx";
import {Icon,PlaySymbol,copy,tabLabels,type Tab} from "./ui.tsx";
import {deserialize,initialLanguage,LANGUAGE_KEY,loadSession,persist,SAVE_KEY,serialize,type Session} from "./session.ts";
import "./style.css";

type Dialog="wallet"|"settings"|"replay"|"recap"|null;
function App(){
  const [first]=useState(loadSession),[session,setSession]=useState(first.session),[notice,setNotice]=useState(first.notice);
  const [l,setLanguage]=useState(initialLanguage),[tab,setTab]=useState<Tab>("journal"),[dialog,setDialog]=useState<Dialog>(null);
  const [recapAge,setRecapAge]=useState<number|null>(null);
  const live=useRef(session),dialogRef=useRef<HTMLDialogElement>(null);
  const viewportRef=useRef<HTMLDivElement>(null);
  const s=session.life,t=(bg:string,en:string)=>copy(l,bg,en);
  const labels=tabLabels(l);
  function commit(next:Session){
    live.current=next;setSession(next);
    if(!persist(next))setNotice("temporary");
  }
  useEffect(()=>{
    if(!persist(live.current))setNotice("temporary");
    function sync(e:StorageEvent){
      if(e.key===SAVE_KEY&&e.newValue){const saved=deserialize(e.newValue);if(saved){live.current=saved;setSession(saved);}}
      if(e.key===LANGUAGE_KEY&&(e.newValue==="bg"||e.newValue==="en"))setLanguage(e.newValue);
    }
    window.addEventListener("storage",sync);return ()=>window.removeEventListener("storage",sync);
  },[]);
  useEffect(()=>{document.documentElement.lang=l;document.title="BgLife · "+t("Животът на Мила","Mila’s life");},[l]);
  useEffect(()=>{
    if(!dialog||!dialogRef.current)return;
    const d=dialogRef.current;d.showModal();
    return ()=>{if(d.open)d.close()};
  },[dialog]);
  function setLocale(){
    const next=l==="bg"?"en":"bg";setLanguage(next);
    try{localStorage.setItem(LANGUAGE_KEY,next)}catch{/* In-memory language still works. */}
  }
  function route(which:Tab){setTab(which);viewportRef.current?.scrollTo(0,0);}
  function act(fn:(v:GameState)=>GameState){
    const current=live.current;
    if(current.life!==s)return;
    const updated=fn(current.life);
    if(updated!==current.life)commit({...current,life:updated});
  }
  function nextYear(){
    const current=live.current;
    if(current.life!==s)return;
    if(s.finished){setDialog("replay");return;}
    const next=playYear(s);
    if(next===s){
      route("journal");
      requestAnimationFrame(()=>document.getElementById("scene-heading")?.focus());
      return;
    }
    commit({...current,life:next});
    setRecapAge(s.age);
    setDialog("recap");
    route("journal");
  }
  function replay(){
    const current=live.current;
    commit({life:newLife(),album:current.life.history.length?[...current.album,current.life]:current.album});
    setDialog(null);route("journal");
  }
  function exportSave(){
    const b=new Blob([serialize(live.current)],{type:"application/json"});
    const url=URL.createObjectURL(b),a=document.createElement("a");a.href=url;a.download="BgLife-save.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  const [importMessage,setImportMessage]=useState<"invalid"|"ready"|null>(null);
  const importRef=useRef<Session|null>(null);
  function close(){setDialog(null);setImportMessage(null);importRef.current=null}
  function importBackup(){
    if(!importRef.current)return;
    const current=live.current,restored=importRef.current;
    const histories=new Map<string,GameState>();
    for(const v of [...current.album,...restored.album,...(current.life.history.length?[current.life]:[])]){
      const key=v.seed+"-"+JSON.stringify(v.commands);
      if(v.seed!==restored.life.seed||JSON.stringify(v.commands)!==JSON.stringify(restored.life.commands))histories.set(key,v);
    }
    commit({life:restored.life,album:[...histories.values()]});close();route("journal");
  }
  const recap = recapAge === null ? null : yearRecap(s, recapAge);
  const fallback = defaultPlayChoice(s);
  const playLabel = s.finished ? t("Нов живот","New life") : t("Следваща година","Next year");
  function navItem(k:Tab) {
    return <button data-tab={k} className="nav-item" aria-current={tab===k?"page":undefined} onClick={()=>route(k)}><Icon name={k}/><span>{labels[k]}</span></button>;
  }
  return <div className="app-shell">
    <header className="masthead"><div className="masthead-inner">
      <button className="wordmark" aria-label={t("BgLife – към дневника","BgLife – open journal")} onClick={()=>route("journal")}><span>Bg<i>Life</i></span></button>
      <div className="masthead-actions"><button className="lang-button" data-testid="language" onClick={setLocale} aria-label={t("Switch to English","Премини на български")}>{l==="bg"?"EN":"БГ"}</button><button className="icon-button" data-testid="settings" onClick={()=>setDialog("settings")} aria-label={t("Настройки","Settings")}><Icon name="settings"/></button></div>
    </div></header>
    {notice&&<div className="save-notice" role="status"><span>{notice==="temporary"?t("Браузърът не запази играта. Можеш да изтеглиш копие от Настройки.","This browser couldn’t save your game. Download a backup in Settings."):notice==="recovered"?t("Дневникът е възстановен от предишния запис.","Your journal was restored from its previous save."):t("Предишният запис е повреден. Започваш нова глава.","The previous save was damaged. A new chapter has begun.")}</span><button aria-label={t("Затвори","Dismiss")} onClick={()=>setNotice(null)}><Icon name="close" size={16}/></button></div>}
    <div className="game-layout" ref={viewportRef}><main className="main-column" id="main">
      {tab==="journal"?<Journal s={s} l={l} onChoice={id=>act(v=>choose(v,id,s.age))} onAction={id=>act(v=>doAction(v,id,s.age))} onWallet={()=>setDialog("wallet")} onAlbum={()=>route("album")} onReplay={()=>setDialog("replay")}/>:
       tab==="people"?<People s={s} l={l}/>:tab==="places"?<Places s={s} l={l}/>:<Album s={s} archive={session.album} l={l}/>}
    </main></div>
    <nav className="bottom-nav" aria-label={t("Навигация","Navigation")}>
      <div className="nav-inner">
        {navItem("journal")}{navItem("people")}
        <button className="play-control" data-testid="advance" onClick={nextYear}
          aria-label={fallback && tab!=="journal" ? playLabel + ". " + fallback.label[l] : playLabel}
          title={fallback ? playLabel + " · " + fallback.label[l] : playLabel}
          aria-describedby={fallback && tab==="journal" ? "play-default" : undefined}>
          <span className="play-face" aria-hidden="true"><PlaySymbol/></span><span>{s.finished ? playLabel : "+1 " + t("година","year")}</span>
        </button>
        {navItem("places")}{navItem("album")}
      </div>
    </nav>
    {dialog&&<dialog key={dialog} ref={dialogRef} className={"modal-card"+(dialog==="recap"?" recap-dialog":"")} onCancel={close} aria-labelledby="dialog-heading" onClick={e=>{if(e.target===e.currentTarget){const b=e.currentTarget.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close()}}}><div className="dialog-head"><h2 id="dialog-heading">{dialog==="recap"?t("Твоята година","Your year in review"):dialog==="wallet"?t("Портфейл","Wallet"):dialog==="settings"?t("Настройки","Settings"):t("Нов живот","Another life")}</h2><button className="icon-button" aria-label={t("Затвори","Close")} onClick={close}><Icon name="close"/></button></div>
      {dialog==="recap"&&recap?<Recap s={s} l={l} recap={recap} onContinue={close}/>:dialog==="wallet"?<Wallet s={s} l={l}/>:dialog==="replay"?<><p>{t("Започваш отново на 16 в Трявна. Написаните страници от този живот ще останат в албума.","Start again at sixteen in Tryavna. The pages from this life will stay in your album.")}</p><div className="dialog-actions"><button className="secondary-button" onClick={close}>{t("Назад","Back")}</button><button className="primary-button" data-testid="confirm-replay" onClick={replay}>{t("Започни отначало","Start again")}</button></div></>:
      <div className="settings-list"><button onClick={setLocale}>{t("Език","Language")}<strong>{l==="bg"?"Български → English":"English → Български"}</strong></button>
      <button onClick={exportSave}>{t("Изтегли резервно копие","Download a backup")}<Icon name="down"/></button>
      <label className="import-label">{t("Възстанови от файл","Restore from a file")}<input type="file" accept=".json,application/json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const value=file.size<5_000_000?deserialize(await file.text()):null;importRef.current=value;setImportMessage(value?"ready":"invalid")}catch{setImportMessage("invalid")}e.target.value=""}}/></label>
      {importMessage==="ready"&&<><p>{t("Текущият живот ще остане в албума.","Your current life will stay in the album.")}</p><button className="secondary-button" onClick={importBackup}>{t("Възстанови избрания запис","Restore selected save")}</button></>}
      {importMessage==="invalid"&&<p role="alert">{t("Този файл не е съвместим запис на BgLife.","This file is not a compatible BgLife save.")}</p>}
      <button data-testid="replay" onClick={()=>{setDialog("replay");setImportMessage(null);importRef.current=null}}>{t("Започни друг живот","Start another life")}<Icon name="right"/></button></div>}
    </dialog>}
  </div>;
}
const root=document.getElementById("root");
if(root)createRoot(root).render(<App/>);

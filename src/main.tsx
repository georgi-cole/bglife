import React,{useCallback,useEffect,useLayoutEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {choose,defaultPlayChoice,doAction,doLifeActivity,getPersonActivities,giveUp,nameNewborns,hasStartedLife,newProfileLife,playYear,doPathAction,startCareerLife,type City,type GameState,type LifeActivityCategory,type LifeActivityOption} from "./engine.ts";
import {Album,Places} from "./Views.tsx";
import {Career} from "./Career.tsx";
import {isSchoolAge} from "./lifePath.ts";
import {BirthNamingDialog} from "./BirthNamingDialog.tsx";
import type {SurnameSource} from "./reproduction.ts";
import {People} from "./People.tsx";
import {BgLifeMark,PersonActionDialog,type PersonActionFlow} from "./PersonActionDialog.tsx";
import {personRelationship,type PeopleId} from "./peopleIdentity.ts";
import {Journal,Wallet} from "./Journal.tsx";
import {More,StatsBars} from "./More.tsx";
import {Icon,MenuTitle,NavigationButton,PlaySymbol,copy,lifeName,lifeOccupation,money,tabLabels,type Tab} from "./ui.tsx";
import {deserialize,initialLanguage,initialTrialVip,LANGUAGE_KEY,loadSession,persist,restoreSession,SAVE_KEY,serialize,VIP_TRIAL_KEY,type Session} from "./session.ts";
import "./style.css";
import {HomeHub,StartGuide} from "./HomeHub.tsx";
import {AvatarCreator} from "./AvatarCreator.tsx";
import {LifePortrait} from "./AvatarPortrait.tsx";
import type {NewLifeDraft} from "./lifeProfile.ts";

type Dialog="wallet"|"settings"|"replay"|"guide"|"give-up"|null;
type Screen = "home" | "game" | "album" | "avatar";
type MoreParent = "journal" | "people" | "places" | "wallet";
type LogPosition = {age: number; focus?: boolean; activityId?: string};

function lastLogPosition(life: GameState): LogPosition | null {
  const last = life.history.at(-1);
  return last ? {age: last.age} : null;
}

function scrollToLog(position: LogPosition) {
  const entry = position.activityId ? document.getElementById("life-event-" + position.age + "-" + position.activityId) : null;
  const heading = entry ?? document.getElementById("life-year-" + position.age);
  heading?.scrollIntoView({block:"start"});
  if(position.focus)heading?.focus({preventScroll:true});
}

function CharacterHeader({ life, l, onAvatar }: { life: GameState; l: Parameters<typeof lifeName>[0]; onAvatar?: () => void }) {
  const portrait = <LifePortrait life={life} region="badge"/>;
  return <div className="character-header">
    {onAvatar
      ? <button type="button" className="character-avatar" aria-label={copy(l,"Визия и грижа","Aesthetics")} onClick={onAvatar}>{portrait}</button>
      : <span className="character-avatar">{portrait}</span>}
    <div className="character-identity">
      <div className="character-name">
        <span className="character-flag" role="img" aria-label={copy(l,"България","Bulgaria")}/>
        <strong>{lifeName(l,life)}</strong>
      </div>
      <span className="character-occupation">{lifeOccupation(life,l)}</span>
    </div>
    <div className="character-money">
      <strong>{money(life.cash,l)}</strong>
      <span>{copy(l,"Налични пари","Cash balance")}</span>
    </div>
  </div>;
}

function App(){
  const [first]=useState(loadSession),[session,setSession]=useState(first.session),[notice,setNotice]=useState(first.notice);
  const [l,setLanguage]=useState(initialLanguage),[tab,setTab]=useState<Tab>("journal"),[dialog,setDialog]=useState<Dialog>(null);
  const [screen,setScreen]=useState<Screen>("home");
  const [homeIntro,setHomeIntro]=useState(()=>!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const finishHomeIntro=useCallback(()=>setHomeIntro(false),[]);
  const [vip,setVip]=useState(initialTrialVip);
  const [moreMenu,setMoreMenu]=useState<{category:LifeActivityCategory|null;parent:MoreParent;version:number}>({category:null,parent:"journal",version:0});
  const [albumFromMore,setAlbumFromMore]=useState(false);
  const [slideMenu,setSlideMenu]=useState(false);
  const [personAction,setPersonAction]=useState<PersonActionFlow|null>(null);
  const live=useRef(session),dialogRef=useRef<HTMLDialogElement>(null);
  const viewportRef=useRef<HTMLDivElement>(null);
  const mainRef=useRef<HTMLElement>(null);
  const focusScreen=useRef(false);
  const avatarOrigin=useRef<"home"|"game">("home");
  const endTarget=useRef<GameState|null>(null);
  const nextLogPosition=useRef<LogPosition|null>(null);
  const s=session.life,t=(bg:string,en:string)=>copy(l,bg,en);
  const labels=tabLabels(l,s.age);
  const menuDialog=dialog==="wallet"||dialog==="settings"||dialog==="guide";
  const showJournal=screen==="game"&&tab==="journal";
  const showNav=screen==="game"&&(tab==="journal"||tab==="career");
  const dialogTitle=dialog==="wallet"?t("Портфейл","Wallet"):dialog==="settings"?t("Настройки","Settings"):dialog==="guide"?t("Как се играе","How to play"):dialog==="give-up"?t("Приключване на живота","End this life"):t("Нов живот","New life");
  function commit(next:Session){
    live.current=next;setSession(next);
    if(!persist(next))setNotice("temporary");
  }
  useEffect(()=>{
    if(!persist(live.current))setNotice("temporary");
    function sync(e:StorageEvent){
      if(e.key===SAVE_KEY&&e.newValue){const saved=deserialize(e.newValue);if(saved){
        const next={...saved,life:startCareerLife(saved.life)};live.current=next;setSession(next);
      }}
      if(e.key===LANGUAGE_KEY&&(e.newValue==="bg"||e.newValue==="en"))setLanguage(e.newValue);
    }
    window.addEventListener("storage",sync);return ()=>window.removeEventListener("storage",sync);
  },[]);
  useEffect(()=>{
    document.documentElement.lang=l;
    if(screen==="game")document.title="BgLife · "+lifeName(l,s);
    else if(screen==="album")document.title="BgLife · "+t("Албум","Album");
    else if(screen==="avatar")document.title="BgLife · "+t("Създай аватар","Create avatar");
    else document.title="BgLife";
  },[l,screen,s]);
  useLayoutEffect(()=>{
    const position=nextLogPosition.current;
    if(focusScreen.current){
      focusScreen.current=false;
      const viewport=viewportRef.current;
      if(viewport)viewport.scrollTop=0;
      if(!position?.focus)mainRef.current?.focus({preventScroll:true});
    }
    if(screen==="game"&&tab==="journal"&&position){
      nextLogPosition.current=null;
      scrollToLog(position);
    }
  },[s,tab,screen]);
  useEffect(()=>{
    if(!dialog||!dialogRef.current)return;
    const d=dialogRef.current;d.showModal();
    return ()=>{if(d.open)d.close()};
  },[dialog]);
  function setLocale(){
    const next=l==="bg"?"en":"bg";setLanguage(next);
    try{localStorage.setItem(LANGUAGE_KEY,next)}catch{/* In-memory language still works. */}
  }
  function openMenuScreen(which:"home"|"album"){
    if(screen===which)return;
    nextLogPosition.current=null;
    focusScreen.current=true;
    setScreen(which);
  }
  function openJournal(life:GameState,currentYear=false,activityId?:string){
    const position = !life.commands.length ? null : currentYear ? {age:life.age} : lastLogPosition(life);
    nextLogPosition.current=position && {...position,focus:true,activityId};
    focusScreen.current=true;
    setTab("journal");
    setScreen("game");
  }
  function startLife(){
    if(hasStartedLife(live.current.life))setDialog("replay");
    else openAvatarCreator();
  }
  function openAvatarCreator(){
    avatarOrigin.current=screen==="game"?"game":"home";
    nextLogPosition.current=null;
    focusScreen.current=true;
    close();
    setScreen("avatar");
  }
  function cancelAvatarCreator(){
    if(avatarOrigin.current==="game"&&tab==="journal"){
      openJournal(live.current.life);
      return;
    }
    focusScreen.current=true;
    setScreen(avatarOrigin.current);
  }
  function route(which:Tab){
    const position=which==="journal"?lastLogPosition(live.current.life):null;
    if(tab===which){
      if(position)scrollToLog(position);
      return;
    }
    setSlideMenu(tab==="journal"&&(which==="people"||which==="places"||which==="more"));
    nextLogPosition.current=position;
    focusScreen.current=true;
    setTab(which);
  }
  function openMore(category:LifeActivityCategory|null=null,parent:MoreParent="journal"){
    setMoreMenu(menu=>({category,parent,version:menu.version+1}));
    route("more");
  }
  function openGameMenu(which:"wallet"|"settings"){
    setSlideMenu(showJournal);
    setDialog(which);
  }
  function backFromCategory(){
    const parent=moreMenu.parent;
    if(parent==="wallet"){
      route("journal");
      setDialog("wallet");
    }else route(parent);
  }
  function openAlbum(fromMore=false){
    setAlbumFromMore(fromMore);
    route("album");
  }
  function requestGiveUp(){
    if(live.current.life.finished)return;
    endTarget.current=live.current.life;
    setDialog("give-up");
  }
  function finishLife(){
    const current=live.current;
    const ended=current.life===endTarget.current ? giveUp(current.life,current.life.age) : current.life;
    close();
    if(ended===current.life)return;
    commit({...current,life:ended});
    openJournal(ended);
  }
  function openPersonAction(contact:PeopleId,options:LifeActivityOption[]){
    const firstOption=options[0];
    if(!firstOption)return;
    setPersonAction({contact,seed:s.seed,age:s.age,ids:options.map(option=>option.id),branch:firstOption.branch,
      selected:firstOption.branch?null:firstOption.id,outcome:null});
  }
  function confirmPersonAction(){
    const current=live.current;
    if(!personAction||personAction.outcome||!personAction.selected||current.life!==s
      ||s.seed!==personAction.seed||s.age!==personAction.age)return;
    const option=getPersonActivities(s,personAction.contact).find(choice=>choice.id===personAction.selected);
    if(!option||option.blocked)return;
    const updated=doLifeActivity(s,option.id,s.age);
    const entry=updated.history.at(-1);
    if(updated===s||!entry)return;
    const before=personRelationship(s,personAction.contact),after=personRelationship(updated,personAction.contact);
    setPersonAction({...personAction,outcome:{entry,relationDelta:before!==null&&after!==null?after-before:null}});
    commit({...current,life:updated});
    openJournal(updated,true,entry.id);
  }
  function closePersonAction(){
    const entry=personAction?.outcome?.entry;
    setPersonAction(null);
    if(entry)requestAnimationFrame(()=>scrollToLog({age:entry.age,activityId:entry.id,focus:true}));
  }
  function act(fn:(v:GameState)=>GameState){
    const current=live.current;
    if(current.life!==s)return;
    const updated=fn(current.life);
    if(updated!==current.life){
      const entry=updated.history.at(-1);
      if(entry?.kind==="choice")nextLogPosition.current={age:entry.age,focus:true};
      commit({...current,life:updated});
    }
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
    const latestEvent = next.history.slice(s.history.length).filter(entry => entry.kind === "event" || entry.kind === "end" || entry.kind === "path").at(-1);
    nextLogPosition.current={age:latestEvent?.age ?? next.age,focus:true};
    commit({...current,life:next});
    setTab("journal");
  }
  function saveBabyNames(names:string[],surname:SurnameSource){
    const current=live.current;
    if(current.life!==s)return;
    const updated=nameNewborns(s,names,surname,s.age);
    if(updated===s)return;
    commit({...current,life:updated});
    openJournal(updated,true);
  }
  function relocate(city: City) {
    const current = live.current;
    if (current.life !== s) return;
    const next = doAction(s, "move." + city);
    if (next === s) return;
    commit({ ...current, life: next });
    openJournal(next, true);
  }
  function toggleTrialVip() {
    const active = !vip;
    setVip(active);
    try { localStorage.setItem(VIP_TRIAL_KEY, active ? "on" : "off"); } catch { /* The preview still works in memory. */ }
  }
  function startWithAvatar(draft:NewLifeDraft) {
    const current = live.current;
    const life = startCareerLife(newProfileLife(draft));
    commit({ life, album: hasStartedLife(current.life) ? [...current.album, current.life] : current.album });
    openJournal(life, true);
  }
  function exportSave(){
    const b=new Blob([serialize(live.current)],{type:"application/json"});
    const url=URL.createObjectURL(b),a=document.createElement("a");a.href=url;a.download="BgLife-save.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  const [importMessage,setImportMessage]=useState<"invalid"|"ready"|null>(null);
  const importRef=useRef<Session|null>(null);
  function close(){
    setDialog(null);
    setImportMessage(null);
    importRef.current=null;
    endTarget.current=null;
  }
  function importBackup(){
    if(!importRef.current)return;
    const restored=restoreSession(live.current,importRef.current);
    commit(restored);
    close();
    openJournal(restored.life);
  }
  const fallback = defaultPlayChoice(s);
  const playLabel = s.finished ? t("Нов живот","New life") : t("Следваща година","Next year");
  function navItem(k:Tab) {
    const icon = k==="career" ? isSchoolAge(s.age) ? "school" : "bag" : k;
    return <button data-tab={k} className="nav-item" aria-current={tab===k?"page":undefined} onClick={()=>k==="more"?openMore():route(k)}><Icon name={icon}/><span>{labels[k]}</span></button>;
  }
  const closeLabel=screen==="album"?t("Към менюто","Back to main menu"):t("Към дневника","Back to journal");
  const closeMenu=()=>screen==="album"?openMenuScreen("home"):openJournal(live.current.life);
  const menuProps={onClose:closeMenu,closeLabel};
  const albumMenu=albumFromMore
    ? {onClose:()=>openMore(),closeLabel:t("Назад към Още","Back to More"),back:true}
    : {...menuProps,back:true};
  const categoryBackLabel={
    people:t("Назад към Хора","Back to People"),
    places:t("Назад към Места","Back to Places"),
    wallet:t("Назад към портфейла","Back to Wallet"),
    journal:t("Назад към дневника","Back to journal"),
  }[moreMenu.parent];
  const toolbar = <div className="masthead-actions">
    <button className="lang-button" data-testid="language" onClick={setLocale} aria-label={t("Switch to English","Премини на български")}>{l==="bg"?"EN":"БГ"}</button>
    <button className="icon-button" data-testid="settings" onClick={()=>openGameMenu("settings")} aria-label={t("Настройки","Settings")}><Icon name="settings"/></button>
  </div>;
  return <div className={screen==="home"?"app-shell app-shell--home":"app-shell"}>
    {(screen==="game"||screen==="album")&&<header className="masthead"><CharacterHeader life={s} l={l}
      onAvatar={showJournal&&!s.finished?()=>openMore("aesthetics"):undefined}/></header>}
    {notice&&<div className="save-notice" role="status"><span>{notice==="temporary"?t("Браузърът не запази играта. Можеш да изтеглиш копие от Настройки.","This browser couldn’t save your game. Download a backup in Settings."):notice==="recovered"?t("Дневникът е възстановен от предишния запис.","Your journal was restored from its previous save."):t("Предишният запис е повреден. Започваш нова глава.","The previous save was damaged. A new chapter has begun.")}</span><NavigationButton label={t("Затвори","Dismiss")} onClick={()=>setNotice(null)}/></div>}
    <div className={screen==="avatar"?"game-layout avatar-layout":screen==="game"?(tab==="more"||tab==="people"?"game-layout more-layout":"game-layout"):"game-layout start-layout"} ref={viewportRef}>
      <main className={screen==="home"?"main-column start-column":(showJournal===false&&(tab==="people"||tab==="places")&&screen==="game"&&slideMenu)?"main-column menu-enter":"main-column"} id="main" ref={mainRef} tabIndex={-1}>
      {showJournal&&<div className="life-tools">
        <button className="icon-button menu-button" onClick={()=>openMenuScreen("home")}><Icon name="menu" size={18}/>{t("Меню","Menu")}</button>
        <BgLifeMark/>
        {toolbar}
      </div>}
      {screen==="home"?<HomeHub life={s} l={l} intro={homeIntro} onIntroEnd={finishHomeIntro} onContinue={()=>openJournal(live.current.life)} onNewLife={startLife}
        onAlbum={()=>openMenuScreen("album")} onGuide={()=>setDialog("guide")}>{toolbar}</HomeHub>:
       screen==="avatar"?<AvatarCreator l={l} vip={vip} onVip={toggleTrialVip} onClose={cancelAvatarCreator} onStart={startWithAvatar}/>:
       screen==="album"?<Album {...menuProps} back s={s} archive={session.album} l={l}/>:
       tab==="journal"?<Journal s={s} l={l} onChoice={id=>act(v=>choose(v,id,s.age))} onAction={id=>act(v=>doAction(v,id,s.age))} onWallet={()=>openGameMenu("wallet")} onAlbum={()=>openAlbum()} onReplay={()=>setDialog("replay")} onMore={openMore}/>:
       tab==="career"?<Career s={s} l={l} onClose={closeMenu} onAction={id=>act(v=>doPathAction(v,id,s.age))}/>:
       tab==="people"?<People {...menuProps} s={s} l={l} onFamily={()=>openMore("family","people")} onActivity={openPersonAction}/>:tab==="places"?<Places {...menuProps} s={s} l={l} onHolidays={()=>openMore("holidays","places")} onMove={relocate}/>:
       tab==="more"?<More {...menuProps} key={moreMenu.version} life={s} l={l} initialCategory={moreMenu.category} animateEntry={slideMenu&&moreMenu.category===null}
        onActivity={id=>act(v=>doLifeActivity(v,id,s.age))} onGiveUp={requestGiveUp} onJournal={()=>openJournal(live.current.life,true)} onAlbum={()=>openAlbum(true)}
        onCategoryBack={moreMenu.category?backFromCategory:undefined} categoryBackLabel={categoryBackLabel}/>:
       <Album {...albumMenu} s={s} archive={session.album} l={l}/>}
    </main></div>
    {showNav&&!menuDialog&&<footer className="game-footer"><nav className="bottom-nav" aria-label={t("Навигация","Navigation")}>
      <div className="nav-inner">
        {navItem("career")}{navItem("people")}
        <button className="play-control" data-testid="advance" onClick={nextYear}
          aria-label={fallback && tab!=="journal" ? playLabel + ". " + fallback.label[l] : playLabel}
          title={fallback ? playLabel + " · " + fallback.label[l] : playLabel}
          aria-describedby={fallback && tab==="journal" ? "play-default" : undefined}>
          <span className="play-face" aria-hidden="true"><PlaySymbol/></span><span>{s.finished ? playLabel : "+1 " + t("година","year")}</span>
        </button>
        {navItem("places")}{navItem("more")}
      </div>
    </nav><StatsBars life={s} l={l}/></footer>}
    {screen==="game"&&!dialog&&!personAction&&s.lifeSystems.reproduction.naming&&
      <BirthNamingDialog key={s.seed+"-"+s.age} life={s} birth={s.lifeSystems.reproduction.naming} l={l} onSave={saveBabyNames}/>}
    {personAction&&<PersonActionDialog flow={personAction} life={s} l={l} onClose={closePersonAction}
      onSelect={selected=>setPersonAction({...personAction,selected})} onConfirm={confirmPersonAction}/>}
    {dialog&&<dialog key={dialog} ref={dialogRef} className={menuDialog?"modal-card game-menu-dialog":"modal-card"} onCancel={close} aria-labelledby="dialog-heading" onClick={e=>{if(e.target===e.currentTarget){const b=e.currentTarget.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close()}}}>
      {menuDialog&&screen!=="home"&&<div className="game-menu-profile"><CharacterHeader life={s} l={l}/></div>}
      <div className={menuDialog?(slideMenu&&showJournal?"game-menu-content menu-enter":"game-menu-content"):undefined}>
      {menuDialog?<MenuTitle onClose={close} back={screen==="home"} closeLabel={screen==="home"?t("Назад към менюто","Back to main menu"):t("Затвори","Close")}><h2 id="dialog-heading">{dialogTitle}</h2></MenuTitle>:<div className="dialog-head"><h2 id="dialog-heading">{dialogTitle}</h2><NavigationButton label={t("Затвори","Close")} onClick={close}/></div>}
      {dialog==="wallet"?<Wallet s={s} l={l} onBank={()=>{close();openMore("bank","wallet");}}/>:
      dialog==="guide"?<StartGuide l={l}/>:dialog==="give-up"?<>
        <p>{t("Тази история ще приключи на текущата възраст. Дневникът остава достъпен в албума.","This story will end at the current age. The journal will remain available in the album.")}</p>
        <div className="dialog-actions">
          <button className="secondary-button" autoFocus onClick={close}>{t("Продължи да играеш","Keep playing")}</button>
          <button className="primary-button end-life-confirm" data-testid="confirm-give-up" onClick={finishLife}>{t("Приключи живота","End this life")}</button>
        </div>
      </>:dialog==="replay"?<><p>{t("Избираш нов град на раждане. Страниците от този живот остават в албума.","Choose a birth city for the next life. The pages from this life stay in your album.")}</p><div className="dialog-actions"><button className="secondary-button" onClick={close}>{t("Назад","Back")}</button><button className="primary-button" data-testid="confirm-replay" onClick={openAvatarCreator}>{t("Към новия живот","Set up a new life")}</button></div></>:
      <div className="settings-list"><button onClick={setLocale}>{t("Език","Language")}<strong>{l==="bg"?"Български → English":"English → Български"}</strong></button>
      <button onClick={exportSave}>{t("Изтегли резервно копие","Download a backup")}<Icon name="down"/></button>
      <label className="import-label">{t("Възстанови от файл","Restore from a file")}<input type="file" accept=".json,application/json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const value=file.size<5_000_000?deserialize(await file.text()):null;importRef.current=value;setImportMessage(value?"ready":"invalid")}catch{setImportMessage("invalid")}e.target.value=""}}/></label>
      {importMessage==="ready"&&<><p>{t("Текущият живот ще остане в албума.","Your current life will stay in the album.")}</p><button className="secondary-button" onClick={importBackup}>{t("Възстанови избрания запис","Restore selected save")}</button></>}
      {importMessage==="invalid"&&<p role="alert">{t("Този файл не е съвместим запис на BgLife.","This file is not a compatible BgLife save.")}</p>}
      {screen==="game"&&<button data-testid="replay" onClick={()=>{setDialog("replay");setImportMessage(null);importRef.current=null}}>{t("Започни друг живот","Start another life")}<Icon name="right"/></button>}</div>}
    </div></dialog>}
  </div>;
}
const root=document.getElementById("root");
if(root)createRoot(root).render(<App/>);

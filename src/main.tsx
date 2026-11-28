import React,{useCallback,useEffect,useLayoutEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {choose,doAction,doLifeActivity,doMaternityReturn,doPregnancyAction,getPersonActivities,giveUp,nameNewborns,hasStartedLife,newProfileLife,hasPendingStoryDecision,playYear,skipDecision,doPathAction,startCareerLife,type City,type GameState,type LifeActivityCategory,type LifeActivityOption,type Memory,type PregnancyAction} from "./engine.ts";
import {Album,Places} from "./Views.tsx";
import {Assets} from "./Assets.tsx";
import {Career} from "./Career.tsx";
import {Workplace} from "./Workplace.tsx";
import {WorkDecisionDialog} from "./WorkDecisionDialog.tsx";
import {getWorkDecision} from "./workplace.ts";
import {isSchoolAge} from "./lifePath.ts";
import {BirthNamingDialog} from "./BirthNamingDialog.tsx";
import {PregnancyDialog} from "./PregnancyDialog.tsx";
import {canEndPregnancy,pregnancyTurnLabel} from "./pregnancyTimeline.ts";
import type {SurnameSource} from "./reproduction.ts";
import {People} from "./People.tsx";
import {BgLifeMark,PersonActionDialog,type PersonActionFlow} from "./PersonActionDialog.tsx";
import {personRelationship,type PeopleId} from "./peopleIdentity.ts";
import {Journal} from "./Journal.tsx";
import {More,StatsBars} from "./More.tsx";
import {Icon,MenuTitle,NavigationButton,PlaySymbol,copy,lifeName,tabLabels,type Tab} from "./ui.tsx";
import {deserialize,initialLanguage,initialTrialVip,LANGUAGE_KEY,loadSession,persist,restoreSession,SAVE_KEY,serialize,VIP_TRIAL_KEY,type Session} from "./session.ts";
import "./style.css";
import {HomeHub,StartGuide} from "./HomeHub.tsx";
import {AvatarCreator} from "./AvatarCreator.tsx";
import {CharacterHeader,CityBadge,PlayerProfile} from "./PlayerProfile.tsx";
import type {NewLifeDraft} from "./lifeProfile.ts";
import {DecisionDialog} from "./DecisionDialog.tsx";
import {cityDecision,storyDecision} from "./journalDecisions.ts";

type Dialog="profile"|"settings"|"replay"|"guide"|"give-up"|"pregnancy-end"|null;
type Screen = "home" | "game" | "album" | "avatar";
type MoreParent = "journal" | "people" | "places";
type LogPosition = {age: number; focus?: boolean; activityId?: string};

function lastLogPosition(life: GameState): LogPosition | null {
  return life.history.length ? {age: life.age} : null;
}

function scrollToLog(position: LogPosition) {
  const entry = position.activityId ? document.getElementById("life-event-" + position.age + "-" + position.activityId) : null;
  const heading = entry ?? document.getElementById("life-year-" + position.age);
  heading?.scrollIntoView({block:"start"});
  if(position.focus)heading?.focus({preventScroll:true});
}

function App(){
  const [first]=useState(loadSession),[session,setSession]=useState(first.session),[notice,setNotice]=useState(first.notice);
  const [l,setLanguage]=useState(initialLanguage),[tab,setTab]=useState<Tab>("journal"),[dialog,setDialog]=useState<Dialog>(null);
  const [screen,setScreen]=useState<Screen>("home");
  const [homeIntro,setHomeIntro]=useState(()=>!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const finishHomeIntro=useCallback(()=>setHomeIntro(false),[]);
  const [vip,setVip]=useState(initialTrialVip);
  const [moreMenu,setMoreMenu]=useState<{category:LifeActivityCategory|null;parent:MoreParent;version:number}>({category:null,parent:"journal",version:0});
  const [assetStart,setAssetStart]=useState<"overview"|"funds">("overview");
  const [albumFromMore,setAlbumFromMore]=useState(false);
  const [slideMenu,setSlideMenu]=useState(false);
  const [personAction,setPersonAction]=useState<PersonActionFlow|null>(null);
  const [cityPrompt,setCityPrompt]=useState<string|null>(null);
  const live=useRef(session),dialogRef=useRef<HTMLDialogElement>(null);
  const viewportRef=useRef<HTMLDivElement>(null);
  const mainRef=useRef<HTMLElement>(null);
  const focusScreen=useRef(false);
  const avatarOrigin=useRef<"home"|"game">("home");
  const endTarget=useRef<GameState|null>(null);
  const pregnancyEndTarget=useRef<GameState|null>(null);
  const nextLogPosition=useRef<LogPosition|null>(null);
  const s=session.life,t=(bg:string,en:string)=>copy(l,bg,en);
  const labels=tabLabels(l,s.age);
  const pregnancyNotice=s.lifeSystems.reproduction.notice;
  const pregnancyTurn=pregnancyTurnLabel(s);
  const menuDialog=dialog==="settings"||dialog==="guide";
  const showJournal=screen==="game"&&tab==="journal";
  const showNav=screen==="game"&&(tab==="journal"||tab==="career"||tab==="workplace");
  const showDecision=showJournal&&!dialog&&!personAction&&!pregnancyNotice&&!s.lifeSystems.reproduction.naming;
  const story=showDecision&&!pregnancyTurn?storyDecision(s):null;
  const workDecision=showDecision&&!story?getWorkDecision(s):null;
  const local=showDecision&&!story&&!workDecision&&cityPrompt!==null?cityDecision(s):null;
  const pendingDecision=story??(local?.key===cityPrompt?local:null);
  const dialogTitle=dialog==="profile"?t("Профил","Profile"):dialog==="settings"?t("Настройки","Settings"):dialog==="guide"?t("Как се играе","How to play"):dialog==="give-up"?t("Приключване на живота","End this life"):dialog==="pregnancy-end"?t("Прекъсване на бременността","End the pregnancy"):t("Нов живот","New life");
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
      if(!position?.focus&&tab!=="assets")mainRef.current?.focus({preventScroll:true});
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
  function openJournal(life:GameState,currentYear=false,entry?:Memory){
    const position = entry ? {age:entry.age,activityId:entry.id}
      : !life.commands.length ? null : currentYear ? {age:life.age} : lastLogPosition(life);
    nextLogPosition.current=position && {...position,focus:true};
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
    setSlideMenu(tab==="journal"&&(which==="people"||which==="assets"||which==="more"));
    nextLogPosition.current=position;
    focusScreen.current=true;
    setTab(which);
  }
  function openMore(category:LifeActivityCategory|null=null,parent:MoreParent="journal"){
    setMoreMenu(menu=>({category,parent,version:menu.version+1}));
    route("more");
  }
  function openAssets(from:"overview"|"funds"){
    setAssetStart(from);
    route("assets");
  }
  function openSettings(){
    setSlideMenu(showJournal);
    setDialog("settings");
  }
  function backFromCategory(){
    route(moreMenu.parent);
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
    if(!firstOption||personAction)return;
    const flow:PersonActionFlow={contact,seed:s.seed,age:s.age,ids:options.map(option=>option.id),
      branch:firstOption.branch,outcome:null};
    if(options.length===1)takePersonAction(flow,firstOption.id);
    else setPersonAction(flow);
  }
  function takePersonAction(flow:PersonActionFlow,id:string){
    const current=live.current;
    if(flow.outcome||current.life!==s||s.seed!==flow.seed||s.age!==flow.age||!flow.ids.includes(id))return;
    const option=getPersonActivities(s,flow.contact).find(choice=>choice.id===id);
    if(!option||option.blocked)return;
    const updated=doLifeActivity(s,option.id,s.age);
    const entry=updated.history.at(-1);
    if(updated===s||updated.history.length===s.history.length||!entry)return;
    const before=personRelationship(s,flow.contact),after=personRelationship(updated,flow.contact);
    setPersonAction(updated.lifeSystems.reproduction.notice ? null
      : {...flow,outcome:{entry,title:option.branch?.label??option.label,
        relationship:before!==null&&after!==null&&before!==after?{before,after}:null}});
    commit({...current,life:updated});
  }
  function act(fn:(v:GameState)=>GameState){
    const current=live.current;
    if(current.life!==s)return;
    const updated=fn(current.life);
    if(updated!==current.life){
      const entry=updated.history.length>s.history.length?updated.history.at(-1):undefined;
      if(entry?.kind==="choice"||entry?.decision||(entry?.kind==="action"&&entry.id.startsWith("city-life."))){
        nextLogPosition.current={age:entry.age,activityId:entry.id,focus:true};
      }
      commit({...current,life:updated});
      return entry;
    }
  }
  function nextYear(){
    const current=live.current;
    if(current.life!==s)return;
    if(s.finished){setDialog("replay");return;}
    if(!pregnancyTurn&&hasPendingStoryDecision(s)){
      route("journal");
      return;
    }
    const next=playYear(s);
    if(next===s){
      route("journal");
      return;
    }
    const latestEvent = next.history.slice(s.history.length).filter(entry => entry.kind === "event" || entry.kind === "end" || entry.kind === "path").at(-1);
    nextLogPosition.current={age:latestEvent?.age ?? next.age,focus:true,activityId:pregnancyTurn ? latestEvent?.id : undefined};
    commit({...current,life:next});
    setTab("journal");
  }
  function pregnancyAction(kind:PregnancyAction){
    const current=live.current;
    if(current.life!==s)return;
    const updated=doPregnancyAction(s,kind,s.age);
    if(updated===s)return;
    commit({...current,life:updated});
    if(updated.history.length!==s.history.length)openJournal(updated,true,updated.history.at(-1));
  }
  function requestPregnancyEnd(){
    if(!canEndPregnancy(s))return;
    pregnancyEndTarget.current=s;
    setDialog("pregnancy-end");
  }
  function confirmPregnancyEnd(){
    const target=pregnancyEndTarget.current;
    close();
    if(target===s)pregnancyAction("pregnancy-end");
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
    pregnancyEndTarget.current=null;
  }
  function importBackup(){
    if(!importRef.current)return;
    const restored=restoreSession(live.current,importRef.current);
    commit(restored);
    close();
    openJournal(restored.life);
  }
  const playLabel = pregnancyTurn?.[l] ?? (s.finished ? t("Нов живот","New life") : t("Следваща година","Next year"));
  function navItem(k:Exclude<Tab,"workplace">) {
    const icon = k==="career" ? isSchoolAge(s.age) ? "school" : "bag" : k;
    const active=tab===k||(k==="career"&&tab==="workplace");
    return <button data-tab={k} className="nav-item" aria-current={active?"page":undefined} onClick={()=>k==="more"?openMore():k==="assets"?openAssets("overview"):route(k)}><Icon name={icon}/><span>{labels[k]}</span></button>;
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
    journal:t("Назад към дневника","Back to journal"),
  }[moreMenu.parent];
  const toolbar = <div className="masthead-actions">
    <button className="lang-button" data-testid="language" onClick={setLocale} aria-label={t("Switch to English","Премини на български")}>{l==="bg"?"EN":"БГ"}</button>
    <button className="icon-button" data-testid="settings" onClick={openSettings} aria-label={t("Настройки","Settings")}><Icon name="settings"/></button>
  </div>;
  return <div className={screen==="home"?"app-shell app-shell--home":"app-shell"}>
    {(screen==="game"||screen==="album")&&<header className={"masthead"+(showNav?" journal-masthead":"")}>
      {showNav&&<div className="journal-banner">
        <button type="button" className="icon-button" aria-label={t("Главно меню","Main menu")} onClick={()=>openMenuScreen("home")}><Icon name="menu" size={18}/></button>
        <div className="banner-identity"><BgLifeMark/><CityBadge city={s.city} l={l}/></div>
        {toolbar}
      </div>}
      <CharacterHeader life={s} l={l} onProfile={showNav?()=>setDialog("profile"):undefined}
        onWallet={showNav?()=>openAssets("funds"):undefined}/>
    </header>}
    {notice&&<div className="save-notice" role="status"><span>{notice==="temporary"?t("Браузърът не запази играта. Можеш да изтеглиш копие от Настройки.","This browser couldn’t save your game. Download a backup in Settings."):notice==="recovered"?t("Дневникът е възстановен от предишния запис.","Your journal was restored from its previous save."):t("Предишният запис е повреден. Започваш нова глава.","The previous save was damaged. A new chapter has begun.")}</span><NavigationButton label={t("Затвори","Dismiss")} onClick={()=>setNotice(null)}/></div>}
    <div className={screen==="avatar"?"game-layout avatar-layout":screen==="game"?(tab==="journal"?"game-layout journal-layout":tab==="more"||tab==="people"||tab==="assets"?"game-layout more-layout":"game-layout"):"game-layout start-layout"} ref={viewportRef}>
      <main className={screen==="home"?"main-column start-column":((tab==="people"||tab==="assets")&&screen==="game"&&slideMenu)?"main-column menu-enter":"main-column"} id="main" ref={mainRef} tabIndex={-1}>
      {screen==="home"?<HomeHub life={s} l={l} intro={homeIntro} onIntroEnd={finishHomeIntro} onContinue={()=>openJournal(live.current.life)} onNewLife={startLife}
        onAlbum={()=>openMenuScreen("album")} onGuide={()=>setDialog("guide")}>{toolbar}</HomeHub>:
       screen==="avatar"?<AvatarCreator l={l} vip={vip} onVip={toggleTrialVip} onClose={cancelAvatarCreator} onStart={startWithAvatar}/>:
       screen==="album"?<Album {...menuProps} back s={s} archive={session.album} l={l}/>:
       tab==="journal"?<Journal s={s} l={l} onCityDecision={()=>setCityPrompt(cityDecision(s)?.key??null)} onAction={id=>act(v=>doAction(v,id,s.age))} onAlbum={()=>openAlbum()} onReplay={()=>setDialog("replay")} onMore={openMore} onEndPregnancy={requestPregnancyEnd} onCareer={()=>route("career")}/>:
       tab==="career"?<Career s={s} l={l} onClose={closeMenu} onMaternityReturn={()=>act(v=>doMaternityReturn(v,s.age))} onWorkplace={()=>route("workplace")} onAction={id=>act(v=>doPathAction(v,id,s.age))}/>:
       tab==="workplace"?<Workplace s={s} l={l} onClose={closeMenu} onCareer={()=>route("career")} onAction={id=>act(v=>doPathAction(v,id,s.age))}/>:
       tab==="people"?<People {...menuProps} s={s} l={l} onFamily={()=>openMore("family","people")} onActivity={openPersonAction}/>:
       tab==="assets"?<Assets life={s} l={l} initialPage={assetStart} onClose={closeMenu}
        onAction={id=>act(v=>doLifeActivity(v,id,s.age))} onJournal={entry=>openJournal(live.current.life,true,entry)}/>:
       tab==="places"?<Places back onClose={()=>openMore()} closeLabel={t("Назад към Още","Back to More")}
        s={s} l={l} onHolidays={()=>openMore("holidays","places")} onMove={relocate}/>:
       tab==="more"?<More {...menuProps} key={moreMenu.version} life={s} l={l} initialCategory={moreMenu.category} animateEntry={slideMenu&&moreMenu.category===null}
        onActivity={id=>act(v=>doLifeActivity(v,id,s.age))} onGiveUp={requestGiveUp} onJournal={()=>openJournal(live.current.life,true)} onAlbum={()=>openAlbum(true)} onPlaces={()=>route("places")}
        onCategoryBack={moreMenu.category?backFromCategory:undefined} categoryBackLabel={categoryBackLabel}/>:
       <Album {...albumMenu} s={s} archive={session.album} l={l}/>}
    </main></div>
    {showNav&&!menuDialog&&<footer className="game-footer"><nav className="bottom-nav" aria-label={t("Навигация","Navigation")}>
      <div className="nav-inner">
        {navItem("career")}{navItem("people")}
        <button className="play-control" data-testid="advance" data-play-mode={pregnancyTurn ? "pregnancy" : "year"} onClick={nextYear}
          aria-label={playLabel} title={playLabel}>
          <span className="play-face" aria-hidden="true"><PlaySymbol/></span><span>{s.finished || pregnancyTurn ? playLabel : "+1 " + t("година","year")}</span>
        </button>
        {navItem("assets")}{navItem("more")}
      </div>
    </nav><StatsBars life={s} l={l}/></footer>}
    {screen==="game"&&!dialog&&!personAction&&pregnancyNotice&&
      <PregnancyDialog notice={pregnancyNotice} l={l} onProceed={()=>pregnancyAction(pregnancyNotice.kind==="test"?"pregnancy-test":"pregnancy-read")}/>}
    {screen==="game"&&!dialog&&!personAction&&!pregnancyNotice&&s.lifeSystems.reproduction.naming&&
      <BirthNamingDialog key={s.seed+"-"+s.age} life={s} birth={s.lifeSystems.reproduction.naming} l={l} onSave={saveBabyNames}/>}
    {workDecision&&<WorkDecisionDialog key={workDecision.key} decision={workDecision} l={l} onChoose={id=>act(v=>doPathAction(v,id,s.age))}/>}
    {pendingDecision&&<DecisionDialog key={pendingDecision.key} decision={pendingDecision} age={s.age} l={l}
      onClose={()=>act(v=>skipDecision(v,pendingDecision.id,s.age))}
      onChoose={id=>act(v=>pendingDecision.kind==="story"?choose(v,id,s.age):doAction(v,id,s.age))}/>}
    {personAction&&<PersonActionDialog flow={personAction} life={s} l={l} onClose={()=>setPersonAction(null)}
      onChoose={id=>takePersonAction(personAction,id)}
      onRepeat={id=>takePersonAction({...personAction,outcome:null},id)}/>}
    {dialog&&<dialog key={dialog} ref={dialogRef} className={menuDialog?"modal-card game-menu-dialog":dialog==="profile"?"modal-card player-profile-dialog":"modal-card"} onCancel={close} aria-labelledby="dialog-heading" onClick={e=>{if(e.target===e.currentTarget){const b=e.currentTarget.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close()}}}>
      {menuDialog&&screen!=="home"&&<div className="game-menu-profile"><CharacterHeader life={s} l={l}/></div>}
      <div className={menuDialog?(slideMenu&&showJournal?"game-menu-content menu-enter":"game-menu-content"):undefined}>
      {menuDialog?<MenuTitle onClose={close} back={screen==="home"} closeLabel={screen==="home"?t("Назад към менюто","Back to main menu"):t("Затвори","Close")}><h2 id="dialog-heading">{dialogTitle}</h2></MenuTitle>:<div className="dialog-head"><h2 id="dialog-heading">{dialogTitle}</h2><NavigationButton label={t("Затвори","Close")} onClick={close}/></div>}
      {dialog==="profile"?<PlayerProfile life={s} l={l} onAesthetics={()=>{close();openMore("aesthetics");}}/>:
      dialog==="guide"?<StartGuide l={l}/>:dialog==="pregnancy-end"?<>
        <p>{t("Потвърди, че избираш да прекъснеш бременността. След това Play се връща към годишния цикъл.",
          "Confirm your decision to end the pregnancy. Play returns to the yearly cycle afterwards.")}</p>
        <div className="dialog-actions">
          <button className="secondary-button" autoFocus onClick={close}>{t("Назад","Back")}</button>
          <button className="primary-button" disabled={!canEndPregnancy(s) || pregnancyEndTarget.current!==s} onClick={confirmPregnancyEnd}>
            {t("Потвърди прекъсването","Confirm decision")}
          </button>
        </div>
      </>:dialog==="give-up"?<>
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

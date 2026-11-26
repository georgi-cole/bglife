import {useLayoutEffect,useRef,useState} from "react";
import {AvatarPortrait} from "./AvatarPortrait.tsx";
import {avatarPalettes,avatarPresets,getAvatarLook,type AvatarTraits} from "./avatar.ts";
import {commitmentsLeft,getPersonActivities,type GameState,type LifeActivityOption,type PersonId} from "./engine.ts";
import {personAge,personName,personPresentation,personSeed,type PeopleId} from "./peopleIdentity.ts";
import type {Language} from "./session.ts";
import {personProfiles} from "./story.ts";
import {Icon,MenuTitle,ageLabel,copy,money,town,type IconName} from "./ui.tsx";
import "./people.css";

type Partner = NonNullable<GameState["lifeSystems"]["family"]["partner"]>;

type Person = {
  id: PeopleId;
  name: string;
  status: string;
  score?: { label: string; value: number };
  portraitAge: number;
};
type Group = { title: string; people: Person[]; dating?: boolean };

function portraitTraits(seed: number, id: PeopleId): AvatarTraits {
  let number = personSeed(seed,id);
  function pick<T extends {id: string}>(options: readonly T[]): T["id"] {
    number = Math.imul(number, 1664525) + 1013904223 | 0;
    return options[(number >>> 8) % options.length].id;
  }

  return {
    presentation: personPresentation(seed,id),
    face: pick(avatarPresets.face), hair: pick(avatarPresets.hair), eyes: pick(avatarPresets.eyes),
    brows: pick(avatarPresets.brows), lips: pick(avatarPresets.lips),
    skin: pick(avatarPalettes.skin), hairColor: pick(avatarPalettes.hairColor), eyeColor: pick(avatarPalettes.eyeColor),
  };
}

function getPeople(s: GameState, l: Language): Group[] {
  const t=(bg:string,en:string)=>copy(l,bg,en);
  const {partner,stage,bond,formerPartners,childProfiles}=s.lifeSystems.family;
  const stages = {
    single:t("Без връзка","Single"), dating:t("Срещате се","Dating"), committed:t("Във връзка","In a relationship"),
    engaged:t("Сгодени","Engaged"), married:t("В брак","Married"),
  };
  function contact(id: PersonId): Person {
    const profile = personProfiles[id];
    const trust = s.trust[id];
    return {
      id, name:personName(s.seed,id)[l], status:profile.role[l]+" · "+town(profile.city,l),
      score:{label:t("Доверие","Trust"),value:trust}, portraitAge:personAge(s,id)??0,
    };
  }
  function knownPartner(id: Partner, status: string): Person {
    const profile = id==="appMatch" || id==="serviceMatch" ? null : contact(id);
    return {...profile,id,name:personName(s.seed,id)[l],status,portraitAge:personAge(s,id)??0,score:undefined};
  }

  const former = formerPartners.filter(row=>row.id!==partner).slice().reverse();
  const friends = partner==="friend" || former.some(row=>row.id==="friend") ? [] : [contact("friend")];
  return [
    {title:t("Семейство","Family"),people:[contact("rumi"),contact("niki")]},
    {title:t("Деца","Children"),people:childProfiles.map(({bond},index)=>{
      const id=`child-${index}` as const;
      return {
        id,name:personName(s.seed,id)[l],status:t("Дете","Child"),portraitAge:personAge(s,id)??0,
        score:{label:t("Близост","Bond"),value:bond},
      };
    })},
    {title:t("Любов","Love"),dating:true,people:partner?[{
      ...knownPartner(partner,stages[stage]),score:{label:t("Близост","Bond"),value:bond},
    }]:[]},
    {title:t("Приятели","Friends"),people:friends},
    {title:t("Наставници","Mentors"),people:[contact("mentor")]},
    {title:t("Бивши партньори","Former partners"),people:former.map(({id,endedAt})=>
      knownPartner(id,t("Разделихте се на "+endedAt+" г.","Relationship ended at age "+endedAt)))},
  ];
}

function RelationshipMeter({score}: {score:NonNullable<Person["score"]>}) {
  return <meter className="people-meter" aria-label={score.label} min={0} max={100} value={score.value}
    data-level={score.value<25?"poor":score.value<45?"strained":score.value<60?"neutral":"good"}/>;
}

function Portrait({person,seed}: {person:Person;seed:number}) {
  return <AvatarPortrait region="badge" className="people-portrait" look={getAvatarLook(portraitTraits(seed,person.id),person.portraitAge)}/>;
}

const actionIcons: Record<string,IconName> = {
  "voice-note":"phone", coffee:"food", game:"video", gaming:"video", basketball:"bolt", meme:"photo", cinema:"video",
  feedback:"journal", advice:"phone", "video-call":"phone", takeaway:"food", concert:"music", "check-in":"phone",
  park:"leaf", bedtime:"journal", playground:"sun", "board-game":"sparkle", skate:"shoes",
  compliment:"sparkle", conversation:"people", gift:"bag", "give-money":"wallet", "ask-money":"wallet",
  walk:"places", fitness:"bolt", insult:"bolt", argue:"live", persuade:"heart",
};

function ActionRow({options,l,onClick}: {options:LifeActivityOption[];l:Language;onClick:()=>void}) {
  const action=options[0],branch=action.branch;
  const symbol=actionIcons[branch?.id??action.id.split(".")[2]]??"people";
  const blocked=!branch&&action.blocked;
  return <button type="button" className="people-action" data-action-group={branch?.id} aria-disabled={!!blocked}
    onClick={()=>{if(!blocked)onClick()}}>
    <span className="people-action-icon"><Icon name={symbol} size={20}/></span>
    <span className="people-action-copy">
      <strong>{(branch?.label??action.label)[l]}</strong>
      <small>{(branch?.description??action.description)[l]}</small>
      {!branch&&<span className="people-action-cost">
        {action.cashDelta<0&&<span><Icon name="wallet" size={13}/>{money(-action.cashDelta,l)}</span>}
        {action.timeCost>0&&<span><Icon name="clock" size={13}/>{copy(l,action.timeCost+" ангажимент",action.timeCost+" time slot")}</span>}
      </span>}
      {blocked&&<small className="people-action-blocked">{blocked[l]}</small>}
    </span>
    <Icon name={blocked?"key":"next"} size={16}/>
  </button>;
}

export function People({s,l,onFamily,onClose,closeLabel,onActivity}: {
  s:GameState;l:Language;onFamily:()=>void;onClose:()=>void;closeLabel:string;onActivity:(contact:PeopleId,options:LifeActivityOption[])=>void;
}) {
  const [selected,setSelected]=useState<PeopleId|null>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const shouldFocus=useRef(false);
  const t=(bg:string,en:string)=>copy(l,bg,en);
  const groups=getPeople(s,l);
  const person=groups.flatMap(group=>group.people).find(row=>row.id===selected);
  const {partner,expecting}=s.lifeSystems.family;
  const actions=person?getPersonActivities(s,person.id):[];
  const actionRows=new Map<string,LifeActivityOption[]>();
  for(const action of actions){
    const key=action.branch?.id??action.id;
    const row=actionRows.get(key);
    if(row)row.push(action);
    else actionRows.set(key,[action]);
  }

  useLayoutEffect(()=>{
    if(!shouldFocus.current)return;
    shouldFocus.current=false;
    const viewport=heading.current?.closest(".game-layout");
    if(viewport)viewport.scrollTop=0;
    heading.current?.focus({preventScroll:true});
  },[selected]);

  function openPerson(id:PeopleId|null) {
    shouldFocus.current=true;
    setSelected(id);
  }

  return <section className="people-screen" aria-labelledby="people-heading">
    <header className="more-heading">
      <MenuTitle back={!!person} onClose={person?()=>openPerson(null):onClose}
        closeLabel={person?t("Назад към Хора","Back to People"):closeLabel}>
        <h1 id="people-heading" ref={heading} tabIndex={-1}>{person?t("Профил","Profile"):t("Хора","People")}</h1>
      </MenuTitle>
    </header>
    {person ? <>
      <div className="people-profile">
        <Portrait person={person} seed={s.seed}/>
        <div className="people-profile-copy">
          <h2>{person.name}</h2>
          <small>{ageLabel(person.portraitAge,l)} · {person.status}</small>
          {person.score&&<RelationshipMeter score={person.score}/>}
        </div>
      </div>
      <section className="people-actions" aria-labelledby="people-actions-title">
        <h2 id="people-actions-title" className="people-group-heading">
          {t("Действия","Activities")}
          <span><Icon name="clock" size={14}/>{t("Свободно време","Free time")} <strong>{commitmentsLeft(s)}</strong></span>
        </h2>
        {[...actionRows].map(([key,options])=><div className="people-action-entry" key={key}>
          <ActionRow options={options} l={l} onClick={()=>onActivity(person.id,options)}/>
        </div>)}
      </section>
    </> : <>
      {groups.map(group=>{
        const love=group.dating;
        if(!group.people.length&&!love)return null;
        return <section key={group.title}>
          <h2 className="people-group-heading">{group.title}</h2>
          {group.people.map(row=><button type="button" className="people-row" key={row.id} data-person={row.id} onClick={()=>openPerson(row.id)}>
            <Portrait person={row} seed={s.seed}/>
            <span className="people-row-copy">
              <strong>{row.name}</strong><small>{row.status}</small>
              {row.score&&<RelationshipMeter score={row.score}/>}
            </span>
            <Icon name="next" size={16}/>
          </button>)}
          {love&&<button type="button" className="people-row people-family-link" onClick={onFamily}>
            <span className="people-family-icon"><Icon name="heart" size={21}/></span>
            <span className="people-row-copy">
              <strong>{t("Любов и семейство","Love and Family")}</strong>
              {expecting?<small>{t("Очаквате дете","Expecting a child")}</small>:!partner&&<small>{t("Без връзка","Single")}</small>}
            </span>
            <Icon name="next" size={16}/>
          </button>}
        </section>;
      })}
    </>}
  </section>;
}

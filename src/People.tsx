import {useLayoutEffect,useRef,useState} from "react";
import {currentCaregiver,relativeLabel,type KinRole,type Relative} from "./birthFamily.ts";
import {AvatarPortrait} from "./AvatarPortrait.tsx";
import {getAvatarLook} from "./avatar.ts";
import {getPersonActivities,type GameState,type LifeActivityOption,type PersonId} from "./engine.ts";
import {isKnownPerson,personAge,personAvatarTraits,personCity,personName,personRelationship,type PeopleId} from "./peopleIdentity.ts";
import {deathCauses,type Death} from "./mortality.ts";
import {pregnancyStatus} from "./reproduction.ts";
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
  death?: Death;
};
type Group = { title: string; people: Person[]; dating?: boolean };

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
      id, name:personName(s,id)[l], status:profile.role[l]+" · "+town(personCity(s,id),l),
      score:{label:t("Доверие","Trust"),value:trust}, portraitAge:personAge(s,id)??0,
    };
  }
  function knownPartner(id: Partner, status: string): Person {
    const profile = id==="appMatch" || id==="serviceMatch" ? null : contact(id);
    return {...profile,id,name:personName(s,id)[l],status,portraitAge:personAge(s,id)??0,score:undefined};
  }

  const former = formerPartners.filter(row=>row.id!==partner).slice().reverse();
  const friends = partner==="friend" || former.some(row=>row.id==="friend") ? [] : [contact("friend")];
  const relativeGroups: { title: string; roles: KinRole[] }[] = [
    { title: t("Родители","Parents"), roles: ["mother","father"] },
    { title: t("Братя и сестри","Siblings"), roles: ["sibling"] },
    { title: t("Баби и дядовци","Grandparents"), roles: ["grandmother","grandfather"] },
    { title: t("Лели, чичовци и вуйчовци","Aunts and uncles"), roles: ["aunt","uncle","maternal-uncle"] },
  ];
  const caregiver = currentCaregiver(s)?.id;
  function relativeCard(relative: Relative): Person {
    let status = relativeLabel(relative)[l];
    if (s.age < 18 && relative.id === caregiver) status += " · " + t("Грижи се за теб","Your caregiver");
    else if (s.age < 18 && relative.household) status += " · " + t("У дома","At home");
    return { id: relative.id, name: relative.name[l], status, portraitAge: personAge(s,relative.id) ?? 0,
      score: { label: t("Близост","Bond"), value: personRelationship(s,relative.id) ?? relative.bond } };
  }
  const groups: Group[] = [
    ...relativeGroups.map(group => ({ title: group.title, people: (s.birthFamily?.relatives ?? [])
      .filter(relative => group.roles.includes(relative.role)).map(relativeCard) })),
    {title:t("Леля и братовчед","Aunt and cousin"),people:[contact("rumi"),contact("niki")]},
    {title:t("Деца","Children"),people:childProfiles.map(({bond},index)=>{
      const id=`child-${index}` as const;
      return {
        id,name:personName(s,id)[l],status:t("Дете","Child"),portraitAge:personAge(s,id)??0,
        score:{label:t("Близост","Bond"),value:bond},
      };
    })},
    {title:t("Любов","Love"),dating:s.age>=18,people:partner?[{
      ...knownPartner(partner,stages[stage]),score:{label:t("Близост","Bond"),value:bond},
    }]:[]},
    {title:t("Приятели","Friends"),people:friends},
    {title:t("Наставници","Mentors"),people:[contact("mentor")]},
    {title:t("Бивши партньори","Former partners"),people:former.map(({id,endedAt})=>
      knownPartner(id,t("Разделихте се на "+endedAt+" г.","Relationship ended at age "+endedAt)))},
  ].map(group => ({ ...group, people: group.people.filter(person => isKnownPerson(s,person.id) && !s.deceased[person.id]) }));
  const remembered: Person[] = [];
  for (const [id, death] of Object.entries(s.deceased) as [PeopleId,Death][]) {
    remembered.push({ id, death, name: personName(s,id)[l], portraitAge: death.age,
      status: t("Почина на " + death.age + " г.", "Died at age " + death.age) });
  }
  return [...groups, { title: t("В памет", "In memory"), people: remembered }];
}

function RelationshipMeter({score}: {score:NonNullable<Person["score"]>}) {
  return <meter className="people-meter" aria-label={score.label} min={0} max={100} value={score.value}
    data-level={score.value<25?"poor":score.value<45?"strained":score.value<60?"neutral":"good"}/>;
}

function Portrait({person,life}: {person:Person;life:GameState}) {
  return <AvatarPortrait region="badge" className="people-portrait" look={getAvatarLook(personAvatarTraits(life,person.id),person.portraitAge)}/>;
}

const actionIcons: Record<string,IconName> = {
  "voice-note":"phone", coffee:"food", game:"video", gaming:"video", basketball:"bolt", meme:"photo", cinema:"video",
  feedback:"journal", advice:"phone", "video-call":"phone", takeaway:"food", concert:"music", "check-in":"phone",
  park:"leaf", bedtime:"journal", playground:"sun", "board-game":"sparkle", skate:"shoes",
  compliment:"sparkle", conversation:"people", gift:"bag", "give-money":"wallet", "ask-money":"wallet",
  walk:"places", fitness:"bolt", insult:"bolt", argue:"live", persuade:"heart", intimacy:"heart",
  "family-time":"heart", "family-story":"journal",
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
      {!branch&&action.cashDelta<0&&<span className="people-action-cost">
        <span><Icon name="wallet" size={13}/>{money(-action.cashDelta,l)}</span>
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
  const {partner}=s.lifeSystems.family;
  const pregnancy=pregnancyStatus(s);
  const actions=person?getPersonActivities(s,person.id):[];
  const received=person?s.lifeSystems.assets.transfers?.filter(transfer=>transfer.recipient===person.id)??[]:[];
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
        <Portrait person={person} life={s}/>
        <div className="people-profile-copy">
          <h2>{person.name}</h2>
          <small>{person.death ? person.status : ageLabel(person.portraitAge,l) + " · " + person.status}</small>
          {person.death && <small>{deathCauses[person.death.cause][l]}</small>}
          {person.score&&<RelationshipMeter score={person.score}/>}
        </div>
      </div>
      {received.length > 0 && <section className="people-transfers" aria-labelledby="people-transfers-title">
        <h2 id="people-transfers-title" className="people-group-heading">{t("Получени притежания","Received assets")}</h2>
        <ul>{received.map(({item,age},index)=><li key={index}>
          <span>{item[l]}</span><small>{ageLabel(age,l)}</small>
        </li>)}</ul>
      </section>}
      {!person.death && <section className="people-actions" aria-labelledby="people-actions-title">
        <h2 id="people-actions-title" className="people-group-heading">
          {t("Действия","Activities")}
        </h2>
        {[...actionRows].map(([key,options])=><div className="people-action-entry" key={key}>
          <ActionRow options={options} l={l} onClick={()=>onActivity(person.id,options)}/>
        </div>)}
      </section>}
    </> : <>
      {s.birthFamily && s.age < 18 && !currentCaregiver(s) && <p className="people-care-note">
        {t("За теб се грижи приемно семейство.","A foster family is looking after you.")}
      </p>}
      {groups.map(group=>{
        const love=group.dating;
        if(!group.people.length&&!love)return null;
        return <section key={group.title}>
          <h2 className="people-group-heading">{group.title}</h2>
          {group.people.map(row=><button type="button" className="people-row" key={row.id} data-person={row.id} onClick={()=>openPerson(row.id)}>
            <Portrait person={row} life={s}/>
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
              {pregnancy?<small>{pregnancy[l]}</small>:!partner&&<small>{t("Без връзка","Single")}</small>}
            </span>
            <Icon name="next" size={16}/>
          </button>}
        </section>;
      })}
    </>}
  </section>;
}

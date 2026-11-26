import {useLayoutEffect,useRef,useState} from "react";
import {AvatarPortrait} from "./AvatarPortrait.tsx";
import {avatarPalettes,avatarPresets,getAvatarLook,type AvatarPresentation,type AvatarTraits} from "./avatar.ts";
import {lifePartnerLabel,type GameState,type Memory,type PersonId} from "./engine.ts";
import type {Language} from "./session.ts";
import {personProfiles} from "./story.ts";
import {Icon,MenuTitle,ageLabel,copy,town} from "./ui.tsx";
import "./people.css";

type Partner = NonNullable<GameState["lifeSystems"]["family"]["partner"]>;
type PersonKey = Partner | `child-${number}`;
type Person = {
  id: PersonKey;
  name: string;
  status: string;
  detail?: string;
  score?: { label: string; value: number };
  memories?: Memory[];
  portraitAge: number;
};
type Group = { title: string; people: Person[]; dating?: boolean };

const relativeAge: Record<Partner, number> = {rumi:23,niki:-4,mentor:33,friend:0,appMatch:1,serviceMatch:2};
const presentation: Record<Partner, AvatarPresentation> = {
  rumi:"female", niki:"male", mentor:"male", friend:"female", appMatch:"male", serviceMatch:"female",
};

function portraitTraits(seed: number, id: PersonKey): AvatarTraits {
  let number = id.split("").reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), seed ^ 2166136261);
  function pick<T extends {id: string}>(options: readonly T[]): T["id"] {
    number = Math.imul(number, 1664525) + 1013904223 | 0;
    return options[(number >>> 8) % options.length].id;
  }

  return {
    presentation: presentation[id as Partner] ?? (number & 1 ? "female" : "male"),
    face: pick(avatarPresets.face), hair: pick(avatarPresets.hair), eyes: pick(avatarPresets.eyes),
    brows: pick(avatarPresets.brows), lips: pick(avatarPresets.lips),
    skin: pick(avatarPalettes.skin), hairColor: pick(avatarPalettes.hairColor), eyeColor: pick(avatarPalettes.eyeColor),
  };
}

function getPeople(s: GameState, l: Language): Group[] {
  const t=(bg:string,en:string)=>copy(l,bg,en);
  const {partner,stage,bond,formerPartners,childrenJoinedAt}=s.lifeSystems.family;
  const stages = {
    single:t("Без връзка","Single"), dating:t("Срещате се","Dating"), committed:t("Във връзка","In a relationship"),
    engaged:t("Сгодени","Engaged"), married:t("В брак","Married"),
  };
  function contact(id: PersonId): Person {
    const profile = personProfiles[id];
    const trust = s.trust[id];
    return {
      id, name:profile.name[l], status:profile.role[l]+" · "+town(profile.city,l), detail:profile.detail[l],
      score:{label:t("Доверие","Trust"),value:trust}, portraitAge:s.age+relativeAge[id],
      memories:s.history.filter(event=>event.person===id||event.witnesses.includes(id)).reverse(),
    };
  }
  function knownPartner(id: Partner, status: string): Person {
    const profile = id==="appMatch" || id==="serviceMatch" ? null : contact(id);
    return {...profile,id,name:lifePartnerLabel(s,id)?.[l] ?? "",status,portraitAge:s.age+relativeAge[id],score:undefined};
  }

  const former = formerPartners.filter(row=>row.id!==partner).slice().reverse();
  const friends = partner==="friend" || former.some(row=>row.id==="friend") ? [] : [contact("friend")];
  return [
    {title:t("Семейство","Family"),people:[contact("rumi"),contact("niki")]},
    {title:t("Деца","Children"),people:childrenJoinedAt.map((joinedAt,index)=>({
      id:`child-${index}`, name:childrenJoinedAt.length===1?t("Дете","Child"):t("Дете ","Child ")+(index+1),
      status:joinedAt===s.age?t("От тази година в семейството","Joined the family this year"):
        t((s.age-joinedAt)+" г. в семейството",s.age-joinedAt===1?"1 year in the family":(s.age-joinedAt)+" years in the family"),
      portraitAge:s.age-joinedAt,
    }))},
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
  return <span className="people-meter">
    <span>{score.label}</span><meter aria-label={score.label} min={0} max={100} value={score.value}/><strong>{score.value}%</strong>
  </span>;
}

function Portrait({person,seed}: {person:Person;seed:number}) {
  return <AvatarPortrait region="badge" className="people-portrait" look={getAvatarLook(portraitTraits(seed,person.id),person.portraitAge)}/>;
}

export function People({s,l,onFamily,onClose,closeLabel}: {
  s:GameState;l:Language;onFamily:()=>void;onClose:()=>void;closeLabel:string;
}) {
  const [selected,setSelected]=useState<PersonKey|null>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const shouldFocus=useRef(false);
  const t=(bg:string,en:string)=>copy(l,bg,en);
  const groups=getPeople(s,l);
  const person=groups.flatMap(group=>group.people).find(row=>row.id===selected);
  const {partner,expecting}=s.lifeSystems.family;

  useLayoutEffect(()=>{
    if(!shouldFocus.current)return;
    shouldFocus.current=false;
    const viewport=heading.current?.closest(".game-layout");
    if(viewport)viewport.scrollTop=0;
    heading.current?.focus({preventScroll:true});
  },[selected]);

  function openPerson(id:PersonKey|null) {
    shouldFocus.current=true;
    setSelected(id);
  }

  return <section className="people-screen" aria-labelledby="people-heading">
    <header className="more-heading">
      <MenuTitle back={!!person} onClose={person?()=>openPerson(null):onClose}
        closeLabel={person?t("Назад към Хора","Back to People"):closeLabel}>
        <h1 id="people-heading" ref={heading} tabIndex={-1}>{person?.name??t("Хора","People")}</h1>
      </MenuTitle>
    </header>
    {person ? <>
      <div className="people-profile">
        <Portrait person={person} seed={s.seed}/>
        <div><strong>{person.status}</strong>{person.score&&<RelationshipMeter score={person.score}/>}</div>
      </div>
      {person.detail&&<p className="people-profile-note">{person.detail}</p>}
      {!!person.memories?.length&&<section className="people-memories">
        <h2 className="people-group-heading">{t("Общи спомени","Shared memories")}</h2>
        {person.memories.map((event,index)=><div className="small-memory" key={event.age+event.kind+event.id+index}>
          <small>{ageLabel(event.age,l)}</small><p>{event.text[l]}</p>
        </div>)}
      </section>}
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

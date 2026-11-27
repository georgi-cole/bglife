import React, { useState } from "react";
import { LifePortrait } from "./AvatarPortrait.tsx";
import { relativeLabel, type Relative } from "./birthFamily.ts";
import { cities, type City } from "./cities.ts";
import type { GameState, Text } from "./engine.ts";
import { isKnownPerson, personAge, personName, type PeopleId } from "./peopleIdentity.ts";
import { maritalStatus, playerBirthday, playerEducation, playerJob, playerStatus, zodiacFor } from "./playerProfile.ts";
import type { Language } from "./session.ts";
import { ageLabel, copy, Icon, lifeName, money, town } from "./ui.tsx";
import "./player-profile.css";

const cityMotifs = {
  coast: "M2 13c3 0 3-3 6-3s3 3 6 3 3-3 6-3M2 18c3 0 3-3 6-3s3 3 6 3 3-3 6-3",
  danube: "M3 10h18M4 10c0-5 7-5 7 0 0-5 7-5 7 0m-16 6c3 0 3-2 6-2s3 2 6 2 3-2 6-2",
  mountain: "m2 18 7-11 4 6 3-4 6 9M7 10l2 2 2-2",
  inland: "M3 18c5-5 13-5 18 0m-15-5a6 6 0 0 1 12 0M12 4V2M5 7 3 5m16 2 2-2",
  capital: "M4 19V9l5-4 3 3 3-3 5 4v10H4Zm5 0v-4h6v4m-6-8h.01m6 0h.01",
  clock: "M6 21h12V9l-6-6-6 6v12Zm6-11v3l2 1",
  pier: "M3 11h18m-4 0V8m-9 3V8m-5 7c3 0 3-2 6-2s3 2 6 2 3-2 6-2M3 19h18",
  hills: "M2 18c2-5 5-6 8-2 3-8 7-8 12 2M9 8l3-4 3 4",
};

export function CityBadge({ city, l }: { city: City; l: Language }) {
  const place = cities[city];
  const motif = city === "tryavna" ? "clock" : city === "burgas" ? "pier" : city === "plovdiv" ? "hills" : place.landscape;
  const code = city === "tryavna" ? "TRY" : city === "samokov" ? "SMK" : place.district;
  return <span className="city-token" data-city={city} data-terrain={place.landscape} title={place.name[l]}>
    <span className="city-insignia" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"><path d={cityMotifs[motif]}/></svg>
      <span className="city-code">{code}</span>
    </span>
    <span className="city-token-name">{place.name[l]}</span>
  </span>;
}

export function CharacterHeader({ life, l, onProfile, onWallet }: {
  life: GameState; l: Language; onProfile?: () => void; onWallet?: () => void;
}) {
  const identity = <>
    <span className="character-avatar"><LifePortrait life={life} region="badge"/></span>
    <span className="character-identity">
      <strong className="character-name">{lifeName(l, life)}</strong>
      <span className="character-occupation">
        <span className="character-status">{playerStatus(life)[l]}</span>
        <span className="character-age" data-testid={onProfile ? "chapter-age" : undefined}>{life.age}<span aria-hidden="true"> {copy(l, "г.", "yr")}</span></span>
      </span>
    </span>
  </>;
  const balance = <><strong>{money(life.cash, l)}</strong><span>{copy(l, "Налични пари", "Cash balance")}</span></>;
  return <div className="character-header">
    {onProfile ? <button type="button" className="character-summary" aria-haspopup="dialog" aria-label={copy(l, "Профил на ", "Profile of ") + lifeName(l, life)} onClick={onProfile}>
      {identity}<Icon name="next" size={13}/>
    </button> : <div className="character-summary">{identity}</div>}
    {onWallet ? <button type="button" className="character-money" aria-haspopup="dialog" onClick={onWallet}>{balance}</button>
      : <div className="character-money">{balance}</div>}
  </div>;
}

type FamilyMember = { id: PeopleId; label: Text; adopted?: boolean };

function memberDetails(life: GameState, member: FamilyMember, l: Language) {
  const age = personAge(life, member.id);
  return [member.label[l], member.adopted && copy(l, "Осиновяване", "Adopted"),
    life.deceased[member.id] && copy(l, "†", "†"), age !== null && ageLabel(age, l)].filter(Boolean).join(" · ");
}

function MemberCard({ life, member, l }: { life: GameState; member: FamilyMember; l: Language }) {
  return <div className="tree-member" data-family-member={member.id}>
    <strong>{personName(life, member.id)[l]}</strong>
    <span>{memberDetails(life, member, l)}</span>
  </div>;
}

function FamilyTree({ life, l, children, partner }: { life: GameState; l: Language; children: FamilyMember[]; partner: FamilyMember | null }) {
  const relatives = life.birthFamily?.relatives ?? [];
  const item = (relative: Relative) => <MemberCard key={relative.id} life={life} l={l} member={{ id: relative.id, label: relativeLabel(relative) }}/>;
  const grandparents = (side: "maternal" | "paternal") => relatives.filter(relative =>
    relative.id.startsWith("kin-" + side + "-grand"));
  const otherKin = relatives.filter(relative => ["aunt", "uncle", "maternal-uncle", "sibling"].includes(relative.role));
  const storyKin: FamilyMember[] = life.birthFamily ? [] : [
    { id: "rumi", label: { bg: "Леля", en: "Aunt" } },
    { id: "niki", label: { bg: "Братовчед", en: "Cousin" } },
  ];
  return <div className="family-tree">
    <div className="tree-ancestors">
      {(["maternal", "paternal"] as const).map(side => {
        const parent = relatives.find(relative => relative.role === (side === "maternal" ? "mother" : "father"));
        const elders = grandparents(side);
        if (!parent && !elders.length) return null;
        return <section className="tree-branch" key={side} aria-label={side === "maternal" ? copy(l, "По майчина линия", "Maternal side") : copy(l, "По бащина линия", "Paternal side")}>
          <h3 className="tree-lineage">{side === "maternal" ? copy(l, "Майчина линия", "Maternal side") : copy(l, "Бащина линия", "Paternal side")}</h3>
          {elders.length > 0 && <div className="tree-grandparents">{elders.map(item)}</div>}
          {parent && item(parent)}
        </section>;
      })}
    </div>
    <div className="tree-centre">
      <div className="tree-member tree-self"><strong>{lifeName(l, life)}</strong><span>{copy(l, "Ти", "You")} · {ageLabel(life.age, l)}</span></div>
      {partner && <MemberCard life={life} l={l} member={partner}/>}
    </div>
    {children.length > 0 && <section className="tree-children" aria-label={copy(l, "Деца", "Children")}>
      {children.map(member => <MemberCard key={member.id} life={life} l={l} member={member}/>)}
    </section>}
    {(!life.birthFamily || otherKin.length > 0) && <div className="tree-other">
      {otherKin.map(item)}
      {storyKin.filter(member => isKnownPerson(life, member.id)).map(member => <MemberCard key={member.id} life={life} l={l} member={member}/>)}
    </div>}
  </div>;
}

const birthdays = {
  bg: new Intl.DateTimeFormat("bg-BG", { dateStyle: "long", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }),
};

export function PlayerProfile({ life, l, onAesthetics }: { life: GameState; l: Language; onAesthetics: () => void }) {
  const [tree, setTree] = useState(false);
  const { family, pets } = life.lifeSystems;
  const birthday = playerBirthday(life);
  const male = life.avatar?.presentation === "male";
  const partner = family.partner ? { id: family.partner, label: { bg: "Партньор", en: "Partner" } } satisfies FamilyMember : null;
  const children = family.childProfiles.map((child, index): FamilyMember => ({
    id: "child-" + index as PeopleId, label: child.gender === "male" ? { bg: "Син", en: "Son" } : { bg: "Дъщеря", en: "Daughter" },
    adopted: child.origin === "adoption" || child.ageAtJoin > 0,
  }));
  const job = playerJob(life);
  const petsList = [pets.adopted && copy(l, "куче", "dog"), pets.rescued && copy(l, "котка", "cat")].filter(Boolean).join(", ");
  const none = copy(l, "Няма", "None");
  const facts: [string, React.ReactNode][] = [
    [copy(l, "Пол", "Sex"), male ? copy(l, "Мъжки", "Male") : copy(l, "Женски", "Female")],
    [copy(l, "Дата на раждане", "Date of birth"), <time dateTime={birthday.toISOString().slice(0, 10)}>{birthdays[l].format(birthday)}</time>],
    [copy(l, "Зодия", "Zodiac sign"), zodiacFor(birthday)[l]],
    [copy(l, "Семеен статус", "Relationship status"), maritalStatus(life)[l]],
    [copy(l, "Партньор", "Partner"), partner ? personName(life, partner.id)[l] : none],
    [copy(l, "Деца", "Children"), children.length ? <ul className="profile-children">
      {children.map(member => <li key={member.id}>{personName(life, member.id)[l]} <small>{memberDetails(life, member, l)}</small></li>)}
    </ul> : none],
    [copy(l, "Образование", "Education"), playerEducation(life)[l]],
    ...(job ? [[copy(l, "Работа", "Job"), job[l]] as [string, string]] : []),
    [copy(l, "Град", "City"), town(life.city, l)],
    ...(petsList ? [[copy(l, "Домашни любимци", "Pets"), petsList] as [string, string]] : []),
  ];
  return <>
    <div className="profile-heading">
      <span className="profile-portrait"><LifePortrait life={life} region="badge"/></span>
      <div><strong>{lifeName(l, life)}</strong><span>{ageLabel(life.age, l)}</span></div>
    </div>
    <button type="button" className="secondary-button profile-tree-toggle" aria-controls="profile-tree" aria-expanded={tree}
      onClick={() => setTree(!tree)}>
      <Icon name={tree ? "back" : "people"} size={17}/>{tree ? copy(l, "Към профила", "Back to profile") : copy(l, "Родословно дърво", "Family tree")}
    </button>
    <div id="profile-tree" hidden={!tree}>{tree && <FamilyTree life={life} l={l} children={children} partner={partner}/>}</div>
    {!tree && <>
      <dl className="profile-facts">
        {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      {!life.finished && <button type="button" className="secondary-button profile-aesthetics" onClick={onAesthetics}>
        <Icon name="sparkle" size={15}/>{copy(l, "Визия и грижа", "Aesthetics")}
      </button>}
    </>}
  </>;
}

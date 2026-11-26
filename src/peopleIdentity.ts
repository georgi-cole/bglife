import type {GameState,Text} from "./engine.ts";
import type {PartnerId} from "./lifeActivities.ts";
import type {AvatarPresentation} from "./avatar.ts";

export type PeopleId = PartnerId | `child-${number}`;

const names: Record<PartnerId, Text> = {
  rumi:{bg:"Румяна Димитрова",en:"Rumyana Dimitrova"},
  niki:{bg:"Николай Димитров",en:"Nikolay Dimitrov"},
  mentor:{bg:"Стефан Стоянов",en:"Stefan Stoyanov"},
  friend:{bg:"Елица Петрова",en:"Elitsa Petrova"},
  appMatch:{bg:"Александър Георгиев",en:"Aleksandar Georgiev"},
  serviceMatch:{bg:"Даниела Маринова",en:"Daniela Marinova"},
};
const ageOffset: Record<PartnerId, number> = {rumi:23,niki:-4,mentor:33,friend:0,appMatch:1,serviceMatch:2};
const presentations: Record<PartnerId, AvatarPresentation> = {
  rumi:"female",niki:"male",mentor:"male",friend:"female",appMatch:"male",serviceMatch:"female",
};
const childNames = {
  female:[["Виктория","Viktoria"],["Александра","Aleksandra"],["София","Sofia"],["Ния","Niya"]],
  male:[["Мартин","Martin"],["Даниел","Daniel"],["Теодор","Teodor"],["Борис","Boris"]],
} as const;

export function isChild(id: PeopleId): id is `child-${number}` {
  return id.startsWith("child-");
}

export function childIndex(id: `child-${number}`) {
  return Number(id.slice(6));
}

export function personSeed(seed: number, id: PeopleId) {
  return Array.from(id).reduce((hash,char)=>Math.imul(hash^char.charCodeAt(0),16777619),seed^2166136261);
}

export function personPresentation(seed: number, id: PeopleId): AvatarPresentation {
  return isChild(id) ? ((personSeed(seed,id)&1)===1?"female":"male") : presentations[id];
}

export function personName(seed: number, id: PeopleId): Text {
  if(!isChild(id))return names[id];
  const sex=personPresentation(seed,id);
  const options=childNames[sex];
  const [bg,en]=options[((personSeed(seed,id)>>>9)+childIndex(id))%options.length];
  return sex==="female"?{bg:bg+" Николова",en:en+" Nikolova"}:{bg:bg+" Николов",en:en+" Nikolov"};
}

export function personRelationship(s: GameState,id: PeopleId): number | null {
  if(isChild(id))return s.lifeSystems.family.childProfiles[childIndex(id)]?.bond??null;
  if(s.lifeSystems.family.partner===id)return s.lifeSystems.family.bond;
  return id==="appMatch"||id==="serviceMatch"?null:s.trust[id];
}

export function personAge(s: GameState, id: PeopleId): number | null {
  if(!isChild(id))return s.age+ageOffset[id];
  const child=s.lifeSystems.family.childProfiles[childIndex(id)];
  return child ? child.ageAtJoin+s.age-child.joinedAt : null;
}

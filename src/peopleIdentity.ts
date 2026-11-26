import type {GameState,Text} from "./engine.ts";
import type {ChildProfile,PartnerId} from "./lifeActivities.ts";
import {avatarPalettes,avatarPresets,type AvatarPresentation,type AvatarTraits} from "./avatar.ts";

export type PeopleId = PartnerId | `child-${number}`;

const identities: Record<PartnerId, {name: Text; ageOffset: number; gender: AvatarPresentation}> = {
  rumi:{name:{bg:"Румяна Димитрова",en:"Rumyana Dimitrova"},ageOffset:23,gender:"female"},
  niki:{name:{bg:"Николай Димитров",en:"Nikolay Dimitrov"},ageOffset:-4,gender:"male"},
  mentor:{name:{bg:"Стефан Стоянов",en:"Stefan Stoyanov"},ageOffset:33,gender:"male"},
  friend:{name:{bg:"Елица Петрова",en:"Elitsa Petrova"},ageOffset:0,gender:"female"},
  appMatch:{name:{bg:"Александър Георгиев",en:"Aleksandar Georgiev"},ageOffset:1,gender:"male"},
  serviceMatch:{name:{bg:"Даниела Маринова",en:"Daniela Marinova"},ageOffset:2,gender:"female"},
};
const childNames = {
  female:[["Виктория","Viktoria"],["Александра","Aleksandra"],["София","Sofia"],["Ния","Niya"]],
  male:[["Мартин","Martin"],["Даниел","Daniel"],["Теодор","Teodor"],["Борис","Boris"]],
} as const;

const portraitPresets = {
  female: {
    face: ["round","oval","heart","long","diamond"],
    hair: ["bob","curls","ponytail","waves","bangs","bun"],
    brows: ["soft","full","angled","fine"],
    lips: ["soft","full","bow","wide"],
  },
  male: {
    face: ["round","oval","square","long","diamond"],
    hair: ["crop","part","slick","buzz"],
    brows: ["straight","full","angled"],
    lips: ["soft","wide","fine"],
  },
} as const satisfies Record<AvatarPresentation, {
  [Part in "face" | "hair" | "brows" | "lips"]: readonly AvatarTraits[Part][];
}>;

export function isPeopleId(id: string | undefined): id is PeopleId {
  return !!id && (Object.hasOwn(identities, id) || /^child-(?:0|[1-9]\d*)$/u.test(id));
}

export function isChild(id: PeopleId): id is `child-${number}` {
  return id.startsWith("child-");
}

export function childIndex(id: `child-${number}`) {
  return Number(id.slice(6));
}

export function personSeed(seed: number, id: PeopleId) {
  return Array.from(id).reduce((hash,char)=>Math.imul(hash^char.charCodeAt(0),16777619),seed^2166136261);
}

function childGender(seed: number, id: `child-${number}`): AvatarPresentation {
  return (personSeed(seed,id)&1)===1?"female":"male";
}

export function newChildProfile(s: GameState, joinedAt: number, ageAtJoin: number, bond: number): ChildProfile {
  const id = `child-${s.lifeSystems.family.childProfiles.length}` as const;
  // Keep the original seed rule so replaying old saves preserves the child's identity.
  return {joinedAt,ageAtJoin,bond,gender:childGender(s.seed,id)};
}

export function personGender(s: GameState, id: PeopleId): AvatarPresentation {
  if(!isChild(id))return identities[id].gender;
  return s.lifeSystems.family.childProfiles[childIndex(id)]?.gender ?? childGender(s.seed,id);
}

export function personName(s: GameState, id: PeopleId): Text {
  if(!isChild(id))return identities[id].name;
  const savedName = s.lifeSystems.family.childProfiles[childIndex(id)]?.name;
  if (savedName) return savedName;
  const gender=personGender(s,id);
  const options=childNames[gender];
  const [bg,en]=options[((personSeed(s.seed,id)>>>9)+childIndex(id))%options.length];
  return gender==="female"?{bg:bg+" Николова",en:en+" Nikolova"}:{bg:bg+" Николов",en:en+" Nikolov"};
}

export function personAvatarTraits(s: GameState, id: PeopleId): AvatarTraits {
  const gender=personGender(s,id);
  const presets=portraitPresets[gender];
  let number=personSeed(s.seed,id);
  function pick<T>(options: readonly T[]): T {
    number = Math.imul(number, 1664525) + 1013904223 | 0;
    return options[(number >>> 8) % options.length];
  }
  return {
    presentation:gender,face:pick(presets.face),hair:pick(presets.hair),eyes:pick(avatarPresets.eyes).id,
    brows:pick(presets.brows),lips:pick(presets.lips),skin:pick(avatarPalettes.skin).id,
    hairColor:pick(avatarPalettes.hairColor).id,eyeColor:pick(avatarPalettes.eyeColor).id,
  };
}

export function personRelationship(s: GameState,id: PeopleId): number | null {
  if(isChild(id))return s.lifeSystems.family.childProfiles[childIndex(id)]?.bond??null;
  if(s.lifeSystems.family.partner===id)return s.lifeSystems.family.bond;
  return id==="appMatch"||id==="serviceMatch"?null:s.trust[id];
}

export function personAge(s: GameState, id: PeopleId): number | null {
  if(!isChild(id))return s.age+identities[id].ageOffset;
  const child=s.lifeSystems.family.childProfiles[childIndex(id)];
  return child ? child.ageAtJoin+s.age-child.joinedAt : null;
}

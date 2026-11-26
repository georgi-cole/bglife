import type {City,GameState,PersonId,Text} from "./engine.ts";
import type {ChildProfile,PartnerId} from "./lifeActivities.ts";
import {getRelative,isKin,type KinId} from "./birthFamily.ts";
import {bilingualName,genderedSurname} from "./lifeProfile.ts";
import {avatarPalettes,avatarPresets,type AvatarPresentation,type AvatarTraits} from "./avatar.ts";

export type PeopleId = PartnerId | `child-${number}` | KinId;
export const storyPeople: readonly PersonId[] = ["rumi", "niki", "mentor", "friend"];

export function isKnownPerson(s: GameState, id: PeopleId): boolean {
  if (isKin(id)) return getRelative(s,id) !== undefined;
  if (isChild(id)) return s.lifeSystems.family.childProfiles[childIndex(id)] !== undefined;
  const { partner, formerPartners } = s.lifeSystems.family;
  if (partner === id || formerPartners.some(row => row.id === id)) return true;
  if (id === "appMatch" || id === "serviceMatch") return false;
  if (s.lifespanStart === null) return true;
  if (s.profile && (id === "rumi" || id === "niki")) return s.birthCity === "tryavna" && s.age >= 16;
  if (id === "rumi") return true;
  if (id === "mentor") return s.birthCity === "tryavna" && s.age >= 16;
  return s.age >= 4;
}

export function hasLivingChildren(s: GameState): boolean {
  return s.lifeSystems.family.childProfiles.some((_, index) => !s.deceased[`child-${index}`]);
}

export function personCity(s: GameState, id: PeopleId): City {
  if (s.lifeSystems.family.partner === id || isChild(id)) return s.city;
  if (id === "rumi" || id === "niki") return "sofia";
  return s.birthCity;
}

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
  if (isKin(id)) return getRelative(s,id)?.gender ?? "female";
  if(!isChild(id))return identities[id].gender;
  return s.lifeSystems.family.childProfiles[childIndex(id)]?.gender ?? childGender(s.seed,id);
}

export function personName(s: GameState, id: PeopleId): Text {
  if (isKin(id)) return getRelative(s,id)?.name ?? { bg: "Роднина", en: "Relative" };
  if(!isChild(id))return identities[id].name;
  const gender=personGender(s,id);
  const options=childNames[gender];
  const [bg,en]=options[((personSeed(s.seed,id)>>>9)+childIndex(id))%options.length];
  if(s.profile?.name.includes(" ")) {
    const last = s.profile.name.split(" ").at(-1)!;
    const familyName = bilingualName(genderedSurname(last,gender));
    return { bg:bg+" "+familyName.bg, en:en+" "+familyName.en };
  }
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
  if (isKin(id)) return s.lifeSystems.kinBonds?.[id] ?? getRelative(s,id)?.bond ?? null;
  if(isChild(id))return s.lifeSystems.family.childProfiles[childIndex(id)]?.bond??null;
  if(s.lifeSystems.family.partner===id)return s.lifeSystems.family.bond;
  return id==="appMatch"||id==="serviceMatch"?null:s.trust[id];
}

export function personAge(s: GameState, id: PeopleId): number | null {
  const death = s.deceased[id];
  if (death) return death.age;
  if (isKin(id)) {
    const relative = getRelative(s,id);
    return relative ? relative.ageAtBirth + s.age : null;
  }
  if(!isChild(id))return s.age+identities[id].ageOffset;
  const child=s.lifeSystems.family.childProfiles[childIndex(id)];
  return child ? child.ageAtJoin+s.age-child.joinedAt : null;
}

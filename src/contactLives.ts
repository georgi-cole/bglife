import { currentCaregiver, isKin, getRelative, relativeLabel, relativesOf, type KinId, type KinRole, type Relative } from "./birthFamily.ts";
import { cities, cityIds, inCityBg, type City } from "./cities.ts";
import { cityPaths, jobTypes, type JobId } from "./cityPaths.ts";
import type { GameState, Memory, Text } from "./engine.ts";
import { bilingualName, genderedSurname, localNames } from "./lifeProfile.ts";
import { lifeDraw } from "./mortality.ts";
import {
  isChild, isKnownPerson, personAge, personCity, personGender, personName, personRelationship, personSeed, storyPeople, type PeopleId,
} from "./peopleIdentity.ts";

type ContactLife = {
  city?: City;
  education?: "school" | "secondary" | "university" | "higher";
  work?: { job: JobId; since: number } | "retired";
  relationship?: { partner: KinId; since: number; married?: true };
};

export type ContactWorld = {
  lives: Partial<Record<PeopleId, ContactLife>>;
  relatives: Relative[];
  wedding?: { contact: PeopleId; age: number; city: City };
};

type NewsKind = "birth" | "wedding" | "move" | "work" | "retire" | "graduate" | "relationship" | "study";
type ContactNews = { entry: Memory; priority: number; wedding?: ContactWorld["wedding"] };

const t = (bg: string, en: string): Text => ({ bg, en });
const universities = cityIds.filter(city => cityPaths[city].schools.some(school => school.level === "higher"));
const importance: Record<NewsKind, number> = {birth: 40, wedding: 35, move: 25, work: 15, retire: 15, graduate: 12, relationship: 8, study: 5};
const names: Record<NewsKind, Text> = {
  birth: t("Новородено", "New baby"), wedding: t("Сватба", "Wedding"), move: t("Преместване", "Moving"),
  work: t("Работа", "Work"), retire: t("Пенсиониране", "Retirement"), graduate: t("Дипломиране", "Graduation"),
  relationship: t("Нова връзка", "New relationship"), study: t("Следване", "University"),
};

function draw(s: GameState, id: PeopleId, stream: number, age = s.age): number {
  return lifeDraw(personSeed(s.seed, id), age, stream);
}

function siblingParents(s: GameState): [KinId, KinId] | null {
  if (s.birthFamily?.upbringing !== "two-parents" || s.deceased["kin-mother"] || s.deceased["kin-father"]) return null;
  return getRelative(s, "kin-mother") && getRelative(s, "kin-father") ? ["kin-mother", "kin-father"] : null;
}

function eligibility(s: GameState): PeopleId[] {
  const ids = new Set<PeopleId>(relativesOf(s).map(person => person.id));
  for (const id of storyPeople) {
    if ((!s.storyRoute || s.age >= 26) && isKnownPerson(s, id)) ids.add(id);
  }
  for (const [index] of s.lifeSystems.family.childProfiles.entries()) ids.add("child-" + index as PeopleId);
  const { partner, formerPartners } = s.lifeSystems.family;
  for (const former of formerPartners) {
    if (!s.storyRoute || s.age >= 26 || !storyPeople.some(id => id === former.id)) ids.add(former.id);
  }
  if (partner) ids.add(partner);
  return [...ids].filter(id => !s.deceased[id]);
}

function contactName(s: GameState, id: PeopleId): Text {
  const name = personName(s, id);
  return t(name.bg.split(" ")[0], name.en.split(" ")[0]);
}

function namedRelative(s: GameState, owner: PeopleId, id: KinId, role: KinRole, age: number): Relative {
  const gender = role === "contact-partner" ? personGender(s, owner) === "female" ? "male" : "female"
    : draw(s, id, 0xb20ce138) < .5 ? "female" : "male";
  const firstNames = localNames[gender];
  const first = firstNames[Math.floor(draw(s, id, 0x12083c54) * firstNames.length)];
  const last = role === "contact-partner" ? ["Иванов", "Маринов", "Колев", "Стоянов"][Math.floor(draw(s, id, 0xa6cbe369) * 4)]
    : personName(s, owner).bg.split(" ").at(-1) ?? "Петров";
  return {
    id, role, gender, name: bilingualName(first + " " + genderedSurname(last, gender)),
    ageAtBirth: age - s.age, household: false, bond: role === "sibling" ? 67 : role === "grandchild" ? 62 : 49,
    homeWith: owner,
  };
}

function babyRole(s: GameState, id: PeopleId): KinRole {
  if (isChild(id)) return "grandchild";
  const role = isKin(id) ? getRelative(s, id)?.role : undefined;
  if (role === "mother" || role === "father") return "sibling";
  if (role === "sibling") return "niece-nephew";
  if (role === "aunt" || role === "uncle" || role === "maternal-uncle" || id === "rumi") return "cousin";
  return "contact-child";
}

function chanceOfBirth(s: GameState, first: PeopleId, second: PeopleId): number {
  const parents = [first, second];
  const mother = parents.find(id => personGender(s, id) === "female");
  if (!mother || personGender(s, first) === personGender(s, second)) return 0;
  const age = personAge(s, mother) ?? 0;
  const otherAge = personAge(s, mother === first ? second : first) ?? 0;
  if (age < 20 || age > 42 || otherAge < 18 || otherAge > 65) return 0;
  return age <= 35 ? .15 : age <= 39 ? .08 : .03;
}

function initialLife(s: GameState, id: PeopleId, age: number): ContactLife {
  if (age < 7) return {};
  if (age <= 18) return {education: "school"};
  const higher = draw(s, id, 0xfe90b188, 0) < .32;
  if (age <= 23) return { education: higher ? "university" : "secondary" };
  const education = higher ? "higher" : "secondary";
  if (age >= 67) return {education, work: "retired"};
  if (age < 29 || draw(s, id, 0x86ee585b, 0) < .16) return {education};
  const jobs = cityPaths[personCity(s, id)].jobs;
  const job = jobs[Math.floor(draw(s, id, 0x194ea638, 0) * jobs.length)];
  return { education, work: {job, since: s.age - 4} };
}

export function advanceContactLives(s: GameState): GameState {
  const previous = s.lifeSystems.contacts;
  const world: ContactWorld = { lives: {...previous?.lives}, relatives: [...(previous?.relatives ?? [])] };
  // Use last year's contacts as the simulation input so a newborn does not take an adult turn in its birth year.
  const updated = { ...s, lifeSystems: { ...s.lifeSystems, contacts: world } };
  const parents = siblingParents(s);
  const caregiver = s.age < 18 ? currentCaregiver(s)?.id : undefined;
  const news: ContactNews[] = [];

  function note(kind: NewsKind, id: PeopleId, city: City, text: Text) {
    const relative = isKin(id) && getRelative(s, id);
    const close = isChild(id) || id === "friend" || (relative && ["mother","father","sibling"].includes(relative.role));
    const wedding = kind === "wedding" && (close || (personRelationship(s, id) ?? 0) >= 60)
      && (s.age >= 16 || s.city === city) ? { contact: id, age: s.age, city } : undefined;
    news.push({
      entry: { id: "contact-" + kind + "-" + id, age: s.age, city, kind: "event", title: names[kind], text, witnesses: [], cashDelta: 0 },
      priority: importance[kind] + (close ? 12 : 0), wedding,
    });
  }

  function addBaby(owner: PeopleId, partner: PeopleId, foundingParents: boolean) {
    const city = personCity(updated, owner);
    if (city !== personCity(updated, partner) || draw(s, owner, 0x5e8cfc71, 0) < .24) return false;
    const children = world.relatives.filter(relative => relative.parentIds?.includes(owner) && relative.parentIds.includes(partner));
    if (children.length >= (foundingParents ? 1 : 2) || children.some(child => child.ageAtBirth + s.age < 3)) return false;
    if (draw(s, owner, 0x7c228923) >= chanceOfBirth(updated, owner, partner) * (foundingParents ? .34 : 1)) return false;
    const id = ("kin-born-" + owner + "-" + s.age) as KinId;
    const child = namedRelative(updated, owner, id, babyRole(updated, owner), 0);
    const sibling = child.role === "sibling";
    if (sibling && !foundingParents) child.halfSibling = true;
    world.relatives.push({ ...child, parentIds: [owner, partner] });
    const name = contactName(s, owner);
    const given = child.name.bg.split(" ")[0];
    const english = child.name.en.split(" ")[0];
    const role = relativeLabel(child);
    note("birth", owner, city, sibling
      ? t("Роди ми се " + role.bg.toLocaleLowerCase("bg") + ". Казва се " + given + ".",
        "My little " + role.en.toLowerCase() + " " + english + " was born.")
      : t(name.bg + " вече има " + (child.gender === "female" ? "дъщеря" : "син") + ". Бебето се казва " + given + ".",
        name.en + " welcomed a " + (child.gender === "female" ? "daughter" : "son") + " named " + english + "."));
    return true;
  }

  const youngerSibling = s.age >= 2 && parents && addBaby(parents[0], parents[1], true);
  for (const id of eligibility(s)) {
    const age = personAge(s, id);
    if (age === null || age < 7) continue;
    const relative = isKin(id) ? getRelative(s, id) : undefined;
    const before = world.lives[id];
    const life = before ?? initialLife(s, id, age);
    world.lives[id] = life;
    if (youngerSibling && parents?.[0] === id) continue;

    const city = personCity(updated, id);
    const name = contactName(s, id);
    const activePartner = s.lifeSystems.family.partner === id;
    const linkedPartner = relative?.role === "contact-partner";
    const sameHousehold = activePartner || linkedPartner || id === caregiver || Boolean(relative?.household && s.age < 18) || Boolean(parents?.includes(id as KinId));
    const newCity = (candidates: readonly City[], stream: number) => {
      const destinations = candidates.filter(candidate => candidate !== city);
      return destinations[Math.floor(draw(s, id, stream) * destinations.length)] ?? city;
    };
    const universityTrack = draw(s, id, 0xfe90b188, 0) < .32;
    if (age === 19 && life.education === "school") {
      const destination = universityTrack && !sameHousehold && draw(s, id, 0x56be1297) < .42
        ? newCity(universities, 0x66d3dfff) : city;
      world.lives[id] = { ...life, education: universityTrack ? "university" : "secondary", ...(destination !== city && {city: destination}) };
      note(destination !== city ? "move" : universityTrack ? "study" : "graduate", id, destination,
        destination !== city ? t(name.bg + " се премести " + inCityBg(destination) + ", за да учи.",
          name.en + " moved to " + cities[destination].name.en + " for university.")
        : universityTrack ? t(name.bg + " започна да учи в университет.", name.en + " started university.")
          : t(name.bg + " завърши средно образование.", name.en + " finished secondary school."));
      continue;
    }
    if (age >= 23 && before?.education === "university") {
      world.lives[id] = {...life, education: "higher"};
      note("graduate", id, city, t(name.bg + " завърши университета.", name.en + " graduated from university."));
      continue;
    }
    if (age >= 64 && life.work && life.work !== "retired" && (age >= 69 || draw(s, id, 0x127d339b) < .23)) {
      world.lives[id] = {...life, work: "retired"};
      note("retire", id, city, t(name.bg + " се пенсионира.", name.en + " retired."));
      continue;
    }

    // One milestone per person per year. Established relationships get a chance before career changes.
    if (age >= 20 && !activePartner && !linkedPartner && !parents?.includes(id as KinId)) {
      const relationship = life.relationship;
      const together = relationship && !s.deceased[relationship.partner];
      if (together && !relationship.married && s.age > relationship.since && draw(s, id, 0xcbe84130) < .25) {
        world.lives[id] = {...life, relationship: {...relationship, married: true}};
        note("wedding", id, city, t(name.bg + " сключи брак с " + contactName(updated, relationship.partner).bg + ".",
          name.en + " married " + contactName(updated, relationship.partner).en + "."));
        continue;
      }
      if (together && s.age > relationship.since && !["grandchild","niece-nephew","contact-child"].includes(relative?.role ?? "")
        && addBaby(id, relationship.partner, false)) continue;
      const prefersPartnership = draw(s, id, 0x16400552, 0) >= .18;
      if ((!relationship || !together) && age < 68 && prefersPartnership
        && draw(s, id, 0x0b94c8db) < (age <= 42 ? .17 : .07)) {
        const partnerId = ("kin-partner-" + id + "-" + s.age) as KinId;
        const partnerAge = Math.max(18, age + Math.floor(draw(s, id, 0x101597dd) * 9) - 4);
        const other = namedRelative(updated, id, partnerId, "contact-partner", partnerAge);
        world.relatives.push(other);
        world.lives[id] = {...life, relationship: { partner: other.id, since: s.age }};
        note("relationship", id, city, t(name.bg + " започна връзка с " + other.name.bg.split(" ")[0] + ".",
          name.en + " started seeing " + other.name.en.split(" ")[0] + "."));
        continue;
      }
    }

    const employed = life.work && life.work !== "retired" ? life.work : null;
    const looking = age >= 19 && age < 64 && life.work !== "retired" && life.education !== "university"
      && (!employed || s.age - employed.since >= 4);
    if (!looking || draw(s, id, 0xe723ef03) >= (employed ? .09 : .42)) continue;
    const destination = !sameHousehold && (!life.relationship || s.deceased[life.relationship.partner]) && age <= 48 && draw(s, id, 0xeb3a20d2) < (employed ? .20 : .30)
      ? newCity(cityIds, 0x545be789) : city;
    const options = cityPaths[destination].jobs.filter(job => job !== employed?.job);
    const job = options[Math.floor(draw(s, id, 0xf31e94a2) * options.length)];
    if (!job) continue;
    world.lives[id] = { ...life, work: {job, since: s.age}, ...(destination !== city && {city: destination}) };
    note(destination === city ? "work" : "move", id, destination, destination === city
      ? t(name.bg + (employed ? " смени работата си и вече работи като " : " започна работа като ") + jobTypes[job].label.bg.toLocaleLowerCase("bg") + ".",
        name.en + (employed ? " changed jobs: " : " started work as ") + jobTypes[job].label.en.toLowerCase() + ".")
      : t(name.bg + " се премести " + inCityBg(destination) + " за нова работа.",
        name.en + " moved to " + cities[destination].name.en + " for a new job."));
  }

  const headlines = news.sort((a, b) => b.priority - a.priority || a.entry.id.localeCompare(b.entry.id, "en")).slice(0, 2);
  world.wedding = headlines.find(item => item.wedding)?.wedding;
  return { ...updated, history: [...s.history, ...headlines.map(item => item.entry)] };
}

export function weddingInvitation(s: GameState) {
  const wedding = s.lifeSystems.contacts?.wedding;
  if (!wedding || s.finished || wedding.age !== s.age || s.deceased[wedding.contact]) return null;
  const id = "contact-wedding-" + wedding.contact;
  if (s.skippedDecisions.includes(id) || s.usedActions.some(action => action.startsWith("people." + wedding.contact + ".wedding."))) return null;
  return { ...wedding, id };
}

export function contactDetails(s: GameState, id: PeopleId) {
  const life = s.lifeSystems.contacts?.lives[id];
  const relative = isKin(id) ? getRelative(s, id) : undefined;
  const owner = relative?.role === "contact-partner" ? relative.homeWith : undefined;
  const ownerRelationship = owner && s.lifeSystems.contacts?.lives[owner]?.relationship;
  const relationship = life?.relationship ?? (owner && ownerRelationship && ownerRelationship.partner === id
    ? { ...ownerRelationship, partner: owner } : undefined);
  const work = life?.work === "retired" ? t("В пенсия", "Retired") : life?.work && jobTypes[life.work.job].label;
  const education = life?.education && {
    school: t("Учи в училище", "At school"), secondary: t("Средно образование", "Secondary education"),
    university: t("Следва в университет", "At university"), higher: t("Висше образование", "Higher education"),
  }[life.education];
  const children = s.lifeSystems.contacts?.relatives.filter(person => person.parentIds?.includes(id)) ?? [];
  return {work, education, relationship, children};
}


export function familyConnection(s: GameState, relative: Relative): Text | undefined {
  if (relative.parentIds?.length) {
    const parents = relative.parentIds.map(id => contactName(s,id));
    return t("Дете на " + parents.map(name => name.bg).join(" и "),
      "Child of " + parents.map(name => name.en).join(" and "));
  }
  if (relative.role === "contact-partner" && relative.homeWith) {
    const name = contactName(s, relative.homeWith);
    const married = contactDetails(s, relative.id).relationship?.married;
    const label = married ? relative.gender === "female" ? "Съпруга на " : "Съпруг на "
      : relative.gender === "female" ? "Партньорка на " : "Партньор на ";
    return t(label + name.bg, (married ? "Spouse of " : "Partner of ") + name.en);
  }
}

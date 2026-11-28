import type { GameState, Memory } from "./engine.ts";
import { currentCaregiver, getRelative, isKin, relativesOf } from "./birthFamily.ts";
import { applyStats, statsChange } from "./lifeActivities.ts";
import { isChild, isKnownPerson, personAge, personCity, personGender, personName, personSeed, storyPeople, type PeopleId } from "./peopleIdentity.ts";
import { deathCauses, rollDeath } from "./mortality.ts";

export function settlePeople(s: GameState): GameState {
  const family = s.lifeSystems.family;
  const people = new Set<PeopleId>(relativesOf(s).map(relative => relative.id));
  for (const person of storyPeople) {
    // Recurring characters in the authored Tryavna plot must be present for their scenes.
    if ((!s.storyRoute || s.age >= 26) && isKnownPerson(s, person)) people.add(person);
  }
  for (const { id } of family.formerPartners) if (!storyPeople.some(person => person === id)) people.add(id);
  if (family.partner && !storyPeople.some(person => person === family.partner)) people.add(family.partner);
  for (const [index] of family.childProfiles.entries()) people.add(`child-${index}`);

  let result = s;
  for (const id of people) {
    if (result.deceased[id]) continue;
    const age = personAge(s, id);
    if (age === null || age < 0) continue;
    const city = personCity(s, id);
    const death = rollDeath({ age, sex: personGender(s, id), city }, personSeed(s.seed, id));
    if (!death) continue;
    const name = personName(s, id);
    const cause = deathCauses[death.cause];
    const partner = result.lifeSystems.family.partner === id;
    const relative = isKin(id) ? getRelative(s,id) : undefined;
    const grief = partner || isChild(id) || relative?.household ? -17 : -9;
    const stats = applyStats(result.stats, { joy: grief });
    const memory: Memory = {
      age: s.age, city, kind: "event", id: "loss-" + id, witnesses: [], cashDelta: 0,
      title: { bg: name.bg + " почина", en: name.en + " died" },
      text: { bg: death.age + " г. · " + cause.bg, en: "Age " + death.age + " · " + cause.en },
      statsDelta: statsChange(result.stats, stats),
    };
    const systems = result.lifeSystems;
    const keptHeirs = systems.legacy.heirs.filter(heir =>
      !(heir === "partner" && partner) && heir !== id);
    if (keptHeirs.includes("children") && !systems.family.childProfiles.some((_, index) => {
      const child = `child-${index}` as const;
      return child !== id && !result.deceased[child];
    })) keptHeirs.splice(keptHeirs.indexOf("children"), 1);
    result = {
      ...result, stats, history: [...result.history, memory], deceased: { ...result.deceased, [id]: death },
      housing: id === "rumi" && result.housing === "rumi" ? "home" : result.housing,
      lifeSystems: {
        ...systems,
        family: partner ? { ...systems.family, partner: null, bond: 0, stage: "single", relationship: null } : systems.family,
        legacy: { heirs: keptHeirs, prepared: systems.legacy.prepared && keptHeirs.length > 0 },
      },
    };
  }
  if (s.age < 18 && s.birthFamily) {
    const before = currentCaregiver(s);
    const after = currentCaregiver(result);
    if (before && before.id !== after?.id) result.history.push({
      age: s.age, city: s.city, kind: "event", id: "caregiver-" + s.age, witnesses: [], cashDelta: 0,
      title: { bg: "Грижа у дома", en: "Care at home" },
      text: after
        ? { bg: after.name.bg + " пое грижата за теб.", en: after.name.en + " took over your care." }
        : { bg: "Приемно семейство пое грижата за теб.", en: "A foster family took over your care." },
    });
  }
  return result;
}

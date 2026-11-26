import { defaultAvatar, defaultMaleAvatar, parseAvatar, type AvatarPresentation, type AvatarTraits } from "./avatar.ts";
import type { City } from "./cities.ts";
import type { Text } from "./engine.ts";
import type { StatDelta } from "./lifeActivities.ts";
import { lifeDraw } from "./mortality.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

export const talents = {
  none: t("Без специален талант", "No special talent"),
  music: t("Музика", "Music"),
  sport: t("Спорт", "Sport"),
  craft: t("Изкуство и занаяти", "Arts and crafts"),
  technology: t("Технологии", "Technology"),
  languages: t("Езици", "Languages"),
};
export type Talent = keyof typeof talents;

export const dispositions = {
  curious: { label: t("Любознателност", "Curiosity"), effect: t("+10 знания", "+10 Smarts"), stats: { brains: 10 } },
  outgoing: { label: t("Общителност", "Sociability"), effect: t("+8 влияние, +6 настроение", "+8 Influence, +6 Happiness"), stats: { influence: 8, joy: 6 } },
  determined: { label: t("Упоритост", "Determination"), effect: t("+5 здраве, +5 знания", "+5 Health, +5 Smarts"), stats: { health: 5, brains: 5 } },
  calm: { label: t("Спокойствие", "Calmness"), effect: t("+12 настроение", "+12 Happiness"), stats: { joy: 12 } },
} satisfies Record<string, { label: Text; effect: Text; stats: StatDelta }>;
export type Disposition = keyof typeof dispositions;
export const HEIR_CASH = 100_000_000;

export type LifeProfile = { name: string; talent: Talent; vip: boolean; wealthy: boolean; disposition: Disposition | null };
export type NewLifeDraft = {
  seed: number;
  city: City;
  presentation: AvatarPresentation;
  avatar: AvatarTraits;
  profile: LifeProfile;
};

export function validName(raw: string): string | null {
  const normalized = raw.normalize("NFC").trim().replace(/ +/g, " ");
  return normalized.length <= 48 && /^\p{L}+(?:[ ’'’-]\p{L}+)*$/u.test(normalized) ? normalized : null;
}

export function parseLifeProfile(value: unknown): LifeProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { name, talent, vip, wealthy, disposition } = value as Record<string, unknown>;
  if (typeof name !== "string" || validName(name) !== name || typeof talent !== "string" || !Object.hasOwn(talents, talent)
    || typeof vip !== "boolean" || typeof wealthy !== "boolean") return null;
  if (disposition !== null && (typeof disposition !== "string" || !Object.hasOwn(dispositions, disposition))) return null;
  if (!vip && (wealthy || disposition !== null)) return null;
  return { name, talent: talent as Talent, vip, wealthy, disposition: disposition as Disposition | null };
}

const latin: Record<string, string> = {
  а:"a", б:"b", в:"v", г:"g", д:"d", е:"e", ж:"zh", з:"z", и:"i", й:"y", к:"k", л:"l", м:"m", н:"n",
  о:"o", п:"p", р:"r", с:"s", т:"t", у:"u", ф:"f", х:"h", ц:"ts", ч:"ch", ш:"sh", щ:"sht", ъ:"a",
  ь:"y", ю:"yu", я:"ya",
};
export function bilingualName(bg: string): Text {
  return t(bg, bg.replace(/[А-Яа-я]+/g, word => [...word].map(char => {
    const copy = latin[char.toLowerCase()];
    return char === char.toLowerCase() ? copy : copy[0].toUpperCase() + copy.slice(1);
  }).join("")));
}

export const localNames = {
  female: ["София", "Мария", "Виктория", "Дария", "Елена", "Мила", "Ива", "Рая", "Мира", "Симона", "Деница", "Яна", "Айлин", "Ния", "Анна"],
  male: ["Александър", "Георги", "Никола", "Мартин", "Борис", "Иван", "Даниел", "Асен", "Калоян", "Стефан", "Виктор", "Емил", "Дениз", "Петър", "Михаил"],
};
const surnames = ["Иванов","Петров","Димитров","Николов","Тодоров","Маринов","Колев","Стоянов","Стефанов","Драганов",
  "Василев","Лазаров","Славов","Атанасов","Радев","Костов","Илиев","Борисов"];

export function genderedSurname(surname: string, presentation: AvatarPresentation): string {
  const stem = surname.replace(/([ое]в|ин)а$/iu, "$1");
  return /([ое]в|ин)$/iu.test(stem) && presentation === "female" ? stem + "а" : stem;
}

export function generatedName(seed: number, presentation: AvatarPresentation): string {
  const first = localNames[presentation][Math.floor(lifeDraw(seed, 0, 0x73b127aa) * localNames[presentation].length)];
  const last = surnames[Math.floor(lifeDraw(seed, 0, 0x7ccdaf11) * surnames.length)];
  return first + " " + genderedSurname(last, presentation);
}

export function automaticAppearance(presentation: AvatarPresentation, seed: number): AvatarTraits {
  const base = presentation === "male" ? defaultMaleAvatar : defaultAvatar;
  const options = [
    { skin: "peach", eyeColor: "brown", hairColor: "chestnut" },
    { skin: "porcelain", eyeColor: "blue", hairColor: "honey" },
    { skin: "sand", eyeColor: "brown", hairColor: "espresso" },
    { skin: "olive", eyeColor: "green", hairColor: "chestnut" },
  ];
  const preset = options[Math.floor(lifeDraw(seed, 0, 0x479ad917) * options.length)];
  return parseAvatar({ ...base, ...preset, presentation }) ?? { ...base, presentation };
}

export function talentBonus(talent: Talent | undefined, action: string): StatDelta {
  if (talent === "sport" && (/^gym\./.test(action) || action.endsWith(".basketball"))) return { health: 2, joy: 2 };
  if (talent === "music" && /rehearsal|music|concert|song|instrument/.test(action)) return { joy: 3, influence: 2 };
  if (talent === "craft" && /wood|studio|craft|photo|drawing/.test(action)) return { brains: 2, joy: 2 };
  if (talent === "technology" && /software|electronics|comput|digital/.test(action)) return { brains: 3 };
  if (talent === "languages" && /language|translation|become-guide/.test(action)) return { brains: 2, influence: 2 };
  return {};
}

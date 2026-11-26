import type { AvatarPresentation } from "./avatar.ts";
import type { Text } from "./engine.ts";
import { bilingualName, genderedSurname, localNames } from "./lifeProfile.ts";

const extraNames = {
  male: ["Димитър", "Стоян", "Георги", "Александър", "Иван", "Никола", "Борис", "Мартин",
    "Петър", "Христо", "Стефан", "Калоян", "Теодор", "Даниел", "Виктор", "Асен", "Явор", "Деян"],
  female: ["Мария", "София", "Виктория", "Елена", "Александра", "Анна", "Дария", "Рая",
    "Калина", "Йоана", "Сияна", "Десислава", "Невена", "Биляна", "Габриела", "Ива", "Магдалена", "Лилия"],
} as const;

const firstNames = {
  male: [...new Set([...extraNames.male, ...localNames.male])],
  female: [...new Set([...extraNames.female, ...localNames.female])],
};

export function suggestedFirstName(gender: AvatarPresentation, roll: number, used: readonly string[] = []): string {
  const choices = firstNames[gender].filter(name => !used.includes(name));
  const pool = choices.length ? choices : firstNames[gender];
  return pool[Math.floor(roll * pool.length)];
}

export function cleanFirstName(value: string): string | null {
  const normalized = value.trim().normalize("NFC").replace(/\s+/gu, " ");
  return normalized.length <= 36 && /^\p{L}[\p{L}\p{M}]*(?:[ '’-]\p{L}[\p{L}\p{M}]*)*$/u.test(normalized)
    ? normalized : null;
}

export function familySurname(parent: Text, gender: AvatarPresentation): Text {
  const surname = parent.bg.includes(" ") ? parent.bg.split(" ").at(-1)! : "Иванов";
  return bilingualName(genderedSurname(surname, gender));
}

const patronymics: Record<string, string> = {
  Александър: "Александров", Николай: "Николаев", Димитър: "Димитров", Петър: "Петров",
  Мила: "Милов", Даниела: "Даниелов", Елица: "Елицов", София: "Софиев", Георги: "Георгиев",
  Ивайло: "Ивайлов", Калина: "Калинов", Борислава: "Бориславов", Мария: "Мариев",
};

export function bulgarianChildName(firstName: string, parent: Text, surname: Text, gender: AvatarPresentation): Text {
  const first = parent.bg.split(" ")[0];
  const stem = first.replace(/[аоя]$/iu, "");
  const base = patronymics[first] ?? (/[еи]$/iu.test(stem) ? stem + "ев" : stem + "ов");
  const patronymic = /[а-я]/iu.test(first) ? base + (gender === "female" ? "а" : "") : first;
  return bilingualName([firstName, patronymic, surname.bg].join(" "));
}

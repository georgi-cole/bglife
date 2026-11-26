import type { AvatarPresentation } from "./avatar.ts";
import type { Text } from "./engine.ts";

const firstNames = {
  male: ["Димитър", "Стоян", "Георги", "Александър", "Иван", "Никола", "Борис", "Мартин",
    "Петър", "Христо", "Стефан", "Калоян", "Теодор", "Даниел", "Виктор", "Асен", "Явор", "Деян"],
  female: ["Мария", "София", "Виктория", "Елена", "Александра", "Анна", "Дария", "Рая",
    "Калина", "Йоана", "Сияна", "Десислава", "Невена", "Биляна", "Габриела", "Ива", "Магдалена", "Лилия"],
} as const;

const latinLetters: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

export function transliterate(text: string): string {
  return text.replace(/ия(?=$|[ -])/giu, ending => ending[0] === "И" ? "Ia" : "ia").replace(/[а-я]/giu, letter => {
    const latin = latinLetters[letter.toLowerCase()] ?? letter;
    return letter === letter.toUpperCase() ? latin[0].toUpperCase() + latin.slice(1) : latin;
  });
}

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
  let bg = parent.bg.split(" ").at(-1) ?? "";
  if (gender === "female" && /(?:ов|ев|ин)$/iu.test(bg)) bg += "а";
  if (gender === "male" && /(?:ова|ева|ина)$/iu.test(bg)) bg = bg.slice(0, -1);
  return { bg, en: transliterate(bg) };
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
  const patronymic = base + (gender === "female" ? "а" : "");
  return { bg: [firstName, patronymic, surname.bg].join(" "), en: [transliterate(firstName), transliterate(patronymic), surname.en].join(" ") };
}

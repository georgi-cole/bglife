type Label = Readonly<{ bg: string; en: string }>;

const label = (bg: string, en: string): Label => ({ bg, en });

export const avatarStages = [
  { id: "baby", from: 0, previewAge: 0, tier: 0, label: label("Бебе", "Baby") },
  { id: "toddler", from: 2, previewAge: 3, tier: 1, label: label("Малко дете", "Toddler") },
  { id: "child", from: 5, previewAge: 8, tier: 2, label: label("Дете", "Child") },
  { id: "teen", from: 13, previewAge: 16, tier: 3, label: label("Тийнейджър", "Teen") },
  { id: "youngAdult", from: 18, previewAge: 25, tier: 4, label: label("Млад възрастен", "Young adult") },
  { id: "adult", from: 35, previewAge: 45, tier: 4, label: label("Зряла възраст", "Adult") },
  { id: "elder", from: 65, previewAge: 70, tier: 4, label: label("Старост", "Elder") },
] as const;

export type AvatarStage = typeof avatarStages[number];

export function getAvatarStage(age: number): AvatarStage {
  return [...avatarStages].reverse().find(stage => age >= stage.from) ?? avatarStages[0];
}

type Preset<Id extends string = string> = Readonly<{
  id: Id; label: Label; tier: number; early?: string;
}>;

const preset = <const Id extends string>(id: Id, bg: string, en: string, tier = 0, early?: string): Preset<Id> =>
  ({ id, label: label(bg, en), tier, early });

export const avatarPresets = {
  face: [
    preset("round", "Кръгло", "Round"),
    preset("oval", "Овално", "Oval", 1, "round"),
    preset("heart", "Сърцевидно", "Heart", 2, "round"),
    preset("square", "Квадратно", "Square", 2, "round"),
    preset("long", "Издължено", "Long", 3, "oval"),
    preset("diamond", "Ромбовидно", "Diamond", 4, "heart"),
  ],
  hair: [
    preset("crop", "Късо", "Crop"),
    preset("part", "На път", "Side part"),
    preset("bob", "Каре", "Bob", 1, "part"),
    preset("curls", "Къдрици", "Curls", 1, "crop"),
    preset("ponytail", "Опашка", "Ponytail", 2, "part"),
    preset("waves", "Вълни", "Waves", 2, "bob"),
    preset("bangs", "Бретон", "Fringe", 2, "bob"),
    preset("bun", "Кок", "Bun", 3, "ponytail"),
    preset("slick", "Зачесано назад", "Slick back", 4, "part"),
    preset("buzz", "Много късо", "Buzz cut", 4, "crop"),
  ],
  eyes: [
    preset("round", "Кръгли", "Round"),
    preset("almond", "Бадемови", "Almond"),
    preset("upturned", "Повдигнати", "Upturned", 1, "almond"),
    preset("hooded", "С паднал клепач", "Hooded", 2, "almond"),
    preset("downturned", "Спуснати", "Downturned", 3, "round"),
    preset("narrow", "Тесни", "Narrow", 4, "almond"),
  ],
  brows: [
    preset("soft", "Мека извивка", "Soft arch"),
    preset("straight", "Прави", "Straight", 2, "soft"),
    preset("full", "Плътни", "Full", 2, "soft"),
    preset("angled", "Под ъгъл", "Angled", 3, "straight"),
    preset("fine", "Тънки", "Fine", 3, "soft"),
  ],
  lips: [
    preset("soft", "Естествени", "Soft"),
    preset("full", "Плътни", "Full", 1, "soft"),
    preset("bow", "С извивка", "Cupid’s bow", 2, "soft"),
    preset("wide", "Широки", "Wide", 2, "soft"),
    preset("fine", "Тънки", "Thin", 3, "soft"),
  ],
} as const;

export type AvatarPart = keyof typeof avatarPresets;

export const avatarParts: readonly { id: AvatarPart; label: Label; tier: number }[] = [
  { id: "face", label: label("Лице", "Face"), tier: 0 },
  { id: "hair", label: label("Коса", "Hair"), tier: 0 },
  { id: "eyes", label: label("Очи", "Eyes"), tier: 0 },
  { id: "brows", label: label("Вежди", "Brows"), tier: 2 },
  { id: "lips", label: label("Устни", "Lips"), tier: 1 },
];

const shade = <const Id extends string>(id: Id, bg: string, en: string, color: string) =>
  ({ id, label: label(bg, en), color });

export const avatarPalettes = {
  skin: [
    shade("porcelain", "Порцеланова", "Porcelain", "#f6d5be"),
    shade("peach", "Прасковена", "Peach", "#efb997"),
    shade("sand", "Пясъчна", "Sand", "#dca071"),
    shade("olive", "Маслинена", "Olive", "#bf8960"),
    shade("umber", "Кестенява", "Umber", "#945a41"),
    shade("deep", "Тъмнокафява", "Deep brown", "#613d35"),
  ],
  hairColor: [
    shade("black", "Черно", "Black", "#302829"),
    shade("espresso", "Тъмнокафяво", "Espresso", "#49332c"),
    shade("chestnut", "Кестеняво", "Chestnut", "#784c3b"),
    shade("copper", "Медно", "Copper", "#a95635"),
    shade("honey", "Медено русо", "Honey blond", "#c79a60"),
    shade("ash", "Пепеляво русо", "Ash blond", "#ae9e82"),
  ],
  eyeColor: [
    shade("brown", "Кафяви", "Brown", "#6f442f"),
    shade("hazel", "Лешникови", "Hazel", "#967440"),
    shade("green", "Зелени", "Green", "#60866b"),
    shade("blue", "Сини", "Blue", "#5c8eb0"),
    shade("gray", "Сиви", "Gray", "#7c8f9b"),
  ],
} as const;

type Palette = keyof typeof avatarPalettes;

export const avatarPartColors: Partial<Record<AvatarPart, { key: Palette; label: Label }>> = {
  face: { key: "skin", label: label("Тен на кожата", "Skin tone") },
  hair: { key: "hairColor", label: label("Цвят на косата", "Hair color") },
  eyes: { key: "eyeColor", label: label("Цвят на очите", "Eye color") },
};

export type AvatarTraits = Readonly<
  { [Key in AvatarPart]: (typeof avatarPresets)[Key][number]["id"] }
  & { [Key in Palette]: (typeof avatarPalettes)[Key][number]["id"] }
>;

export const defaultAvatar: AvatarTraits = Object.freeze({
  face: "oval", hair: "waves", eyes: "almond", brows: "soft", lips: "bow",
  skin: "peach", hairColor: "chestnut", eyeColor: "hazel",
});

export function parseAvatar(value: unknown): AvatarTraits | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = value as Record<string, unknown>;
  const options = { ...avatarPresets, ...avatarPalettes };
  if (Object.keys(options).some(key => !options[key as keyof AvatarTraits].some(p => p.id === entries[key]))) {
    return null;
  }
  const { face, hair, eyes, brows, lips, skin, hairColor, eyeColor } = entries as AvatarTraits;
  return { face, hair, eyes, brows, lips, skin, hairColor, eyeColor };
}

function fitPreset<Id extends string>(options: readonly Preset<Id>[], id: Id, tier: number): Id {
  let option = options.find(preset => preset.id === id);
  // Follow the same feature family back until there is a version for this age.
  while (option && option.tier > tier) {
    option = options.find(preset => preset.id === option?.early);
  }
  return option?.id ?? options[0].id;
}

export const avatarTreatments = [
  { id: "aesthetics.hair", effect: "gloss", years: 2, label: label("Освежен цвят на косата", "Hair color refresh") },
  { id: "aesthetics.barber", effect: "trim", years: 1, label: label("Къса прическа", "Short haircut") },
  { id: "aesthetics.facial", effect: "facial", years: 1, label: label("По-гладка кожа", "Softer skin texture") },
  { id: "aesthetics.makeup", effect: "makeup", years: 1, label: label("Грим", "Make-up") },
  { id: "aesthetics.botox", effect: "lines", years: 1, label: label("По-меки мимически линии", "Softer expression lines") },
  { id: "aesthetics.filler", effect: "volume", years: 2, label: label("Повече обем на устните и бузите", "Fuller lips and cheeks") },
] as const;

export type AvatarTreatment = typeof avatarTreatments[number];

export function getAvatarTreatments(history: readonly { kind: string; id: string; age: number }[], age: number) {
  return avatarTreatments.filter(treatment =>
    history.some(entry => entry.kind === "action" && entry.id === treatment.id
      && entry.age <= age && age - entry.age < treatment.years));
}

const fraction = (value: number) => Math.max(0, Math.min(1, value));

export function getAvatarLook(traits: AvatarTraits | null, age: number, treatments: readonly AvatarTreatment[] = []) {
  const base = traits ?? defaultAvatar;
  const stage = getAvatarStage(age);
  const tier = stage.tier;
  const effects = new Set(treatments.map(treatment => treatment.effect));
  const fitted: AvatarTraits = {
    ...base,
    face: fitPreset(avatarPresets.face, base.face, tier),
    hair: effects.has("trim") ? "crop" : fitPreset(avatarPresets.hair, base.hair, tier),
    eyes: fitPreset(avatarPresets.eyes, base.eyes, tier),
    brows: fitPreset(avatarPresets.brows, base.brows, tier),
    lips: fitPreset(avatarPresets.lips, base.lips, tier),
  };
  const ageLines = fraction((age - 19) / 43);
  const maturity = fraction((age - 30) / 50);
  const facial = effects.has("facial");
  const fuller = effects.has("volume");
  const gloss = effects.has("gloss");

  return {
    traits: fitted, stage,
    skin: avatarPalettes.skin.find(shade => shade.id === base.skin)!.color,
    hair: avatarPalettes.hairColor.find(shade => shade.id === base.hairColor)!.color,
    iris: avatarPalettes.eyeColor.find(shade => shade.id === base.eyeColor)!.color,
    gray: fraction((age - 31) / 51) * (gloss ? .32 : 1),
    gloss,
    upperLines: ageLines * (effects.has("lines") ? .42 : 1) * (facial ? .76 : 1),
    lowerLines: ageLines * (fuller ? .68 : 1) * (facial ? .76 : 1),
    cheekAge: maturity * (fuller ? .6 : 1),
    lipVolume: (1 - maturity * .18) * (fuller ? 1.15 : 1),
    radiance: facial,
    makeup: effects.has("makeup"),
  };
}

export type AvatarLook = ReturnType<typeof getAvatarLook>;

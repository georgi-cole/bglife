import { useState } from "react";
import {
  avatarPalettes, avatarPartColors, avatarParts, avatarPresets, avatarStages, defaultAvatar, defaultMaleAvatar,
  getAvatarLook, getAvatarName, getAvatarStage, type AvatarPart, type AvatarPresentation, type AvatarTraits,
} from "./avatar.ts";
import { AvatarPortrait } from "./AvatarPortrait.tsx";
import type { Language } from "./session.ts";
import { Icon, MenuTitle, ageLabel, copy } from "./ui.tsx";
import "./avatar.css";

type Props = {
  l: Language;
  startAge: number;
  onClose: () => void;
  onStart: (traits: AvatarTraits) => void;
};

export function AvatarCreator({ l, startAge, onClose, onStart }: Props) {
  const [presentation, setPresentation] = useState<AvatarPresentation>("female");
  const [drafts, setDrafts] = useState({ female: defaultAvatar, male: defaultMaleAvatar });
  const traits = drafts[presentation];
  function setTraits(update: (current: AvatarTraits) => AvatarTraits) {
    setDrafts(current => ({ ...current, [presentation]: update(current[presentation]) }));
  }
  const [age, setAge] = useState(startAge);
  const [selectedPart, setSelectedPart] = useState<AvatarPart>("face");
  const t = (bg: string, en: string) => copy(l, bg, en);
  const startingStage = getAvatarStage(startAge);
  const look = getAvatarLook(traits, age);
  const availableParts = avatarParts.filter(part => part.tier <= look.stage.tier);
  const part = availableParts.find(part => part.id === selectedPart) ?? availableParts[0];
  const palette = avatarPartColors[part.id];

  return <section className="avatar-creator" aria-labelledby="avatar-heading">
    <header className="avatar-title">
      <MenuTitle onClose={onClose} closeLabel={t("Назад", "Back")}>
        <h1 id="avatar-heading">{t("Създай аватар", "Create avatar")}</h1>
      </MenuTitle>
    </header>

    <div className="avatar-workspace">
      <div className="avatar-preview-panel">
        <div className="avatar-preview">
          <AvatarPortrait look={look} className="avatar-preview-image" />
          <div className="avatar-preview-copy">
            <h2>{getAvatarName(traits)[l]}</h2>
            <p className="avatar-preview-age" aria-live="polite">{ageLabel(age, l)} · {look.stage.label[l]}</p>
            <p>{t("Разгледай всяка възраст. Историята започва на " + startAge + " г.",
              "Try any age. The story starts at " + startAge + ".")}</p>
          </div>
        </div>
        <fieldset className="avatar-presentation">
          <legend>{t("Герой", "Character")}</legend>
          <div className="avatar-stage-buttons">
            <button type="button" aria-pressed={presentation === "female"} onClick={() => setPresentation("female")}>
              {t("Момиче", "Female")}
            </button>
            <button type="button" aria-pressed={presentation === "male"} onClick={() => setPresentation("male")}>
              {t("Момче", "Male")}
            </button>
          </div>
        </fieldset>
        <fieldset className="avatar-stages">
          <legend>{t("Преглед по възраст", "Preview by age")}</legend>
          <div className="avatar-stage-buttons">
            {avatarStages.map((stage) => <button type="button" key={stage.id} aria-pressed={stage.id === look.stage.id}
              onClick={() => setAge(stage.id === startingStage.id ? startAge : stage.previewAge)}>{stage.label[l]}</button>)}
          </div>
        </fieldset>
      </div>

      <div className="avatar-controls">
        <div className="avatar-feature-tabs" role="group" aria-label={t("Черти", "Features")}>
          {availableParts.map(item => <button type="button" key={item.id} aria-pressed={item.id === part.id}
            onClick={() => setSelectedPart(item.id)}>{item.label[l]}</button>)}
        </div>
        <div className="avatar-feature-panel">
          {palette && <fieldset className="avatar-palette">
            <legend>{palette.label[l]}</legend>
            <div className="avatar-swatches">
              {avatarPalettes[palette.key].map(shade => <button type="button" key={shade.id}
                aria-label={shade.label[l]} aria-pressed={traits[palette.key] === shade.id} title={shade.label[l]}
                onClick={() => setTraits(current => ({ ...current, [palette.key]: shade.id }))}>
                <span style={{ backgroundColor: shade.color }}>{traits[palette.key] === shade.id && <Icon name="check" size={17} />}</span>
              </button>)}
            </div>
          </fieldset>}
          <fieldset className="avatar-options">
            <legend>{part.id === "face" ? t("Форма на лицето", "Face shape")
              : part.id === "hair" ? t("Прическа", "Hairstyle") : part.label[l]}</legend>
            <div className="avatar-option-grid" data-portrait-part={part.id}>
              {avatarPresets[part.id].filter(preset => preset.tier <= look.stage.tier).map(preset => {
                const selected = look.traits[part.id] === preset.id;
                const example = selected ? look : getAvatarLook({ ...traits, [part.id]: preset.id }, age);
                return <button type="button" key={preset.id} aria-pressed={selected}
                  onClick={() => { if (!selected) setTraits(current => ({ ...current, [part.id]: preset.id })); }}>
                  <AvatarPortrait look={example} className="avatar-option-image" region={part.id} />
                  <span>{preset.label[l]}</span>
                </button>;
              })}
            </div>
          </fieldset>
        </div>
      </div>
    </div>

    <footer className="avatar-actions">
      <button type="button" className="primary-button" onClick={() => onStart(traits)}>
        {t("Започни живота", "Start life")}<Icon name="right" size={19} />
      </button>
    </footer>
  </section>;
}

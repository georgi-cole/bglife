import { useState } from "react";
import { avatarPalettes, avatarPartColors, avatarParts, avatarPresets, getAvatarLook, type AvatarPart, type AvatarPresentation, type AvatarTraits } from "./avatar.ts";
import { AvatarPortrait } from "./AvatarPortrait.tsx";
import { CityPicker } from "./CityPicker.tsx";
import { cities, cityIds, type City } from "./cities.ts";
import { automaticAppearance, dispositions, generatedName, HEIR_CASH, talents, validName,
  type Disposition, type NewLifeDraft, type Talent } from "./lifeProfile.ts";
import { lifeDraw } from "./mortality.ts";
import type { Language } from "./session.ts";
import { Icon, MenuTitle, copy, money, type IconName } from "./ui.tsx";
import "./avatar.css";
import "./newLife.css";

type Props = { l: Language; vip: boolean; onVip: () => void; onClose: () => void; onStart: (draft: NewLifeDraft) => void };
type Editor = "appearance" | "disposition";
const sampleSeed = () => globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Date.now() >>> 0;

export function AvatarCreator({ l, vip, onVip, onClose, onStart }: Props) {
  const [seed, setSeed] = useState(sampleSeed);
  const [presentation, setPresentation] = useState<AvatarPresentation>("female");
  const [customName, setCustomName] = useState<string | null>(null);
  const [birthCity, setBirthCity] = useState<City>("tryavna");
  const [talent, setTalent] = useState<Talent>("none");
  const [wealthy, setWealthy] = useState(false);
  const [disposition, setDisposition] = useState<Disposition | null>(null);
  const [edited, setEdited] = useState<Partial<Record<AvatarPresentation, AvatarTraits>>>({});
  const [editor, setEditor] = useState<Editor | null>(null);
  const [selectedPart, setSelectedPart] = useState<AvatarPart>("face");
  const t = (bg: string, en: string) => copy(l, bg, en);
  const suggestedName = generatedName(seed, presentation);
  const name = customName ?? suggestedName;
  const normalized = validName(name);
  const traits = (vip && edited[presentation]) || automaticAppearance(presentation, seed);
  const look = getAvatarLook(traits, 0);
  const availableParts = avatarParts.filter(part => part.tier <= look.stage.tier);
  const part = availableParts.find(part => part.id === selectedPart) ?? availableParts[0];
  const palette = avatarPartColors[part.id];
  const row = (icon: IconName, label: string, value: string, action: () => void, active: boolean, kind?: Editor) =>
    <button type="button" className="setup-vip-row" data-option={kind ?? "wealthy"} disabled={!vip} onClick={action}
      aria-pressed={!kind ? active : undefined} aria-expanded={kind ? active : undefined}>
      <span className="setup-icon"><Icon name={icon} size={19}/></span>
      <span><strong>{label}</strong><small>{value}</small></span>
      <Icon name={vip ? kind ? "down" : wealthy ? "check" : "plus" : "key"} size={16}/>
    </button>;

  function changeTraits(patch: Partial<AvatarTraits>) {
    setEdited(current => ({ ...current, [presentation]: { ...traits, ...patch } }));
  }
  function reroll() {
    const next = sampleSeed();
    const fields = Object.keys(talents) as Talent[];
    setSeed(next);
    setPresentation(lifeDraw(next,0,0x531ba287) < .5 ? "female" : "male");
    setBirthCity(cityIds[Math.floor(lifeDraw(next,0,0x9ae82571) * cityIds.length)]);
    setTalent(fields[Math.floor(lifeDraw(next,0,0x641e8d01) * fields.length)]);
    setCustomName(null);
    setEdited({});
    setEditor(null);
    setDisposition(null);
    setWealthy(false);
  }
  function toggleVip() {
    if (vip) {
      setWealthy(false);
      setDisposition(null);
      setEdited({});
      setEditor(null);
    }
    onVip();
  }
  function start() {
    if (!normalized) return;
    onStart({ seed, city: birthCity, presentation, avatar: traits,
      profile: { name: normalized, talent, vip, wealthy: vip && wealthy, disposition: vip ? disposition : null } });
  }

  return <section className="setup-life" aria-labelledby="new-life-heading">
    <header className="setup-head">
      <MenuTitle onClose={onClose} closeLabel={t("Назад", "Back")} back>
        <h1 id="new-life-heading">{t("Нов живот", "New life")}</h1>
      </MenuTitle>
      <button type="button" className="setup-shuffle" onClick={reroll} aria-label={t("Случаен профил", "Randomize profile")}>
        <Icon name="shuffle" size={18}/>{t("Разбъркай", "Randomize")}
      </button>
    </header>

    <section className="setup-preview" aria-label={t("Новородено", "Newborn")}>
      <AvatarPortrait look={look} className="setup-baby"/>
      <div>
        <span>{t("Новородено", "Newborn")}</span>
        <h2>{name.trim() || suggestedName}</h2>
        <p><Icon name="pin" size={15}/>{cities[birthCity].name[l]}</p>
      </div>
    </section>

    <div className="setup-fields">
      <div className="setup-field">
        <label htmlFor="life-name">{t("Име", "Name")}</label>
        <input id="life-name" value={name} maxLength={48} autoComplete="off" aria-invalid={!normalized}
          aria-describedby={!normalized ? "life-name-error" : undefined}
          onChange={event => setCustomName(event.target.value)}/>
        {!normalized && <small className="setup-error" id="life-name-error">{t("Въведи име с букви.", "Enter a name using letters.")}</small>}
      </div>
      <fieldset className="setup-field setup-gender">
        <legend>{t("Пол", "Sex")}</legend>
        <div>
          <button type="button" aria-pressed={presentation === "female"} onClick={() => setPresentation("female")}>{t("Момиче","Girl")}</button>
          <button type="button" aria-pressed={presentation === "male"} onClick={() => setPresentation("male")}>{t("Момче","Boy")}</button>
        </div>
      </fieldset>
      <div className="setup-field">
        <label htmlFor="birth-city">{t("Град на раждане", "Birth city")}</label>
        <CityPicker id="birth-city" city={birthCity} language={l} onChange={setBirthCity} allowRandom/>
      </div>
      <div className="setup-field">
        <label htmlFor="life-talent">{t("Талант","Talent")}</label>
        <select id="life-talent" value={talent} onChange={event => setTalent(event.target.value as Talent)}>
          {(Object.keys(talents) as Talent[]).map(id => <option value={id} key={id}>{talents[id][l]}</option>)}
        </select>
      </div>
    </div>

    <section className="setup-vip" aria-labelledby="setup-vip-title">
      <div className="setup-vip-head">
        <h2 id="setup-vip-title">VIP</h2>
        <button type="button" aria-pressed={vip} onClick={toggleVip} data-testid="trial-vip">
          {vip ? t("VIP е включен за теста","VIP trial is on") : t("Пробвай VIP","Try VIP")}
        </button>
      </div>
      {row("wallet", t("Богат наследник","Wealthy heir"), money(HEIR_CASH,l), () => setWealthy(!wealthy), wealthy)}
      {row("eye", t("Избери външност","Choose appearance"), vip && edited[presentation]
        ? t("Персонализирана","Custom") : t("Автоматична","Automatic"), () => setEditor(editor === "appearance" ? null : "appearance"), editor === "appearance", "appearance")}
      {vip && editor === "appearance" && <section className="setup-custom" aria-label={t("Външност на новороденото","Newborn appearance")}>
        <div className="avatar-feature-tabs" role="group" aria-label={t("Части на лицето", "Facial features")}>
          {availableParts.map(item => <button type="button" key={item.id} aria-pressed={item.id === part.id}
            onClick={() => setSelectedPart(item.id)}>{item.label[l]}</button>)}
        </div>
        {palette && <fieldset className="avatar-palette">
          <legend>{palette.label[l]}</legend>
          <div className="avatar-swatches">
            {avatarPalettes[palette.key].map(shade => <button type="button" key={shade.id} aria-label={shade.label[l]}
              aria-pressed={traits[palette.key] === shade.id} onClick={() => changeTraits({ [palette.key]: shade.id })}>
              <span style={{ backgroundColor: shade.color }}>{traits[palette.key] === shade.id && <Icon name="check" size={17}/>}</span>
            </button>)}
          </div>
        </fieldset>}
        <div className="avatar-option-grid">
          {avatarPresets[part.id].filter(preset => preset.tier <= look.stage.tier).map(preset => (
            <button type="button" key={preset.id} aria-pressed={look.traits[part.id] === preset.id}
              onClick={() => changeTraits({ [part.id]: preset.id })}>
              <AvatarPortrait look={getAvatarLook({ ...traits, [part.id]: preset.id }, 0)} className="avatar-option-image" region={part.id}/>
              <span>{preset.label[l]}</span>
            </button>
          ))}
        </div>
      </section>}
      {row("sparkle", t("Избери черти","Choose traits"), disposition ? dispositions[disposition].label[l]
        : t("По подразбиране","Default"), () => setEditor(editor === "disposition" ? null : "disposition"), editor === "disposition", "disposition")}
      {vip && editor === "disposition" && <fieldset className="setup-custom setup-traits">
        <legend>{t("Характер","Personality")}</legend>
        {(Object.keys(dispositions) as Disposition[]).map(id => <button type="button" key={id} aria-pressed={disposition === id}
          onClick={() => setDisposition(disposition === id ? null : id)}>
          <strong>{dispositions[id].label[l]}</strong><small>{dispositions[id].effect[l]}</small>
        </button>)}
      </fieldset>}
    </section>
    <footer className="setup-footer">
      <button type="button" className="primary-button" disabled={!normalized} onClick={start}>
        {t("Започни живота","Start life")}<Icon name="right" size={19}/>
      </button>
    </footer>
  </section>;
}

import { useLayoutEffect, useRef, useState } from "react";
import { cleanFirstName } from "./babyNames.ts";
import type { GameState } from "./engine.ts";
import { newbornName, newbornSurname, type BirthNaming, type SurnameSource } from "./reproduction.ts";
import type { Language } from "./session.ts";
import { Icon, copy } from "./ui.tsx";
import "./birth-naming.css";

export function BirthNamingDialog({ life, birth, l, onSave }: {
  life: GameState; birth: BirthNaming; l: Language; onSave: (names: string[], surname: SurnameSource) => void;
}) {
  const [names, setNames] = useState(() => birth.newborns.map(baby => baby.firstName));
  const [surname, setSurname] = useState(birth.surnames[0]);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const t = (bg: string, en: string) => copy(l, bg, en);
  const validNames = names.map(cleanFirstName);
  const valid = validNames.every(name => name !== null);
  const children = life.lifeSystems.family.childProfiles;
  const count = birth.newborns.length;

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    title.current?.focus({ preventScroll: true });
    return () => { if (element.open) element.close(); };
  }, []);

  return <dialog ref={dialog} className="modal-card birth-naming" aria-labelledby="birth-naming-title"
    onCancel={event => event.preventDefault()}>
    <header className="birth-naming-header">
      <span className="birth-naming-icon"><Icon name="heart" size={23}/></span>
      <h2 id="birth-naming-title" ref={title} tabIndex={-1}>
        {count === 3 ? t("Родиха се тризнаци!", "Triplets!") : count === 2 ? t("Родиха се близнаци!", "Twins!") : t("Роди се бебе!", "A baby was born!")}
      </h2>
    </header>
    <form onSubmit={e => { e.preventDefault(); if (valid) onSave(names, surname); }}>
      {birth.surnames.length > 1 && <fieldset className="birth-surname-options">
        <legend>{count === 1 ? t("Фамилия на бебето", "Baby’s surname") : t("Фамилия на бебетата", "Babies’ surname")}</legend>
        {birth.surnames.map(source => {
          const surnames = [...new Set(birth.newborns.map(({ index }) => newbornSurname(birth, source, children[index].gender)[l]))];
          return <label className="birth-surname-option" key={source}>
            <input type="radio" name="birth-surname" value={source} checked={surname === source} onChange={() => setSurname(source)}/>
            <span><strong>{surnames.join(" / ")}</strong><small>{source === "father" ? t("От бащата", "From the father") : t("От майката", "From the mother")}</small></span>
          </label>;
        })}
      </fieldset>}
      <div className="birth-name-fields">
        {birth.newborns.map(({ index }, order) => {
          const { gender } = children[index];
          const sex = gender === "female" ? t("Момиче", "Girl") : t("Момче", "Boy");
          const previewName = validNames[order];
          return <label key={index} className="birth-name-field">
            <span>{count === 1 ? t("Собствено име", "First name") : t("Бебе ", "Baby ") + (order + 1)} <small>{sex}</small></span>
            <input type="text" value={names[order]} maxLength={36} autoComplete="off" required name={"newborn-" + index}
              aria-invalid={previewName === null} onChange={e => setNames(current => current.map((name, i) => i === order ? e.target.value : name))}/>
            <small aria-live="polite">
              {previewName ? newbornName(birth, previewName, surname, gender)[l] : t("Въведи име с букви, интервал или тире.", "Enter a name with letters, spaces or a hyphen.")}
            </small>
          </label>;
        })}
      </div>
      <button className="primary-button birth-name-save" type="submit" disabled={!valid}>
        {count === 1 ? t("Запиши името", "Save name") : t("Запиши имената", "Save names")}<Icon name="check" size={18}/>
      </button>
    </form>
  </dialog>;
}

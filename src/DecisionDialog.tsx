import { useLayoutEffect, useRef } from "react";
import type { JournalDecision } from "./journalDecisions.ts";
import type { Language } from "./session.ts";
import { Icon, ageLabel, copy, money } from "./ui.tsx";
import "./decision-dialog.css";

export function DecisionDialog({ decision, age, l, onClose, onChoose }: {
  decision: JournalDecision; age: number; l: Language; onClose: () => void; onChoose: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const local = decision.kind === "city";
  const skipLabel = copy(l, "Пропусни събитието", "Skip event");

  useLayoutEffect(() => {
    const panel = dialog.current;
    if (!panel) return;
    panel.showModal();
    heading.current?.focus({ preventScroll: true });
    return () => { if (panel.open) panel.close(); };
  }, []);

  return <dialog ref={dialog} className="decision-dialog" data-kind={decision.kind} data-testid="decision-dialog"
    aria-labelledby="scene-heading" aria-describedby="decision-situation"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="decision-head">
      <span className="decision-emblem"><Icon name={local ? "pin" : "sparkle"} size={19}/></span>
      <span className="decision-age">{decision.date?.[l] || ageLabel(age, l)}</span>
      <button className="decision-close" type="button" aria-label={skipLabel} title={skipLabel} onClick={onClose}>
        <Icon name="close" size={19}/>
      </button>
    </header>
    <h2 id="scene-heading" tabIndex={-1} ref={heading}>{decision.title[l]}</h2>
    <p id="decision-situation">{decision.body[l]}</p>
    <div className="decision-options">
      {decision.options.map(({option, blocked}) => {
        const cash = decision.kind !== "story" ? option.effect?.cash ?? 0 : 0;
        return <button type="button" className="decision-option" data-choice={option.id} key={option.id}
          disabled={blocked} onClick={() => onChoose(option.id)}>
          <strong>{option.label[l]}</strong>
          {cash !== 0 && <span className={cash > 0 ? "cash-in" : "cash-out"}>{cash > 0 ? "+" : ""}{money(cash, l)}</span>}
          <span className="decision-arrow"><Icon name="next" size={16}/></span>
        </button>;
      })}
      {!decision.options.length && <p>{copy(l, "В момента няма достъпен вариант.", "No option is available right now.")}</p>}
    </div>
  </dialog>;
}

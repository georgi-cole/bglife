
import { useLayoutEffect, useRef } from "react";
import type { Language } from "./session.ts";
import { Icon, copy } from "./ui.tsx";
import type { getWorkDecision } from "./workplace.ts";
import "./workplace.css";

export function WorkDecisionDialog({ decision, l, onChoose }: {
  decision: NonNullable<ReturnType<typeof getWorkDecision>>;
  l: Language;
  onChoose: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const skip = () => onChoose(decision.dismiss);
  useLayoutEffect(() => {
    const panel = dialog.current;
    if (!panel) return;
    panel.showModal();
    heading.current?.focus({ preventScroll: true });
    return () => { if (panel.open) panel.close(); };
  }, []);
  return <dialog ref={dialog} className="work-decision" data-testid="work-decision" aria-labelledby="work-decision-title"
    aria-describedby="work-decision-situation" onCancel={event => { event.preventDefault(); skip(); }}>
    <header className="work-decision-head">
      <span className="workplace-emblem"><Icon name="bag" size={22}/></span>
      <span>{decision.employer[l]}</span>
      <button type="button" className="work-decision-skip" onClick={skip}>{copy(l, "Пропусни", "Skip")}</button>
    </header>
    <h2 id="work-decision-title" ref={heading} tabIndex={-1}>{decision.title[l]}</h2>
    <p id="work-decision-situation">{decision.situation[l]}</p>
    <div className="work-decision-options">
      {decision.choices.map(choice => <button type="button" className="career-action-row" key={choice.id}
        data-work-choice={choice.id} onClick={() => onChoose(choice.id)}>
        <strong>{choice.label[l]}</strong><Icon name="next" size={17}/>
      </button>)}
    </div>
  </dialog>;
}

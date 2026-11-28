import { useLayoutEffect, useRef } from "react";
import { pregnancyNoticeCopy } from "./pregnancyTimeline.ts";
import type { PregnancyNotice } from "./reproduction.ts";
import type { Language } from "./session.ts";
import { Icon, copy } from "./ui.tsx";
import "./pregnancy.css";

export function PregnancyDialog({ notice, l, onProceed }: { notice: PregnancyNotice; l: Language; onProceed: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const t = (bg: string, en: string) => copy(l, bg, en);
  const test = notice.kind === "test";
  const { title, text, action } = pregnancyNoticeCopy(notice);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  useLayoutEffect(() => titleRef.current?.focus({ preventScroll: true }), [notice.kind]);

  return <dialog ref={ref} className="modal-card pregnancy-dialog" data-pregnancy-notice={notice.kind} aria-labelledby="pregnancy-dialog-title"
    onCancel={event => { event.preventDefault(); if (!test) onProceed(); }}>
    <header className="pregnancy-dialog-header">
      <span className="pregnancy-dialog-icon"><Icon name={notice.kind === "confirmed" ? "heart" : "journal"} size={22}/></span>
      <h2 id="pregnancy-dialog-title" ref={titleRef} tabIndex={-1}>{title[l]}</h2>
    </header>
    <p>{text[l]}</p>
    {notice.kind === "confirmed" && <p className="pregnancy-dialog-hint">{t("Бутонът Play ще те преведе през трите триместъра.", "The Play button will take you through the three trimesters.")}</p>}
    <button type="button" className="primary-button pregnancy-dialog-action" onClick={onProceed}>{action[l]}<Icon name="next" size={16}/></button>
  </dialog>;
}

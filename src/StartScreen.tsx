import React from "react";
import { art } from "../scripts/art";
import { hasStartedLife, type GameState } from "./engine.ts";
import type { Language } from "./session.ts";
import { Icon, PlaySymbol, ageLabel, copy, lifeName, town } from "./ui.tsx";
import "./start.css";

type Props = {
  life: GameState;
  l: Language;
  onContinue: () => void;
  onNewLife: () => void;
  onAlbum: () => void;
  onGuide: () => void;
  children: React.ReactNode;
};

export function StartScreen({ life, l, onContinue, onNewLife, onAlbum, onGuide, children }: Props) {
  const t = (bg: string, en: string) => copy(l, bg, en);
  const hasLife = hasStartedLife(life);
  const progress = [ageLabel(life.age, l), town(life.city, l)];
  if (life.endReason === "gaveUp") progress.push(t("Приключена история", "Story ended"));
  else if (life.death) progress.push(t("Край на живота", "Life ended"));
  else if (life.finished) progress.push(t("Завършена история", "Story complete"));

  return <div className="start-screen">
    <header className="start-cover">
      <img className="start-cover-art" src={art.tryavna} alt="" fetchPriority="high" />
      <div className="start-cover-actions">{children}</div>
      <div className="start-cover-title">
        <h1>Bg<em>Life</em></h1>
        <p>{t("Симулатор на живота в България", "A life simulator set in Bulgaria")}</p>
      </div>
    </header>

    <nav className="start-actions" aria-label={t("Начално меню", "Main menu")}>
      <button className="start-primary" onClick={hasLife ? onContinue : onNewLife}>
        <span className="start-play"><PlaySymbol /></span>
        <span className="start-primary-text">
          <strong>{hasLife ? t("Продължи", "Continue") : t("Нов живот", "New life")}</strong>
          <small>{(hasLife ? [lifeName(l, life), ...progress] : [t("Избери име, град и талант", "Choose a name, city and talent")]).join(" · ")}</small>
        </span>
        <Icon name="next" size={19} />
      </button>

      {hasLife && <button className="start-option start-option-wide" onClick={onNewLife}>
        <Icon name="plus" size={20} />
        <span>{t("Нов живот", "New life")}</span>
        <Icon name="next" size={17} />
      </button>}

      <div className="start-shortcuts">
        <button className="start-option" onClick={onAlbum}><Icon name="album" size={20} />{t("Албум", "Album")}</button>
        <button className="start-option" onClick={onGuide}><Icon name="help" size={20} />{t("Как се играе", "How to play")}</button>
      </div>
    </nav>
  </div>;
}

export function StartGuide({ l }: { l: Language }) {
  const t = (bg: string, en: string) => copy(l, bg, en);
  return <ol className="start-guide">
    <li>{t("Започваш като новородено. Избери име, град на раждане и талант. В „Живот“ решаваш какво да правиш през годината.", "You start as a newborn. Choose your name, birth city and talent. Use Life to decide what to do during the year.")}</li>
    <li>{t("Натисни „+1 година“, за да продължиш. Дневникът показва какво се е случило през годината.", "Tap “+1 year” to move on. The journal shows what happened that year.")}</li>
    <li>{t("В „Още“ избираш как да използваш свободното си време. Показателите под навигацията се променят с решенията, дейностите и изминалите години.", "Use More to decide how to spend your free time. The bars below navigation change with decisions, activities, and the passing years.")}</li>
    <li>{t("Играта се запазва автоматично в този браузър. Миналите истории са в „Албум“.", "The game saves automatically in this browser. Past stories are in Album.")}</li>
  </ol>;
}

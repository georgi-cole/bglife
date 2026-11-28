import { useState, type ReactNode } from "react";
import type { GameState } from "./engine.ts";
import type { Language } from "./session.ts";
import { specialCareerIds, specialCareers } from "./specialCareerCatalog.ts";
import { specialCareerView } from "./specialCareers.ts";
import type { SpecialAction, SpecialCard, SpecialCareerId } from "./specialCareerTypes.ts";
import { Icon, copy, money, type IconName } from "./ui.tsx";
import "./special-career.css";

type Props = { s: GameState; l: Language; renderActions: (actions: SpecialAction[]) => ReactNode };
const icons: Record<SpecialCareerId, IconName> = { creator: "video", actor: "sparkle", athlete: "shoes", politics: "people" };

export function SpecialCards({ cards, l, renderActions }: Pick<Props, "l" | "renderActions"> & { cards: SpecialCard[] }) {
  return <>{cards.map(card => {
    const body = <div className="special-card-body">
      {card.detail && !card.fold && <p>{card.detail[l]}</p>}
      {card.facts?.map(({ label, value, money: isMoney }) => <div className="career-row" key={label.en}>
        <span>{label[l]}</span><strong>{typeof value !== "number" ? value[l] : isMoney ? money(value, l) : value.toLocaleString(l === "bg" ? "bg-BG" : "en-GB")}</strong>
      </div>)}
      {card.meters?.map(({ label, value }) => <div className="special-meter" key={label.en}>
        <div><span>{label[l]}</span><strong>{value}%</strong></div>
        <progress aria-label={label[l]} value={value} max={100}/>
      </div>)}
      {card.actions && renderActions(card.actions)}
    </div>;
    return card.fold ? <details className="career-card career-fold special-career-card" key={card.id}>
      <summary><span><strong>{card.title[l]}</strong>{card.detail && <small>{card.detail[l]}</small>}</span><Icon name="down" size={16}/></summary>
      {body}
    </details> : <section className="career-card special-career-card" key={card.id}>
      <h2>{card.title[l]}</h2>{body}
    </section>;
  })}</>;
}

export function SpecialCareerPanel({ s, l, renderActions }: Props) {
  const [active, setActive] = useState<SpecialCareerId | null>(null);
  const [showAway, setShowAway] = useState(false);
  const t = (bg: string, en: string) => copy(l, bg, en);
  const progress = s.path?.special;
  if (!active) return <section className="career-card special-career-panel" data-testid="special-careers">
    <h2>{t("Специални кариери", "Special careers")}</h2>
    {progress && progress.fame > 0 && <div className="career-row"><span>{t("Известност", "Fame")}</span><strong>{progress.fame}%</strong></div>}
    {!!progress?.careerReceipts && <div className="career-row"><span>{t("Хонорари и премии общо", "Fees and prizes to date")}</span><strong>{money(progress.careerReceipts, l)}</strong></div>}
    <div className="special-career-choices">
      {specialCareerIds.map(id => {
        const item = specialCareers[id], locked = s.age < item.minAge;
        return <button type="button" className="career-action-row" key={id} data-special-career={id} disabled={locked}
          onClick={() => { setActive(id); setShowAway(false); }}>
          <span className="special-career-icon"><Icon name={icons[id]} size={21}/></span>
          <span><strong>{item.title[l]}</strong><small>{locked ? t("От " + item.minAge + " г.", "From age " + item.minAge) : item.summary[l]}</small></span>
          <Icon name={locked ? "key" : "next"} size={17}/>
        </button>;
      })}
    </div>
  </section>;
  const item = specialCareers[active];
  const { cards } = specialCareerView(s, active);
  const here = cards.filter(card => !card.city || card.city === s.city || !card.fold);
  const away = cards.filter(card => card.city && card.city !== s.city && card.fold);
  return <section className="special-career-panel" data-special-track={active}>
    <header className="career-card special-career-hero">
      <span className="special-career-icon"><Icon name={icons[active]} size={22}/></span>
      <h2>{item.title[l]}</h2>
      <button type="button" className="career-route-link" onClick={() => setActive(null)}>
        <Icon name="back" size={15}/>{t("Кариери", "Careers")}
      </button>
    </header>
    <SpecialCards cards={here} l={l} renderActions={renderActions}/>
    {away.length > 0 && <button type="button" className="career-action-row special-away" aria-expanded={showAway} onClick={() => setShowAway(!showAway)}>
      <strong>{t("Други градове", "Other cities")}</strong><Icon name="down" size={16}/>
    </button>}
    {showAway && <SpecialCards cards={away} l={l} renderActions={renderActions}/>}
  </section>;
}

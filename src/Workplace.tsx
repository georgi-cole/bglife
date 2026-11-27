
import { useState } from "react";
import { Actions, Row } from "./Career.tsx";
import type { GameState } from "./engine.ts";
import { netMonthly } from "./pathPolicy.ts";
import type { Language } from "./session.ts";
import { Icon, MenuTitle, copy, money } from "./ui.tsx";
import { workplaceView } from "./workplace.ts";
import "./workplace.css";

export function Workplace({ s, l, onAction, onClose, onCareer }: {
  s: GameState;
  l: Language;
  onAction: (id: string) => void;
  onClose: () => void;
  onCareer: () => void;
}) {
  const t = (bg: string, en: string) => copy(l, bg, en);
  const work = s.finished ? null : workplaceView(s);
  const [openPerson, setOpenPerson] = useState<string | null>(null);
  const last = s.history.at(-1);
  const feedback = last?.age === s.age && !last.decision && (last.id.startsWith("workplace.") || ["work.raise", "work.leave"].includes(last.id)) ? last : null;
  const track = { s, l, onAction };
  return <section className="career-view workplace-view" data-panel="work" data-testid="workplace" aria-labelledby="workplace-title">
    <header className="career-heading">
      <MenuTitle onClose={onClose} closeLabel={t("Към дневника", "Back to journal")} back>
        <h1 id="workplace-title">{t("Работа", "Work")}</h1>
      </MenuTitle>
      <button className="career-route-link" type="button" data-testid="open-career" onClick={onCareer}>
        <Icon name="school" size={16}/>{s.age < 18 ? t("Даскало", "Education") : t("Кариера", "Career")}<Icon name="next" size={13}/>
      </button>
    </header>
    {feedback && <div className="career-feedback" role="status">
      <Icon name="check" size={17}/><p>{feedback.text[l]}</p>
    </div>}
    {work ? <>
      <section className="career-card workplace-contract">
        <div className="workplace-role">
          <span className="workplace-emblem"><Icon name="bag" size={23}/></span>
          <div><h2>{work.job.title[l]}</h2><p>{work.job.employer[l]}</p></div>
        </div>
        <div className="workplace-facts">
          <span>{t("Нетно / месец", "Take-home / month")} <strong>{money(netMonthly(work.contract.gross), l)}</strong></span>
          <span>{t("Работно време", "Working hours")} <strong>{work.contract.hours} {t("ч./ден", "h/day")}</strong></span>
        </div>
        <div className="career-progress">
          <p>{t("Представяне", "Performance")}</p>
          <progress max={100} value={work.contract.performance} aria-label={t("Представяне на работа", "Job performance")}/>
        </div>
      </section>
      <section className="career-card">
        <h2>{t("Задачи", "Tasks")}</h2>
        <Actions {...track} items={work.tasks}/>
      </section>
      <section className="career-card">
        <h2>{t("Екип", "Team")}</h2>
        <ul role="list" className="workplace-team">
          {work.team.map(person => {
            const open = openPerson === work.key + person.id;
            const boss = person.id === "boss";
            const initials = person.name[l].split(" ").map(word => word[0]).join("");
            return <li key={work.key + person.id} data-work-contact={person.id}>
              <button className="workplace-person" type="button" aria-expanded={open} aria-controls={"team-" + person.id}
                onClick={() => setOpenPerson(open ? null : work.key + person.id)}>
                <span className={"workplace-initials" + (boss ? " workplace-boss" : "")} aria-hidden="true">{initials}</span>
                <span className="workplace-person-name"><strong>{person.name[l]}</strong>
                  <small>{boss ? t("Шеф", "Supervisor") + " · " : ""}{person.role[l]}</small></span>
                <Icon name="down" size={15}/>
              </button>
              <div className="workplace-contact-actions" id={"team-" + person.id} hidden={!open}>
                <div className="career-progress">
                  <p>{t("Отношения", "Relationship")}</p>
                  <progress className="workplace-bond" max={100} value={person.bond}
                    data-tone={person.bond < 25 ? "red" : person.bond < 40 ? "orange" : person.bond < 55 ? "yellow" : "green"}
                    aria-label={t("Отношения с ", "Relationship with ") + person.name[l]}/>
                </div>
                <Actions {...track} items={person.actions}/>
              </div>
            </li>;
          })}
        </ul>
      </section>
      <details className="career-card career-fold workplace-contract-details">
        <summary><strong>{t("Трудов договор", "Employment contract")}</strong><Icon name="down" size={16}/></summary>
        <div className="career-fold-content">
          <Row label={t("Брутно / месец", "Gross / month")}>{money(work.contract.gross, l)}</Row>
          <Row label={t("Вид договор", "Contract type")}>{work.contract.monthsLeft === null ? t("Безсрочен", "Permanent")
            : t("Срочен · ", "Fixed-term · ") + work.contract.monthsLeft + t(" мес.", " mo")}</Row>
          <Actions {...track} items={work.contractActions}/>
        </div>
      </details>
    </> : <section className="career-card">
      <h2>{t("Нямаш текуща работа", "No current job")}</h2>
      <button className="secondary-button" type="button" onClick={onCareer}>{t("Към обявите", "Browse vacancies")}<Icon name="next" size={15}/></button>
    </section>}
  </section>;
}

import { useLayoutEffect, useRef, useState } from "react";
import { acquiredHome, assetPageData, assetParent, type AssetPage, type AssetRow } from "./assetMenu.ts";
import type { GameState, LifeActivityOption, Memory } from "./engine.ts";
import { JournalFinances } from "./LifeTimeline.tsx";
import type { Language } from "./session.ts";
import { ageLabel, copy, Icon, MenuTitle, money, town } from "./ui.tsx";
import "./assets.css";

function signed(amount: number, l: Language): string {
  return (amount > 0 ? "+" : "") + money(amount, l);
}

function AssetsRow({ row, l, onOpen, shop }: {
  row: AssetRow; l: Language; onOpen: (page: AssetPage) => void; shop?: boolean;
}) {
  return <button type="button" className={shop ? "asset-row asset-shop" : "asset-row"} onClick={() => onOpen(row.page)}>
    <span className="asset-icon" data-icon={row.icon}><Icon name={row.icon} size={18}/></span>
    <span className="asset-row-text">
      <strong>{row.label[l]}</strong>
      {row.hint && <small>{row.hint[l]}</small>}
    </span>
    {row.value !== undefined && <span className="asset-row-value">{money(row.value, l)}</span>}
    <Icon name="next" size={14}/>
  </button>;
}

function Transaction({ option, active, direct, l, onOpen, onConfirm }: {
  option: LifeActivityOption; active: boolean; direct: boolean; l: Language;
  onOpen: () => void; onConfirm: () => void;
}) {
  const value = option.cashDelta;
  const price = value ? signed(value, l) : null;
  if (direct) return <div className="asset-transaction">
    {option.blocked && <p className="asset-blocked">{option.blocked[l]}</p>}
    <button type="button" className="primary-button asset-confirm" data-asset-confirm={option.id}
      disabled={Boolean(option.blocked)} onClick={onConfirm}>
      {option.label[l]}{price && <span>{money(Math.abs(value), l)}</span>}
    </button>
  </div>;

  return <div className="asset-transaction">
    <button type="button" className="asset-row" onClick={onOpen} aria-expanded={active}>
      <span className="asset-icon"><Icon name={option.blocked ? "key" : "wallet"} size={17}/></span>
      <span className="asset-row-text"><strong>{option.label[l]}</strong></span>
      {price && <span className="asset-row-value">{price}</span>}
      <Icon name={active ? "down" : "next"} size={14}/>
    </button>
    {active && <div className="asset-transaction-body">
      <p>{option.description[l]}</p>
      {option.blocked ? <p className="asset-blocked">{option.blocked[l]}</p> :
        <button type="button" className="primary-button asset-confirm" data-asset-confirm={option.id} onClick={onConfirm}>
          {copy(l, "Потвърди", "Confirm")}<Icon name="check" size={16}/>
        </button>}
    </div>}
  </div>;
}

type Props = {
  life: GameState; l: Language; initialPage: "overview" | "funds"; onClose: () => void;
  onAction: (id: string) => Memory | undefined; onJournal: (entry: Memory) => void;
};

export function Assets({ life, l, initialPage, onClose, onAction, onJournal }: Props) {
  const [page, setPage] = useState<AssetPage>({ kind: initialPage });
  const [selected, setSelected] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Memory | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const data = assetPageData(life, page);
  const parent = assetParent(page);
  const t = (bg: string, en: string) => copy(l, bg, en);

  useLayoutEffect(() => {
    const element = heading.current;
    const viewport = element?.closest(".game-layout");
    if (viewport) viewport.scrollTop = 0;
    element?.focus({ preventScroll: true });
  }, [page]);

  function open(next: AssetPage) {
    setSelected(null);
    setReceipt(null);
    setPage(next);
  }

  function transact(id: string) {
    const entry = onAction(id);
    if (!entry) return;
    setSelected(null);
    setReceipt(entry);
  }

  return <section className="assets-screen" aria-labelledby="assets-heading">
    <header className="assets-heading">
      <MenuTitle back={Boolean(parent)} onClose={parent ? () => open(parent) : onClose}
        closeLabel={parent ? t("Назад", "Back") : t("Към дневника", "Back to journal")}>
        <h1 id="assets-heading" tabIndex={-1} ref={heading}>{data.title[l]}</h1>
      </MenuTitle>
    </header>
    {receipt && <div className="asset-receipt">
      <div role="status"><strong>{receipt.title[l]}</strong><p>{receipt.text[l]}</p></div>
      <button type="button" className="secondary-button" onClick={() => onJournal(receipt)}>
        {t("Към дневника", "View in journal")}<Icon name="next" size={14}/>
      </button>
    </div>}
    {data.summary && <div className="assets-balance">
      <div><span>{data.summary.label[l]}</span><strong>{money(data.summary.value, l)}</strong></div>
      <Icon name={page.kind === "investments" ? "trend" : "assets"} size={31}/>
    </div>}
    {data.note && <p className="asset-note">{data.note[l]}</p>}
    {page.kind === "funds" && data.rows?.map(row => <AssetsRow key={row.label.en} row={row} l={l} onOpen={open}/>)}
    {data.groups?.map(({ title, fields }, i) => <section className="asset-figures" key={title?.en ?? i}>
      {title && <h2>{title[l]}</h2>}
      <dl>{fields.map(({ label, value, change }) => <div key={label.en}>
        <dt>{label[l]}</dt><dd className={change ? value < 0 ? "cash-out" : "cash-in" : undefined}>
          {change ? signed(value, l) : money(value, l)}
        </dd>
      </div>)}</dl>
    </section>)}
    {page.kind === "funds" && <JournalFinances s={life} l={l}/>}
    {page.kind !== "funds" && Boolean(data.rows?.length) && <div className="asset-list">
      {data.rows?.map(row => <AssetsRow key={row.label.en} row={row} l={l} onOpen={open}/>)}
    </div>}
    {data.shop && <AssetsRow row={data.shop} l={l} onOpen={open} shop/>}
    {Boolean(data.actions?.length) && <div className="asset-list">
      {data.actions?.map(option => <Transaction key={option.id} option={option} l={l} direct={page.kind === "good"}
        active={selected === option.id} onOpen={() => setSelected(selected === option.id ? null : option.id)}
        onConfirm={() => transact(option.id)}/>)}
    </div>}
    {Boolean(data.history?.length) && <div className="asset-list">
      {data.history?.map(entry => <button type="button" key={entry.age + "-" + entry.id} className="asset-row" onClick={() => onJournal(entry)}>
        <span className="asset-icon"><Icon name={acquiredHome(entry) ? "home" : "bag"} size={18}/></span>
        <span className="asset-row-text">
          <strong>{entry.title[l]}</strong>
          <small>{ageLabel(entry.age, l)} · {town(entry.city, l)}
            {entry.id === "bank.mortgage" && " · " + t("Самоучастие", "Down payment")}</small>
        </span>
        <span className="asset-row-value">{money(-entry.cashDelta, l)}</span>
        <Icon name="next" size={14}/>
      </button>)}
    </div>}
  </section>;
}

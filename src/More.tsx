import React, { useLayoutEffect, useRef, useState } from "react";
import {
  annualBudget, commitmentsLeft, getEstate, getLifeActivities, lifeHeirLabel, lifePartnerLabel,
  type GameState, type LifeActivityCategory, type LifeActivityOption, type LifeStat, type Memory,
} from "./engine.ts";
import type { Language } from "./session.ts";
import { avatarTreatments, getAvatarStage, getAvatarTreatments } from "./avatar.ts";
import { LifePortrait } from "./AvatarPortrait.tsx";
import { Icon, MenuTitle, copy, lifeStatLabels, money, type IconName } from "./ui.tsx";
import "./more.css";

const categories = [
  { id: "hospital", title: { bg: "Болница", en: "Hospital" }, clue: { bg: "Лекар и прегледи", en: "Doctors and checkups" }, path: "M5 3h14v18H5zM9 7h6m-3-3v6m-4 4h2m4 0h2m-6 7v-4h4v4" },
  { id: "gym", title: { bg: "Спорт", en: "Gym" }, clue: { bg: "Тичане и тренировки", en: "Running and training" }, path: "M2 10v4m20-4v4M5 7v10m14-10v10M5 12h14M2 12h3m14 0h3" },
  { id: "pets", title: { bg: "Домашни любимци", en: "Pets" }, clue: { bg: "Осиновяване и грижи", en: "Adoption and care" }, path: "M12 21c-2 0-2.8-1.1-4.5-1.1C4.7 19.9 4 17 6 15l3.2-3.4a3.6 3.6 0 0 1 5.6 0L18 15c2 2 1.3 4.9-1.5 4.9-1.7 0-2.5 1.1-4.5 1.1ZM5.6 10.2a2 2 0 1 1-4-1 2 2 0 0 1 4 1ZM11 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm5.4 3.2a2 2 0 1 1-4 1 2 2 0 0 1 4-1Z" },
  { id: "holidays", title: { bg: "Почивки", en: "Holidays" }, clue: { bg: "Уикенди и пътувания", en: "Weekends and travel" }, path: "M4 8h16v12H4zM9 8V5h6v3M8 10v8m8-8v8M2 11v6m20-6v6" },
  { id: "family", title: { bg: "Любов и семейство", en: "Love and family" }, clue: { bg: "Срещи, партньор и деца", en: "Dating, partners and children" }, path: "M20.5 5.7a4.7 4.7 0 0 0-6.7 0L12 7.5l-1.8-1.8a4.7 4.7 0 0 0-6.7 6.6l8.5 8.2 8.5-8.2a4.7 4.7 0 0 0 0-6.6Z" },
  { id: "bank", title: { bg: "Банка", en: "Bank" }, clue: { bg: "Сметки, заеми и ипотека", en: "Accounts, loans and mortgages" }, path: "m3 8 9-5 9 5v2H3zm3 2v8m6-8v8m6-8v8M3 18h18v3H3z" },
  { id: "aesthetics", title: { bg: "Визия и грижа", en: "Aesthetics" }, clue: { bg: "Салони и процедури", en: "Salons and treatments" }, path: "M12 3c0 5-2 7-7 7 5 0 7 2 7 7 0-5 2-7 7-7-5 0-7-2-7-7ZM5 14v6m-3-3h6m12-4v6m-3-3h6" },
  { id: "fun", title: { bg: "Забавления", en: "Fun" }, clue: { bg: "Кино, концерти и излизания", en: "Films, concerts and nights out" }, path: "M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V8Zm10 0v2m0 2v2m0 2v2m-5-7 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L6 13.3l2-.3z" },
  { id: "social", title: { bg: "Социални мрежи", en: "Social media" }, clue: { bg: "Профили и аудитория", en: "Accounts and audiences" }, path: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 3h4m-3 11h2m-3-7 5 2-5 3z" },
  { id: "legacy", title: { bg: "Наследство", en: "Legacy" }, clue: { bg: "Завещание и наследници", en: "Wills and heirs" }, path: "M5 3h9l5 5v13H5zm9 0v6h5m-11 4h8m-8 4h6" },
] as const satisfies ReadonlyArray<{id: LifeActivityCategory; title: Record<Language, string>; clue: Record<Language, string>; path: string}>;

type Category = typeof categories[number];
const statOrder = ["health", "looks", "joy", "brains", "influence"] as const satisfies readonly LifeStat[];

export function StatsBars({ life, l }: { life: GameState; l: Language }) {
  const labels = lifeStatLabels(l);
  return <section className="life-status" aria-label={copy(l, "Показатели", "Life stats")}>
    <div className="life-status-inner">
      {statOrder.map(stat => {
        const value = life.stats[stat];
        return <div key={stat} className={`life-status-item stat-${stat}`}
          role="meter" aria-label={labels[stat]} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={`${value}%`}>
          <span className="life-status-label" aria-hidden="true">{labels[stat]}</span>
          <div className="life-status-track" aria-hidden="true"><span style={{ width: value + "%" }} /></div>
          <strong className="life-status-value" aria-hidden="true">{value}%</strong>
        </div>;
      })}
    </div>
  </section>;
}

type MoreProps = {
  onClose: () => void;
  closeLabel: string;
  life: GameState;
  l: Language;
  onActivity: (id: string) => void;
  onGiveUp: () => void;
  initialCategory?: LifeActivityCategory | null;
  onJournal?: () => void;
  onAlbum?: () => void;
  onCategoryBack?: () => void;
  categoryBackLabel: string;
};

function CategoryIcon({ category, size = 20 }: { category: Category; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={category.path} /></svg>;
}

function CategoryStatus({ life, category, l }: { life: GameState; category: LifeActivityCategory; l: Language }) {
  const { bank, family, legacy, medicalIssue, pets, social } = life.lifeSystems;
  const t = (bg: string, en: string) => copy(l, bg, en);
  let fields: { label: string; value: string | number }[];

  switch (category) {
    case "hospital":
      fields = [{ label: t("Състояние","Condition"), value: medicalIssue === "urgent"
        ? t("Спешен случай в играта","In-game emergency")
        : medicalIssue === "routine" ? t("Нужен е преглед","Checkup needed") : t("Няма активен проблем","No active concern") }];
      break;
    case "pets": {
      const count = Number(pets.adopted) + Number(pets.rescued);
      fields = [{ label: t("Любимци","Pets at home"), value: count }];
      if (count) fields.push({ label: t("Привързаност","Bond"), value: pets.bond + "%" });
      break;
    }
    case "family": {
      const status = {
        single: t("Необвързана","Single"), dating: t("Излизате","Dating"), committed: t("Сериозна връзка","Committed"),
        engaged: t("Сгодени","Engaged"), married: t("Женени","Married"),
      };
      fields = [{ label: t("Статус","Relationship"), value: status[family.stage] }];
      const partner = lifePartnerLabel(life);
      if (partner) fields.push({ label: t("Партньор","Partner"), value: partner[l] },
        { label: t("Близост","Bond"), value: family.bond + "%" });
      fields.push({ label: t("Деца","Children"), value: family.children });
      if (family.expecting) fields.push({ label: t("Семейство","Family"), value: t("Очакваш дете","Expecting a child") });
      break;
    }
    case "bank":
      fields = [
        { label: t("Сметка","Bank account"), value: bank.accountOpen ? money(bank.balance, l) : t("Няма сметка","No account") },
        { label: t("Годишен баланс","Yearly balance"), value: money(annualBudget(life).net, l) },
      ];
      if (bank.loan > 0) fields.push({ label: t("Оставащ заем","Loan balance"), value: money(bank.loan, l) });
      if (bank.mortgage > 0) fields.push({ label: t("Оставаща ипотека","Mortgage balance"), value: money(bank.mortgage, l) });
      if (bank.ownsHome) fields.push({ label: t("Жилище","Home"), value: t("Собствено","Owned") });
      break;
    case "aesthetics": {
      const treatments = getAvatarTreatments(life.history, life.age);
      return <section className="avatar-current" aria-labelledby="avatar-current-heading">
        <LifePortrait life={life} region="badge"/>
        <div>
          <h2 id="avatar-current-heading">{t("Външен вид", "Your appearance")}</h2>
          <p>{getAvatarStage(life.age).label[l]} · {life.age} {t("г.", "years old")}</p>
          {treatments.length > 0 && <p aria-live="polite">{treatments.map(treatment => treatment.label[l]).join(" · ")}</p>}
        </div>
      </section>;
    }
    case "social":
      fields = [{ label: t("Активни профили","Active accounts"), value: Object.keys(social).length }];
      break;
    case "legacy": {
      const estate = getEstate(life);
      fields = [
        { label: t("Нетно наследство","Net estate"), value: money(estate.net, l) },
        { label: t("Завещание","Affairs"), value: legacy.prepared ? t("Уредено","Prepared") : t("Неуредено","Unprepared") },
      ];
      if (estate.shares.length) fields.push(...estate.shares.map(({ heir, amount }) =>
        ({ label: lifeHeirLabel(life, heir)[l], value: money(amount, l) })));
      else if (legacy.heirs.length) fields.push({
        label: t("Избрани наследници","Selected heirs"),
        value: legacy.heirs.map(heir => lifeHeirLabel(life, heir)[l]).join(", "),
      });
      break;
    }
    default:
      return null;
  }

  return <dl className="activity-state">{fields.map(({ label, value }) =>
    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function timeLabel(time: number, l: Language) {
  return l === "bg"
    ? time === 1 ? "1 ангажимент" : time + " ангажимента"
    : time === 1 ? "1 time slot" : time + " time slots";
}

function ActivityFeedback({ feedback, onJournal, l }: { feedback: Memory; onJournal?: () => void; l: Language }) {
  return <div className="activity-feedback">
    <div role="status"><strong>{feedback.title[l]}</strong><p>{feedback.text[l]}</p></div>
    {onJournal && <button type="button" onClick={onJournal}>{copy(l, "Към дневника", "View in journal")}<Icon name="right" size={15} /></button>}
  </div>;
}

const activityIcons: Record<string, IconName> = {
  "hospital.gp":"phone", "hospital.grandma":"home", "hospital.clinic":"plus", "hospital.emergency":"bolt",
  "hospital.therapy":"people", "hospital.psychiatrist":"journal", "hospital.eyes":"eye",
  "gym.run":"shoes", "gym.hiit":"bolt", "gym.crossfit":"people",
  "holidays.weekend":"bag", "holidays.picnic":"food", "holidays.local":"pin", "holidays.abroad":"flight",
  "aesthetics.hair":"scissors", "aesthetics.massage":"leaf", "aesthetics.facial":"sparkle",
  "aesthetics.nails":"sparkle", "aesthetics.makeup":"eye", "aesthetics.barber":"scissors",
  "aesthetics.botox":"plus", "aesthetics.filler":"sparkle", "aesthetics.liposuction":"heart", "aesthetics.augmentation":"plus",
  "fun.club":"music", "fun.bar":"people", "fun.dinner":"food", "fun.cinema":"video",
  "fun.theatre":"sparkle", "fun.concert":"music", "fun.escape-room":"key", "fun.mall":"bag",
  "pets.adopt":"home", "pets.rescue":"heart", "pets.vet":"plus", "pets.play":"sun",
  "family.tinder":"phone", "family.dating-service":"people", "family.casual":"sparkle", "family.date-eli":"heart",
  "family.time-together":"clock", "family.commit":"check", "family.engage":"ring", "family.marry":"home",
  "family.baby":"heart", "family.adopt":"people", "family.break-up":"back",
  "bank.open":"wallet", "bank.deposit":"plus", "bank.withdraw":"down", "bank.loan":"bag",
  "bank.pay-loan":"check", "bank.mortgage":"home", "bank.pay-mortgage":"key",
  "legacy.add":"plus", "legacy.remove":"close", "legacy.prepare":"journal",
};
const platformIcons: Record<string, IconName> = {
  Instagram:"photo", Facebook:"people", TikTok:"music", YouTube:"video", Vbox7:"video", OnlyFans:"sparkle",
};
const socialActionIcons: Record<string, IconName> = {
  register:"plus", photo:"photo", reel:"video", live:"live", post:"journal", event:"clock", video:"video",
  duet:"people", short:"video", clip:"video", series:"album", collab:"people",
};

const rowTones = ["rose", "teal", "amber", "indigo", "sage", "violet"] as const;

function ActivityCard({ category, option, feedback, onChoose, onJournal, l, tone, ageLock }: {
  category: Category;
  tone: typeof rowTones[number];
  ageLock?: number;
  option: LifeActivityOption; feedback?: Memory; onChoose: (id: string) => void; onJournal?: () => void; l: Language;
}) {
  const t = (bg: string, en: string) => copy(l, bg, en);
  const labels = lifeStatLabels(l);
  const deltas = statOrder.filter(key => option.statDelta[key]);
  const [domain, group, action] = option.id.split(".");
  const icon = domain === "social" ? socialActionIcons[action] : activityIcons[option.id] ?? activityIcons[domain + "." + group];
  const amount = option.cashDelta;
  const cost = amount === 0 ? t("Безплатно", "Free") : (amount > 0 ? "+" : "−") + money(Math.abs(amount), l);
  const treatment = avatarTreatments.find(item => item.id === option.id);

  return <li className="activity-entry">
    <button type="button" className="activity-card" aria-disabled={!!option.blocked} tabIndex={option.blocked ? -1 : undefined}
      onClick={() => { if (!option.blocked) onChoose(option.id); }}>
      <span className="activity-row-copy">
        <strong className="activity-row-title">
          <span className="activity-row-icon" data-tone={tone}>{icon ? <Icon name={icon} size={15} /> : <CategoryIcon category={category} size={15} />}</span>
          <span>{option.label[l]}</span>
        </strong>
        <span className="activity-description">{option.description[l]}</span>
        {treatment && <span className="avatar-treatment-note">
          {treatment.label[l]} · {treatment.years === 1 ? t("тази година","this year") : t("тази и следващата година","this year and next")}
        </span>}
        <span className="activity-meta">
          {ageLock && <span className="activity-age" aria-label={t("Достъпно от "+ageLock+" г.","Available from age "+ageLock)}>{ageLock}+</span>}
          <span><Icon name="wallet" size={14} />{cost}</span>
          {option.timeCost > 0 && <span><Icon name="clock" size={14} />{timeLabel(option.timeCost, l)}</span>}
          {deltas.map(stat => {
            const delta = option.statDelta[stat] ?? 0;
            return <span key={stat} className={`activity-delta stat-${stat}`}>{labels[stat]} {delta > 0 ? "+" : "−"}{Math.abs(delta)}</span>;
          })}
        </span>
        {option.blocked && !ageLock && <span className="activity-blocked">{option.blocked[l]}</span>}
      </span>
      <Icon name={option.blocked ? "key" : "next"} size={17} />
    </button>
    {feedback && <ActivityFeedback feedback={feedback} onJournal={onJournal} l={l} />}
  </li>;
}

export function More({ life, l, onActivity, onGiveUp, initialCategory = null, onJournal, onAlbum, onClose, closeLabel, onCategoryBack, categoryBackLabel }: MoreProps) {
  const [selected, setSelected] = useState(initialCategory);
  const [platform, setPlatform] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ id: string; category: LifeActivityCategory | null; index: number } | null>(null);
  const focusHeading = useRef(initialCategory !== null);
  const heading = useRef<HTMLHeadingElement>(null);
  const screen = useRef<HTMLElement>(null);
  const t = (bg: string, en: string) => copy(l, bg, en);
  const category = categories.find(item => item.id === selected);
  const availableTime = commitmentsLeft(life);
  const memory = life.history.at(-1);
  const feedback = lastAction && lastAction.category === selected && lastAction.index === life.commands.length && lastAction.id === memory?.id ? memory : undefined;

  useLayoutEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    screen.current?.scrollIntoView({ block: "start" });
    heading.current?.focus({ preventScroll: true });
  }, [selected, platform]);

  function changeCategory(next: LifeActivityCategory | null) {
    focusHeading.current = true;
    setSelected(next);
  }

  function openPlatform(next: string | null) {
    focusHeading.current = true;
    setPlatform(next);
  }

  function chooseActivity(id: string) {
    setLastAction({id, category: selected, index: life.commands.length + 1});
    onActivity(id);
  }

  if (!category) return <section key="directory" ref={screen} className="more-screen menu-enter" aria-labelledby="more-heading">
    <header className="more-heading">
      <MenuTitle onClose={onClose} closeLabel={closeLabel}><h1 ref={heading} id="more-heading" tabIndex={-1}>{t("Още", "More")}</h1></MenuTitle>
      <span className="more-resource"><Icon name="clock" size={15} />{t("Свободно време", "Free time")}: <strong>{availableTime}</strong></span>
    </header>
    <div className="activity-directory">
      {categories.map(item => <button type="button" key={item.id} data-category={item.id}
        className={`activity-category activity-${item.id}`} onClick={() => changeCategory(item.id)}>
        <span className="activity-category-icon"><CategoryIcon category={item} /></span>
        <span className="activity-category-copy"><strong>{item.title[l]}</strong><small>{item.clue[l]}</small></span>
        <Icon name="next" size={15} />
      </button>)}
    </div>
    <div className="more-secondary">
      {onAlbum && <button type="button" onClick={onAlbum}><Icon name="album" size={17} />{t("Албум", "Album")}<Icon name="next" size={15}/></button>}
      {!life.finished && <button type="button" className="more-give-up" onClick={onGiveUp}>
        <Icon name="close" size={17} />{t("Откажи се", "Give up")}<Icon name="next" size={15}/>
      </button>}
    </div>
  </section>;

  const groups = new Map<string, LifeActivityOption[]>();
  const optionsForCategory = getLifeActivities(life).filter(option => option.category === category.id);
  for (const option of optionsForCategory) {
    const key = option.group?.[l] ?? "";
    const list = groups.get(key);
    if (list) list.push(option);
    else groups.set(key, [option]);
  }

  return <section key={platform ?? category.id} ref={screen} className={`more-screen menu-enter activity-${category.id}`} aria-labelledby="more-heading">
    <header className="more-heading">
      <MenuTitle back onClose={platform ? () => openPlatform(null) : onCategoryBack ?? (() => changeCategory(null))}
        closeLabel={platform ? t("Назад към Социални мрежи","Back to Social media") : onCategoryBack ? categoryBackLabel : t("Назад към Още","Back to More")}>
        <h1 ref={heading} id="more-heading" tabIndex={-1}>
          {platform ?? category.title[l]}
        </h1>
      </MenuTitle>
      <span className="more-resource"><Icon name="clock" size={15} />{t("Свободно време", "Free time")}: <strong>{availableTime}</strong></span>
    </header>
    {!platform && <CategoryStatus life={life} category={category.id} l={l}/>}
    {!life.finished && life.choiceId === null && onJournal && <div className="activity-unlock">
      <span>{t("Първо вземи решението за тази година.", "Make this year’s story decision to unlock activities.")}</span>
      <button type="button" onClick={onJournal}>{t("Към решението", "Go to decision")}<Icon name="right" size={15} /></button>
    </div>}
    {feedback && !optionsForCategory.some(option => option.id === feedback.id) && <ActivityFeedback feedback={feedback} onJournal={onJournal} l={l} />}
    {category.id === "social" && !platform ? <div className="activity-directory">
      {[...groups].map(([group, options]) => {
        const key = options[0].id.split(".")[1] as keyof typeof life.lifeSystems.social;
        const profile = life.lifeSystems.social[key];
        const profileStatus = profile
          ? profile.followers + " " + (profile.followers === 1 ? t("последовател", "follower") : t("последователи", "followers"))
            + " · " + profile.posts + " " + (profile.posts === 1 ? t("публикация", "post") : t("публикации", "posts"))
          : t("Нямаш профил", "No account");
        return <button key={group} type="button" className="activity-category" onClick={() => openPlatform(group)}>
          <span className="activity-category-icon"><Icon name={platformIcons[group] ?? "more"}/></span>
          <span className="activity-category-copy"><strong>{group}</strong><small>{profileStatus}</small></span>
          <Icon name="next" size={17}/>
        </button>;
      })}
    </div> : <ul className="activity-list">
      {(platform ? groups.get(platform) ?? [] : optionsForCategory).map((option, index) =>
        <ActivityCard category={category} option={option} tone={rowTones[index % rowTones.length]}
          ageLock={!life.finished && option.minAge !== undefined && life.age < option.minAge ? option.minAge : undefined} key={option.id} onChoose={chooseActivity} onJournal={onJournal} l={l}
          feedback={feedback?.id === option.id ? feedback : undefined}/>)}
    </ul>}
  </section>;
}

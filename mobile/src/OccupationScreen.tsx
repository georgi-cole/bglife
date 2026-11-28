
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { doPathAction, type GameState } from "../../src/engine.ts";
import { applicationLabel, insuranceView, jobGross, requirementName, workView } from "../../src/employment.ts";
import { pathActionBlock } from "../../src/lifePath.ts";
import { maternityPay, maternityStatus } from "../../src/maternity.ts";
import { mark, type PathAction } from "../../src/pathActions.ts";
import { pathCities, pathMoney, subjects, type Subject } from "../../src/pathCatalog.ts";
import { netMonthly } from "../../src/pathPolicy.ts";
import { gradeName, schoolView } from "../../src/school.ts";
import type { Language } from "../../src/sessionCodec.ts";
import { findProgram, fundingName, universityCosts, universityView } from "../../src/university.ts";
import { workplaceView } from "../../src/workplace.ts";
import { specialCareerIds, specialCareers } from "../../src/specialCareerCatalog.ts";
import { specialCareerView } from "../../src/specialCareers.ts";
import type { SpecialCard, SpecialCareerId } from "../../src/specialCareerTypes.ts";
import { type Screens, useGame } from "./game";
import { CityPicker } from "./NewLifeScreen";
import { base, Button, Chip, color, money, town, translation } from "./ui";

type ActionsProps = { actions: Pick<PathAction<unknown>, "id" | "label" | "blocked">[]; onAct: (id: string) => void };
type Track = { life: GameState; language: Language; onAct: ActionsProps["onAct"] };

function ActionList({ actions, onAct }: ActionsProps) {
  const { session, language, saving } = useGame();
  const life = session.life;
  return actions.filter(action => !life.path?.used.includes(action.id)).map(action => {
    const blocked = pathActionBlock(life, action);
    return <View key={action.id} style={styles.action}>
      <Button label={action.label[language]} secondary disabled={saving || Boolean(blocked)} testID={action.id} onPress={() => onAct(action.id)}/>
      {blocked && <Text style={base.muted}>{blocked[language]}</Text>}
    </View>;
  });
}

function Meter({ title, value }: { title: string; value: number }) {
  const tint = value < 25 ? color.red : value < 40 ? "#bd713a" : value < 55 ? "#967117" : color.green;
  return <View style={styles.meter}>
    <Text style={base.muted}>{title}</Text>
    <View style={styles.meterTrack} accessibilityRole="progressbar" accessibilityLabel={title} accessibilityValue={{ min: 0, max: 100, now: value }}>
      <View style={[styles.meterFill, { width: `${value}%`, backgroundColor: tint }]}/>
    </View>
  </View>;
}


function CareerCards({ cards, language, onAct }: Pick<Track, "language" | "onAct"> & { cards: SpecialCard[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return <>{cards.map(card => {
    const visible = !card.fold || open === card.id;
    return <View style={base.card} key={card.id}>
      {card.fold ? <Pressable accessibilityRole="button" accessibilityState={{ expanded: visible }}
        onPress={() => setOpen(visible ? null : card.id)}>
        <Text style={base.section}>{card.title[language]}</Text>
        {card.detail && <Text style={base.muted}>{card.detail[language]}</Text>}
      </Pressable> : <>
        <Text accessibilityRole="header" style={base.section}>{card.title[language]}</Text>
        {card.detail && <Text style={base.muted}>{card.detail[language]}</Text>}
      </>}
      {visible && <>
        {card.facts?.map(({ label, value, money: isMoney }) => <View style={styles.fact} key={label.en}>
          <Text style={base.muted}>{label[language]}</Text>
          <Text style={base.body}>{typeof value !== "number" ? value[language] : isMoney ? money(value, language) : value.toLocaleString(language === "bg" ? "bg-BG" : "en-GB")}</Text>
        </View>)}
        {card.meters?.map(meter => <Meter key={meter.label.en} title={meter.label[language] + " · " + meter.value + "%"} value={meter.value}/>)}
        {card.actions && <ActionList actions={card.actions} onAct={onAct}/>}
      </>}
    </View>;
  })}</>;
}

function SpecialCareers({ life, language, onAct }: Track) {
  const [selected, setSelected] = useState<SpecialCareerId | null>(null);
  const [showAway, setShowAway] = useState(false);
  const t = (bg: string, en: string) => translation(language, bg, en);
  if (!selected) return <View style={base.card} testID="special-careers">
    <Text accessibilityRole="header" style={base.section}>{t("Специални кариери", "Special careers")}</Text>
    {!!life.path?.special?.fame && <Meter title={t("Известност", "Fame")} value={life.path.special.fame}/>}
    {!!life.path?.special?.careerReceipts && <Text style={base.muted}>{t("Хонорари и премии общо", "Fees and prizes to date")} · {money(life.path.special.careerReceipts, language)}</Text>}
    {specialCareerIds.map(id => {
      const item = specialCareers[id], locked = life.age < item.minAge;
      return <View style={styles.group} key={id}>
        <Button label={item.title[language]} testID={"special-career-" + id} disabled={locked} secondary
          onPress={() => { setSelected(id); setShowAway(false); }}/>
        <Text style={base.muted}>{locked ? t("От " + item.minAge + " г.", "From age " + item.minAge) : item.summary[language]}</Text>
      </View>;
    })}
  </View>;
  const { cards } = specialCareerView(life, selected);
  const here = cards.filter(card => !card.city || card.city === life.city || !card.fold);
  const away = cards.filter(card => card.city && card.city !== life.city && card.fold);
  return <>
    <View style={[base.card, styles.highlight]}>
      <Text accessibilityRole="header" style={base.heading}>{specialCareers[selected].title[language]}</Text>
      <Button label={t("Към кариерите", "Back to careers")} secondary onPress={() => setSelected(null)}/>
    </View>
    <CareerCards key={selected} cards={here} language={language} onAct={onAct}/>
    {away.length > 0 && <Button label={showAway ? t("Скрий други градове", "Hide other cities") : t("Други градове", "Other cities")}
      secondary onPress={() => setShowAway(!showAway)}/>}
    {showAway && <CareerCards cards={away} language={language} onAct={onAct}/>}
  </>;
}

function CurrentWork({ life, language, onAct, onCareer }: Track & { onCareer: () => void }) {
  const work = workplaceView(life);
  const t = (bg: string, en: string) => translation(language, bg, en);
  const [contact, setContact] = useState<string | null>(null);
  const [contract, setContract] = useState(false);
  const special = life.path?.work.job?.special;
  if (special && !life.finished) return <CareerCards cards={specialCareerView(life, special.kind).work} language={language} onAct={onAct}/>;
  if (!work || life.finished) return <View style={base.card}>
    <Text style={base.section}>{t("Нямаш текуща работа", "No current job")}</Text>
    <Button label={t("Към обявите", "Browse vacancies")} secondary onPress={onCareer}/>
  </View>;
  return <>
    <View style={[base.card, styles.highlight]}>
      <Text accessibilityRole="header" style={base.heading}>{work.job.title[language]}</Text>
      <Text style={base.body}>{work.job.employer[language]}</Text>
      <Text style={base.muted}>{money(netMonthly(work.contract.gross), language)} {t("нетно/мес.", "net/mo")} · {work.contract.hours} {t("ч./ден", "h/day")}</Text>
      <Meter title={t("Представяне", "Performance")} value={work.contract.performance}/>
    </View>
    <View style={base.card}>
      <Text accessibilityRole="header" style={base.section}>{t("Задачи", "Tasks")}</Text>
      <ActionList actions={work.tasks} onAct={onAct}/>
      {work.tasks.every(action => life.path?.used.includes(action.id)) && <Text style={base.muted}>{t("Задачите за тази година са изпълнени.", "This year’s tasks are complete.")}</Text>}
    </View>
    <View style={base.card}>
      <Text accessibilityRole="header" style={base.section}>{t("Екип", "Team")}</Text>
      {work.team.map(person => {
        const key = work.key + person.id;
        const open = contact === key;
        return <View style={styles.group} key={key} testID={"work-contact-" + person.id}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.contact}
            onPress={() => setContact(open ? null : key)}>
            <Text style={base.section}>{person.name[language]}</Text>
            <Text style={base.muted}>{person.id === "boss" && t("Шеф · ", "Supervisor · ")}{person.role[language]}</Text>
          </Pressable>
          {open && <>
            <Meter title={t("Отношения", "Relationship")} value={person.bond}/>
            <ActionList actions={person.actions} onAct={onAct}/>
          </>}
        </View>;
      })}
    </View>
    <View style={base.card}>
      <Button label={t("Трудов договор", "Employment contract")} secondary onPress={() => setContract(!contract)}/>
      {contract && <>
        <Text style={base.body}>{work.contract.monthsLeft === null ? t("Безсрочен договор", "Permanent contract")
          : t("Оставащ срок", "Time remaining") + " · " + work.contract.monthsLeft + t(" месеца", " months")}</Text>
        <Text style={base.muted}>{money(work.contract.gross, language)} {t("брутно/мес.", "gross/mo")}</Text>
        <ActionList actions={work.contractActions} onAct={onAct}/>
      </>}
    </View>
  </>;
}

function Vacancies({ life, language, onAct }: Track) {
  const work = life.path!.work;
  const { actions, vacancies } = workView(life, work);
  const t = (bg: string, en: string) => translation(language, bg, en);
  return <>
    <View style={base.card}>
      <Text accessibilityRole="header" style={base.section}>{t("Свободни позиции", "Vacancies")} · {town(life.city, language)}</Text>
      {work.prepared ? <Text style={base.muted}>{t("CV и интервю · подготвени", "CV and interview · ready")}</Text>
        : <ActionList actions={actions.filter(action => action.id === "work.prepare")} onAct={onAct}/>}
      <ActionList actions={actions.filter(action => action.id.startsWith("work.register."))} onAct={onAct}/>
    </View>
    {vacancies.map(job => {
      const status = work.applications[job.id];
      return <View key={job.id} style={base.card}>
        <Text style={base.section}>{job.title[language]}</Text>
        <Text style={base.muted}>{job.employer[language]} · {job.hours} {t("ч./ден", "h/day")}</Text>
        <Text style={base.body}>{money(netMonthly(jobGross(life, job)), language)} {t("нетно/мес.", "net/mo")}</Text>
        {job.requirement !== "none" && <Text style={base.muted}>{requirementName(job)[language]}</Text>}
        {status && <Text style={base.muted}>{applicationLabel[status][language]}</Text>}
        <ActionList actions={actions.filter(action => action.id.endsWith("." + job.id) || action.id.startsWith("work.interview." + job.id + "."))} onAct={onAct}/>
      </View>;
    })}
  </>;
}

function Education({ life, language, onAct }: Track) {
  const { school, university } = life.path!;
  const view = schoolView(life, school);
  const study = universityView(life, university, school.diploma);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [city, setCity] = useState(life.city);
  const [cityPicker, setCityPicker] = useState(false);
  const t = (bg: string, en: string) => translation(language, bg, en);
  const current = university.student;
  return <>
    {!school.diploma && <View style={base.card}>
      <Text style={base.section}>{school.grade === null ? t("Преди училище", "Before school") : gradeName(school.grade)[language]}</Text>
      {school.grade === null ? <Text style={base.muted}>{t("Изборът на училище започва в I клас.", "School enrollment starts in first grade.")}</Text> : <>
        <Text style={base.body}>{view.active.name[language]}</Text>
        <ActionList actions={view.actions.filter(action => /^(school\.zone\.|school\.nvo$|school\.final[.-]|school\.(leave|return)$)/.test(action.id))} onAct={onAct}/>
        {view.admissions.map(candidate => <View style={styles.group} key={candidate.id}>
          <Text style={base.body}>{candidate.name[language]}</Text>
          <ActionList actions={view.actions.filter(action => action.id === "school.apply." + candidate.id || action.id === "school.enroll." + candidate.id)} onAct={onAct}/>
        </View>)}
        <View style={base.row}>
          {view.subjects.map(id => <Chip key={id} label={subjects[id][language]} selected={id === subject} onPress={() => setSubject(id === subject ? null : id)}/>)}
        </View>
        {subject && <ActionList actions={view.actions.filter(action => /^(school\.(study|homework|test|classwork)\.)/.test(action.id) && action.id.endsWith("." + subject))} onAct={onAct}/>}
      </>}
    </View>}
    {school.diploma && <View style={base.card}>
      <Text style={base.section}>{t("Диплома за средно образование", "Secondary school diploma")} · {mark(school.diploma.average, language)}</Text>
      {university.degrees.map(degree => {
        const program = findProgram(degree.city, degree.program);
        return program && <Text key={degree.program} style={base.body}>{program.title[language]} · {mark(degree.mark, language)}</Text>;
      })}
    </View>}
    {current && study.active ? <View style={base.card}>
      <Text style={base.section}>{study.active.title[language]}</Text>
      <Text style={base.muted}>{study.active.institution[language]} · {fundingName[current.funding][language]}</Text>
      <Text style={base.body}>{t("Курс", "Year of study")} {current.yearsPassed + 1} / {study.active.years} · {money(universityCosts(university).due, language)} {t("/ год.", "/ yr")}</Text>
      <ActionList actions={study.actions} onAct={onAct}/>
    </View> : school.diploma && life.age >= 18 && <>
      <View style={base.card}>
        <Text style={base.section}>{t("Университет", "University")}</Text>
        <Button label={town(city, language)} secondary onPress={() => setCityPicker(true)}/>
        {pathCities[city].programs.length === 0 && <Text style={base.muted}>{t("Избери град с университет.", "Choose a city with a university.")}</Text>}
      </View>
      {cityPicker && <CityPicker language={language} selected={city} title={t("Град на университета", "University city")}
        onSelect={next => { setCity(next); setCityPicker(false); }} onClose={() => setCityPicker(false)}/>}
      {pathCities[city].programs.filter(program => !university.degrees.some(degree => degree.program === program.id)).map(program => {
        const application = university.applications[program.id];
        const fees = [program.fee.state !== undefined && fundingName.state[language] + " " + money(pathMoney(program.fee.state), language),
          program.fee.paid !== undefined && fundingName.paid[language] + " " + money(pathMoney(program.fee.paid), language)].filter(Boolean);
        return <View style={base.card} key={program.id}>
          <Text style={base.section}>{program.title[language]}</Text>
          <Text style={base.muted}>{program.institution[language]}</Text>
          {program.admission.practical && <Text style={base.muted}>{t("Практически изпит · 3 кръга", "Practical entrance exam · 3 rounds")}
            {university.entrance[program.id]?.length ? " · " + university.entrance[program.id].map(score => mark(score, language)).join(" · ") : ""}</Text>}
          <Text style={base.muted}>{fees.join(" · ")} {t("/ год.", "/ yr")}</Text>
          {application && <Text style={base.body}>{application.outcome === "refused" ? t("Извън класирането", "No place offered") : fundingName[application.outcome][language]}
            {" · "}{t("Бал", "Score")} {mark(application.score, language)}</Text>}
          <ActionList actions={study.actions.filter(action => action.id.endsWith("." + program.id))} onAct={onAct}/>
        </View>;
      })}
    </>}
  </>;
}

export function OccupationScreen({ route, navigation }: NativeStackScreenProps<Screens, "Occupation">) {
  const { session, language, updateSession } = useGame();
  const life = session.life;
  const t = (bg: string, en: string) => translation(language, bg, en);
  const [panel, setPanel] = useState<"education" | "vacancies" | "insurance" | "special">(life.age < 18 || life.path?.university.student ? "education" : "vacancies");
  const maternity = maternityStatus(life);
  const currentWork = route.params.section === "work" && !maternity;
  function onAct(id: string) {
    void updateSession(current => {
      if (current.life !== life) return current;
      const next = doPathAction(life, id, life.age);
      return next === life ? current : { ...current, life: next };
    });
  }

  const props: Track = { life, language, onAct };
  const work = life.path?.work;
  const last = life.history.at(-1);
  const workplaceAction = last?.id.startsWith("workplace.") || (last && /^special\.[^.]+\.work\./.test(last.id)) || last?.id === "work.raise" || last?.id === "work.leave";
  const feedback = last?.age === life.age && last.kind === "path" && !last.decision && Boolean(workplaceAction) === currentWork ? last.text[language] : null;
  return <ScrollView style={base.page} contentContainerStyle={base.scroll} testID={currentWork ? "workplace-screen" : "career-screen"}>
    <View style={base.row}>
      <Chip label={life.age < 18 ? t("Даскало", "Education") : t("Кариера", "Career")} selected={!currentWork}
        onPress={() => navigation.setParams({ section: "career" })}/>
      {!maternity && (currentWork || work?.job) && <Chip label={t("Работа", "Work")} selected={currentWork}
        onPress={() => navigation.setParams({ section: "work" })}/>}
    </View>
    {feedback && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text>}
    {life.path && !life.finished && (currentWork ? <CurrentWork {...props} onCareer={() => { setPanel("vacancies"); navigation.setParams({ section: "career" }); }}/> : <>
      {life.age >= 7 && <View style={base.row}>
        <Chip label={life.age >= 18 ? t("Образование", "Education") : t("Училище", "School")} selected={panel === "education"} onPress={() => setPanel("education")}/>
        {life.age >= 16 && <Chip label={life.age >= 18 ? t("Обяви", "Vacancies") : t("Летни обяви", "Summer jobs")} selected={panel === "vacancies"} onPress={() => setPanel("vacancies")}/>}
        <Chip label={t("Специални", "Special")} testID="special-tab" selected={panel === "special"} onPress={() => setPanel("special")}/>
        {life.age >= 18 && <Chip label={t("Осигуряване", "Social insurance")} selected={panel === "insurance"} onPress={() => setPanel("insurance")}/>}
      </View>}
      {panel === "education" ? <Education {...props}/> : panel === "vacancies" ? (
        maternity ? <View style={base.card}>
          <Text accessibilityRole="header" style={base.section}>{maternity[language]}</Text>
          <Text style={base.body}>{t("Обезщетение за годината", "Benefit this year")} · {money(maternityPay(life), language)}</Text>
        </View> : <Vacancies {...props}/>
      ) : panel === "special" ? <SpecialCareers {...props}/> : <>
        {work && <View style={base.card}>
          <Text accessibilityRole="header" style={base.section}>{t("Безработица и пенсия", "Unemployment and pension")}</Text>
          <Text style={base.body}>{t("Осигурителен стаж", "Insurance service")} · {insuranceView(life, work).pension.service} {t("мес.", "mo")}</Text>
          <ActionList actions={insuranceView(life, work).actions} onAct={onAct}/>
        </View>}
      </>}
    </>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  highlight: { backgroundColor: "#EEF1E5", borderColor: "#BBC9AA" },
  action: { gap: 4 },
  contact: { justifyContent: "center", minHeight: 47 },
  group: { padding: 9, backgroundColor: "#EFF2EB", borderRadius: 9, gap: 7 },
  meter: { gap: 5 },
  fact: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 6 },
  meterTrack: { height: 5, borderRadius: 5, backgroundColor: color.line, overflow: "hidden" },
  meterFill: { height: "100%" },
  feedback: { ...base.body, color: color.green, backgroundColor: color.lightGreen, padding: 12, borderRadius: 10 },
});

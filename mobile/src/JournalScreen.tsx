import { useMemo, useRef, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { selectionAsync } from "expo-haptics";
import { assetTitle } from "../../src/assetMenu.ts";
import { getAvatarLook, getAvatarTreatments } from "../../src/avatar.ts";
import { activityMoment } from "../../src/activityMoments.ts";
import { cleanFirstName } from "../../src/babyNames.ts";
import { cityWeatherDate } from "../../src/cityLife.ts";
import {
  choose, doAction, doMaternityReturn, doPathAction, doPregnancyAction, getCityOpportunity, hasPendingStoryDecision,
  nameNewborns, playYear, skipDecision, type GameState, type Memory,
} from "../../src/engine.ts";
import { maternityPay, maternityStatus, maternityYear } from "../../src/maternity.ts";
import { canEndPregnancy, pregnancyNoticeCopy, pregnancyTurnLabel } from "../../src/pregnancyTimeline.ts";
import { newbornName, newbornSurname, pregnancyStatus, type BirthNaming } from "../../src/reproduction.ts";
import { cityDecision, storyDecision, weddingDecision } from "../../src/journalDecisions.ts";
import { familyActivityLine, journalLine } from "../../src/journalCopy.ts";
import type { Language } from "../../src/sessionCodec.ts";
import { getWorkDecision } from "../../src/workplace.ts";
import { getSpecialDecision, type CareerDecision } from "../../src/specialCareers.ts";
import { Avatar } from "./Avatar";
import { DecisionModal } from "./DecisionModal";
import { type Screens, useGame } from "./game";
import { ageLabel, base, Button, Chip, color, labels, lifeName, money, town, translation } from "./ui";

type Year = { age: number; entries: Memory[]; balance: number };

function journalYears(life: GameState): Year[] {
  const entriesByAge = new Map<number, Memory[]>();
  let balance = life.cash - life.history.reduce((sum, entry) => sum + entry.cashDelta, 0);
  for (const entry of life.history) {
    const year = entriesByAge.get(entry.age);
    if (year) year.push(entry);
    else entriesByAge.set(entry.age, [entry]);
  }
  if (!entriesByAge.has(life.age)) entriesByAge.set(life.age, []);
  return [...entriesByAge].map(([age, entries]) => {
    balance += entries.reduce((sum, entry) => sum + entry.cashDelta, 0);
    return { age, entries, balance };
  }).reverse();
}

function YearCard({ life, year, language, current, opportunityId, onCityDecision, weddingId, onWeddingDecision }: {
  life: GameState;
  year: Year;
  language: Language;
  current: boolean;
  opportunityId?: string;
  onCityDecision: () => void;
  weddingId?: string;
  onWeddingDecision: () => void;
}) {
  const events = year.entries.filter(entry => entry.kind !== "year");
  const budget = year.entries.find(entry => entry.kind === "year");
  return (
    <View style={base.card} testID={"journal-year-" + year.age}>
      <View style={styles.yearTitle}>
        <Text accessibilityRole="header" style={base.section}>
          {ageLabel(year.age, language)}
        </Text>
        {current && <Text style={styles.current}>{translation(language, "Сега", "Now")}</Text>}
      </View>
      {events.map((entry, index) => {
        if (entry.decision) return <WorkJournalEntry key={entry.id + "-" + index} entry={entry} language={language}/>;
        const result = entry.kind === "choice" || (entry.kind === "action" && entry.id.startsWith("city-life."));
        return <View key={entry.id + "-" + index} style={[styles.entry, result && styles.outcome]}>
          {!result && <Text style={styles.entryTitle}>{entry.title[language]}</Text>}
          {entry.cityEvent && <Text style={base.muted}>{cityWeatherDate(entry.cityEvent, language)}</Text>}
          <Text style={[base.body, result && styles.outcomeText]}>{familyActivityLine(entry, language, life) ?? activityMoment(entry, life.seed)?.[language]
            ?? (result ? journalLine(entry, language, life.birthFamily) : entry.text[language])}</Text>
          {current && opportunityId === entry.id && <Button label={translation(language, "Виж вариантите", "See options")}
            secondary testID="city-opportunity" onPress={onCityDecision}/>}
          {current && weddingId === entry.id && <Button label={translation(language, "Покана за сватба", "Wedding invitation")}
            secondary testID="wedding-invitation" onPress={onWeddingDecision}/>}
          {entry.cashDelta !== 0 && (
            <Text style={[styles.delta, entry.cashDelta < 0 && styles.negative]}>
              {entry.cashDelta > 0 ? "+" : ""}{money(entry.cashDelta, language)}
            </Text>
          )}
        </View>;
      })}
      {budget && (
        <View style={styles.budget}>
          <Text style={base.muted}>{budget.text[language]}</Text>
          <Text style={base.muted}>{translation(language, "Наличност", "Closing balance")} · {money(year.balance, language)}</Text>
        </View>
      )}
    </View>
  );
}


function WorkJournalEntry({ entry, language }: { entry: Memory; language: Language }) {
  const [open, setOpen] = useState(false);
  const decision = entry.decision!;
  const impact = entry.workImpact;
  const signed = (amount: number) => (amount > 0 ? "+" : "") + amount;
  const statLabels = {
    health: translation(language, "Здраве", "Health"), looks: translation(language, "Визия", "Looks"),
    joy: translation(language, "Радост", "Joy"), brains: translation(language, "Ум", "Brains"),
    influence: translation(language, "Влияние", "Influence"),
  };
  return <View style={styles.entry}>
    <Pressable style={styles.workJournalLine} accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}>
      <Text style={base.body}>{entry.text[language]} {open ? "▴" : "▾"}</Text>
    </Pressable>
    {open && <View style={styles.workJournalDetail}>
      <Text style={styles.entryTitle}>{entry.title[language]}</Text>
      <Text style={base.muted}>{decision.situation[language]}</Text>
      <Text style={base.muted}>{translation(language, "Избрах", "I chose")} · {decision.choice[language]}</Text>
      {impact?.performance ? <Text style={styles.delta}>{translation(language, "Представяне", "Performance")} {signed(impact.performance)}</Text> : null}
      {impact?.relationship && <Text style={[styles.delta, impact.relationship.delta < 0 && styles.negative]}>
        {impact.relationship.name[language]} {signed(impact.relationship.delta)}
      </Text>}
      {impact?.career?.map(effect => <Text style={styles.delta} key={effect.label.en}>{effect.label[language]} {signed(effect.delta)}</Text>)}
      {entry.cashDelta !== 0 && <Text style={[styles.delta, entry.cashDelta < 0 && styles.negative]}>
        {entry.cashDelta > 0 ? "+" : ""}{money(entry.cashDelta, language)}
      </Text>}
      {(Object.keys(statLabels) as (keyof typeof statLabels)[]).map(key => {
        const delta = entry.statsDelta?.[key];
        return delta ? <Text key={key} style={[styles.delta, delta < 0 && styles.negative]}>{statLabels[key]} {signed(delta)}</Text> : null;
      })}
    </View>}
  </View>;
}

function WorkPrompt({ life, decision }: { life: GameState; decision: CareerDecision }) {
  const { language, saving, updateSession } = useGame();
  const chooseWork = (id: string) => {
    void updateSession(current => {
      if (current.life !== life) return current;
      const next = doPathAction(life, id, life.age);
      return next === life ? current : { ...current, life: next };
    });
  };
  return <Modal transparent visible animationType="fade" onRequestClose={() => chooseWork(decision.dismiss)}>
    <View style={styles.workBackdrop}>
      <View style={[base.card, styles.workPrompt]} accessibilityViewIsModal testID="work-decision">
        <ScrollView contentContainerStyle={base.field}>
          <Text style={base.muted}>{decision.employer[language]}</Text>
          <Text style={base.heading} accessibilityRole="header">{decision.title[language]}</Text>
          <Text style={base.body}>{decision.situation[language]}</Text>
          {decision.choices.map(choice => <Button key={choice.id} label={choice.label[language]}
            testID={choice.id} disabled={saving} onPress={() => chooseWork(choice.id)}/>)}
          <Button label={translation(language, "Пропусни", "Skip")} secondary disabled={saving} onPress={() => chooseWork(decision.dismiss)}/>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function BirthNames({ life, birth }: { life: GameState; birth: BirthNaming }) {
  const { language, saving, updateSession } = useGame();
  const [names, setNames] = useState(() => birth.newborns.map(baby => baby.firstName));
  const [surname, setSurname] = useState(birth.surnames[0]);
  const valid = names.every(name => cleanFirstName(name) !== null);

  return (
    <View style={base.card}>
      <Text style={base.section}>{translation(language, "Име на новороденото", "Name the newborn")}</Text>
      {birth.surnames.length > 1 && (
        <View style={base.row}>
          {birth.surnames.map(source => (
            <Chip key={source} selected={surname === source} onPress={() => setSurname(source)}
              label={newbornSurname(birth, source, life.lifeSystems.family.childProfiles[birth.newborns[0].index].gender)[language]} />
          ))}
        </View>
      )}
      {birth.newborns.map(({ index }, order) => {
        const gender = life.lifeSystems.family.childProfiles[index].gender;
        const cleaned = cleanFirstName(names[order]);
        return (
          <View key={index} style={base.field}>
            <TextInput value={names[order]} onChangeText={name => setNames(values => values.map((value, i) => i === order ? name : value))}
              accessibilityLabel={translation(language, "Име на бебе ", "Baby name ") + (order + 1)}
              maxLength={36} autoCapitalize="words" style={base.input} />
            {cleaned && <Text style={base.muted}>{newbornName(birth, cleaned, surname, gender)[language]}</Text>}
          </View>
        );
      })}
      <Button label={translation(language, "Запази", "Save")} disabled={saving || !valid}
        onPress={() => { void updateSession(current => {
          const next = nameNewborns(current.life, names, surname, life.age);
          return next === current.life ? current : { ...current, life: next };
        }); }} />
    </View>
  );
}

export function JournalScreen({ navigation, route }: NativeStackScreenProps<Screens, "Journal">) {
  const { session, language, saving, updateSession } = useGame();
  const focused = useIsFocused();
  const archive = route.params?.archive;
  const archived = archive !== undefined;
  const life = archived ? session.album[archive] : session.life;
  const years = useMemo(() => life ? journalYears(life) : [], [life]);
  const look = useMemo(() => life ? getAvatarLook(life.avatar, life.age, getAvatarTreatments(life.history, life.age)) : null, [life]);
  const list = useRef<FlatList<Year>>(null);
  const [cityPrompt, setCityPrompt] = useState<string | null>(null);
  const t = (bg: string, en: string) => translation(language, bg, en);
  const text = labels(language);

  if (!life || !look) return <View style={base.page} />;

  const age = life.age;
  const { naming: birth, notice } = life.lifeSystems.reproduction;
  const turn = pregnancyTurnLabel(life);
  const pregnancy = pregnancyStatus(life);
  const pregnancyPrompt = !archived && focused && notice ? pregnancyNoticeCopy(notice) : null;
  const maternity = maternityStatus(life);
  const showDecision = !archived && focused && !birth && !notice;
  const story = showDecision && !turn ? storyDecision(life) : null;
  const opportunity = archived ? null : getCityOpportunity(life);
  const workDecision = showDecision && !story ? (getWorkDecision(life) ?? getSpecialDecision(life)) : null;
  const wedding = archived ? null : weddingDecision(life);
  const optional = showDecision && !story && !workDecision && cityPrompt !== null
    ? [cityDecision(life), wedding].find(item => item?.key === cityPrompt)
    : null;
  const decision = story ?? optional;
  const blocked = Boolean(birth || notice || (!turn && hasPendingStoryDecision(life)));

  function changeLife(change: (state: GameState) => GameState) {
    return updateSession(current => {
      if (archived || current.life !== life) return current;
      const next = change(current.life);
      return next === current.life ? current : { ...current, life: next };
    });
  }

  async function advance() {
    void selectionAsync().catch(() => {});
    const changed = await changeLife(current => playYear(current, age));
    if (changed) list.current?.scrollToOffset({ offset: 0, animated: true });
  }

  function proceedWithPregnancyNotice() {
    void changeLife(current => doPregnancyAction(current, notice?.kind === "test" ? "pregnancy-test" : "pregnancy-read", age));
  }

  function askToEndPregnancy() {
    Alert.alert(t("Прекъсване на бременността", "End the pregnancy"),
      t("Потвърди решението си. След това Play се връща към годишния цикъл.",
        "Confirm your decision. Play then returns to the yearly cycle."), [
        { text: text.cancel, style: "cancel" },
        { text: t("Потвърди", "Confirm"), style: "destructive",
          onPress: () => { void changeLife(current => doPregnancyAction(current, "pregnancy-end", age)); } },
      ]);
  }

  return (
    <SafeAreaView style={base.page} edges={["bottom"]} testID="journal-screen">
      <FlatList ref={list} data={years} keyExtractor={year => String(year.age)} contentContainerStyle={base.scroll}
        keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
        renderItem={({ item }) => <YearCard life={life} year={item} language={language} current={item.age === age && !life.finished && !archived}
          opportunityId={opportunity?.id} onCityDecision={() => setCityPrompt(cityDecision(life)?.key ?? null)}
          weddingId={wedding?.id} onWeddingDecision={() => setCityPrompt(wedding?.key ?? null)} />}
        ListHeaderComponent={(
          <View style={styles.journalHeader}>
            <View style={styles.profile}>
              <View style={styles.badge}>
                <Avatar look={look} label={t("Портрет", "Character portrait")} size={76} />
              </View>
              <View style={styles.profileText}>
                <Text testID="current-name" style={styles.name}>{lifeName(life, language)}</Text>
                <Text testID="current-age" style={styles.profileDetail}>{ageLabel(life.age, language)}</Text>
                <Text style={styles.profileDetail}>{town(life.city, language)} · {money(life.cash, language)}</Text>
                {archived && <Text style={styles.profileDetail}>{text.fromArchive}</Text>}
              </View>
            </View>
            {!archived && !life.finished && life.path && age >= 7 && <View style={base.row}>
              <Button label={age < 18 ? t("Даскало", "Education") : t("Кариера", "Career")} secondary testID="open-career"
                onPress={() => navigation.navigate("Occupation", { section: "career" })}/>
              {life.path.work.job && !maternity && <Button label={t("Работа", "Work")} secondary testID="open-workplace"
                onPress={() => navigation.navigate("Occupation", { section: "work" })}/>}
            </View>}
            {life.finished && <Text style={base.section} testID="life-ended">{t("Животът приключи", "Life ended")}</Text>}
            {!archived && pregnancy && <View style={base.card}>
              <Text style={base.section}>{pregnancy[language]}</Text>
              {canEndPregnancy(life) && <Button label={t("Прекъсване по желание", "End the pregnancy")} secondary
                disabled={saving} onPress={askToEndPregnancy} />}
            </View>}
            {!archived && maternity && <View style={base.card}>
              <Text style={base.section}>{maternity[language]}</Text>
              <Text style={base.body}>{t("Обезщетение за годината", "Benefit this year")} · {money(maternityPay(life), language)}</Text>
              {maternityYear(life) === 2 && <Button label={life.path?.work.job ? t("Върни се на работа", "Return to work")
                : t("Приключи отпуска", "End maternity leave")} secondary disabled={saving || Boolean(birth || notice)}
                onPress={() => { void changeLife(current => doMaternityReturn(current, age)); }} />}
            </View>}
            {!archived && birth && <BirthNames key={life.seed + "-" + life.age} life={life} birth={birth} />}
          </View>
        )} />
      {workDecision && <WorkPrompt life={life} decision={workDecision}/>}
      {!archived && (
        <View style={styles.dock}>
          {life.finished
            ? <Button style={styles.play} label={text.newLife} onPress={() => navigation.replace("NewLife")} />
            : <Button label={turn?.[language] ?? text.ageUp} style={[styles.play, turn && styles.pregnancyPlay]}
                testID="advance-year" disabled={saving || blocked} onPress={() => { void advance(); }} />}
          <Button label={assetTitle[language]} testID="assets" secondary onPress={() => navigation.navigate("Assets")} />
        </View>
      )}
      {pregnancyPrompt && <Modal transparent animationType="fade" onRequestClose={() => {
        if (!saving && notice?.kind !== "test") proceedWithPregnancyNotice();
      }}>
        <View style={styles.modalShade}>
          <View style={[base.card, styles.modalCard]} accessibilityViewIsModal>
            <Text accessibilityRole="header" style={base.section}>{pregnancyPrompt.title[language]}</Text>
            <Text style={base.body}>{pregnancyPrompt.text[language]}</Text>
            <Button label={pregnancyPrompt.action[language]} style={styles.pregnancyPlay}
              disabled={saving} onPress={proceedWithPregnancyNotice} />
          </View>
        </View>
      </Modal>}
      {decision && <DecisionModal key={decision.key} decision={decision} age={age} language={language} saving={saving}
        onClose={() => { void changeLife(current => skipDecision(current, decision.id, age)); }}
        onChoose={id => { void changeLife(current => decision.kind === "story" ? choose(current, id, age) : doAction(current, id, age)); }}/>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  journalHeader: { gap: 16 },
  pregnancyPlay: { backgroundColor: "#7B3656" },
  modalShade: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#231924B3" },
  modalCard: { width: "100%", maxWidth: 450 },
  profile: {
    backgroundColor: color.deep, borderRadius: 19, padding: 14, flexDirection: "row", alignItems: "center", gap: 14,
  },
  profileText: { flex: 1, gap: 3 },
  badge: { borderRadius: 12, overflow: "hidden" },
  name: { color: color.paper, fontSize: 22, fontWeight: "800" },
  profileDetail: { color: "#D3E2D7", fontSize: 14 },
  yearTitle: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 },
  current: { color: color.green, fontSize: 12, fontWeight: "800" },
  entry: { borderLeftWidth: 2, borderLeftColor: color.lightGreen, paddingLeft: 11, gap: 3 },
  entryTitle: { fontSize: 15, fontWeight: "800", color: color.ink },
  workJournalLine: { minHeight: 44, justifyContent: "center" },
  workJournalDetail: { padding: 10, backgroundColor: color.lightGreen, borderRadius: 8, gap: 4 },
  workBackdrop: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "#14221BC7" },
  workPrompt: { width: "100%", maxWidth: 460, maxHeight: "82%", backgroundColor: "#F3F5E9" },
  outcome: { borderLeftColor: "#5A947F" },
  outcomeText: { fontWeight: "700" },
  delta: { color: color.green, fontSize: 13, fontWeight: "700" },
  negative: { color: color.red },
  budget: { paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.line, gap: 3 },
  dock: {
    width: "100%", maxWidth: 580, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: color.paper, borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.line,
    flexDirection: "row", gap: 10,
  },
  play: { flex: 1 },
});

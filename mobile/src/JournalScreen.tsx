import { useMemo, useRef, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { selectionAsync } from "expo-haptics";
import { assetTitle } from "../../src/assetMenu.ts";
import { getAvatarLook, getAvatarTreatments } from "../../src/avatar.ts";
import { cleanFirstName } from "../../src/babyNames.ts";
import { cityWeatherDate } from "../../src/cityLife.ts";
import {
  choose, defaultPlayChoice, doAction, doPathAction, getChoices, getCityOpportunity, getScene, nameNewborns, playYear, type GameState, type Memory,
} from "../../src/engine.ts";
import { newbornName, newbornSurname, type BirthNaming } from "../../src/reproduction.ts";
import type { Language } from "../../src/sessionCodec.ts";
import { getWorkDecision } from "../../src/workplace.ts";
import { Avatar } from "./Avatar";
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

function YearCard({ year, language, current, opportunity, saving, onCityAction }: {
  year: Year;
  language: Language;
  current: boolean;
  opportunity: ReturnType<typeof getCityOpportunity>;
  saving: boolean;
  onCityAction: (id: string) => void;
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
      {events.map((entry, index) => (
        entry.decision ? <WorkJournalEntry key={entry.id + "-" + index} entry={entry} language={language}/>
          : <View key={entry.id + "-" + index} style={styles.entry}>
          <Text style={styles.entryTitle}>{entry.title[language]}</Text>
          {entry.cityEvent && <Text style={base.muted}>{cityWeatherDate(entry.cityEvent, language)}</Text>}
          <Text style={base.body}>{entry.text[language]}</Text>
          {current && opportunity?.id === entry.id && (
            <View style={styles.cityChoices} testID="city-opportunity">
              {opportunity.options.map(({ option, blocked }) => {
                const cash = option.effect?.cash ?? 0;
                const label = option.label[language] + (cash ? " · " + (cash > 0 ? "+" : "") + money(cash, language) : "");
                return <Button key={option.id} label={label} secondary disabled={saving || blocked}
                  testID={option.id} onPress={() => onCityAction(option.id)} />;
              })}
            </View>
          )}
          {entry.cashDelta !== 0 && (
            <Text style={[styles.delta, entry.cashDelta < 0 && styles.negative]}>
              {entry.cashDelta > 0 ? "+" : ""}{money(entry.cashDelta, language)}
            </Text>
          )}
        </View>
      ))}
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

function WorkPrompt({ life, decision }: { life: GameState; decision: NonNullable<ReturnType<typeof getWorkDecision>> }) {
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
  const t = (bg: string, en: string) => translation(language, bg, en);
  const text = labels(language);

  if (!life || !look) return <View style={base.page} />;

  const age = life.age;
  const birth = life.lifeSystems.reproduction.naming;
  const scene = getScene(life);
  const choices = getChoices(life);
  const opportunity = archived ? null : getCityOpportunity(life);
  const workDecision = !archived && focused ? getWorkDecision(life) : null;
  const blocked = Boolean(birth || (scene && life.choiceId === null && !defaultPlayChoice(life)));

  function takeCityAction(id: string) {
    void updateSession(current => {
      const next = doAction(current.life, id, age);
      return next === current.life ? current : { ...current, life: next };
    });
  }

  async function advance() {
    void selectionAsync().catch(() => {});
    const changed = await updateSession(current => {
      const next = playYear(current.life, age);
      return next === current.life ? current : { ...current, life: next };
    });
    if (changed) list.current?.scrollToOffset({ offset: 0, animated: true });
  }

  return (
    <SafeAreaView style={base.page} edges={["bottom"]} testID="journal-screen">
      <FlatList ref={list} data={years} keyExtractor={year => String(year.age)} contentContainerStyle={base.scroll}
        keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
        renderItem={({ item }) => <YearCard year={item} language={language} current={item.age === age && !life.finished && !archived}
          opportunity={opportunity} saving={saving} onCityAction={takeCityAction} />}
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
              {life.path.work.job && <Button label={t("Работа", "Work")} secondary testID="open-workplace"
                onPress={() => navigation.navigate("Occupation", { section: "work" })}/>}
            </View>}
            {life.finished && <Text style={base.section} testID="life-ended">{t("Животът приключи", "Life ended")}</Text>}
            {!archived && birth && <BirthNames key={life.seed + "-" + life.age} life={life} birth={birth} />}
            {!archived && !birth && !life.finished && scene && choices.length > 0 && (
              <View style={base.card}>
                <Text style={base.section}>{scene.title[language]}</Text>
                <Text style={base.body}>{scene.body[language]}</Text>
                {choices.map(option => (
                  <Button key={option.id} label={option.label[language]} secondary disabled={saving}
                    onPress={() => { void updateSession(current => {
                      const next = choose(current.life, option.id, life.age);
                      return next === current.life ? current : { ...current, life: next };
                    }); }} />
                ))}
              </View>
            )}
          </View>
        )} />
      {workDecision && <WorkPrompt life={life} decision={workDecision}/>}
      {!archived && (
        <View style={styles.dock}>
          {life.finished
            ? <Button style={styles.play} label={text.newLife} onPress={() => navigation.replace("NewLife")} />
            : <Button style={styles.play} label={text.ageUp} testID="advance-year" disabled={saving || blocked}
                onPress={() => { void advance(); }} />}
          <Button label={assetTitle[language]} testID="assets" secondary onPress={() => navigation.navigate("Assets")} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  journalHeader: { gap: 16 },
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
  cityChoices: { gap: 6, marginTop: 6 },
  workJournalLine: { minHeight: 44, justifyContent: "center" },
  workJournalDetail: { padding: 10, backgroundColor: color.lightGreen, borderRadius: 8, gap: 4 },
  workBackdrop: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "#14221BC7" },
  workPrompt: { width: "100%", maxWidth: 460, maxHeight: "82%", backgroundColor: "#F3F5E9" },
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

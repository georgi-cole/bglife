import { useLayoutEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { assetPageData, type AssetPage, type AssetRow } from "../../src/assetMenu.ts";
import { doLifeActivity, type Memory } from "../../src/engine.ts";
import { type Screens, useGame } from "./game";
import { ageLabel, base, Button, color, money, town, translation } from "./ui";

export function AssetsScreen({ navigation, route }: NativeStackScreenProps<Screens, "Assets">) {
  const { language, session, saving, updateSession } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Memory | null>(null);
  const life = session.life;
  const page: AssetPage = route.params?.page ?? { kind: "overview" };
  const data = assetPageData(life, page);
  const t = (bg: string, en: string) => translation(language, bg, en);
  const format = (value: number, signed = false) => (signed && value > 0 ? "+" : "") + money(value, language);

  useLayoutEffect(() => {
    navigation.setOptions({ title: data.title[language] });
  }, [data.title, language, navigation]);

  async function transact(id: string) {
    let entry: Memory | undefined;
    const saved = await updateSession(current => {
      if (current.life !== life) return current;
      const next = doLifeActivity(current.life, id, life.age);
      if (next === current.life) return current;
      entry = next.history.at(-1);
      return { ...current, life: next };
    });
    if (saved && entry) {
      setSelected(null);
      setReceipt(entry);
    }
  }

  function renderRow(row: AssetRow, shop = false) {
    return <Pressable key={row.label.en} accessibilityRole="button" accessibilityState={{ disabled: saving }}
      disabled={saving} onPress={() => navigation.push("Assets", { page: row.page })}
      style={({ pressed }) => [styles.row, shop && styles.shop, pressed && styles.pressed]}>
      <View style={styles.rowText}>
        <Text style={styles.label}>{row.label[language]}</Text>
        {row.hint && <Text style={base.muted}>{row.hint[language]}</Text>}
      </View>
      {row.value !== undefined && <Text style={styles.value}>{format(row.value)}</Text>}
      <Text importantForAccessibility="no" accessibilityElementsHidden style={styles.arrow}>›</Text>
    </Pressable>;
  }

  return <SafeAreaView style={base.page} edges={["bottom"]}>
    <ScrollView contentContainerStyle={[base.scroll, styles.scroll]}>
      {receipt && <View style={[base.card, styles.receipt]} accessibilityLiveRegion="polite">
        <Text style={base.section}>{receipt.title[language]}</Text>
        <Text style={base.muted}>{receipt.text[language]}</Text>
        <Button secondary label={t("Към дневника", "Back to journal")} onPress={() => navigation.popTo("Journal")}/>
      </View>}
      {data.summary && <View style={styles.balance}>
        <Text style={styles.balanceLabel}>{data.summary.label[language]}</Text>
        <Text style={styles.balanceValue}>{format(data.summary.value)}</Text>
      </View>}
      {data.note && <Text style={base.muted}>{data.note[language]}</Text>}
      {page.kind === "funds" && data.rows?.map(row => renderRow(row))}
      {data.groups?.map(({ title, fields }, i) => <View key={title?.en ?? i} style={base.card}>
        {title && <Text style={base.section} accessibilityRole="header">{title[language]}</Text>}
        {fields.map(({ label, value, change }) => <View key={label.en} style={styles.field}>
          <Text style={[base.muted, styles.rowText]}>{label[language]}</Text>
          <Text style={[styles.value, change && value < 0 && styles.loss]}>{format(value, change)}</Text>
        </View>)}
      </View>)}
      {page.kind !== "funds" && data.rows?.map(row => renderRow(row))}
      {data.shop && renderRow(data.shop, true)}
      {data.actions?.map(option => {
        const direct = page.kind === "good";
        const expanded = selected === option.id;
        const value = option.cashDelta;
        const price = value ? " · " + format(Math.abs(value)) : "";
        return <View key={option.id} style={styles.action}>
          {!direct && <Pressable accessibilityRole="button" accessibilityState={{ expanded, disabled: saving }}
            disabled={saving} onPress={() => setSelected(expanded ? null : option.id)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Text style={[styles.label, styles.rowText]}>{option.label[language]}</Text>
            {!!value && <Text style={styles.value}>{format(value, true)}</Text>}
            <Text importantForAccessibility="no" accessibilityElementsHidden style={styles.arrow}>{expanded ? "⌄" : "›"}</Text>
          </Pressable>}
          {(direct || expanded) && <View style={direct ? styles.action : base.card}>
            {!direct && <Text style={base.muted}>{option.description[language]}</Text>}
            {option.blocked && <Text style={styles.loss}>{option.blocked[language]}</Text>}
            {(direct || !option.blocked) && <Button testID={option.id} label={direct ? option.label[language] + price : t("Потвърди", "Confirm")}
              disabled={saving || Boolean(option.blocked)} onPress={() => { void transact(option.id); }}/>}
          </View>}
        </View>;
      })}
      {data.history?.map(entry => <View key={entry.age + "-" + entry.id} style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.label}>{entry.title[language]}</Text>
          <Text style={base.muted}>{ageLabel(entry.age, language)} · {town(entry.city, language)}
            {entry.id === "bank.mortgage" && " · " + t("Самоучастие", "Down payment")}</Text>
        </View>
        <Text style={styles.value}>{format(-entry.cashDelta)}</Text>
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  scroll: { gap: 10 },
  balance: { padding: 17, gap: 4, borderRadius: 16, backgroundColor: color.deep },
  balanceLabel: { color: "#D4E2D6", fontSize: 14, fontWeight: "600" },
  balanceValue: { color: color.gold, fontSize: 32, fontWeight: "800", fontVariant: ["tabular-nums"] },
  row: {
    minHeight: 54, borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.surface,
    paddingHorizontal: 13, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 10,
  },
  rowText: { flex: 1, gap: 2 },
  label: { color: color.ink, fontSize: 16, fontWeight: "700" },
  value: { color: color.green, fontSize: 15, fontWeight: "700", maxWidth: "43%", textAlign: "right",
    fontVariant: ["tabular-nums"] },
  arrow: { color: color.muted, fontSize: 23, lineHeight: 24 },
  field: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 },
  shop: { borderColor: "#BFAB84", backgroundColor: "#F5EDDA" },
  action: { gap: 7 },
  receipt: { backgroundColor: color.lightGreen },
  loss: { color: color.red, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.72 },
});

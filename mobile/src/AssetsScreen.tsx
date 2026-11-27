import { useLayoutEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { assetPageData, paidDeposit, type AssetPage, type AssetRow } from "../../src/assetMenu.ts";
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
  const wallet = money(life.cash, language);

  useLayoutEffect(() => {
    navigation.setOptions({ title: data.title[language], headerRight: () => <Text style={styles.wallet} numberOfLines={1}
      adjustsFontSizeToFit>{wallet}</Text> });
  }, [data.title, language, navigation, wallet]);

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

  function renderRow(row: AssetRow, banner = false) {
    return <Pressable key={row.label.en} accessibilityRole="button" accessibilityState={{ disabled: saving }}
      disabled={saving} onPress={() => navigation.push("Assets", { page: row.page })}
      style={({ pressed }) => [styles.row, banner && styles.banner, pressed && styles.pressed]}>
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
      {data.note && <Text style={base.muted}>{data.note[language]}</Text>}
      {data.summary && <View style={[base.card, styles.field]}>
        <Text style={[base.muted, styles.rowText]}>{data.summary.label[language]}</Text>
        <Text style={styles.value}>{format(data.summary.value)}</Text>
      </View>}
      {data.condition !== undefined && <View style={base.card}>
        <View style={styles.field}>
          <Text style={[base.muted, styles.rowText]}>{t("Състояние", "Condition")}</Text>
          <Text style={styles.value}>{data.condition}%</Text>
        </View>
        <View accessibilityRole="progressbar" accessibilityLabel={t("Състояние на притежанието", "Asset condition")}
          accessibilityValue={{ min: 0, max: 100, now: data.condition }} style={styles.condition}>
          <View style={[styles.conditionFill, { width: data.condition + "%" }]}/>
        </View>
      </View>}
      {data.status && <Text style={styles.status}>{data.status[language]}</Text>}
      {page.kind === "funds" && data.rows?.map(row => renderRow(row))}
      {data.groups?.map(({ title, fields }, i) => <View key={title?.en ?? i} style={base.card}>
        {title && <Text style={base.section} accessibilityRole="header">{title[language]}</Text>}
        {fields.map(({ label, value, change }) => <View key={label.en} style={styles.field}>
          <Text style={[base.muted, styles.rowText]}>{label[language]}</Text>
          <Text style={[styles.value, change && value < 0 && styles.loss]}>{format(value, change)}</Text>
        </View>)}
      </View>)}
      {page.kind !== "funds" && data.rows?.map(row => renderRow(row))}
      {data.banner && renderRow(data.banner, true)}
      {data.actions?.map(option => {
        const direct = page.kind === "good" && page.offer;
        const expanded = selected === option.id;
        const value = option.cashDelta;
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
            {(direct || !option.blocked) && <Button testID={option.id} label={direct ? option.label[language] : t("Потвърди", "Confirm")}
              disabled={saving || Boolean(option.blocked)} onPress={() => { void transact(option.id); }}/>}
          </View>}
        </View>;
      })}
      {data.history?.map(entry => <View key={entry.age + "-" + entry.id} style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.label}>{entry.title[language]}</Text>
          <Text style={base.muted}>{ageLabel(entry.age, language)} · {town(entry.city, language)}
            {paidDeposit(entry) && " · " + t("Самоучастие", "Down payment")}</Text>
        </View>
        <Text style={styles.value}>{format(-entry.cashDelta)}</Text>
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  scroll: { gap: 10 },
  wallet: { color: color.green, fontWeight: "800", fontSize: 14, maxWidth: 110, fontVariant: ["tabular-nums"] },
  condition: { height: 5, borderRadius: 6, overflow: "hidden", backgroundColor: color.line },
  conditionFill: { height: 5, backgroundColor: color.green },
  status: { color: "#77562C", fontSize: 14, fontWeight: "700" },
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
  banner: { borderColor: "#B69761", backgroundColor: "#F5E6C9", marginTop: 4 },
  action: { gap: 7 },
  receipt: { backgroundColor: color.lightGreen },
  loss: { color: color.red, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.72 },
});

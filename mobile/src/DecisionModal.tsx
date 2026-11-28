import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { JournalDecision } from "../../src/journalDecisions.ts";
import type { Language } from "../../src/sessionCodec.ts";
import { ageLabel, money, translation } from "./ui";

export function DecisionModal({ decision, age, language, saving, onClose, onChoose }: {
  decision: JournalDecision; age: number; language: Language; saving: boolean; onClose: () => void; onChoose: (id: string) => void;
}) {
  const local = decision.kind === "city";
  const accent = local ? "#A9ECD8" : "#CBBaff";

  return (
    <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor: local ? "#1B2A32" : "#232337" }]}
          accessibilityViewIsModal testID="decision-dialog">
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            <View style={styles.head}>
              <Text accessible={false} style={[styles.emblem, { color: accent }]}>{local ? "◇" : "✦"}</Text>
              <Text style={[styles.context, { color: accent }]}>{decision.date?.[language] || ageLabel(age, language)}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={translation(language, "Пропусни събитието", "Skip event")}
                testID="dismiss-decision" onPress={onClose} disabled={saving} style={styles.close}>
                <Text style={styles.closeMark}>×</Text>
              </Pressable>
            </View>
            <Text accessibilityRole="header" style={styles.title}>{decision.title[language]}</Text>
            <Text style={styles.body}>{decision.body[language]}</Text>
            <View style={styles.options}>
              {decision.options.map(({ option, blocked }) => {
                const disabled = blocked || saving;
                const cash = local ? option.effect?.cash ?? 0 : 0;
                return <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ disabled }}
                  testID={"decision-" + option.id} disabled={disabled} onPress={() => onChoose(option.id)}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed, disabled && styles.disabled]}>
                  <Text style={styles.label}>{option.label[language]}</Text>
                  {cash !== 0 && <Text style={{ color: cash > 0 ? "#A9ECD8" : "#FFB6BF" }}>
                    {cash > 0 ? "+" : ""}{money(cash, language)}
                  </Text>}
                  <Text accessible={false} style={[styles.arrow, { color: accent }]}>›</Text>
                </Pressable>;
              })}
              {!decision.options.length && <Text style={styles.body}>{translation(language, "В момента няма достъпен вариант.", "No option is available right now.")}</Text>}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#080A17BF", justifyContent: "center", alignItems: "center", padding: 16, paddingVertical: 24 },
  panel: { width: "100%", maxWidth: 450, maxHeight: "92%", borderRadius: 22, borderWidth: 1, borderColor: "#777594", overflow: "hidden", elevation: 12 },
  content: { padding: 19, gap: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#686982" },
  emblem: { fontSize: 22, width: 34, textAlign: "center", backgroundColor: "#FFFFFF16", borderRadius: 8, paddingVertical: 4, overflow: "hidden" },
  context: { fontSize: 13, fontWeight: "700", flex: 1 },
  close: { alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF14" },
  closeMark: { color: "#E4E4F2", fontSize: 25, lineHeight: 29 },
  title: { color: "#F4F3FB", fontSize: 26, lineHeight: 32, fontWeight: "800" },
  body: { color: "#D8D9E8", fontSize: 15, lineHeight: 23 },
  options: { gap: 7 },
  option: { minHeight: 51, alignItems: "center", flexDirection: "row", gap: 9, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: "#62667F", borderRadius: 11, backgroundColor: "#FFFFFF12" },
  label: { color: "#F4F3FB", fontSize: 15, lineHeight: 20, fontWeight: "700", flex: 1 },
  arrow: { fontSize: 23, lineHeight: 26 },
  pressed: { backgroundColor: "#FFFFFF25" },
  disabled: { opacity: .48 },
});

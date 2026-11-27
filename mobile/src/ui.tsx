import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { getAvatarName } from "../../src/avatar.ts";
import { cities } from "../../src/cities.ts";
import type { GameState } from "../../src/engine.ts";
import { bilingualName } from "../../src/lifeProfile.ts";
import type { Language } from "../../src/sessionCodec.ts";

export const color = {
  paper: "#F9F5EB",
  surface: "#FFFCF5",
  ink: "#172D25",
  muted: "#52635B",
  line: "#DDD8C8",
  green: "#225043",
  deep: "#102C25",
  gold: "#E1BE84",
  lightGreen: "#E7EFE7",
  red: "#8B3F33",
} as const;

export const base = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.paper },
  scroll: { width: "100%", maxWidth: 580, alignSelf: "center", padding: 20, paddingBottom: 28, gap: 16 },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  field: { gap: 9 },
  heading: { fontSize: 28, fontWeight: "800", color: color.ink, letterSpacing: -0.7 },
  section: { fontSize: 17, fontWeight: "800", color: color.ink },
  body: { fontSize: 16, lineHeight: 23, color: color.ink },
  muted: { fontSize: 14, lineHeight: 20, color: color.muted },
  input: {
    minHeight: 50, borderWidth: 1, borderColor: color.line, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: color.surface,
    color: color.ink, fontSize: 17,
  },
  card: { backgroundColor: color.surface, borderColor: color.line, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
});

const copy = {
  bg: { newLife: "Нов живот", journal: "Дневник", settings: "Настройки", album: "Албум", ageUp: "+1 година",
    cancel: "Отказ", fromArchive: "От албума" },
  en: { newLife: "New life", journal: "Journal", settings: "Settings", album: "Album", ageUp: "+1 year",
    cancel: "Cancel", fromArchive: "From the album" },
};
export const labels = (language: Language) => copy[language];
export const translation = (language: Language, bg: string, en: string) => language === "bg" ? bg : en;
export const lifeName = (life: GameState, language: Language) =>
  (life.profile ? bilingualName(life.profile.name) : getAvatarName(life.avatar))[language];
export const town = (city: GameState["city"], language: Language) => cities[city].name[language];
export function ageLabel(age: number, language: Language) {
  return age === 0 ? translation(language, "При раждането", "At birth") : translation(language, age + " г.", "Age " + age);
}
export function money(cents: number, language: Language) {
  return new Intl.NumberFormat(language === "bg" ? "bg-BG" : "en-IE", {
    style: "currency", currency: "EUR", minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function Button({ label, onPress, secondary, disabled, testID, style }: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} testID={testID}
      onPress={onPress} disabled={disabled} android_ripple={{ color: "#68847830" }}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, style, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, testID, swatch }: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
  swatch?: string;
}) {
  return (
    <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: selected }}
      onPress={onPress} testID={testID} style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      {swatch && <View style={[styles.swatch, { backgroundColor: swatch }]} />}
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

export function Flag() {
  return (
    <View style={styles.flag} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.stripe, { backgroundColor: "#FFFFFF" }]} />
      <View style={[styles.stripe, { backgroundColor: "#25885F" }]} />
      <View style={[styles.stripe, { backgroundColor: "#CE483A" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: "row", gap: 10,
    alignItems: "center", justifyContent: "center", backgroundColor: color.green, overflow: "hidden",
  },
  buttonText: { color: color.surface, fontSize: 16, fontWeight: "800", textAlign: "center", flexShrink: 1 },
  secondary: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line },
  secondaryText: { color: color.ink },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
  chip: {
    minHeight: 44, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface,
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 13, flexDirection: "row", gap: 7, alignItems: "center",
  },
  selected: { backgroundColor: color.lightGreen, borderColor: color.green },
  chipText: { color: color.ink, fontSize: 14, fontWeight: "700", flexShrink: 1 },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: "#172D2540" },
  flag: { width: 34, height: 23, overflow: "hidden", borderWidth: 1, borderColor: "#FFF2DB80", borderRadius: 4 },
  stripe: { flex: 1 },
});

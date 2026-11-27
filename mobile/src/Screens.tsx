import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDocumentAsync } from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { hasStartedLife } from "../../src/engine.ts";
import { deserialize, restoreSession, serialize, type Session } from "../../src/sessionCodec.ts";
import { type Screens, useGame } from "./game";
import { ageLabel, base, Button, Chip, color, Flag, labels, lifeName, town, translation } from "./ui";

const cover = require("../../public/art/tryavna.webp");
const maxBackupBytes = 24 * 1024 * 1024;

export function HomeScreen({ navigation }: NativeStackScreenProps<Screens, "Home">) {
  const { session, language, notice, dismissNotice } = useGame();
  const life = session.life;
  const hasLife = hasStartedLife(life);
  const text = labels(language);
  const t = (bg: string, en: string) => translation(language, bg, en);

  return (
    <SafeAreaView style={base.page} testID="home-screen">
      <ScrollView contentContainerStyle={base.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={cover} style={styles.heroImage} resizeMode="cover" accessible={false} />
          <View style={styles.wordmark}>
            <Text accessibilityRole="header" style={styles.logo}>Bg<Text style={styles.logoAccent}>Life</Text></Text>
            <Flag />
          </View>
        </View>
        {notice && (
          <Pressable accessibilityRole="button" accessibilityHint={t("Скрий съобщението", "Dismiss message")} onPress={dismissNotice} style={base.card}>
            <Text accessibilityLiveRegion="polite" style={base.body}>
              {notice === "recovered"
                ? t("Предишният запис е възстановен.", "Your previous save was recovered.")
                : t("Записът е повреден. Можеш да заредиш резервно копие от настройките.", "The save is damaged. You can restore a backup in Settings.")}
            </Text>
          </Pressable>
        )}
        <View style={styles.actions}>
          {hasLife ? (
            <>
              <View style={base.card}>
                <Text style={base.section}>{lifeName(life, language)}</Text>
                <Text style={base.muted}>{ageLabel(life.age, language)} · {town(life.city, language)}</Text>
                <Button label={t("Продължи", "Continue")} onPress={() => navigation.navigate("Journal")} testID="continue-life" />
              </View>
              <Button label={text.newLife} secondary onPress={() => navigation.navigate("NewLife")} testID="new-life" />
            </>
          ) : <Button label={text.newLife} onPress={() => navigation.navigate("NewLife")} testID="new-life" />}
          <View style={styles.shortcuts}>
            <Button label={text.album} secondary style={styles.shortcut} onPress={() => navigation.navigate("Album")} testID="open-album" />
            <Button label={text.settings} secondary style={styles.shortcut} onPress={() => navigation.navigate("Settings")} testID="open-settings" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function AlbumScreen({ navigation }: NativeStackScreenProps<Screens, "Album">) {
  const { session, language } = useGame();
  return (
    <SafeAreaView style={base.page} edges={["bottom"]}>
      <ScrollView contentContainerStyle={base.scroll}>
        {session.album.length ? [...session.album].reverse().map((life, index) => (
          <Pressable accessibilityRole="button" key={session.album.length - index}
            onPress={() => navigation.navigate("Journal", { archive: session.album.length - index - 1 })}
            style={({ pressed }) => [base.card, pressed && styles.pressed]}>
            <Text style={base.section}>{lifeName(life, language)}</Text>
            <Text style={base.muted}>{ageLabel(life.age, language)} · {town(life.city, language)}</Text>
          </Pressable>
        )) : <Text style={base.body}>{translation(language, "Тук ще се пазят предишните ти животи.", "Your previous lives will appear here.")}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SettingsScreen({ navigation }: NativeStackScreenProps<Screens, "Settings">) {
  const { language, session, saving, updateLanguage, updateSession } = useGame();
  const t = (bg: string, en: string) => translation(language, bg, en);
  const [working, setWorking] = useState(false);
  const [backup, setBackup] = useState<Session | null>(null);
  const [fileError, setFileError] = useState<"invalid" | "export" | null>(null);

  async function pickBackup() {
    setWorking(true);
    setFileError(null);
    setBackup(null);
    try {
      const result = await getDocumentAsync({ type: ["application/json", "text/plain", "application/octet-stream"], copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const file = new File(asset.uri);
      if ((asset.size ?? file.size ?? 0) > maxBackupBytes) {
        setFileError("invalid");
        return;
      }
      const restored = deserialize(await file.text());
      if (!restored) setFileError("invalid");
      else setBackup(restored);
    } catch {
      setFileError("invalid");
    } finally {
      setWorking(false);
    }
  }

  async function shareBackup() {
    setWorking(true);
    setFileError(null);
    try {
      if (!await isAvailableAsync()) throw new Error("File sharing unavailable");
      const file = new File(Paths.cache, "BgLife-save.json");
      file.create({ overwrite: true });
      file.write(serialize(session));
      await shareAsync(file.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle: t("Резервно копие", "BgLife backup") });
    } catch {
      setFileError("export");
    } finally {
      setWorking(false);
    }
  }

  async function restoreBackup() {
    if (!backup) return;
    if (await updateSession(current => restoreSession(current, backup))) {
      navigation.reset({ index: 1, routes: [{ name: "Home" }, { name: "Journal" }] });
    }
  }

  return (
    <SafeAreaView style={base.page} edges={["bottom"]}>
      <ScrollView contentContainerStyle={base.scroll} keyboardShouldPersistTaps="handled">
        <View style={base.card}>
          <Text style={base.section} accessibilityRole="header">{t("Език", "Language")}</Text>
          <View style={base.row}>
            <Chip label="Български" selected={language === "bg"} testID="language-bg" onPress={() => { void updateLanguage("bg"); }} />
            <Chip label="English" selected={language === "en"} testID="language-en" onPress={() => { void updateLanguage("en"); }} />
          </View>
        </View>
        <View style={base.card}>
          <Text style={base.section} accessibilityRole="header">{t("Запазени животи", "Saved lives")}</Text>
          <Button label={t("Избери резервно копие", "Choose a backup")} secondary onPress={() => { void pickBackup(); }}
            disabled={working || saving} testID="choose-backup" />
          {backup && (
            <View style={base.field}>
              <Text style={base.body}>{lifeName(backup.life, language)} · {ageLabel(backup.life.age, language)}</Text>
              <Text style={base.muted}>{t("Текущият живот ще се запази в албума.", "Your current life will be kept in the album.")}</Text>
              <Button label={t("Възстанови записа", "Restore save")} onPress={() => { void restoreBackup(); }}
                disabled={working || saving} testID="restore-backup" />
            </View>
          )}
          <Button label={t("Сподели резервно копие", "Share a backup")} secondary onPress={() => { void shareBackup(); }}
            disabled={working || saving || !hasStartedLife(session.life)} testID="share-backup" />
          {fileError && <Text accessibilityLiveRegion="polite" style={styles.error}>{fileError === "invalid"
            ? t("Файлът не е съвместим запис на BgLife.", "This file isn’t a compatible BgLife save.")
            : t("Копието не може да се сподели.", "Couldn’t share this backup.")}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 23, overflow: "hidden", backgroundColor: color.deep },
  heroImage: { width: "100%", aspectRatio: 1.2 },
  wordmark: { paddingHorizontal: 23, paddingTop: 10, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 13 },
  logo: { fontSize: 47, fontWeight: "900", letterSpacing: -1.7, color: color.paper, includeFontPadding: false },
  logoAccent: { color: color.gold },
  actions: { gap: 10 },
  shortcuts: { flexDirection: "row", gap: 10 },
  shortcut: { flex: 1 },
  pressed: { opacity: 0.72 },
  error: { color: color.red, lineHeight: 19 },
});

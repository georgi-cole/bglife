import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, View } from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { initialWindowMetrics, SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import type { Language, Session } from "../../src/sessionCodec.ts";
import { Game, type Screens } from "./game";
import { JournalScreen } from "./JournalScreen";
import { NewLifeScreen } from "./NewLifeScreen";
import { OccupationScreen } from "./OccupationScreen";
import { AlbumScreen, HomeScreen, SettingsScreen } from "./Screens";
import { openSaveStore, type SaveStore } from "./saveStore";
import { base, Button, color, labels, translation } from "./ui";

const Stack = createNativeStackNavigator<Screens>();
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors, background: color.paper, card: color.paper, text: color.ink,
    border: color.line, primary: color.green,
  },
};

function GameApp({ storage }: { storage: SaveStore }) {
  const [session, setSession] = useState(storage.session);
  const [language, setLanguage] = useState(storage.language);
  const [notice, setNotice] = useState(storage.notice);
  const [saving, setSaving] = useState(false);
  const current = useRef(session);
  const writing = useRef(false);
  const wording = labels(language);

  async function persist(operation: () => Promise<void>) {
    if (writing.current) return false;
    writing.current = true;
    setSaving(true);
    try {
      await operation();
      return true;
    } catch {
      Alert.alert(translation(language, "Записът е неуспешен", "Couldn’t save"),
        translation(language, "Промяната не е приложена. Опитай отново.", "Your change wasn’t applied. Try again."));
      return false;
    } finally {
      writing.current = false;
      setSaving(false);
    }
  }

  function updateSession(update: (session: Session) => Session) {
    return persist(async () => {
      const next = update(current.current);
      if (next === current.current) return;
      await storage.save(next);
      current.current = next;
      setSession(next);
      setNotice(null);
    });
  }

  function updateLanguage(value: Language) {
    return persist(async () => {
      await storage.saveLanguage(value);
      setLanguage(value);
    });
  }

  return (
    <Game.Provider value={{ session, language, saving, notice, dismissNotice: () => setNotice(null), updateSession, updateLanguage }}>
      <NavigationContainer theme={theme}>
        <Stack.Navigator screenOptions={{
          headerShadowVisible: false, headerTintColor: color.green, headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: { color: color.ink, fontSize: 19, fontWeight: "800" },
        }}>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="NewLife" component={NewLifeScreen} options={{ title: wording.newLife }} />
          <Stack.Screen name="Journal" component={JournalScreen} options={{ title: wording.journal }} />
          <Stack.Screen name="Occupation" component={OccupationScreen} options={({ route }) => ({
            title: route.params.section === "work" ? translation(language, "Работа", "Work")
              : session.life.age < 18 ? translation(language, "Даскало", "Education") : translation(language, "Кариера", "Career"),
          })} />
          <Stack.Screen name="Album" component={AlbumScreen} options={{ title: wording.album }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: wording.settings }} />
        </Stack.Navigator>
      </NavigationContainer>
    </Game.Provider>
  );
}

export function App() {
  const [storage, setStorage] = useState<SaveStore | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let mounted = true;
    openSaveStore().then(
      store => { if (mounted) setStorage(store); },
      () => { if (mounted) setError(true); },
    );
    return () => { mounted = false; };
  }, [attempt]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar barStyle="dark-content" />
      {storage ? <GameApp storage={storage} /> : (
        <SafeAreaView style={[base.page, styles.launch]}>
          <Text style={base.heading}>BgLife</Text>
          {error ? (
            <View style={styles.error}>
              <Text style={base.body}>Записът не може да се отвори.</Text>
              <Text style={base.muted}>Couldn’t open the game save.</Text>
              <Button label="Опитай отново · Retry" onPress={() => { setError(false); setAttempt(value => value + 1); }} />
            </View>
          ) : <ActivityIndicator color={color.green} />}
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  launch: { alignItems: "center", justifyContent: "center", gap: 18 },
  error: { gap: 10, paddingHorizontal: 24, alignItems: "center" },
});

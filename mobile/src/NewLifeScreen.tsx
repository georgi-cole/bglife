import { useMemo, useState } from "react";
import {
  FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch,
  Text, TextInput, View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  avatarPalettes, avatarPresets, getAvatarLook, type AvatarPresentation, type AvatarTraits,
} from "../../src/avatar.ts";
import { cities, cityIds, type City } from "../../src/cities.ts";
import { hasStartedLife, newProfileLife, startCareerLife } from "../../src/engine.ts";
import { automaticAppearance, generatedName, talents, validName, type Talent } from "../../src/lifeProfile.ts";
import type { Language } from "../../src/sessionCodec.ts";
import { Avatar } from "./Avatar";
import { type Screens, useGame } from "./game";
import { base, Button, Chip, color, labels, town, translation } from "./ui";

const presentations = ["female", "male"] as const;
const talentIds = Object.keys(talents) as Talent[];

function newbornAppearance(sex: AvatarPresentation, seed: number) {
  return getAvatarLook(automaticAppearance(sex, seed), 0).traits;
}

export function CityPicker({ language, selected, title, onSelect, onClose }: {
  language: Language;
  selected: City;
  title?: string;
  onSelect: (city: City) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const items = cityIds.filter(id => cities[id].name.bg.toLowerCase().includes(search) || cities[id].name.en.toLowerCase().includes(search));
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={base.page}>
        <View style={styles.cityPickerHeader}>
          <Text accessibilityRole="header" style={base.heading}>{title ?? translation(language, "Роден град", "Birth city")}</Text>
          <TextInput value={query} onChangeText={setQuery} style={base.input} testID="city-search"
            placeholder={translation(language, "Потърси град", "Search cities")}
            accessibilityLabel={translation(language, "Потърси град", "Search cities")} placeholderTextColor={color.muted} />
        </View>
        <FlatList data={items} keyExtractor={id => id} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.cityList}
          ListEmptyComponent={<Text style={base.muted}>{translation(language, "Няма намерени градове.", "No cities found.")}</Text>}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected === item }} testID={"city-" + item}
              onPress={() => onSelect(item)} style={[styles.cityItem, selected === item && styles.currentCity]}>
              <Text style={base.body}>{town(item, language)}</Text>
              {selected === item && <Text style={styles.cityArrow}>✓</Text>}
            </Pressable>
          )} />
        <View style={styles.footer}>
          <Button label={labels(language).cancel} onPress={onClose} secondary />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function AvatarEditor({ language, appearance, onChange }: {
  language: Language;
  appearance: AvatarTraits;
  onChange: (appearance: AvatarTraits) => void;
}) {
  const t = (bg: string, en: string) => translation(language, bg, en);
  return (
    <View style={base.field}>
      <Text style={base.section}>{t("Коса", "Hair")}</Text>
      <View style={base.row}>
        {avatarPresets.hair.filter(preset => preset.tier === 0).map(({ id, label }) => (
          <Chip key={id} label={label[language]} selected={appearance.hair === id} testID={"avatar-hair-" + id}
            onPress={() => onChange({ ...appearance, hair: id })} />
        ))}
      </View>
      <Text style={base.section}>{t("Очи", "Eyes")}</Text>
      <View style={base.row}>
        {avatarPresets.eyes.filter(preset => preset.tier === 0).map(({ id, label }) => (
          <Chip key={id} label={label[language]} selected={appearance.eyes === id}
            onPress={() => onChange({ ...appearance, eyes: id })} />
        ))}
      </View>
      <Text style={base.section}>{t("Тен на кожата", "Skin tone")}</Text>
      <View style={base.row}>
        {avatarPalettes.skin.map(({ id, label, color }) => (
          <Chip key={id} label={label[language]} swatch={color} selected={appearance.skin === id}
            onPress={() => onChange({ ...appearance, skin: id })} />
        ))}
      </View>
    </View>
  );
}

export function NewLifeScreen({ navigation }: NativeStackScreenProps<Screens, "NewLife">) {
  const { language, saving, updateSession } = useGame();
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 32));
  const [name, setName] = useState("");
  const [presentation, setPresentation] = useState<AvatarPresentation>("female");
  const [city, setCity] = useState<City>("tryavna");
  const [talent, setTalent] = useState<Talent>("none");
  const [vip, setVip] = useState(false);
  const [cityPicker, setCityPicker] = useState(false);
  const [appearance, setAppearance] = useState(() => newbornAppearance("female", seed));
  const t = (bg: string, en: string) => translation(language, bg, en);
  const defaultName = generatedName(seed, presentation);
  const normalizedName = validName(name.trim() ? name : defaultName);
  const look = useMemo(() => getAvatarLook(vip ? appearance : automaticAppearance(presentation, seed), 0), [vip, appearance, presentation, seed]);

  function changePresentation(value: AvatarPresentation) {
    setPresentation(value);
    setAppearance(newbornAppearance(value, seed));
  }

  async function startLife() {
    if (!normalizedName) return;
    Keyboard.dismiss();
    const started = await updateSession(current => ({
      life: startCareerLife(newProfileLife({
        seed, presentation, city, avatar: appearance,
        profile: { name: normalizedName, talent, vip, wealthy: false, disposition: null },
      })),
      album: hasStartedLife(current.life) ? [...current.album, current.life] : current.album,
    }));
    if (started) navigation.replace("Journal");
  }

  return (
    <SafeAreaView style={base.page} edges={["bottom"]} testID="new-life-screen">
      <KeyboardAvoidingView style={base.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={base.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.portrait}>
            <Avatar look={look} size={104} label={t("Портрет на новороденото", "Newborn portrait")} full />
            <View style={styles.portraitTitle}>
              <Text style={base.heading}>{t("При раждането", "At birth")}</Text>
              <Text style={base.muted}>{town(city, language)}</Text>
            </View>
          </View>
          <View style={base.field}>
            <Text style={base.section}>{t("Име", "Name")}</Text>
            <TextInput value={name} onChangeText={setName} autoCapitalize="words" autoComplete="off" maxLength={48}
              style={base.input} placeholder={defaultName} placeholderTextColor={color.muted} testID="player-name"
              accessibilityLabel={t("Име на героя", "Character name")} />
            {!normalizedName && <Text style={styles.error}>{t("Използвай букви, интервали или тире.", "Use letters, spaces, or a hyphen.")}</Text>}
          </View>
          <View style={base.field}>
            <Text style={base.section}>{t("Пол", "Sex")}</Text>
            <View style={base.row}>
              {presentations.map(value => (
                <Chip key={value} label={value === "female" ? t("Момиче", "Girl") : t("Момче", "Boy")}
                  selected={presentation === value} onPress={() => changePresentation(value)} />
              ))}
            </View>
          </View>
          <View style={base.field}>
            <Text style={base.section}>{t("Роден град", "Birth city")}</Text>
            <Pressable testID="choose-city" accessibilityRole="button" accessibilityLabel={t("Промени родния град", "Change birth city")}
              onPress={() => { Keyboard.dismiss(); setCityPicker(true); }} style={styles.cityChoice}>
              <Text style={base.body}>{town(city, language)}</Text>
              <Text style={styles.cityArrow}>›</Text>
            </Pressable>
          </View>
          <View style={base.field}>
            <Text style={base.section}>{t("Талант", "Talent")}</Text>
            <View style={base.row}>
              {talentIds.map(value => (
                <Chip key={value} label={talents[value][language]} selected={talent === value} onPress={() => setTalent(value)} />
              ))}
            </View>
          </View>
          <View style={base.card}>
            <Pressable style={styles.vipRow} onPress={() => setVip(value => !value)}
              accessibilityRole="switch" accessibilityState={{ checked: vip }}
              accessibilityLabel={t("Пробен VIP", "VIP preview")} testID="vip-preview">
              <Text style={base.section}>{t("Пробен VIP", "VIP preview")}</Text>
              <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Switch value={vip} trackColor={{ true: color.green }} />
              </View>
            </Pressable>
            {vip && <AvatarEditor language={language} appearance={appearance} onChange={setAppearance} />}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button label={t("Започни живота", "Start life")} onPress={() => { void startLife(); }}
            disabled={!normalizedName || saving} testID="start-life" />
        </View>
      </KeyboardAvoidingView>
      {cityPicker && <CityPicker language={language} selected={city}
        onSelect={value => { setCity(value); setCityPicker(false); }} onClose={() => setCityPicker(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  portrait: { ...base.card, flexDirection: "row", alignItems: "center", gap: 16 },
  portraitTitle: { flex: 1, gap: 5 },
  error: { color: color.red },
  cityChoice: { ...base.input, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cityArrow: { color: color.green, fontSize: 22, fontWeight: "700" },
  vipRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cityPickerHeader: { padding: 20, gap: 12 },
  cityList: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  cityItem: { ...base.card, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  currentCity: { backgroundColor: color.lightGreen, borderColor: color.green },
  footer: {
    width: "100%", maxWidth: 580, alignSelf: "center", backgroundColor: color.paper,
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.line,
    paddingHorizontal: 20, paddingVertical: 10,
  },
});

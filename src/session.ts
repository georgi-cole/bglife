import { continueLife, decodeSave, encodeSave, newLife, startCareerLife, type GameState } from "./engine.ts";

import { startFamilyEvents } from "./reproduction.ts";

export const SAVE_KEY = "bglife.journal.v1";
export const LANGUAGE_KEY = "bglife.language";
export const VIP_TRIAL_KEY = "bglife.preview.vip";
export type Session = { life: GameState; album: GameState[] };
export type Language = "bg" | "en";

export function serialize(session: Session): string {
  return JSON.stringify({ version: 1, life: encodeSave(session.life), album: session.album.map(encodeSave) });
}

export function deserialize(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || typeof value.life !== "string" || !Array.isArray(value.album)) return null;
    const life = decodeSave(value.life);
    const album = value.album.map((entry: unknown) => typeof entry === "string" ? decodeSave(entry) : null);
    return life && album.every((entry: GameState | null) => entry !== null) ? {life: startFamilyEvents(continueLife(life)), album} : null;
  } catch { return null; }
}

export function loadSession(): { session: Session; notice: "recovered" | "damaged" | "temporary" | null } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const session = deserialize(raw);
    if (session) return { session: { ...session, life: startCareerLife(session.life) }, notice: null };
    const backup = deserialize(localStorage.getItem(SAVE_KEY + ".previous"));
    if (backup) return { session: { ...backup, life: startCareerLife(backup.life) }, notice: "recovered" };
    return {session: {life:startCareerLife(newLife()), album:[]}, notice: raw ? "damaged" : null};
  } catch { return {session:{life:startCareerLife(newLife()), album:[]}, notice:"temporary"}; }
}

export function persist(session: Session): boolean {
  try {
    const old = localStorage.getItem(SAVE_KEY);
    const next = serialize(session);
    if (old === next) return true;
    if (old && deserialize(old)) localStorage.setItem(SAVE_KEY+".previous",old);
    localStorage.setItem(SAVE_KEY,next);
    return true;
  } catch { return false; }
}

export function initialTrialVip(): boolean {
  try { return localStorage.getItem(VIP_TRIAL_KEY) === "on"; }
  catch { return false; }
}

export function initialLanguage(): Language {
  try { return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "bg"; }
  catch { return "bg"; }
}

import { decodeSave, encodeSave, newLife, type GameState } from "./engine.ts";

export const SAVE_KEY = "bglife.journal.v1";
export const LANGUAGE_KEY = "bglife.language";
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
    return life && album.every((entry: GameState | null) => entry !== null) ? {life, album} : null;
  } catch { return null; }
}

export function loadSession(): { session: Session; notice: "recovered" | "damaged" | "temporary" | null } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const session = deserialize(raw);
    if (session) return { session, notice: null };
    const backup = deserialize(localStorage.getItem(SAVE_KEY + ".previous"));
    if (backup) return { session: backup, notice: "recovered" };
    return {session: {life:newLife(), album:[]}, notice: raw ? "damaged" : null};
  } catch { return {session:{life:newLife(), album:[]}, notice:"temporary"}; }
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

export function initialLanguage(): Language {
  try { return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "bg"; }
  catch { return "bg"; }
}

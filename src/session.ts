import { newLife, startCareerLife } from "./engine.ts";
import { deserialize, serialize, type Language, type Session } from "./sessionCodec.ts";

export { deserialize, restoreSession, serialize, type Language, type Session } from "./sessionCodec.ts";

export const SAVE_KEY = "bglife.journal.v1";
export const LANGUAGE_KEY = "bglife.language";
export const VIP_TRIAL_KEY = "bglife.preview.vip";

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

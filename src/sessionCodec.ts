import { continueLife, decodeSave, encodeSave, hasStartedLife, startCareerLife, type GameState } from "./engine.ts";
import { startFamilyEvents } from "./reproduction.ts";

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

export function restoreSession(current: Session, backup: Session): Session {
  const life = startCareerLife(backup.life);
  const activeKey = encodeSave(life);
  const album = new Map<string, GameState>();
  const archived = hasStartedLife(current.life) ? [current.life] : [];
  for (const past of [...current.album, ...backup.album, ...archived]) {
    const key = encodeSave(past);
    if (key !== activeKey) album.set(key, past);
  }
  return { life, album: [...album.values()] };
}

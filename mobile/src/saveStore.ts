import { openDatabaseAsync } from "expo-sqlite";
import { newLife, startCareerLife } from "../../src/engine.ts";
import { deserialize, serialize, type Language, type Session } from "../../src/sessionCodec.ts";

export type SaveNotice = "recovered" | "damaged";

type SaveRow = {
  current_save: string | null;
  previous_save: string | null;
  language: string;
};

export async function openSaveStore() {
  const db = await openDatabaseAsync("bglife.db");
  try {
    await db.execAsync(`PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS game (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_save TEXT,
        previous_save TEXT,
        language TEXT NOT NULL DEFAULT 'bg'
      );
      INSERT OR IGNORE INTO game (id) VALUES (1);`);

    const row = await db.getFirstAsync<SaveRow>("SELECT * FROM game WHERE id = 1");
    if (!row) throw new Error("BgLife’s save row is missing");
    const current = deserialize(row.current_save);
    const previous = current ? null : deserialize(row.previous_save);
    const loaded = current ?? previous;
    let lastGood = current ? row.current_save : previous ? row.previous_save : null;
    const notice: SaveNotice | null = previous ? "recovered" : !current && row.current_save ? "damaged" : null;
    const language: Language = row.language === "en" ? "en" : "bg";

    if (previous) {
      await db.runAsync("UPDATE game SET current_save = ? WHERE id = 1", lastGood);
    }

    return {
      session: loaded ? { ...loaded, life: startCareerLife(loaded.life) } : { life: startCareerLife(newLife()), album: [] },
      language,
      notice,
      async save(session: Session) {
        const payload = serialize(session);
        if (payload === lastGood) return;
        await db.runAsync("UPDATE game SET current_save = ?, previous_save = ? WHERE id = 1", payload, lastGood);
        lastGood = payload;
      },
      async saveLanguage(value: Language) {
        await db.runAsync("UPDATE game SET language = ? WHERE id = 1", value);
      },
    };
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

export type SaveStore = Awaited<ReturnType<typeof openSaveStore>>;

import { createContext, useContext } from "react";
import type { AssetPage } from "../../src/assetMenu.ts";
import type { Language, Session } from "../../src/sessionCodec.ts";
import type { SaveNotice } from "./saveStore";

export type Screens = {
  Home: undefined;
  NewLife: undefined;
  Journal: { archive: number } | undefined;
  Assets: { page: AssetPage } | undefined;
  Occupation: { section: "career" | "work" };
  Album: undefined;
  Settings: undefined;
};

export const Game = createContext<{
  session: Session;
  language: Language;
  saving: boolean;
  notice: SaveNotice | null;
  dismissNotice: () => void;
  updateSession: (update: (session: Session) => Session) => Promise<boolean>;
  updateLanguage: (language: Language) => Promise<boolean>;
} | null>(null);

export function useGame() {
  const game = useContext(Game);
  if (!game) throw new Error("BgLife is not loaded");
  return game;
}

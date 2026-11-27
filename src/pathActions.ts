import type { City, GameState, Text } from "./engine.ts";
import type { StatDelta } from "./lifeActivities.ts";
import type { WorkImpact } from "./workplace.ts";

export type PathResult<T> = {
  state: T;
  note: Text;
  stats?: StatDelta;
  moveTo?: City;
  cash?: number;
  silent?: true;
  decision?: { title: Text; situation: Text };
  workImpact?: WorkImpact;
};
export type PathAction<T> = {
  id: string;
  label: Text;
  run: () => PathResult<T>;
  blocked?: Text;
};
export type PathEvent = { id: string; title: Text; note: Text };

export const limit = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
export const roundMark = (n: number) => Math.round(limit(n, 2, 6) * 100) / 100;
export const mark = (n: number, l: keyof Text) => n.toFixed(2).replace(".", l === "bg" ? "," : ".");
export const average = (numbers: readonly number[]) => numbers.reduce((sum, n) => sum + n, 0) / Math.max(1, numbers.length);

export function pathRoll(s: Pick<GameState, "seed" | "age">, key: string): number {
  let hash = (s.seed ^ Math.imul(s.age, 0x9e3779b1)) >>> 0;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  return ((hash ^ (hash >>> 13)) >>> 0) / 0x100000000;
}

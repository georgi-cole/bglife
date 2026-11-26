export const lifeStatKeys = ["health", "looks", "joy", "brains", "influence"] as const;
export type LifeStat = typeof lifeStatKeys[number];
export type LifeStats = Record<LifeStat, number>;
export type StatDelta = Partial<LifeStats>;

export function startingStats(): LifeStats {
  return { health: 76, looks: 55, joy: 66, brains: 63, influence: 24 };
}

export function applyStats(stats: LifeStats, delta: StatDelta): LifeStats {
  return {
    health: boundStat(stats.health + (delta.health ?? 0)),
    looks: boundStat(stats.looks + (delta.looks ?? 0)),
    joy: boundStat(stats.joy + (delta.joy ?? 0)),
    brains: boundStat(stats.brains + (delta.brains ?? 0)),
    influence: boundStat(stats.influence + (delta.influence ?? 0)),
  };
}

export function statsChange(before: LifeStats, after: LifeStats): StatDelta {
  const change: StatDelta = {};
  for (const key of lifeStatKeys) {
    const delta = after[key] - before[key];
    if (delta !== 0) change[key] = delta;
  }
  return change;
}

export function boundStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}

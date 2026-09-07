export type Progress = {
  currentLevel: number;
  completed: number[];
  best: Record<string, { moves: number; pushes: number; stars: number }>;
  totalMoves: number;
  totalPushes: number;
  hintsUsed: number;
  noUndoClears: number;
  achievements: string[];
  settings: Settings;
};

export type Theme = "CRT" | "PAPER" | "MONO";

export const THEMES: Theme[] = ["CRT", "PAPER", "MONO"];

export type Settings = {
  sfx: boolean;
  music: boolean;
  vibration: boolean;
  swipe: boolean;
  crt: boolean;
  theme: Theme;
};

const KEY = "sokoban_push_v1";

export const defaultProgress = (): Progress => ({
  currentLevel: 0,
  completed: [],
  best: {},
  totalMoves: 0,
  totalPushes: 0,
  hintsUsed: 0,
  noUndoClears: 0,
  achievements: [],
  settings: { sfx: true, music: false, vibration: true, swipe: true, crt: false, theme: "CRT" },
});


export function loadProgress(): Progress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    const base = defaultProgress();
    return { ...base, ...parsed, settings: { ...base.settings, ...(parsed.settings ?? {}) } };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: Progress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore quota errors */
  }
}

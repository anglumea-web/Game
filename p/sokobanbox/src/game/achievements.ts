import type { Progress } from "./storage";
import { TOTAL_LEVELS } from "./levels";

export type Achievement = {
  id: string;
  name: string;
  desc: string;
  earned: (p: Progress) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_push", name: "FIRST PUSH", desc: "Selesaikan level pertama", earned: (p) => p.completed.length >= 1 },
  { id: "world_one", name: "WAREHOUSE RAT", desc: "Bersihkan 8 level", earned: (p) => p.completed.length >= 8 },
  {
    id: "perfectionist",
    name: "PERFECTIONIST",
    desc: "Raih 3 bintang di 5 level",
    earned: (p) => Object.values(p.best).filter((b) => b.stars === 3).length >= 5,
  },
  { id: "no_regrets", name: "NO REGRETS", desc: "Tuntaskan 3 level tanpa undo", earned: (p) => p.noUndoClears >= 3 },
  { id: "purist", name: "PURIST", desc: "Bersihkan 10 level tanpa hint", earned: (p) => p.completed.length >= 10 && p.hintsUsed === 0 },
  { id: "marathon", name: "MARATHON", desc: "1.000 langkah total", earned: (p) => p.totalMoves >= 1000 },
  {
    id: "completionist",
    name: "COMPLETIONIST",
    desc: "Tamatkan semua level",
    earned: (p) => p.completed.length >= TOTAL_LEVELS,
  },
];

/** Kembalikan id achievement yang baru saja terbuka. */
export function newlyEarned(p: Progress): string[] {
  return ACHIEVEMENTS.filter((a) => a.earned(p) && !p.achievements.includes(a.id)).map((a) => a.id);
}

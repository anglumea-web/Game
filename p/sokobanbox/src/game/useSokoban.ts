import { useCallback, useEffect, useRef, useState } from "react";
import { cloneState, move as applyMove, parseLevel, starsFor, type GameState } from "./engine";
import { sfx, setSfxEnabled, vibrate } from "./audio";
import { loadProgress, saveProgress, type Progress } from "./storage";
import { LEVELS } from "./levels";
import { newlyEarned } from "./achievements";
import { hintSteps, type Dir } from "./solver";

export function useSokoban() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [hydrated, setHydrated] = useState(false);
  const [levelIndex, setLevelIndex] = useState(0);
  const [state, setState] = useState<GameState>(() => parseLevel(0));
  const [facing, setFacing] = useState({ dx: 0, dy: 1 });
  const [won, setWon] = useState(false);
  const [usedUndo, setUsedUndo] = useState(false);
  const usedUndoRef = useRef(false);
  const [hint, setHint] = useState<{ steps: Dir[]; level: number } | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const hintLevel = useRef(0);
  const [unlocked, setUnlockedAch] = useState<string[]>([]);
  const history = useRef<GameState[]>([]);
  const [historyLen, setHistoryLen] = useState(0);


  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    setSfxEnabled(p.settings.sfx);
    setHydrated(true);
  }, []);

  useEffect(() => {
    setSfxEnabled(progress.settings.sfx);
  }, [progress.settings.sfx]);

  const persist = useCallback((updater: (p: Progress) => Progress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveProgress(next);
      return next;
    });
  }, []);

  const loadLevel = useCallback((index: number) => {
    setLevelIndex(index);
    setState(parseLevel(index));
    history.current = [];
    setHistoryLen(0);
    setWon(false);
    setUsedUndo(false);
    usedUndoRef.current = false;
    setHint(null);
    setHintMsg(null);
    hintLevel.current = 0;
    setUnlockedAch([]);
    setFacing({ dx: 0, dy: 1 });
  }, []);

  const step = useCallback(
    (dx: number, dy: number) => {
      if (won) return;
      setFacing({ dx, dy });
      setHint(null);
      setState((current) => {
        const { next, result } = applyMove(current, dx, dy);
        const { vibration, sfx: sfxOn } = progress.settings;
        if (!next) {
          if (sfxOn) sfx.blocked();
          return current;
        }
        history.current.push(cloneState(current));
        setHistoryLen(history.current.length);
        if (result === "pushed") {
          if (sfxOn) sfx.push();
          vibrate(12, vibration);
        } else if (result === "moved") {
          if (sfxOn) sfx.move();
        }
        if (result === "win") {
          if (sfxOn) sfx.win();
          vibrate([40, 40, 60], vibration);
          setWon(true);
          const stars = starsFor(levelIndex, next.moves);
          const clean = !usedUndoRef.current;
          persist((p) => {
            const prevBest = p.best[String(levelIndex)];
            const better = !prevBest || next.moves < prevBest.moves;
            const updated: Progress = {
              ...p,
              currentLevel: Math.min(levelIndex + 1, LEVELS.length - 1),
              completed: p.completed.includes(levelIndex) ? p.completed : [...p.completed, levelIndex],
              best: better
                ? { ...p.best, [String(levelIndex)]: { moves: next.moves, pushes: next.pushes, stars } }
                : p.best,
              totalMoves: p.totalMoves + next.moves,
              totalPushes: p.totalPushes + next.pushes,
              noUndoClears: clean ? p.noUndoClears + 1 : p.noUndoClears,
            };
            const fresh = newlyEarned(updated);
            if (fresh.length) {
              setUnlockedAch(fresh);
              return { ...updated, achievements: [...updated.achievements, ...fresh] };
            }
            return updated;
          });
        }
        return next;
      });
    },
    [won, progress.settings, levelIndex, persist],
  );

  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (!prev) return;
    setHistoryLen(history.current.length);
    if (progress.settings.sfx) sfx.undo();
    setUsedUndo(true);
    usedUndoRef.current = true;
    setHint(null);
    setWon(false);
    setState(prev);
  }, [progress.settings.sfx]);

  const reset = useCallback(() => {
    if (progress.settings.sfx) sfx.reset();
    loadLevel(levelIndex);
  }, [levelIndex, loadLevel, progress.settings.sfx]);

  /** Hint bertingkat: tekan berulang untuk bantuan lebih detail. */
  const requestHint = useCallback(() => {
    if (won || hintBusy) return;
    setHintBusy(true);
    setHintMsg(null);
    hintLevel.current = Math.min(3, hintLevel.current + 1);
    const lvl = hintLevel.current as 1 | 2 | 3;
    if (progress.settings.sfx) sfx.ui();
    // beri browser waktu render sebelum BFS
    setTimeout(() => {
      const steps = hintSteps(state, lvl);
      setHint(steps && steps.length ? { steps, level: lvl } : null);
      setHintMsg(steps && steps.length ? null : "HINT TIDAK TERSEDIA — COBA UNDO / RESET");
      setHintBusy(false);
      if (steps && steps.length) persist((p) => ({ ...p, hintsUsed: p.hintsUsed + 1 }));
    }, 20);
  }, [won, hintBusy, state, persist, progress.settings.sfx]);

  const isUnlocked = useCallback(
    (index: number) => index === 0 || progress.completed.includes(index - 1) || progress.completed.includes(index),
    [progress.completed],
  );

  return {
    progress,
    persist,
    hydrated,
    levelIndex,
    state,
    facing,
    won,
    usedUndo,
    hint,
    hintMsg,
    hintBusy,
    requestHint,
    unlockedAchievements: unlocked,
    canUndo: historyLen > 0,
    loadLevel,
    step,
    undo,
    reset,
    isUnlocked,
  };

}

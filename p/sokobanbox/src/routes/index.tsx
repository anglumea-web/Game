import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Board } from "@/components/game/Board";
import { Dpad } from "@/components/game/Dpad";
import { AdSlot } from "@/components/game/AdSlot";
import { LEVELS, TOTAL_LEVELS, WORLDS } from "@/game/levels";
import { starsFor } from "@/game/engine";
import { sfx } from "@/game/audio";
import { useSokoban } from "@/game/useSokoban";
import { defaultProgress, saveProgress, THEMES, type Theme } from "@/game/storage";
import { ACHIEVEMENTS } from "@/game/achievements";
import { dirArrow, dirLabel } from "@/game/solver";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOKOBAN // PUSH — Retro Box Pushing Puzzle" },
      {
        name: "description",
        content:
          "SOKOBAN // PUSH: puzzle dorong kotak bergaya retro 90-an. Offline, tanpa iklan, tanpa timer — hanya satu kotak dalam satu waktu.",
      },
      { property: "og:title", content: "SOKOBAN // PUSH" },
      {
        property: "og:description",
        content: "No timer. No lives. No noise. Just one box at a time.",
      },
    ],
  }),
  component: App,
});

type Screen = "boot" | "menu" | "levels" | "play" | "stats" | "settings";

const pad = (n: number, len = 3) => String(n).padStart(len, "0");

function Stars({ n, size = "text-xs" }: { n: number; size?: string }) {
  return (
    <span className={`${size} tracking-widest text-primary`}>
      {"★".repeat(n)}
      <span className="text-muted-foreground">{"☆".repeat(3 - n)}</span>
    </span>
  );
}

function MenuButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        sfx.ui();
        onClick();
      }}
      className="group w-full py-2 text-center text-sm tracking-[0.3em] text-foreground transition-colors hover:text-primary"
    >
      <span className="opacity-0 transition-opacity group-hover:opacity-100">▸ </span>
      {children}
    </button>
  );
}

function App() {
  const game = useSokoban();
  const {
    progress,
    persist,
    state,
    levelIndex,
    facing,
    won,
    usedUndo,
    canUndo,
    step,
    undo,
    reset,
    loadLevel,
    isUnlocked,
    hint,
    hintMsg,
    hintBusy,
    requestHint,
    unlockedAchievements,
  } = game;

  const [screen, setScreen] = useState<Screen>("boot");

  // Terapkan tema ke <html> agar seluruh UI + papan ikut berubah
  useEffect(() => {
    document.documentElement.dataset['theme'] = progress.settings.theme ?? "CRT";
  }, [progress.settings.theme]);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((s: Screen) => {
    sfx.ui();
    setScreen(s);
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen === "boot") {
        setScreen("menu");
        return;
      }
      if (screen !== "play") {
        if (e.key === "Escape") setScreen("menu");
        return;
      }
      const k = e.key.toLowerCase();
      const map: Record<string, [number, number]> = {
        arrowup: [0, -1],
        w: [0, -1],
        arrowdown: [0, 1],
        s: [0, 1],
        arrowleft: [-1, 0],
        a: [-1, 0],
        arrowright: [1, 0],
        d: [1, 0],
      };
      if (map[k]) {
        e.preventDefault();
        step(map[k]![0]!, map[k]![1]!);
      } else if (k === "z") undo();
      else if (k === "h") requestHint();
      else if (k === "r") reset();
      else if (k === "escape") setScreen("menu");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, step, undo, reset, requestHint]);


  const onTouchStart = (e: React.TouchEvent) => {
    if (!progress.settings.swipe) return;
    const t = e.changedTouches[0]!;
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!progress.settings.swipe || !touch.current) return;
    const t = e.changedTouches[0]!;
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) step(Math.sign(dx), 0);
    else step(0, Math.sign(dy));
  };

  const startLevel = (i: number) => {
    loadLevel(i);
    setScreen("play");
  };

  const level = LEVELS[levelIndex]!;
  const best = progress.best[String(levelIndex)];
  const completedCount = progress.completed.length;
  const totalStars = Object.values(progress.best).reduce((s, b) => s + b.stars, 0);

  // ── BOOT ───────────────────────────────────────
  if (screen === "boot") {
    return (
      <main
        className="flex min-h-[100dvh] cursor-pointer flex-col items-center justify-center gap-8 bg-background px-6"
        onClick={() => go("menu")}
      >
        <h1 className="animate-flicker-in text-center font-display text-lg leading-[2] text-foreground">
          SOKOBAN
          <br />
          <span className="text-primary">// PUSH</span>
        </h1>
        <p className="text-xs tracking-[0.4em] text-muted-foreground">1995 — 2026</p>
        <p className="animate-blink font-display text-[10px] tracking-widest text-primary">PRESS START</p>
      </main>
    );
  }

  // ── MENU ───────────────────────────────────────
  if (screen === "menu") {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-10 bg-background px-6">
        <header className="text-center">
          <h1 className="font-display text-base leading-[2] text-foreground">
            SOKOBAN
            <br />
            <span className="text-primary">// PUSH</span>
          </h1>
          <p className="mt-4 text-[10px] tracking-[0.25em] text-muted-foreground">
            {pad(completedCount)} / {pad(TOTAL_LEVELS)} CLEARED
          </p>
        </header>

        <div className="h-px w-40 bg-border" />

        <nav className="w-48">
          <MenuButton onClick={() => startLevel(progress.currentLevel)}>PLAY</MenuButton>
          <MenuButton onClick={() => setScreen("levels")}>LEVELS</MenuButton>
          <MenuButton onClick={() => setScreen("stats")}>STATS</MenuButton>
          <MenuButton onClick={() => setScreen("settings")}>SETTINGS</MenuButton>
        </nav>

        <p className="text-[10px] tracking-widest text-muted-foreground">v1.0.0</p>
      </main>
    );
  }

  // ── LEVEL SELECT ───────────────────────────────
  if (screen === "levels") {
    let counter = -1;
    return (
      <main className="min-h-[100dvh] bg-background px-5 pb-16 pt-6">
        <TopBar title="LEVELS" onBack={() => go("menu")} />
        <div className="mx-auto mt-6 max-w-md space-y-8">
          {WORLDS.map((w) => (
            <section key={w.id}>
              <h2 className="text-[10px] tracking-[0.3em] text-muted-foreground">{w.name}</h2>
              <p className="mt-1 font-display text-[11px] text-foreground">{w.subtitle}</p>
              <ul className="mt-4 grid grid-cols-5 gap-2">
                {w.levels.map((lv) => {
                  counter += 1;
                  const idx = counter;
                  const unlocked = isUnlocked(idx);
                  const b = progress.best[String(idx)];
                  return (
                    <li key={lv.name}>
                      <button
                        type="button"
                        disabled={!unlocked}
                        onClick={() => startLevel(idx)}
                        className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-sm border border-border bg-panel text-xs text-foreground transition-colors enabled:hover:border-primary disabled:text-muted-foreground disabled:opacity-40"
                      >
                        {pad(idx + 1, 2)}
                        {b ? <Stars n={b.stars} size="text-[8px]" /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </main>
    );
  }

  // ── STATS ──────────────────────────────────────
  if (screen === "stats") {
    return (
      <main className="min-h-[100dvh] bg-background px-5 pb-16 pt-6">
        <TopBar title="STATS" onBack={() => go("menu")} />
        <dl className="mx-auto mt-8 max-w-sm divide-y divide-border border-y border-border">
          <Row label="LEVELS CLEARED" value={`${completedCount} / ${TOTAL_LEVELS}`} />
          <Row label="STARS" value={`${totalStars} / ${TOTAL_LEVELS * 3}`} />
          <Row label="TOTAL MOVES" value={progress.totalMoves.toLocaleString()} />
          <Row label="TOTAL PUSHES" value={progress.totalPushes.toLocaleString()} />
          <Row label="HINTS USED" value={progress.hintsUsed.toLocaleString()} />
          <Row label="CLEARS TANPA UNDO" value={progress.noUndoClears.toLocaleString()} />
        </dl>

        <section className="mx-auto mt-10 max-w-sm">
          <h2 className="text-[10px] tracking-[0.3em] text-muted-foreground">
            ACHIEVEMENTS {progress.achievements.length}/{ACHIEVEMENTS.length}
          </h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {ACHIEVEMENTS.map((a) => {
              const got = progress.achievements.includes(a.id) || a.earned(progress);
              return (
                <li key={a.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className={`text-xs tracking-[0.2em] ${got ? "text-primary" : "text-muted-foreground"}`}>
                      {a.name}
                    </p>
                    <p className="mt-1 text-[10px] tracking-[0.15em] text-muted-foreground">{a.desc}</p>
                  </div>
                  <span className={`text-xs ${got ? "text-success" : "text-muted-foreground opacity-40"}`}>
                    {got ? "✓" : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

      </main>
    );
  }

  // ── SETTINGS ───────────────────────────────────
  if (screen === "settings") {
    const toggle = (k: keyof typeof progress.settings) => () => {
      sfx.ui();
      persist((p) => ({ ...p, settings: { ...p.settings, [k]: !p.settings[k] } }));
    };
    return (
      <main className="min-h-[100dvh] bg-background px-5 pb-16 pt-6">
        <TopBar title="SETTINGS" onBack={() => go("menu")} />
        <div className="mx-auto mt-8 max-w-sm">
          <p className="mb-2 text-[10px] tracking-[0.3em] text-muted-foreground">THEME</p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  sfx.ui();
                  persist((p) => ({ ...p, settings: { ...p.settings, theme: t as Theme } }));
                }}
                className={`rounded-sm border px-2 py-2 text-[10px] tracking-[0.2em] ${
                  (progress.settings.theme ?? "CRT") === t
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-sm divide-y divide-border border-y border-border">
          <Toggle label="SFX" on={progress.settings.sfx} onClick={toggle("sfx")} />
          <Toggle label="VIBRATION" on={progress.settings.vibration} onClick={toggle("vibration")} />
          <Toggle label="SWIPE" on={progress.settings.swipe} onClick={toggle("swipe")} />
          <Toggle label="CRT EFFECT" on={progress.settings.crt} onClick={toggle("crt")} />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!confirm("Reset semua progress?")) return;
            const fresh = defaultProgress();
            saveProgress(fresh);
            persist(() => fresh);
            loadLevel(0);
          }}
          className="mx-auto mt-8 block text-xs tracking-[0.25em] text-goal"
        >
          RESET PROGRESS
        </button>
      </main>
    );
  }

  // ── PLAY ───────────────────────────────────────
  const stars = won ? starsFor(levelIndex, state.moves) : 0;
  return (
    <main
      className="flex min-h-[100dvh] flex-col bg-background px-4 pb-6 pt-4"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between text-xs tracking-[0.2em] text-muted-foreground">
        <button type="button" onClick={() => go("menu")} className="px-1 py-1 text-foreground">
          ←
        </button>
        <div className="text-center">
          <p className="text-foreground">LEVEL {pad(levelIndex + 1)}</p>
          <p className="mt-1 text-[10px]">{level.name.toUpperCase()}</p>
        </div>
        <button type="button" onClick={() => go("levels")} className="px-1 py-1 text-foreground">
          ⋮
        </button>
      </header>

      <p className="mt-3 text-center text-[10px] tracking-[0.3em] text-muted-foreground">
        {pad(state.moves)} MOVES · {pad(state.pushes)} PUSHES
        {best ? ` · BEST ${pad(best.moves)}` : ""}
      </p>

      <Board state={state} facing={facing} crt={progress.settings.crt} theme={progress.settings.theme} />

      {hintBusy || hint || hintMsg ? (
        <p className="mt-3 text-center text-[10px] tracking-[0.25em] text-primary">
          {hintBusy ? "MENGHITUNG…" : null}
          {hint ? (
            <>
              HINT {hint.level}/3 — {hint.steps.map(dirArrow).join(" ")}{" "}
              <span className="text-muted-foreground">({dirLabel(hint.steps[0]!)})</span>
            </>
          ) : null}
          {!hintBusy && !hint && hintMsg ? (
            <span className="text-muted-foreground">{hintMsg}</span>
          ) : null}
        </p>
      ) : null}

      <div className="mx-auto mt-4 flex w-full max-w-2xl items-center justify-between gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="rounded-sm border border-border px-4 py-2 text-xs tracking-[0.2em] disabled:opacity-30"
        >
          ↶ UNDO
        </button>
        <button
          type="button"
          onClick={requestHint}
          disabled={hintBusy || won}
          className="rounded-sm border border-border px-4 py-2 text-xs tracking-[0.2em] text-primary disabled:opacity-30"
        >
          ? HINT
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-sm border border-border px-4 py-2 text-xs tracking-[0.2em]"
        >
          RESET ↻
        </button>
      </div>


      <div className="mt-5 flex justify-center md:hidden">
        <Dpad onMove={step} />
      </div>
      <p className="mt-4 hidden text-center text-[10px] tracking-[0.25em] text-muted-foreground md:block">
        ARROWS / WASD — MOVE · Z — UNDO · H — HINT · R — RESET · ESC — MENU
      </p>


      {won ? (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-background/92 px-6">
          <div className="w-full max-w-xs border-y border-border py-10 text-center">
            <p className="font-display text-sm text-primary">CLEAR</p>
            <p className="mt-4 text-[10px] tracking-[0.3em] text-muted-foreground">LEVEL {pad(levelIndex + 1)}</p>
            <p className="mt-4 text-xs tracking-[0.2em]">
              {pad(state.moves)} MOVES
              <br />
              {pad(state.pushes)} PUSHES
            </p>
            <div className="mt-4">
              <Stars n={stars} size="text-base" />
            </div>
            {best ? (
              <p className="mt-3 text-[10px] tracking-[0.25em] text-muted-foreground">BEST: {pad(best.moves)}</p>
            ) : null}
            {!usedUndo ? (
              <p className="mt-2 text-[10px] tracking-[0.25em] text-success">NO REGRETS — TANPA UNDO</p>
            ) : null}
            {unlockedAchievements.length ? (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-[9px] tracking-[0.3em] text-muted-foreground">ACHIEVEMENT UNLOCKED</p>
                {unlockedAchievements.map((id) => (
                  <p key={id} className="mt-1 text-[10px] tracking-[0.25em] text-primary">
                    ★ {ACHIEVEMENTS.find((a) => a.id === id)?.name}
                  </p>
                ))}
              </div>
            ) : null}

            {/* Iklan hanya muncul setelah level selesai (lihat AdSlot.tsx) */}
            <AdSlot />


            <div className="mt-8 space-y-1">
              {levelIndex + 1 < TOTAL_LEVELS ? (
                <MenuButton onClick={() => startLevel(levelIndex + 1)}>NEXT LEVEL →</MenuButton>
              ) : (
                <p className="text-xs tracking-[0.2em] text-primary">ALL LEVELS CLEARED</p>
              )}
              <MenuButton onClick={reset}>REPLAY</MenuButton>
              <MenuButton onClick={() => setScreen("menu")}>MENU</MenuButton>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-between">
      <button type="button" onClick={onBack} className="text-sm text-foreground">
        ←
      </button>
      <h1 className="text-xs tracking-[0.35em] text-muted-foreground">{title}</h1>
      <span className="w-4" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-4 text-xs tracking-[0.2em]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between py-4 text-xs tracking-[0.2em]">
      <span className="text-muted-foreground">{label}</span>
      <span className={on ? "text-primary" : "text-muted-foreground"}>{on ? "ON" : "OFF"}</span>
    </button>
  );
}

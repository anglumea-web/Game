import { useEffect, useRef } from "react";
import type { GameState } from "@/game/engine";
import { deadlockedBoxes, key } from "@/game/engine";

type Props = {
  state: GameState;
  facing: { dx: number; dy: number };
  crt?: boolean;
  theme?: string;
};

const FALLBACK = {
  wallDark: "#222222",
  wallLight: "#303030",
  floor: "#181818",
  floorAlt: "#1c1c1c",
  goal: "#D94F4F",
  box: "#B87333",
  boxOk: "#7FB069",
  player: "#E8C547",
  ink: "#111111",
  shade: "rgba(0,0,0,0.35)",
  line: "rgba(0,0,0,0.5)",
};

/** Ambil palet papan dari CSS variable sehingga tema bisa diganti tanpa mengubah gameplay. */
function readPalette(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const v = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  return {
    wallDark: v("--b-wall-dark", FALLBACK.wallDark),
    wallLight: v("--b-wall-light", FALLBACK.wallLight),
    floor: v("--b-floor", FALLBACK.floor),
    floorAlt: v("--b-floor-alt", FALLBACK.floorAlt),
    goal: v("--b-goal", FALLBACK.goal),
    box: v("--b-box", FALLBACK.box),
    boxOk: v("--b-box-ok", FALLBACK.boxOk),
    player: v("--b-player", FALLBACK.player),
    ink: v("--b-ink", FALLBACK.ink),
    shade: v("--b-shade", FALLBACK.shade),
    line: v("--b-line", FALLBACK.line),
  };
}

export function Board({ state, facing, crt, theme }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const render = () => {
      const C = readPalette(wrap);
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const maxW = wrap.clientWidth;
      const maxH = wrap.clientHeight;
      const ts = Math.max(18, Math.floor(Math.min(maxW / state.width, maxH / state.height, 72)));
      const w = ts * state.width;
      const h = ts * state.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);

      const dead = deadlockedBoxes(state);

      for (let y = 0; y < state.height; y++) {
        for (let x = 0; x < state.width; x++) {
          const px = x * ts;
          const py = y * ts;
          const cell = state.grid[y]![x];
          if (cell === "#") {
            ctx.fillStyle = C.wallDark;
            ctx.fillRect(px, py, ts, ts);
            ctx.fillStyle = C.wallLight;
            ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
            ctx.fillStyle = C.wallDark;
            ctx.fillRect(px + 2, py + ts / 2 - 1, ts - 4, 2);
            continue;
          }
          ctx.fillStyle = (x + y) % 2 === 0 ? C.floor : C.floorAlt;
          ctx.fillRect(px, py, ts, ts);
          if (state.targets.has(key(x, y))) {
            const m = ts * 0.3;
            ctx.strokeStyle = C.goal;
            ctx.lineWidth = Math.max(2, ts * 0.06);
            ctx.strokeRect(px + m, py + m, ts - m * 2, ts - m * 2);
          }
        }
      }

      // boxes
      for (const b of state.boxes) {
        const onGoal = state.targets.has(key(b.x, b.y));
        const px = b.x * ts;
        const py = b.y * ts;
        const p = Math.max(2, ts * 0.09);
        ctx.fillStyle = onGoal ? C.boxOk : C.box;
        ctx.fillRect(px + p, py + p, ts - p * 2, ts - p * 2);
        ctx.fillStyle = C.shade;
        ctx.fillRect(px + p, py + p, ts - p * 2, Math.max(2, ts * 0.08));
        ctx.strokeStyle = C.line;
        ctx.lineWidth = Math.max(1.5, ts * 0.05);
        ctx.beginPath();
        ctx.moveTo(px + p * 2, py + p * 2);
        ctx.lineTo(px + ts - p * 2, py + ts - p * 2);
        ctx.moveTo(px + ts - p * 2, py + p * 2);
        ctx.lineTo(px + p * 2, py + ts - p * 2);
        ctx.stroke();
        if (dead.has(key(b.x, b.y))) {
          ctx.strokeStyle = C.goal;
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, ts - 2, ts - 2);
        }
      }

      // player (blocky warehouse worker)
      const { x, y } = state.player;
      const px = x * ts;
      const py = y * ts;
      const u = ts / 8;
      ctx.fillStyle = C.player;
      ctx.fillRect(px + u * 2.5, py + u, u * 3, u * 2.2); // head
      ctx.fillRect(px + u * 2, py + u * 3.4, u * 4, u * 2.6); // body
      ctx.fillStyle = C.ink;
      ctx.fillRect(px + u * 2, py + u * 6.2, u * 1.4, u * 1.2); // legs
      ctx.fillRect(px + u * 4.6, py + u * 6.2, u * 1.4, u * 1.2);
      // facing marker
      ctx.fillStyle = C.ink;
      const cx = px + ts / 2;
      const cy = py + u * 2.1;
      if (facing.dy >= 0 && facing.dx === 0) {
        ctx.fillRect(cx - u * 1.1, cy - u * 0.3, u * 0.6, u * 0.6);
        ctx.fillRect(cx + u * 0.5, cy - u * 0.3, u * 0.6, u * 0.6);
      } else if (facing.dx !== 0) {
        ctx.fillRect(cx + (facing.dx > 0 ? u * 0.6 : -u * 1.2), cy - u * 0.3, u * 0.6, u * 0.6);
      }
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [state, facing, theme]);

  return (
    <div ref={wrapRef} className="relative flex min-h-0 w-full flex-1 items-center justify-center">
      <canvas ref={ref} className="[image-rendering:pixelated]" />
      {crt ? <div className="pointer-events-none absolute inset-0 crt-overlay" /> : null}
    </div>
  );
}

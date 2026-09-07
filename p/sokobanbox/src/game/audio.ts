// Minimal Web Audio SFX — no files, no loading, offline friendly.
let ctx: AudioContext | null = null;
let enabled = true;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSfxEnabled(v: boolean) {
  enabled = v;
}

type ToneOpts = { freq: number; dur: number; type?: OscillatorType; gain?: number; delay?: number; slideTo?: number };

function tone({ freq, dur, type = "square", gain = 0.06, delay = 0, slideTo }: ToneOpts) {
  if (!enabled) return;
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  move: () => tone({ freq: 220, dur: 0.05, type: "square", gain: 0.03 }),
  push: () => tone({ freq: 110, dur: 0.11, type: "triangle", gain: 0.09, slideTo: 80 }),
  goal: () => {
    tone({ freq: 330, dur: 0.08, type: "square", gain: 0.06 });
    tone({ freq: 660, dur: 0.12, type: "sine", gain: 0.05, delay: 0.07 });
  },
  blocked: () => tone({ freq: 70, dur: 0.07, type: "sawtooth", gain: 0.035 }),
  undo: () => tone({ freq: 400, dur: 0.04, type: "sine", gain: 0.04 }),
  reset: () => tone({ freq: 160, dur: 0.09, type: "sawtooth", gain: 0.04, slideTo: 100 }),
  ui: () => tone({ freq: 520, dur: 0.035, type: "square", gain: 0.035 }),
  win: () => {
    tone({ freq: 523, dur: 0.1, gain: 0.06 });
    tone({ freq: 659, dur: 0.1, gain: 0.06, delay: 0.11 });
    tone({ freq: 880, dur: 0.22, gain: 0.07, delay: 0.22 });
  },
};

export function vibrate(pattern: number | number[], on: boolean) {
  if (!on || typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}

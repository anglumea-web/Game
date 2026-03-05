/**
 * audio.js — Web Audio Synthesizer
 * Semua efek suara dibuat secara programatik (tanpa file eksternal).
 */

const Snd = (() => {
  let ctx, on = true;

  function go(f, d, t = 'sine', v = .28, r = .005) {
    if (!on || !ctx) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = t;
      o.frequency.value = f;
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(v, now + r);
      g.gain.exponentialRampToValueAtTime(.001, now + d);
      o.start(now);
      o.stop(now + d + .05);
    } catch (e) {}
  }

  return {
    init() {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        on = false;
      }
    },
    wake() {
      try { if (ctx && ctx.state === 'suspended') ctx.resume(); } catch (e) {}
    },
    toggle() { on = !on; return on; },
    move()   { go(900, .06, 'sine', .25); setTimeout(() => go(640, .05, 'sine', .2), 40); },
    cap()    { go(280, .13, 'sawtooth', .3, .01); setTimeout(() => go(180, .1, 'sine', .2), 60); },
    check()  { go(523, .18, 'sine', .3); setTimeout(() => go(660, .22, 'sine', .3), 170); },
    castle() { go(700, .08, 'sine', .25); setTimeout(() => go(880, .12, 'sine', .25), 100); },
    mate()   {
      [0, 180, 360, 560].forEach((delay, i) =>
        setTimeout(() => go([523, 659, 784, 1047][i], .45, 'sine', .3), delay)
      );
    },
    draw()   { go(440, .3, 'sine', .25); setTimeout(() => go(392, .4, 'sine', .25), 260); },
    click()  { go(1200, .04, 'sine', .15, .003); },
  };
})();

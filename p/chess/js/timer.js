/**
 * timer.js — Countdown Timer untuk kedua pemain
 * Bergantung pada: GS (game state global), Game.onTimeout()
 */

const Timer = (() => {
  let times   = { w: 600, b: 600 };
  let initial = 600;
  let iv      = null;
  let active  = null;

  const fmt = s =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  function updateDisplay() {
    const topKey = GS.humanColor === 'white' ? 'b' : 'w';
    const botKey = GS.humanColor === 'white' ? 'w' : 'b';

    const topEl = document.getElementById('timeTop');
    const botEl = document.getElementById('timeBot');

    if (topEl) topEl.textContent = fmt(times[topKey]);
    if (botEl) botEl.textContent = fmt(times[botKey]);

    [
      { el: topEl, key: topKey },
      { el: botEl, key: botKey },
    ].forEach(({ el, key }) => {
      if (!el) return;
      const sec    = times[key];
      el.className = 'ptime' + (sec <= 30 ? ' crit' : sec <= 60 ? ' low' : '');
    });
  }

  return {

    setInit(mins) {
      initial = mins <= 0 ? 99999 : mins * 60;
    },

    reset() {
      times = { w: initial, b: initial };
      updateDisplay();
    },

    start(player) {
      if (iv) clearInterval(iv);
      if (initial >= 99999) return;

      active = player;
      iv = setInterval(() => {
        times[player[0]]--;
        updateDisplay();
        if (times[player[0]] <= 0) {
          clearInterval(iv);
          iv = null;
          Game.onTimeout(player);
        }
      }, 1000);
    },

    stop() {
      if (iv) { clearInterval(iv); iv = null; }
      active = null;
    },

    switch(player) { this.start(player); },

    get(player) { return times[player[0]]; },

    fmt,
  };
})();

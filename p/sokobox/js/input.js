// =============================================
//  INPUT.JS — Keyboard, swipe, d-pad controls
// =============================================

const Input = {
  touchStart: null,

  KEYMAP: {
    ArrowUp:    [0, -1], ArrowDown: [0,  1],
    ArrowLeft: [-1,  0], ArrowRight:[1,  0],
    w: [0,-1], s: [0, 1], a: [-1,0], d: [1,0],
    W: [0,-1], S: [0, 1], A: [-1,0], D: [1,0],
  },

  DPAD_DIRS: {
    up:    [0, -1],
    down:  [0,  1],
    left:  [-1, 0],
    right: [1,  0]
  },

  init() {
    this._setupKeyboard();
    this._setupTouch();
    this._setupDpad();
  },

  _setupKeyboard() {
    document.addEventListener("keydown", e => {
      if (UI.currentScreen !== "game-screen") return;

      if (this.KEYMAP[e.key]) {
        e.preventDefault();
        Renderer.enqueueMove(...this.KEYMAP[e.key]);
      }
      if (e.key === "u" || e.key === "U") Renderer.undo();
      if (e.key === "r" || e.key === "R") UI.resetLevel();
      if (e.key === "Escape")             UI.confirmBack();
    });
  },

  _setupTouch() {
    document.addEventListener("touchstart", e => {
      if (UI.currentScreen !== "game-screen") return;
      this.touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }, { passive: true });

    document.addEventListener("touchend", e => {
      if (UI.currentScreen !== "game-screen" || !this.touchStart) return;

      const dx = e.changedTouches[0].clientX - this.touchStart.x;
      const dy = e.changedTouches[0].clientY - this.touchStart.y;
      const THRESHOLD = 28;

      if (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD) {
        if (Math.abs(dx) > Math.abs(dy)) Renderer.enqueueMove(dx > 0 ? 1 : -1, 0);
        else                             Renderer.enqueueMove(0, dy > 0 ? 1 : -1);
      }

      this.touchStart = null;
    }, { passive: true });
  },

  _setupDpad() {
    document.querySelectorAll(".dpad-btn[data-dir]").forEach(btn => {
      btn.addEventListener("click", () => {
        const dir = this.DPAD_DIRS[btn.dataset.dir];
        if (dir) Renderer.enqueueMove(...dir);
      });
      // Better mobile: use touchstart for dpad (feels faster)
      btn.addEventListener("touchstart", e => {
        e.preventDefault(); // prevent double-fire with click
        const dir = this.DPAD_DIRS[btn.dataset.dir];
        if (dir) Renderer.enqueueMove(...dir);
      }, { passive: false });
    });
  }
};

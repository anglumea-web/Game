// =============================================
//  GAME.JS — Engine: state, move logic, history
// =============================================

const Game = {
  currentLevel: 0,
  state: null,
  moves: 0,
  history: [],
  solved: false,
  bestScores: {},
  completedLevels: [],

  // ─── INIT ───────────────────────────────────
  loadSaved() {
    try {
      this.completedLevels = JSON.parse(localStorage.getItem("sokoban_completed") || "[]");
      this.bestScores      = JSON.parse(localStorage.getItem("sokoban_best")      || "{}");
      // Sanitize: ensure completedLevels is an array of numbers
      if (!Array.isArray(this.completedLevels)) this.completedLevels = [];
      if (typeof this.bestScores !== "object")  this.bestScores = {};
    } catch(e) {
      this.completedLevels = [];
      this.bestScores = {};
    }
  },

  saveProgress() {
    try {
      localStorage.setItem("sokoban_completed", JSON.stringify(this.completedLevels));
      localStorage.setItem("sokoban_best",      JSON.stringify(this.bestScores));
    } catch(e) {
      console.warn("Could not save progress:", e);
    }
  },

  resetProgress() {
    this.completedLevels = [];
    this.bestScores = {};
    this.saveProgress();
  },

  // ─── LEVEL PARSER ───────────────────────────
  parseLevel(idx) {
    const level = LEVELS[idx];
    const rows  = level.map.map(r => r.split(""));
    const maxW  = Math.max(...rows.map(r => r.length));

    const grid = rows.map(r => {
      while (r.length < maxW) r.push(" ");
      return r;
    });

    let player = null;
    const boxes   = [];
    const targets = [];

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const c = grid[y][x];

        if (c === "@" || c === "+") {
          player = { x, y };
          grid[y][x] = c === "+" ? "." : " ";
        }
        if (c === "$" || c === "*") {
          boxes.push({ x, y });
          grid[y][x] = c === "*" ? "." : " ";
        }
        if (c === "." || c === "*" || c === "+") {
          targets.push(`${x},${y}`);
        }
      }
    }

    return {
      grid,
      player,
      boxes,
      targets: new Set(targets),
      width: maxW,
      height: grid.length
    };
  },

  copyState(s) {
    return {
      player: { ...s.player },
      boxes:  s.boxes.map(b => ({ ...b }))
    };
  },

  // ─── LOAD ───────────────────────────────────
  load(idx) {
    this.currentLevel = idx;
    this.state   = this.parseLevel(idx);
    this.moves   = 0;
    this.history = [];
    this.solved  = false;
  },

  // ─── MOVE LOGIC ─────────────────────────────
  // Returns: "wall" | "blocked" | "moved" | "pushed" | "win"
  tryMove(dx, dy) {
    if (!this.state || this.solved) return null;

    const { player, boxes, grid } = this.state;
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (ny < 0 || ny >= this.state.height ||
        nx < 0 || nx >= this.state.width  ||
        grid[ny][nx] === "#") return "wall";

    const prev = this.copyState(this.state);
    const boxIdx = boxes.findIndex(b => b.x === nx && b.y === ny);

    let result = "moved";

    if (boxIdx !== -1) {
      const bx = nx + dx;
      const by = ny + dy;

      if (by < 0 || by >= this.state.height ||
          bx < 0 || bx >= this.state.width  ||
          grid[by][bx] === "#"              ||
          boxes.some(b => b.x === bx && b.y === by)) return "blocked";

      boxes[boxIdx].x = bx;
      boxes[boxIdx].y = by;
      result = "pushed";
    }

    player.x = nx;
    player.y = ny;
    this.moves++;
    this.history.push({ state: prev, boxIdx: boxIdx !== -1 ? boxIdx : -1 });

    if (this.checkWin()) {
      this.solved = true;
      const id = this.currentLevel;
      if (this.bestScores[id] === undefined || this.moves < this.bestScores[id]) {
        this.bestScores[id] = this.moves;
      }
      if (!this.completedLevels.includes(id)) {
        this.completedLevels.push(id);
      }
      this.saveProgress();
      return "win";
    }

    return result;
  },

  // ─── UNDO ───────────────────────────────────
  undo() {
    if (!this.history.length) return false;
    const { state } = this.history.pop();
    this.state.player = state.player;
    this.state.boxes  = state.boxes;
    this.moves        = Math.max(0, this.moves - 1);
    this.solved       = false;
    return true;
  },

  // ─── WIN CHECK ──────────────────────────────
  checkWin() {
    return this.state.boxes.every(b => this.state.targets.has(`${b.x},${b.y}`));
  },

  // ─── HELPERS ────────────────────────────────
  get boxesPlaced() {
    if (!this.state) return 0;
    return this.state.boxes.filter(b => this.state.targets.has(`${b.x},${b.y}`)).length;
  },
  get totalTargets() {
    if (!this.state) return 0;
    return this.state.targets.size;
  },
  get bestForCurrent() {
    return this.bestScores[this.currentLevel];
  },
  isCompleted(idx) { return this.completedLevels.includes(idx); },
  isUnlocked(idx)  { return idx === 0 || this.completedLevels.includes(idx - 1) || this.isCompleted(idx); }
};

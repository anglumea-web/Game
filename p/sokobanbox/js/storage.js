// Simpan progres di localStorage. Aman walau dibuka lewat file://
var STORAGE_KEY = "sokoban_push_v1";
var THEMES = ["CRT", "PAPER", "MONO"];

function defaultProgress() {
  return {
    currentLevel: 0,
    completed: [],
    best: {},
    totalMoves: 0,
    totalPushes: 0,
    hintsUsed: 0,
    noUndoClears: 0,
    achievements: [],
    settings: { sfx: true, vibration: true, crt: false, theme: "CRT" }
  };
}

function loadProgress() {
  var base = defaultProgress();
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    var parsed = JSON.parse(raw);
    var merged = base;
    for (var k in parsed) merged[k] = parsed[k];
    merged.settings = base.settings;
    if (parsed.settings) for (var s in parsed.settings) merged.settings[s] = parsed.settings[s];
    return merged;
  } catch (e) {
    return base;
  }
}

function saveProgress(p) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch (e) {
    /* abaikan */
  }
}

var ACHIEVEMENTS = [
  { id: "first_push", name: "FIRST PUSH", desc: "Selesaikan level pertama", earned: function (p) { return p.completed.length >= 1; } },
  { id: "world_one", name: "WAREHOUSE RAT", desc: "Bersihkan 8 level", earned: function (p) { return p.completed.length >= 8; } },
  {
    id: "perfectionist",
    name: "PERFECTIONIST",
    desc: "Raih 3 bintang di 5 level",
    earned: function (p) {
      var n = 0;
      for (var k in p.best) if (p.best[k].stars === 3) n++;
      return n >= 5;
    }
  },
  { id: "no_regrets", name: "NO REGRETS", desc: "Tuntaskan 3 level tanpa undo", earned: function (p) { return p.noUndoClears >= 3; } },
  { id: "purist", name: "PURIST", desc: "Bersihkan 10 level tanpa hint", earned: function (p) { return p.completed.length >= 10 && p.hintsUsed === 0; } },
  { id: "marathon", name: "MARATHON", desc: "1.000 langkah total", earned: function (p) { return p.totalMoves >= 1000; } },
  { id: "completionist", name: "COMPLETIONIST", desc: "Tamatkan semua level", earned: function (p) { return p.completed.length >= TOTAL_LEVELS; } }
];

function newlyEarned(p) {
  return ACHIEVEMENTS.filter(function (a) {
    return a.earned(p) && p.achievements.indexOf(a.id) === -1;
  }).map(function (a) {
    return a.id;
  });
}

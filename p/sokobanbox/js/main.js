// Penghubung UI untuk versi HTML/CSS/JS mandiri.
(function () {
  "use strict";

  var progress = loadProgress();
  var levelIndex = Math.max(0, Math.min(progress.currentLevel || 0, TOTAL_LEVELS - 1));
  var state = parseLevel(levelIndex);
  var facing = { dx: 0, dy: 1 };
  var history = [];
  var won = false;
  var usedUndo = false;
  var hintLevel = 0;
  var hintBusy = false;
  var lastUnlocked = [];

  function byId(id) {
    return document.getElementById(id);
  }

  function updateProgress(change) {
    progress = change(progress);
    saveProgress(progress);
    return progress;
  }

  function setTheme(theme) {
    if (THEMES.indexOf(theme) === -1) return;
    progress.settings.theme = theme;
    document.documentElement.dataset.theme = theme;
    updateProgress(function (p) {
      return Object.assign({}, p, { settings: Object.assign({}, p.settings, { theme: theme }) });
    });
    renderSettings();
    render();
  }

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.toggle("active", screen.id === "screen-" + name);
    });
    if (name !== "play") closeWin();
    if (name === "levels") renderLevels();
    if (name === "stats") renderStats();
    if (name === "settings") renderSettings();
    if (name === "play") requestAnimationFrame(render);
  }

  function openLevel(index) {
    if (index < 0 || index >= TOTAL_LEVELS) return;
    if (index > 0 && !progress.completed.includes(index - 1) && !progress.completed.includes(index)) return;
    levelIndex = index;
    state = parseLevel(index);
    history = [];
    facing = { dx: 0, dy: 1 };
    won = false;
    usedUndo = false;
    hintLevel = 0;
    hintBusy = false;
    byId("hint-text").textContent = "";
    closeWin();
    showScreen("play");
    render();
  }

  function render() {
    if (!state) return;
    var level = LEVELS[levelIndex];
    byId("play-title").textContent = level.worldName + " / " + level.name;
    byId("hud-moves").textContent = state.moves;
    byId("hud-pushes").textContent = state.pushes;
    byId("hud-par").textContent = level.par;
    byId("hud-boxes").textContent = state.boxes.filter(function (box) {
      return isTarget(state, box.x, box.y);
    }).length + "/" + state.boxes.length;
    byId("btn-undo").disabled = history.length === 0;
    byId("crt").classList.toggle("hidden", !progress.settings.crt);
    drawBoard(byId("board"), byId("board-wrap"), state, facing);
  }

  function renderLevels() {
    var host = byId("level-list");
    host.innerHTML = "";
    WORLDS.forEach(function (world) {
      var title = document.createElement("p");
      title.className = "world-title";
      title.textContent = world.name + " — " + world.subtitle;
      host.appendChild(title);
      var grid = document.createElement("div");
      grid.className = "levels";
      world.levels.forEach(function (level) {
        var index = LEVELS.findIndex(function (item) {
          return item.name === level.name && item.worldId === world.id;
        });
        var unlocked = index === 0 || index <= progress.currentLevel || progress.completed.includes(index - 1) || progress.completed.includes(index);
        var button = document.createElement("button");
        var best = progress.best[String(index)];
        button.disabled = !unlocked;
        button.setAttribute("aria-label", level.name + (unlocked ? "" : ", terkunci"));
        button.innerHTML = String(index + 1).padStart(2, "0") + (best ? '<span class="stars">' + "★".repeat(best.stars) + "☆".repeat(3 - best.stars) + "</span>" : '<span class="stars">' + (unlocked ? "SIAP" : "TERKUNCI") + "</span>");
        button.addEventListener("click", function () {
          openLevel(index);
        });
        grid.appendChild(button);
      });
      host.appendChild(grid);
    });
  }

  function renderStats() {
    var host = byId("stats-body");
    var completed = progress.completed.length;
    var stars = Object.keys(progress.best).reduce(function (total, index) {
      return total + (progress.best[index] ? progress.best[index].stars : 0);
    }, 0);
    host.innerHTML = "";
    [
      ["LEVEL SELESAI", completed + " / " + TOTAL_LEVELS],
      ["TOTAL BINTANG", stars],
      ["TOTAL LANGKAH", progress.totalMoves],
      ["TOTAL DORONGAN", progress.totalPushes],
      ["HINT DIGUNAKAN", progress.hintsUsed],
      ["SELESAI TANPA UNDO", progress.noUndoClears]
    ].forEach(function (entry) {
      var row = document.createElement("div");
      row.className = "panel row between";
      row.innerHTML = "<span>" + entry[0] + "</span><b>" + entry[1] + "</b>";
      host.appendChild(row);
    });
    ACHIEVEMENTS.forEach(function (achievement) {
      var unlocked = achievement.earned(progress);
      var item = document.createElement("div");
      item.className = "ach" + (unlocked ? "" : " locked");
      item.innerHTML = "<b>" + (unlocked ? "★ " : "◇ ") + achievement.name + "</b>" + achievement.desc;
      host.appendChild(item);
    });
  }

  function renderSettings() {
    var settings = progress.settings;
    var sfxButton = byId("opt-sfx");
    var vibrationButton = byId("opt-vibration");
    var crtButton = byId("opt-crt");
    sfxButton.textContent = "EFEK SUARA: " + (settings.sfx ? "ON" : "OFF");
    vibrationButton.textContent = "GETAR: " + (settings.vibration ? "ON" : "OFF");
    crtButton.textContent = "EFEK SCANLINE: " + (settings.crt ? "ON" : "OFF");
    sfxButton.classList.toggle("on", settings.sfx);
    vibrationButton.classList.toggle("on", settings.vibration);
    crtButton.classList.toggle("on", settings.crt);
    document.documentElement.dataset.theme = THEMES.indexOf(settings.theme) >= 0 ? settings.theme : "CRT";
    var themes = byId("theme-row");
    themes.innerHTML = "";
    THEMES.forEach(function (theme) {
      var button = document.createElement("button");
      button.textContent = theme;
      button.classList.toggle("on", settings.theme === theme);
      button.setAttribute("aria-pressed", settings.theme === theme ? "true" : "false");
      button.addEventListener("click", function () {
        setTheme(theme);
      });
      themes.appendChild(button);
    });
  }

  function closeWin() {
    byId("overlay-win").classList.add("hidden");
    clearAd(byId("ad-slot"));
  }

  function showWin() {
    var level = LEVELS[levelIndex];
    var stars = starsFor(levelIndex, state.moves);
    byId("win-stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    byId("win-stats").textContent = state.moves + " LANGKAH · " + state.pushes + " DORONGAN · PAR " + level.par;
    var achievements = byId("win-ach");
    achievements.innerHTML = "";
    lastUnlocked.forEach(function (id) {
      var achievement = ACHIEVEMENTS.filter(function (item) {
        return item.id === id;
      })[0];
      if (!achievement) return;
      var badge = document.createElement("div");
      badge.className = "ach";
      badge.innerHTML = "<b>ACHIEVEMENT TERBUKA</b>" + achievement.name;
      achievements.appendChild(badge);
    });
    var next = byId("btn-next");
    next.disabled = levelIndex >= TOTAL_LEVELS - 1;
    next.textContent = levelIndex >= TOTAL_LEVELS - 1 ? "SEMUA LEVEL SELESAI" : "LEVEL BERIKUTNYA";
    byId("overlay-win").classList.remove("hidden");
    showAd(byId("ad-slot"));
  }

  function step(dx, dy) {
    if (won) return;
    facing = { dx: dx, dy: dy };
    byId("hint-text").textContent = "";
    var result = move(state, dx, dy);
    if (!result.next) {
      if (progress.settings.sfx) sfx.blocked();
      return;
    }
    history.push(cloneState(state));
    state = result.next;
    if (result.result === "pushed") {
      if (progress.settings.sfx) sfx.push();
      vibrate(12, progress.settings.vibration);
    } else if (result.result === "moved") {
      if (progress.settings.sfx) sfx.move();
    }
    render();
    if (result.result === "win") finishLevel();
  }

  function finishLevel() {
    won = true;
    if (progress.settings.sfx) sfx.win();
    vibrate([40, 40, 60], progress.settings.vibration);
    var stars = starsFor(levelIndex, state.moves);
    lastUnlocked = [];
    updateProgress(function (p) {
      var previous = p.best[String(levelIndex)];
      var best = !previous || state.moves < previous.moves
        ? Object.assign({}, p.best, { [String(levelIndex)]: { moves: state.moves, pushes: state.pushes, stars: stars } })
        : p.best;
      var updated = Object.assign({}, p, {
        currentLevel: Math.min(levelIndex + 1, TOTAL_LEVELS - 1),
        completed: p.completed.includes(levelIndex) ? p.completed : p.completed.concat([levelIndex]),
        best: best,
        totalMoves: p.totalMoves + state.moves,
        totalPushes: p.totalPushes + state.pushes,
        noUndoClears: !usedUndo ? p.noUndoClears + 1 : p.noUndoClears
      });
      lastUnlocked = newlyEarned(updated);
      updated.achievements = p.achievements.concat(lastUnlocked);
      return updated;
    });
    showWin();
  }

  function requestHint() {
    if (won || hintBusy) return;
    hintBusy = true;
    hintLevel = Math.min(3, hintLevel + 1);
    byId("btn-hint").disabled = true;
    byId("hint-text").textContent = "MENGHITUNG…";
    if (progress.settings.sfx) sfx.ui();
    window.setTimeout(function () {
      var steps = hintSteps(state, hintLevel);
      if (steps && steps.length) {
        byId("hint-text").textContent = "HINT " + hintLevel + "/3 — " + dirArrow(steps[0]) + " (" + dirLabel(steps[0]) + ")" + (steps.length > 1 ? " · " + steps.length + " LANGKAH" : "");
        updateProgress(function (p) {
          return Object.assign({}, p, { hintsUsed: p.hintsUsed + 1 });
        });
      } else {
        byId("hint-text").textContent = "HINT TIDAK TERSEDIA — COBA UNDO / RESET";
      }
      hintBusy = false;
      byId("btn-hint").disabled = false;
    }, 20);
  }

  byId("btn-start").addEventListener("click", function () {
    showScreen("menu");
  });
  byId("btn-continue").addEventListener("click", function () {
    openLevel(Math.max(0, Math.min(progress.currentLevel, TOTAL_LEVELS - 1)));
  });
  document.querySelectorAll("[data-goto]").forEach(function (button) {
    button.addEventListener("click", function () {
      showScreen(button.getAttribute("data-goto"));
    });
  });
  document.querySelectorAll("[data-dx]").forEach(function (button) {
    button.addEventListener("click", function () {
      step(Number(button.getAttribute("data-dx")), Number(button.getAttribute("data-dy")));
    });
  });
  byId("btn-undo").addEventListener("click", function () {
    if (!history.length) return;
    state = history.pop();
    won = false;
    usedUndo = true;
    if (progress.settings.sfx) sfx.undo();
    byId("hint-text").textContent = "";
    render();
  });
  byId("btn-reset").addEventListener("click", function () {
    if (progress.settings.sfx) sfx.reset();
    openLevel(levelIndex);
  });
  byId("btn-hint").addEventListener("click", requestHint);
  byId("btn-next").addEventListener("click", function () {
    if (levelIndex < TOTAL_LEVELS - 1) openLevel(levelIndex + 1);
  });
  byId("btn-replay").addEventListener("click", function () {
    openLevel(levelIndex);
  });
  byId("opt-sfx").addEventListener("click", function () {
    updateProgress(function (p) {
      return Object.assign({}, p, { settings: Object.assign({}, p.settings, { sfx: !p.settings.sfx }) });
    });
    setSfxEnabled(progress.settings.sfx);
    renderSettings();
  });
  byId("opt-vibration").addEventListener("click", function () {
    updateProgress(function (p) {
      return Object.assign({}, p, { settings: Object.assign({}, p.settings, { vibration: !p.settings.vibration }) });
    });
    renderSettings();
  });
  byId("opt-crt").addEventListener("click", function () {
    updateProgress(function (p) {
      return Object.assign({}, p, { settings: Object.assign({}, p.settings, { crt: !p.settings.crt }) });
    });
    renderSettings();
    render();
  });
  byId("opt-reset").addEventListener("click", function () {
    if (!window.confirm("Hapus semua progres dan pengaturan?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      /* Progres tetap di-reset di sesi ini bila penyimpanan diblokir. */
    }
    progress = defaultProgress();
    levelIndex = 0;
    state = parseLevel(0);
    history = [];
    won = false;
    setSfxEnabled(progress.settings.sfx);
    renderSettings();
    renderLevels();
    renderStats();
    showScreen("menu");
  });

  document.addEventListener("keydown", function (event) {
    if (!byId("screen-play").classList.contains("active")) return;
    var keyName = event.key.toLowerCase();
    var directions = {
      arrowup: [0, -1], w: [0, -1],
      arrowdown: [0, 1], s: [0, 1],
      arrowleft: [-1, 0], a: [-1, 0],
      arrowright: [1, 0], d: [1, 0]
    };
    if (directions[keyName]) {
      event.preventDefault();
      step(directions[keyName][0], directions[keyName][1]);
    } else if (keyName === "u") {
      byId("btn-undo").click();
    } else if (keyName === "r") {
      byId("btn-reset").click();
    } else if (keyName === "h") {
      byId("btn-hint").click();
    }
  });
  window.addEventListener("resize", function () {
    if (byId("screen-play").classList.contains("active")) render();
  });

  setSfxEnabled(progress.settings.sfx);
  document.documentElement.dataset.theme = THEMES.indexOf(progress.settings.theme) >= 0 ? progress.settings.theme : "CRT";
  renderSettings();
  renderLevels();
  renderStats();
  render();
})();
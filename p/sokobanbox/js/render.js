// Renderer Canvas 2D pixelated. Warna dibaca dari CSS variable (tema).
var FALLBACK = {
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
  line: "rgba(0,0,0,0.5)"
};

function readPalette(el) {
  var cs = getComputedStyle(el);
  function v(name, fb) {
    return cs.getPropertyValue(name).trim() || fb;
  }
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
    line: v("--b-line", FALLBACK.line)
  };
}

function drawBoard(canvas, wrap, state, facing) {
  if (!canvas || !wrap || !state) return;
  var C = readPalette(wrap);
  var dpr = Math.min(window.devicePixelRatio || 1, 3);
  var maxW = wrap.clientWidth;
  var maxH = wrap.clientHeight;
  var ts = Math.max(18, Math.floor(Math.min(maxW / state.width, maxH / state.height, 72)));
  var w = ts * state.width;
  var h = ts * state.height;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);

  var dead = deadlockedBoxes(state);

  for (var y = 0; y < state.height; y++) {
    for (var x = 0; x < state.width; x++) {
      var px = x * ts;
      var py = y * ts;
      if (state.grid[y][x] === "#") {
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
      if (state.targets[key(x, y)]) {
        var m = ts * 0.3;
        ctx.strokeStyle = C.goal;
        ctx.lineWidth = Math.max(2, ts * 0.06);
        ctx.strokeRect(px + m, py + m, ts - m * 2, ts - m * 2);
      }
    }
  }

  state.boxes.forEach(function (b) {
    var onGoal = !!state.targets[key(b.x, b.y)];
    var px = b.x * ts;
    var py = b.y * ts;
    var p = Math.max(2, ts * 0.09);
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
    if (dead[key(b.x, b.y)]) {
      ctx.strokeStyle = C.goal;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, ts - 2, ts - 2);
    }
  });

  var px2 = state.player.x * ts;
  var py2 = state.player.y * ts;
  var u = ts / 8;
  ctx.fillStyle = C.player;
  ctx.fillRect(px2 + u * 2.5, py2 + u, u * 3, u * 2.2);
  ctx.fillRect(px2 + u * 2, py2 + u * 3.4, u * 4, u * 2.6);
  ctx.fillStyle = C.ink;
  ctx.fillRect(px2 + u * 2, py2 + u * 6.2, u * 1.4, u * 1.2);
  ctx.fillRect(px2 + u * 4.6, py2 + u * 6.2, u * 1.4, u * 1.2);
  var cx = px2 + ts / 2;
  var cy = py2 + u * 2.1;
  if (facing.dy >= 0 && facing.dx === 0) {
    ctx.fillRect(cx - u * 1.1, cy - u * 0.3, u * 0.6, u * 0.6);
    ctx.fillRect(cx + u * 0.5, cy - u * 0.3, u * 0.6, u * 0.6);
  } else if (facing.dx !== 0) {
    ctx.fillRect(cx + (facing.dx > 0 ? u * 0.6 : -u * 1.2), cy - u * 0.3, u * 0.6, u * 0.6);
  }
}

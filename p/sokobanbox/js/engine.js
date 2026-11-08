// Engine Sokoban murni — tanpa DOM, tanpa framework.
function key(x, y) {
  return x + "," + y;
}

function parseLevel(index) {
  var def = LEVELS[index];
  var rows = def.map.map(function (r) {
    return r.split("");
  });
  var width = 0;
  rows.forEach(function (r) {
    if (r.length > width) width = r.length;
  });
  var grid = rows.map(function (r) {
    while (r.length < width) r.push(" ");
    return r;
  });

  var player = { x: 0, y: 0 };
  var boxes = [];
  var targets = {};

  for (var y = 0; y < grid.length; y++) {
    for (var x = 0; x < width; x++) {
      var c = grid[y][x];
      if (c === "@" || c === "+") {
        player = { x: x, y: y };
        grid[y][x] = c === "+" ? "." : " ";
      }
      if (c === "$" || c === "*") {
        boxes.push({ x: x, y: y });
        grid[y][x] = c === "*" ? "." : " ";
      }
      if (c === "." || c === "*" || c === "+") targets[key(x, y)] = true;
    }
  }

  return {
    grid: grid,
    player: player,
    boxes: boxes,
    targets: targets,
    width: width,
    height: grid.length,
    moves: 0,
    pushes: 0
  };
}

function cloneState(s) {
  return {
    grid: s.grid,
    targets: s.targets,
    width: s.width,
    height: s.height,
    moves: s.moves,
    pushes: s.pushes,
    player: { x: s.player.x, y: s.player.y },
    boxes: s.boxes.map(function (b) {
      return { x: b.x, y: b.y };
    })
  };
}

function isWall(s, x, y) {
  return y < 0 || y >= s.height || x < 0 || x >= s.width || s.grid[y][x] === "#";
}

function isTarget(s, x, y) {
  return !!s.targets[key(x, y)];
}

function isSolved(s) {
  return s.boxes.every(function (b) {
    return isTarget(s, b.x, b.y);
  });
}

function move(state, dx, dy) {
  var nx = state.player.x + dx;
  var ny = state.player.y + dy;
  if (isWall(state, nx, ny)) return { next: null, result: "wall" };

  var boxIndex = -1;
  for (var i = 0; i < state.boxes.length; i++) {
    if (state.boxes[i].x === nx && state.boxes[i].y === ny) boxIndex = i;
  }
  var next = cloneState(state);

  if (boxIndex !== -1) {
    var bx = nx + dx;
    var by = ny + dy;
    var occupied = state.boxes.some(function (b) {
      return b.x === bx && b.y === by;
    });
    if (isWall(state, bx, by) || occupied) return { next: null, result: "blocked" };
    next.boxes[boxIndex] = { x: bx, y: by };
    next.pushes += 1;
  }

  next.player = { x: nx, y: ny };
  next.moves += 1;
  var result = isSolved(next) ? "win" : boxIndex !== -1 ? "pushed" : "moved";
  return { next: next, result: result };
}

/** Deteksi kotak yang mati di sudut (bukan di goal). */
function deadlockedBoxes(s) {
  var out = {};
  s.boxes.forEach(function (b) {
    if (isTarget(s, b.x, b.y)) return;
    var up = isWall(s, b.x, b.y - 1);
    var down = isWall(s, b.x, b.y + 1);
    var left = isWall(s, b.x - 1, b.y);
    var right = isWall(s, b.x + 1, b.y);
    if ((up || down) && (left || right)) out[key(b.x, b.y)] = true;
  });
  return out;
}

function starsFor(index, moves) {
  var par = LEVELS[index] ? LEVELS[index].par : 999;
  if (moves <= par) return 3;
  if (moves <= Math.ceil(par * 1.6)) return 2;
  return 1;
}

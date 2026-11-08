// Solver A* berbasis dorongan — dipakai untuk hint bertingkat.
var DIRS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 }
];

function deadCorner(s, x, y) {
  if (isTarget(s, x, y)) return false;
  var up = isWall(s, x, y - 1);
  var down = isWall(s, x, y + 1);
  var left = isWall(s, x - 1, y);
  var right = isWall(s, x + 1, y);
  return (up || down) && (left || right);
}

function reachable(s, from, boxes) {
  var paths = {};
  paths[key(from.x, from.y)] = [];
  var queue = [from];
  for (var i = 0; i < queue.length; i++) {
    var cur = queue[i];
    var curPath = paths[key(cur.x, cur.y)];
    for (var d = 0; d < DIRS.length; d++) {
      var dir = DIRS[d];
      var nx = cur.x + dir.dx;
      var ny = cur.y + dir.dy;
      var k = key(nx, ny);
      if (paths[k] || isWall(s, nx, ny) || boxes[k]) continue;
      paths[k] = curPath.concat([dir]);
      queue.push({ x: nx, y: ny });
    }
  }
  return paths;
}

function normalize(paths) {
  var best = null;
  for (var k in paths) if (best === null || k < best) best = k;
  return best || "";
}

function boxKey(boxes) {
  return Object.keys(boxes).sort().join(";");
}

function parseKey(k) {
  var i = k.indexOf(",");
  return { x: Number(k.slice(0, i)), y: Number(k.slice(i + 1)) };
}

function heuristic(start, boxes) {
  var goals = Object.keys(start.targets).map(parseKey);
  var h = 0;
  for (var bk in boxes) {
    var b = parseKey(bk);
    var best = Infinity;
    for (var i = 0; i < goals.length; i++) {
      var d = Math.abs(goals[i].x - b.x) + Math.abs(goals[i].y - b.y);
      if (d < best) best = d;
    }
    h += best === Infinity ? 0 : best;
  }
  return h;
}

function solve(start, maxNodes, maxMs) {
  maxNodes = maxNodes || 60000;
  maxMs = maxMs || 4000;
  var t0 = Date.now();
  if (isSolved(start)) return { solved: true, path: [], nodes: 0 };

  var startBoxes = {};
  start.boxes.forEach(function (b) {
    startBoxes[key(b.x, b.y)] = true;
  });

  var seen = {};
  var buckets = [];
  function push(f, n) {
    if (!buckets[f]) buckets[f] = [];
    buckets[f].push(n);
  }
  push(heuristic(start, startBoxes), { player: { x: start.player.x, y: start.player.y }, boxes: startBoxes, path: [] });
  seen[normalize(reachable(start, start.player, startBoxes)) + "|" + boxKey(startBoxes)] = true;

  var nodes = 0;
  var cursor = 0;

  while (cursor < buckets.length) {
    var bucket = buckets[cursor];
    if (!bucket || bucket.length === 0) {
      cursor += 1;
      continue;
    }
    var node = bucket.pop();
    var g = node.path.length;
    var paths = reachable(start, node.player, node.boxes);

    for (var bk in node.boxes) {
      var bp = parseKey(bk);
      for (var i = 0; i < DIRS.length; i++) {
        var d = DIRS[i];
        var toX = bp.x + d.dx;
        var toY = bp.y + d.dy;
        var toK = key(toX, toY);
        if (isWall(start, toX, toY) || node.boxes[toK]) continue;
        if (deadCorner(start, toX, toY)) continue;
        var walk = paths[key(bp.x - d.dx, bp.y - d.dy)];
        if (!walk) continue;

        var boxes = {};
        for (var k2 in node.boxes) boxes[k2] = true;
        delete boxes[bk];
        boxes[toK] = true;

        var player = { x: bp.x, y: bp.y };
        var stateK = normalize(reachable(start, player, boxes)) + "|" + boxKey(boxes);
        if (seen[stateK]) continue;
        seen[stateK] = true;
        nodes += 1;

        var path = node.path.concat(walk, [d]);
        var done = Object.keys(boxes).every(function (bk2) {
          return !!start.targets[bk2];
        });
        if (done) return { solved: true, path: path, nodes: nodes };
        if (nodes >= maxNodes || Date.now() - t0 > maxMs) return { solved: false, path: [], nodes: nodes };

        var f = g + walk.length + 1 + heuristic(start, boxes) * 2;
        push(f, { player: player, boxes: boxes, path: path });
        if (f < cursor) cursor = f;
      }
    }
  }
  return { solved: false, path: [], nodes: nodes };
}

/** 1 = arah berikutnya, 2 = tiga langkah, 3 = sampai dorongan berikutnya. */
function hintSteps(state, level) {
  var res = solve(state);
  if (!res.solved || res.path.length === 0) return null;
  if (level === 1) return res.path.slice(0, 1);
  if (level === 2) return res.path.slice(0, 3);
  var sim = cloneState(state);
  var out = [];
  for (var i = 0; i < res.path.length; i++) {
    var d = res.path[i];
    var r = move(sim, d.dx, d.dy);
    if (!r.next) break;
    sim = r.next;
    out.push(d);
    if (r.result === "pushed" || r.result === "win") break;
  }
  return out;
}

function dirLabel(d) {
  return d.dy < 0 ? "ATAS" : d.dy > 0 ? "BAWAH" : d.dx < 0 ? "KIRI" : "KANAN";
}

function dirArrow(d) {
  return d.dy < 0 ? "\u2191" : d.dy > 0 ? "\u2193" : d.dx < 0 ? "\u2190" : "\u2192";
}

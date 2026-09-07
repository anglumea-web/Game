// =============================================================
//  SOLVER — BFS berbasis dorongan (push) untuk hint & validasi level.
//  Jauh lebih efisien dari BFS langkah biasa karena ruang state
//  hanya bergantung pada posisi kotak + area jangkauan pemain.
// =============================================================
import { cloneState, isSolved, key, move, type GameState } from "./engine";

export type Dir = { dx: number; dy: number };

export const DIRS: Dir[] = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

const isWall = (s: GameState, x: number, y: number) =>
  y < 0 || y >= s.height || x < 0 || x >= s.width || s.grid[y]![x] === "#";

/** Kotak off-goal yang terjepit di sudut = mati; dipakai untuk pruning. */
function deadCorner(s: GameState, x: number, y: number) {
  if (s.targets.has(key(x, y))) return false;
  const up = isWall(s, x, y - 1);
  const down = isWall(s, x, y + 1);
  const left = isWall(s, x - 1, y);
  const right = isWall(s, x + 1, y);
  return (up || down) && (left || right);
}

/** BFS jangkauan pemain (kotak dianggap dinding). Mengembalikan jalur ke tiap sel. */
function reachable(s: GameState, from: { x: number; y: number }, boxes: Set<string>) {
  const paths = new Map<string, Dir[]>();
  paths.set(key(from.x, from.y), []);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i]!;
    const curPath = paths.get(key(cur.x, cur.y))!;
    for (const d of DIRS) {
      const nx = cur.x + d.dx;
      const ny = cur.y + d.dy;
      const k = key(nx, ny);
      if (paths.has(k) || isWall(s, nx, ny) || boxes.has(k)) continue;
      paths.set(k, [...curPath, d]);
      queue.push({ x: nx, y: ny });
    }
  }
  return paths;
}

export type SolveResult = { solved: boolean; path: Dir[]; nodes: number; exhausted: boolean };

type Node = {
  player: { x: number; y: number };
  boxes: Set<string>;
  path: Dir[];
};

const normalize = (paths: Map<string, Dir[]>) => {
  let best: string | null = null;
  for (const k of paths.keys()) if (best === null || k < best) best = k;
  return best ?? "";
};

const boxKey = (boxes: Set<string>) => [...boxes].sort().join(";");

const parseKey = (k: string) => {
  const i = k.indexOf(",");
  return { x: Number(k.slice(0, i)), y: Number(k.slice(i + 1)) };
};

/** Heuristik: jumlah jarak Manhattan tiap kotak ke goal terdekat. */
function heuristic(start: GameState, boxes: Set<string>) {
  const goals = [...start.targets].map(parseKey);
  let h = 0;
  for (const bk of boxes) {
    const b = parseKey(bk);
    let best = Infinity;
    for (const g of goals) best = Math.min(best, Math.abs(g.x - b.x) + Math.abs(g.y - b.y));
    h += best === Infinity ? 0 : best;
  }
  return h;
}

/** A* pada ruang dorongan; cepat dan hemat memori untuk level besar. */
export function solve(start: GameState, maxNodes = 60_000, maxMs = 4000): SolveResult {
  const t0 = Date.now();
  if (isSolved(start)) return { solved: true, path: [], nodes: 0, exhausted: false };

  const startBoxes = new Set(start.boxes.map((b) => key(b.x, b.y)));
  const seen = new Set<string>();
  const buckets: Node[][] = [];
  const push = (f: number, n: Node) => {
    (buckets[f] ??= []).push(n);
  };
  push(heuristic(start, startBoxes), { player: { ...start.player }, boxes: startBoxes, path: [] });
  seen.add(`${normalize(reachable(start, start.player, startBoxes))}|${boxKey(startBoxes)}`);
  let nodes = 0;
  let cursor = 0;

  while (cursor < buckets.length) {
    const bucket = buckets[cursor];
    if (!bucket || bucket.length === 0) {
      cursor += 1;
      continue;
    }
    const node = bucket.pop()!;
    const g = node.path.length;
    const paths = reachable(start, node.player, node.boxes);

    for (const bk of node.boxes) {
      const { x: bx, y: by } = parseKey(bk);
      for (const d of DIRS) {
        const toX = bx + d.dx;
        const toY = by + d.dy;
        const toK = key(toX, toY);
        if (isWall(start, toX, toY) || node.boxes.has(toK)) continue;
        if (deadCorner(start, toX, toY)) continue;
        const walk = paths.get(key(bx - d.dx, by - d.dy));
        if (!walk) continue;

        const boxes = new Set(node.boxes);
        boxes.delete(bk);
        boxes.add(toK);
        const player = { x: bx, y: by };
        const stateK = `${normalize(reachable(start, player, boxes))}|${boxKey(boxes)}`;
        if (seen.has(stateK)) continue;
        seen.add(stateK);
        nodes += 1;

        const path = [...node.path, ...walk, d];
        if ([...boxes].every((k) => start.targets.has(k)))
          return { solved: true, path, nodes, exhausted: false };
        if (nodes >= maxNodes || Date.now() - t0 > maxMs)
          return { solved: false, path: [], nodes, exhausted: true };

        const f = g + walk.length + 1 + heuristic(start, boxes) * 2;
        push(f, { player, boxes, path });
        if (f < cursor) cursor = f;
      }
    }
  }
  return { solved: false, path: [], nodes, exhausted: false };
}

/** Hint bertingkat: 1 = arah langkah, 2 = 3 langkah, 3 = sampai dorongan berikutnya. */
export function hintSteps(state: GameState, level: 1 | 2 | 3): Dir[] | null {
  const res = solve(state);
  if (!res.solved || res.path.length === 0) return null;
  if (level === 1) return res.path.slice(0, 1);
  if (level === 2) return res.path.slice(0, 3);
  // sampai dorongan berikutnya (inklusif)
  let sim = cloneState(state);
  const out: Dir[] = [];
  for (const d of res.path) {
    const { next, result } = move(sim, d.dx, d.dy);
    if (!next) break;
    sim = next;
    out.push(d);
    if (result === "pushed" || result === "win") break;
  }
  return out;
}

export const dirLabel = (d: Dir) =>
  d.dy < 0 ? "ATAS" : d.dy > 0 ? "BAWAH" : d.dx < 0 ? "KIRI" : "KANAN";

export const dirArrow = (d: Dir) => (d.dy < 0 ? "↑" : d.dy > 0 ? "↓" : d.dx < 0 ? "←" : "→");

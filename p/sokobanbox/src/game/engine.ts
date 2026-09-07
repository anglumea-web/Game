import { LEVELS } from "./levels";

export type Pos = { x: number; y: number };

export type GameState = {
  grid: string[][]; // '#' wall, ' ' floor, '.' goal
  player: Pos;
  boxes: Pos[];
  targets: Set<string>;
  width: number;
  height: number;
  moves: number;
  pushes: number;
};

export type MoveResult = "moved" | "pushed" | "wall" | "blocked" | "win";

export const key = (x: number, y: number) => `${x},${y}`;

export function parseLevel(index: number): GameState {
  const def = LEVELS[index]!;
  const rows = def.map.map((r) => r.split(""));
  const width = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => {
    while (r.length < width) r.push(" ");
    return r;
  });

  let player: Pos = { x: 0, y: 0 };
  const boxes: Pos[] = [];
  const targets = new Set<string>();

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < width; x++) {
      const c = grid[y]![x]!;
      if (c === "@" || c === "+") {
        player = { x, y };
        grid[y]![x] = c === "+" ? "." : " ";
      }
      if (c === "$" || c === "*") {
        boxes.push({ x, y });
        grid[y]![x] = c === "*" ? "." : " ";
      }
      if (c === "." || c === "*" || c === "+") targets.add(key(x, y));
    }
  }

  return { grid, player, boxes, targets, width, height: grid.length, moves: 0, pushes: 0 };
}

export function cloneState(s: GameState): GameState {
  return {
    ...s,
    player: { ...s.player },
    boxes: s.boxes.map((b) => ({ ...b })),
  };
}

const isWall = (s: GameState, x: number, y: number) =>
  y < 0 || y >= s.height || x < 0 || x >= s.width || s.grid[y]![x] === "#";

export function isSolved(s: GameState) {
  return s.boxes.every((b) => s.targets.has(key(b.x, b.y)));
}

/** Pure move: returns the next state (or null) plus the outcome. */
export function move(
  state: GameState,
  dx: number,
  dy: number,
): { next: GameState | null; result: MoveResult; boxIndex: number } {
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  if (isWall(state, nx, ny)) return { next: null, result: "wall", boxIndex: -1 };

  const boxIndex = state.boxes.findIndex((b) => b.x === nx && b.y === ny);
  const next = cloneState(state);

  if (boxIndex !== -1) {
    const bx = nx + dx;
    const by = ny + dy;
    if (isWall(state, bx, by) || state.boxes.some((b) => b.x === bx && b.y === by))
      return { next: null, result: "blocked", boxIndex: -1 };
    next.boxes[boxIndex] = { x: bx, y: by };
    next.pushes += 1;
  }

  next.player = { x: nx, y: ny };
  next.moves += 1;

  const result: MoveResult = isSolved(next) ? "win" : boxIndex !== -1 ? "pushed" : "moved";
  return { next, result, boxIndex };
}

/** Corner deadlock detection: box off-goal wedged between two perpendicular walls. */
export function deadlockedBoxes(s: GameState): Set<string> {
  const out = new Set<string>();
  for (const b of s.boxes) {
    if (s.targets.has(key(b.x, b.y))) continue;
    const up = isWall(s, b.x, b.y - 1);
    const down = isWall(s, b.x, b.y + 1);
    const left = isWall(s, b.x - 1, b.y);
    const right = isWall(s, b.x + 1, b.y);
    if ((up || down) && (left || right)) out.add(key(b.x, b.y));
  }
  return out;
}

export function starsFor(index: number, moves: number) {
  const par = LEVELS[index]?.par ?? 999;
  if (moves <= par) return 3;
  if (moves <= Math.ceil(par * 1.6)) return 2;
  return 1;
}

type Props = { onMove: (dx: number, dy: number) => void };

const btn =
  "flex h-14 w-14 items-center justify-center rounded-md border border-border bg-panel text-lg text-foreground active:bg-tile-light select-none touch-manipulation";

export function Dpad({ onMove }: Props) {
  const press = (dx: number, dy: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    onMove(dx, dy);
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      <span />
      <button type="button" aria-label="Up" className={btn} onPointerDown={press(0, -1)}>
        ▲
      </button>
      <span />
      <button type="button" aria-label="Left" className={btn} onPointerDown={press(-1, 0)}>
        ◀
      </button>
      <span className="flex h-14 w-14 items-center justify-center text-muted-foreground">●</span>
      <button type="button" aria-label="Right" className={btn} onPointerDown={press(1, 0)}>
        ▶
      </button>
      <span />
      <button type="button" aria-label="Down" className={btn} onPointerDown={press(0, 1)}>
        ▼
      </button>
      <span />
    </div>
  );
}

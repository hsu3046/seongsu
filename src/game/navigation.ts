import { WORLD, footprints, streets, distanceToSegment } from '../data/geography.ts';
import type { Point } from '../data/places.ts';

export function insidePolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!, b = polygon[j]!;
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
const obstacles = footprints.map((building) => ({ ...building,
  minX: Math.min(...building.points.map((p) => p.x)), maxX: Math.max(...building.points.map((p) => p.x)),
  minY: Math.min(...building.points.map((p) => p.y)), maxY: Math.max(...building.points.map((p) => p.y)),
}));
export function canWalk(point: Point, padding = 6): boolean {
  if (point.x < 24 || point.y < 24 || point.x > WORLD.width - 24 || point.y > WORLD.height - 24) return false;
  const onStreet = streets.some((street) => street.points.some((b, i) => i > 0
    && distanceToSegment(point, street.points[i - 1]!, b) <= street.width / 2 + 18 - padding));
  if (!onStreet) return false;
  return !obstacles.some((b) => point.x >= b.minX - padding && point.x <= b.maxX + padding
    && point.y >= b.minY - padding && point.y <= b.maxY + padding
    && (insidePolygon(point, b.points) || b.points.some((p, i) => i > 0 && distanceToSegment(point, b.points[i - 1]!, p) < padding)));
}

// Precomputed passability makes each route a cheap bounded search, even with real footprints.
const step = 8;
const cols = WORLD.width / step;
const rows = WORLD.height / step;
const gridPoint = (id: number): Point => ({ x: (id % cols) * step + step / 2, y: Math.floor(id / cols) * step + step / 2 });
let grid: Uint8Array | undefined;
function walkGrid() {
  if (!grid) {
    grid = new Uint8Array(cols * rows);
    for (let id = 0; id < grid.length; id++) grid[id] = Number(canWalk(gridPoint(id), 8));
  }
  return grid;
}
export function clearSegment(a: Point, b: Point): boolean {
  const samples = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3));
  for (let i = 0; i <= samples; i++) {
    if (!canWalk({ x: a.x + (b.x - a.x) * i / samples, y: a.y + (b.y - a.y) * i / samples })) return false;
  }
  return true;
}
export function findPath(from: Point, to: Point): Point[] {
  if (!canWalk(from) || !canWalk(to)) return [];
  const passable = walkGrid();
  const nearestCell = (p: Point) => {
    const x = Math.floor(p.x / step), y = Math.floor(p.y / step);
    const candidates: number[] = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && passable[ny * cols + nx]) candidates.push(ny * cols + nx);
    }
    return candidates.sort((a, b) => Math.hypot(gridPoint(a).x - p.x, gridPoint(a).y - p.y) - Math.hypot(gridPoint(b).x - p.x, gridPoint(b).y - p.y)).find((id) => clearSegment(p, gridPoint(id)));
  };
  const start = nearestCell(from), goal = nearestCell(to);
  if (start === undefined || goal === undefined) return [];
  const queue = [start], previous = new Map<number, number>([[start, -1]]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor]!;
    if (current === goal) {
      const path: Point[] = [to];
      let id = current;
      while (id !== -1) { path.push(gridPoint(id)); id = previous.get(id)!; }
      return path.reverse();
    }
    const x = current % cols, y = Math.floor(current / cols);
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx!, ny = y + dy!;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const id = ny * cols + nx;
      if (!previous.has(id) && passable[id]) { previous.set(id, current); queue.push(id); }
    }
  }
  return [];
}

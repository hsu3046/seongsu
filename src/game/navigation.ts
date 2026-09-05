import { places, WORLD } from '../data/places.ts';
import type { Point } from '../data/places.ts';

export interface Rectangle { x: number; y: number; w: number; h: number }
export const buildings: Rectangle[] = [
  ...places.filter((place) => place.kind !== 'garden').map((place) => place.building),
  { x: 48, y: 176, w: 144, h: 208 }, { x: 544, y: 48, w: 176, h: 112 },
  { x: 768, y: 48, w: 224, h: 112 }, { x: 1104, y: 208, w: 128, h: 176 },
  { x: 48, y: 592, w: 144, h: 160 },
  { x: 240, y: 912, w: 208, h: 96 }, { x: 784, y: 912, w: 192, h: 96 },
];

export function canWalk(point: Point, padding = 9): boolean {
  return point.x >= 24 && point.y >= 24 && point.x <= WORLD.width - 24 && point.y <= WORLD.height - 24
    && !buildings.some((b) => point.x > b.x - padding && point.x < b.x + b.w + padding
      && point.y > b.y - padding && point.y < b.y + b.h + padding);
}

// A bounded, four-direction grid search shares the exact building footprints with physics.
export function findPath(from: Point, to: Point): Point[] {
  if (!canWalk(to)) return [];
  const step = 16;
  const cols = WORLD.width / step;
  const rows = WORLD.height / step;
  const cell = (p: Point) => Math.floor(p.y / step) * cols + Math.floor(p.x / step);
  const point = (id: number): Point => ({ x: (id % cols) * step + step / 2, y: Math.floor(id / cols) * step + step / 2 });
  const start = cell(from);
  const goal = cell(to);
  const queue = [start];
  const previous = new Map<number, number>([[start, -1]]);
  let cursor = 0;
  while (cursor < queue.length) {
    const current = queue[cursor++]!;
    if (current === goal) {
      const path: Point[] = [to];
      let id = current;
      while (id !== start) {
        path.push(point(id));
        id = previous.get(id)!;
      }
      return path.reverse();
    }
    const x = current % cols;
    const y = Math.floor(current / cols);
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx!;
      const ny = y + dy!;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const id = ny * cols + nx;
      if (!previous.has(id) && canWalk(point(id))) {
        previous.set(id, current);
        queue.push(id);
      }
    }
  }
  return [];
}

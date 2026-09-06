import source from './map-source.json' with { type: 'json' };

export interface Point { x: number; y: number }
export interface GeoPoint { longitude: number; latitude: number }
export const WORLD = { width: 1856, height: 1376 };
export const MAP_REVIEWED = '2026-09-06';
export const MAP_ROTATION = 21;

// Local metre projection, rotated to put Achasan-ro almost horizontally.
// Locations retain their relative distances; only street widths are enlarged for play.
export function project({ longitude, latitude }: GeoPoint): Point {
  const east = (longitude - 127.0545) * 88265;
  const south = (37.5435 - latitude) * 111320;
  const angle = MAP_ROTATION * Math.PI / 180;
  return {
    x: Math.round(832 + 3 * (east * Math.cos(angle) + south * Math.sin(angle))),
    y: Math.round(688 + 3 * (-east * Math.sin(angle) + south * Math.cos(angle))),
  };
}
const projectPairs = (points: number[][]) => points.map(([longitude, latitude]) => project({ longitude: longitude!, latitude: latitude! }));
export const streets = source.roads.map((road) => ({
  ...road, points: projectPairs(road.points),
  width: road.kind === 'secondary' ? 64 : road.kind === 'tertiary' ? 44 : 30,
}));
export const footprints = source.buildings.map((building) => {
  const points = projectPairs(building.points);
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const width = Math.max(...xs) - Math.min(...xs), height = Math.max(...ys) - Math.min(...ys);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  // Keep centres/orientation, but inset drawn and collidable outlines together.
  // The 8 px navigation grid and avatar need room in Seongsu's very narrow lanes.
  return { ...building, points: points.map((p) => ({
    x: cx + (p.x - cx) * Math.max(.4, 1 - 24 / width),
    y: cy + (p.y - cy) * Math.max(.4, 1 - 24 / height),
  })) };
});

export function closestOnSegment(point: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x, dy = b.y - a.y;
  const fraction = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return { x: a.x + fraction * dx, y: a.y + fraction * dy };
}
export function distanceToSegment(point: Point, a: Point, b: Point): number {
  const closest = closestOnSegment(point, a, b);
  return Math.hypot(point.x - closest.x, point.y - closest.y);
}
export function streetArrival(location: GeoPoint, streetName: string): Point {
  const target = project(location);
  let nearest = target, distance = Infinity;
  for (const street of streets.filter((item) => item.name === streetName)) {
    for (let index = 1; index < street.points.length; index++) {
      const candidate = closestOnSegment(target, street.points[index - 1]!, street.points[index]!);
      const nextDistance = Math.hypot(target.x - candidate.x, target.y - candidate.y);
      if (nextDistance < distance) { distance = nextDistance; nearest = candidate; }
    }
  }
  return { x: Math.round(nearest.x), y: Math.round(nearest.y) };
}
export const station = project({ longitude: 127.0561016, latitude: 37.5445688 });
export const exits = [
  { number: '4', ...project({ longitude: 127.0550065, latitude: 37.5447446 }) },
  { number: '3', ...project({ longitude: 127.0569174, latitude: 37.5441528 }) },
];
export const SPAWN: Point = { x: exits[0]!.x, y: exits[0]!.y };

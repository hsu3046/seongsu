import { placeIds, SPAWN, WORLD } from '../data/places.ts';
import type { Locale, PlaceId, Point, TimeOfDay } from '../data/places.ts';

// Separate map progress preserves the original fictional passport without transferring stamps.
export const STORAGE_KEY = 'seongsu-passport:yeonmujang:v1';
export interface Progress {
  version: 1;
  started: boolean;
  visited: PlaceId[];
  saved: PlaceId[];
  locale: Locale;
  time: TimeOfDay;
  position: Point;
}

export const freshProgress = (): Progress => ({
  version: 1, started: false, visited: [], saved: [],
  locale: 'en', time: 'afternoon', position: { ...SPAWN },
});

const validIds = (value: unknown): PlaceId[] => Array.isArray(value)
  ? [...new Set(value.filter((id): id is PlaceId => typeof id === 'string' && placeIds.includes(id as PlaceId)))]
  : [];

// Stored browser data is untrusted: sanitize every field before it enters UI or physics.
export function decodeProgress(raw: string | null): Progress {
  const fallback = freshProgress();
  if (!raw) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || !('version' in value) || value.version !== 1) return fallback;
    const data = value as Record<string, unknown>;
    const position = data.position as Record<string, unknown> | null;
    return {
      version: 1,
      started: data.started === true,
      visited: validIds(data.visited), saved: validIds(data.saved),
      locale: data.locale === 'ja' ? 'ja' : 'en',
      time: data.time === 'morning' || data.time === 'night' ? data.time : 'afternoon',
      position: position && typeof position.x === 'number' && typeof position.y === 'number'
        && Number.isFinite(position.x) && Number.isFinite(position.y)
        && position.x >= 16 && position.x <= WORLD.width - 16
        && position.y >= 16 && position.y <= WORLD.height - 16
        ? { x: position.x, y: position.y } : { ...SPAWN },
    };
  } catch {
    return fallback;
  }
}

export function collectStamp(progress: Progress, id: PlaceId, nearby: PlaceId | null): Progress {
  if (!progress.started || nearby !== id || !placeIds.includes(id) || progress.visited.includes(id)) return progress;
  return { ...progress, visited: [...progress.visited, id] };
}

export function toggleSaved(progress: Progress, id: PlaceId): Progress {
  return { ...progress, saved: progress.saved.includes(id) ? progress.saved.filter((item) => item !== id) : [...progress.saved, id] };
}

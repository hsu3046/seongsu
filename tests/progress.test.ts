import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectStamp, decodeProgress, freshProgress, toggleSaved } from '../src/state/progress.ts';
import { places, SPAWN } from '../src/data/places.ts';
import { canWalk, findPath } from '../src/game/navigation.ts';

test('missing, malformed, and future-version data produce a usable fresh passport', () => {
  for (const raw of [null, '', '{', 'null', '[]', '2', '{"version":2}']) {
    assert.deepEqual(decodeProgress(raw), freshProgress());
  }
});

test('saved data cannot forge locations, duplicate stamps, or invalid coordinates', () => {
  const decoded = decodeProgress(JSON.stringify({
    version: 1, started: true, locale: 'xx', time: 'midnight',
    visited: ['scene', 'scene', 'not-a-place', null], saved: ['musinsa', 'musinsa', 9],
    position: { x: -100, y: 'wrong' },
  }));
  assert.deepEqual(decoded.visited, ['scene']);
  assert.deepEqual(decoded.saved, ['musinsa']);
  assert.equal(decoded.locale, 'en');
  assert.equal(decoded.time, 'afternoon');
  assert.deepEqual(decoded.position, SPAWN);
});

test('collecting requires a started walk and physical proximity, and is idempotent', () => {
  const fresh = freshProgress();
  assert.equal(collectStamp(fresh, 'scene', 'scene'), fresh);
  const started = { ...fresh, started: true };
  assert.equal(collectStamp(started, 'scene', null), started);
  assert.equal(collectStamp(started, 'scene', 'dior'), started);
  const visited = collectStamp(started, 'scene', 'scene');
  assert.deepEqual(visited.visited, ['scene']);
  assert.equal(collectStamp(visited, 'scene', 'scene'), visited);
});

test('a complete walk and saved favorites survive serialization without losing settings', () => {
  let progress = { ...freshProgress(), started: true, locale: 'ja' as const, time: 'night' as const };
  for (const place of places) {
    const collected = collectStamp(progress, place.id, place.id);
    progress = { ...collected, locale: 'ja', time: 'night' };
  }
  const saved = toggleSaved(progress, 'daelim');
  assert.deepEqual(decodeProgress(JSON.stringify(saved)), saved);
  assert.equal(saved.visited.length, 5);
  assert.deepEqual(toggleSaved(saved, 'daelim').saved, []);
});

test('every stop can be reached from spawn and from the preceding stop without crossing buildings', () => {
  let from = SPAWN;
  for (const place of places) {
    const path = findPath(from, place.entrance);
    assert.ok(path.length > 0, place.id + ' must be reachable');
    assert.ok(path.every((point) => canWalk(point)), place.id + ' must avoid collisions');
    assert.deepEqual(path.at(-1), place.entrance);
    for (let index = 1; index < path.length; index++) {
      const a = path[index - 1]!;
      const b = path[index]!;
      for (let sample = 0; sample <= 8; sample++) {
        assert.ok(canWalk({ x: a.x + (b.x - a.x) * sample / 8, y: a.y + (b.y - a.y) * sample / 8 }));
      }
    }
    from = place.entrance;
  }
});

test('clicks inside buildings or outside the world do not create an impossible route', () => {
  assert.deepEqual(findPath(SPAWN, { x: places[0]!.building.x + places[0]!.building.w / 2, y: places[0]!.building.y + places[0]!.building.h / 2 }), []);
  assert.deepEqual(findPath(SPAWN, { x: -10, y: 500 }), []);
});

test('any itinerary order has a safe street route, including its first and last segment', () => {
  const stops = [SPAWN, ...places.map((place) => place.entrance)];
  for (const from of stops) for (const to of stops) {
    const path = [from, ...findPath(from, to)];
    assert.ok(path.length > 1, 'all pairs of stops must connect');
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]!, b = path[i]!;
      for (let t = 0; t <= 1; t += .2) assert.ok(canWalk({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }));
    }
  }
});

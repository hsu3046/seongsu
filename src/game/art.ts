import { places, WORLD } from '../data/places.ts';
import type { Place, Point } from '../data/places.ts';
import { footprints, streets, station, exits } from '../data/geography.ts';

type Context = CanvasRenderingContext2D;
const ink = '#3e4e43';
function rect(c: Context, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function makeCanvas(w: number, h: number): [HTMLCanvasElement, Context] {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable');
  context.imageSmoothingEnabled = false;
  return [canvas, context];
}
function noise(x: number, y: number) {
  return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
}
function tree(c: Context, x: number, y: number, size = 1) {
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(size, size);
  rect(c, -18, 3, 45, 10, '#adbfa0');
  rect(c, -3, -15, 7, 24, '#846e4e');
  rect(c, 1, -14, 3, 21, '#645940');
  rect(c, -17, -48, 34, 37, '#71895a');
  rect(c, -25, -40, 50, 24, '#71895a');
  rect(c, -19, -50, 32, 33, '#8da568');
  rect(c, -25, -34, 34, 15, '#8da568');
  rect(c, -13, -54, 22, 34, '#99b371');
  rect(c, -20, -41, 7, 6, '#b0c584');
  rect(c, -5, -48, 9, 5, '#b0c584');
  rect(c, 6, -24, 14, 7, '#627e52');
  rect(c, -6, -20, 8, 7, '#789457');
  rect(c, -19, -25, 5, 4, '#97b070');
  c.restore();
}
function shrub(c: Context, x: number, y: number, width = 25) {
  rect(c, x, y, width, 12, '#738b58');
  rect(c, x + 3, y - 4, width - 6, 14, '#90a86b');
  for (let i = 3; i < width - 3; i += 7) rect(c, x + i, y - 2, 3, 3, '#b0c282');
}
function planter(c: Context, x: number, y: number) {
  rect(c, x - 6, y - 8, 12, 13, '#a96c4d');
  rect(c, x - 8, y - 10, 16, 5, '#cf9b72');
  rect(c, x - 5, y - 7, 2, 10, '#c68b63');
  shrub(c, x - 9, y - 20, 18);
}
function windowPane(c: Context, x: number, y: number, w: number, h: number, arch = false) {
  rect(c, x - 3, y - 3, w + 6, h + 6, '#d3b89a');
  rect(c, x, y, w, h, '#425c55');
  if (arch) {
    rect(c, x - 3, y - 3, 6, 6, '#b8795a');
    rect(c, x + w - 3, y - 3, 6, 6, '#b8795a');
  }
  rect(c, x + 3, y + 4, w - 6, Math.floor(h * .43), '#91b6a9');
  rect(c, x + 6, y + 6, 4, Math.max(5, h / 3 - 6), '#b5cfbe');
  rect(c, x + w / 2 - 1, y, 3, h, '#d5c7a6');
  rect(c, x, y + h / 2, w, 3, '#d5c7a6');
  rect(c, x - 5, y + h, w + 10, 5, '#775d49');
}
function table(c: Context, x: number, y: number, umbrella = false) {
  rect(c, x - 5, y + 7, 4, 8, '#5a6651');
  rect(c, x + 8, y + 7, 4, 8, '#5a6651');
  rect(c, x - 10, y - 1, 28, 10, '#b69a6d');
  rect(c, x - 14, y + 3, 7, 14, '#6d775b');
  rect(c, x + 21, y + 3, 7, 14, '#6d775b');
  rect(c, x, y - 4, 4, 4, '#eee1c6');
  if (umbrella) {
    rect(c, x + 3, y - 22, 3, 30, '#8b7655');
    rect(c, x - 17, y - 30, 46, 12, '#e9dcb7');
    rect(c, x - 10, y - 38, 32, 10, '#f2e9cb');
    rect(c, x, y - 43, 12, 7, '#faf0d4');
    rect(c, x + 7, y - 38, 6, 21, '#d9c79c');
  }
}
function bench(c: Context, x: number, y: number) {
  rect(c, x + 3, y + 13, 4, 9, ink);
  rect(c, x + 39, y + 13, 4, 9, ink);
  rect(c, x, y, 46, 4, '#a38c60');
  rect(c, x, y + 6, 46, 4, '#b79d70');
  rect(c, x, y + 13, 46, 7, '#c4a67a');
  rect(c, x - 3, y + 8, 4, 12, ink);
  rect(c, x + 45, y + 8, 4, 12, ink);
}
function bike(c: Context, x: number, y: number) {
  for (const wheel of [0, 23]) {
    rect(c, x + wheel + 2, y, 9, 2, ink);
    rect(c, x + wheel, y + 2, 2, 9, ink);
    rect(c, x + wheel + 11, y + 2, 2, 9, ink);
    rect(c, x + wheel + 2, y + 11, 9, 2, ink);
  }
  rect(c, x + 8, y + 5, 22, 3, '#af664a');
  rect(c, x + 14, y - 3, 3, 10, '#af664a');
  rect(c, x + 26, y - 7, 3, 14, '#af664a');
  rect(c, x + 11, y - 5, 9, 3, ink);
  rect(c, x + 25, y - 8, 8, 3, ink);
}
function lamp(c: Context, x: number, y: number) {
  rect(c, x - 2, y - 49, 4, 51, '#647261');
  rect(c, x - 6, y, 12, 4, '#77826d');
  rect(c, x - 9, y - 52, 19, 4, '#50634f');
  rect(c, x - 6, y - 63, 13, 11, '#d8cb99');
  rect(c, x - 9, y - 64, 19, 3, '#50634f');
  rect(c, x - 4, y - 68, 9, 4, '#50634f');
  rect(c, x - 3, y - 61, 4, 7, '#fcf1c3');
}

// All façades below are original pixel interpretations, not copied brand photography.
function drawLandmark(c: Context, place: Place) {
  const x = 32, y = 36, w = 192, h = 128;
  const warehouse = place.id === 'daelim' || place.id === 'musinsa';
  rect(c, 42, 63, w, h - 13, '#bdc0ad');
  rect(c, x, y + 28, w, h - 20, warehouse ? '#b17357' : '#dcd9c9');
  if (warehouse) {
    for (let row = 0; row < 12; row++) {
      rect(c, x, y + 30 + row * 8, w, 1, '#8f5c4a');
      for (let col = 0; col < 9; col++) rect(c, x + col * 24 + row % 2 * 12, y + 31 + row * 8, 1, 7, '#8f5c4a');
    }
    const count = place.id === 'musinsa' ? 2 : 1;
    for (let roof = 0; roof < count; roof++) {
      const rw = w / count, rx = x + roof * rw;
      c.fillStyle = '#646c61'; c.beginPath(); c.moveTo(rx - 5, y + 31);
      c.lineTo(rx + rw / 2, y + 1); c.lineTo(rx + rw + 5, y + 31); c.closePath(); c.fill();
      rect(c, rx - 3, y + 31, rw + 6, 5, '#454f48');
    }
    windowPane(c, 44, 115, 44, 42);
    windowPane(c, 168, 115, 44, 42);
    rect(c, 101, 99, 54, 65, '#45554d');
    rect(c, 107, 104, 42, 55, '#a9b9a9');
    rect(c, 125, 104, 3, 55, '#55675a');
  } else if (place.id === 'dior') {
    rect(c, 28, 60, 200, 12, '#eee9d8');
    rect(c, 46, 40, 164, 24, '#7c8174');
    rect(c, 60, 31, 138, 12, '#93998a');
    for (let xx = 48; xx <= 184; xx += 34) {
      rect(c, xx, 94, 22, 64, '#70877b');
      rect(c, xx - 3, 97, 3, 64, '#faf6e6');
      rect(c, xx + 22, 97, 3, 64, '#faf6e6');
      rect(c, xx + 4, 87, 14, 7, '#eae5d4');
      rect(c, xx + 10, 94, 2, 64, '#d7d8c5');
    }
    shrub(c, 26, 167, 56); shrub(c, 176, 167, 56);
  } else if (place.id === 'tamburins') {
    rect(c, 26, 51, 204, 10, '#efeddd');
    rect(c, 43, 64, 169, 91, '#e9e5d5');
    rect(c, 65, 99, 129, 65, '#636e5f');
    rect(c, 71, 105, 117, 59, '#b9c4b0');
    rect(c, 127, 105, 3, 59, '#edf0df');
    rect(c, 43, 99, 22, 65, '#d1c7ac');
    rect(c, 195, 90, 15, 74, '#cec5ad');
    // Abstract sculptural shapes, rather than reproducing a temporary exhibition.
    rect(c, 86, 134, 20, 26, '#a8a68b'); rect(c, 89, 124, 14, 12, '#c5bea0');
  } else {
    rect(c, 28, 36, 200, 10, '#edf0e3');
    rect(c, 39, 48, 178, 57, '#889e92');
    for (let xx = 44; xx < 213; xx += 28) {
      rect(c, xx, 52, 23, 48, '#b8c8b8'); rect(c, xx, 120, 23, 44, '#90aa9a');
    }
    rect(c, 28, 105, 200, 12, '#dddccd');
    rect(c, 31, 117, 6, 48, '#eeede0'); rect(c, 216, 117, 6, 48, '#eeede0');
  }
  rect(c, 65, 74, 126, 17, place.id === 'musinsa' ? '#37443e' : '#f0ecda');
  c.fillStyle = place.id === 'musinsa' ? '#f7f1df' : '#424d43';
  c.font = 'bold 11px monospace'; c.textAlign = 'center'; c.fillText(place.sign, 128, 86);
  rect(c, 25, 166, 207, 6, '#c8c5af');
  planter(c, 37, 164); planter(c, 219, 164);
  if (place.id === 'scene') table(c, 193, 179);
}
function path(c: Context, points: Point[]) {
  c.beginPath(); points.forEach((point, index) => {
    const x = Math.round(point.x / 2) * 2, y = Math.round(point.y / 2) * 2;
    if (index === 0) c.moveTo(x, y); else c.lineTo(x, y);
  });
}
export function drawWorld(): HTMLCanvasElement {
  const [canvas, c] = makeCanvas(WORLD.width, WORLD.height);
  rect(c, 0, 0, WORLD.width, WORLD.height, '#d4d4c1');
  for (let y = 0; y < WORLD.height; y += 16) for (let x = 0; x < WORLD.width; x += 18) {
    if (noise(x, y) > .65) rect(c, x, y, 3, 2, '#c9cbbb');
  }
  c.lineCap = 'round'; c.lineJoin = 'round';
  // Continuous street layers preserve the junctions from the geographic source.
  for (const street of streets) { path(c, street.points); c.strokeStyle = '#b5baa7'; c.lineWidth = street.width + 40; c.stroke(); }
  for (const street of streets) { path(c, street.points); c.strokeStyle = '#e8e5d3'; c.lineWidth = street.width + 36; c.stroke(); }
  for (const street of streets) { path(c, street.points); c.strokeStyle = '#c5ccbd'; c.lineWidth = street.width; c.stroke(); }
  for (const street of streets.filter((s) => s.kind === 'secondary' || s.kind === 'tertiary')) {
    path(c, street.points); c.strokeStyle = '#e9e5cc'; c.lineWidth = 2; c.setLineDash([18, 24]); c.stroke(); c.setLineDash([]);
  }
  for (const building of footprints) {
    const place = places.find((p) => p.footprintIds.includes(building.id));
    const xs = building.points.map((p) => p.x), ys = building.points.map((p) => p.y);
    const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
    c.save(); c.translate(5, 7); path(c, building.points); c.closePath(); c.fillStyle = '#aeb4a1'; c.fill(); c.restore();
    path(c, building.points); c.closePath();
    c.fillStyle = place ? place.id === 'daelim' || place.id === 'musinsa' ? '#a8765d' : '#e2ddc6' : noise(x, y) > .5 ? '#b9bdab' : '#c8c7b2';
    c.fill(); c.strokeStyle = place ? '#777963' : '#a5ad99'; c.lineWidth = place ? 3 : 2; c.stroke();
    c.save(); c.clip();
    for (let ry = y + 9; ry < y + h - 2; ry += 9) rect(c, x + 3, ry, w - 6, 1, place ? '#968f7660' : '#a3ac9860');
    if (w > 28 && h > 25) {
      rect(c, x + w * .55, y + h * .35, 16, 14, '#939e8c');
      rect(c, x + w * .55 - 2, y + h * .35 - 2, 16, 12, '#dce0cd');
      for (let line = 0; line < 4; line++) rect(c, x + w * .55 + line * 3, y + h * .35, 1, 7, '#9fac99');
    }
    if (place) {
      c.strokeStyle = place.id === 'musinsa' || place.id === 'daelim' ? '#705e4c' : '#f4f0db'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke();
      if (place.id === 'scene') for (let xx = x + 7; xx < x + w - 8; xx += 18) rect(c, xx, y + h - 15, 13, 10, '#839f90');
      if (place.id === 'dior') for (let yy = y + 8; yy < y + h - 10; yy += 18) rect(c, x + 5, yy, 11, 13, '#93a594');
      if (place.id === 'tamburins') rect(c, x + 12, y + 13, w - 24, h - 26, '#cec5a6');
    }
    c.restore();
  }
  // The elevated Line 2 platform is a recognizable starting landmark.
  const platform = { x: station.x - 300, y: station.y - 24 };
  rect(c, platform.x + 8, platform.y + 12, 618, 54, '#9fae99');
  rect(c, platform.x, platform.y, 618, 52, '#66786c');
  rect(c, platform.x + 5, platform.y + 6, 608, 32, '#c7d0b9');
  rect(c, platform.x + 5, platform.y + 40, 608, 7, '#578263');
  for (let x = platform.x + 15; x < platform.x + 608; x += 26) rect(c, x, platform.y + 9, 20, 26, '#a8b9a5');
  rect(c, station.x - 105, platform.y + 12, 210, 26, '#f1efdd');
  c.fillStyle = '#425f48'; c.font = 'bold 13px monospace'; c.textAlign = 'center'; c.fillText('② SEONGSU STATION', station.x, platform.y + 30);
  for (const exit of exits) {
    rect(c, exit.x - 14, exit.y - 10, 28, 28, '#768c6e');
    for (let sy = 0; sy < 5; sy++) rect(c, exit.x - 10, exit.y - 5 + sy * 4, 20, 2, '#d4d9bd');
    rect(c, exit.x - 12, exit.y - 21, 24, 15, '#4d7755');
    c.fillStyle = '#fff7dc'; c.font = 'bold 10px monospace'; c.fillText(exit.number, exit.x, exit.y - 10);
  }
  // Only selected landmarks carry nameplates: mobile streets stay readable.
  for (const place of places) {
    const b = place.building;
    c.font = 'bold 9px monospace';
    const width = c.measureText(place.sign).width + 14;
    rect(c, b.x + b.w / 2 - width / 2, b.y + b.h / 2 - 8, width, 17, '#f4efda');
    c.fillStyle = '#4f5b4c'; c.fillText(place.sign, b.x + b.w / 2, b.y + b.h / 2 + 4);
  }
  for (const [x, y] of [[625, 255], [965, 265], [1180, 263], [1320, 266]]) { tree(c, x!, y!, .65); }
  table(c, 435, 398, true); bench(c, 460, 410); bike(c, 642, 275);
  for (const [x, y] of [[465, 264], [935, 796], [1370, 965]]) lamp(c, x!, y!);
  // Labels follow the map orientation (21° counterclockwise from north-up).
  c.fillStyle = '#768571'; c.font = 'bold 12px monospace';
  c.fillText('ACHASAN-RO · 아차산로', 590, 211);
  c.fillText('YEONMUJANG-GIL · 연무장길', 930, 937);
  c.save(); c.translate(343, 553); c.rotate(-Math.PI / 2); c.fillText('YEONMUJANG 5-GIL', 0, 0); c.restore();
  c.save(); c.translate(1410, 608); c.rotate(-Math.PI / 2); c.fillText('SEONGSUI-RO · 성수이로', 0, 0); c.restore();
  return canvas;
}

export function drawWalker(direction: number, frame: number, outfit = '#e38154'): HTMLCanvasElement {
  const [canvas, c] = makeCanvas(24, 34);
  rect(c, 4, 30, 17, 3, '#737c6255');
  if (direction === 1 || direction === 3) {
    // Mirror one true profile, keeping the feet and physics origin unchanged.
    if (direction === 3) { c.translate(24, 0); c.scale(-1, 1); }
    const passing = frame === 2 || frame === 4;
    const bob = passing ? -1 : 0;
    const stride = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    const limb = (points: readonly Point[], color: string) => {
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]!, b = points[i]!;
        const length = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
        for (let step = 0; step <= length; step++) {
          rect(c, a.x + (b.x - a.x) * step / length - 1,
            a.y + (b.y - a.y) * step / length - 1, 3, 3, color);
        }
      }
    };
    const farFoot = { x: 11 - stride * 5, y: frame === 2 ? 29 : 31 };
    const nearFoot = { x: 12 + stride * 5, y: frame === 4 ? 29 : 31 };
    // The far limbs sit behind the narrow torso; arms counter-swing to the legs.
    limb([{ x: 11, y: 24 + bob }, { x: 11 - stride * 2, y: 27 }, farFoot], '#3e4a42');
    rect(c, farFoot.x - 1, farFoot.y, 5, 2, '#303e38');
    limb([{ x: 13, y: 17 + bob }, { x: 14 + stride * 2, y: 21 + bob },
      { x: 14 + stride * 4, y: 24 + bob }], '#c39c7a');
    limb([{ x: 12, y: 24 + bob }, { x: frame === 4 ? 15 : 12 + stride * 3, y: 27 }, nearFoot], '#5d6857');
    rect(c, nearFoot.x - 1, nearFoot.y, 5, 2, '#36443e');
    rect(c, 9, 15 + bob, 9, 11, outfit === '#db7750' ? '#f1e6cc' : outfit);
    rect(c, 5, 17 + bob, 5, 10, outfit);
    rect(c, 5, 19 + bob, 2, 5, '#f0ad72');
    rect(c, 10, 15 + bob, 2, 9, outfit);
    limb([{ x: 13, y: 18 + bob }, { x: 13 - stride * 2, y: 22 + bob },
      { x: 13 - stride * 4, y: 25 + bob }], '#e2c09a');
    rect(c, 11, 16 + bob, 5, 4, outfit === '#db7750' ? '#e5dabf' : outfit);
    rect(c, 12, 12 + bob, 4, 4, '#d5aa84');
    rect(c, 9, 5 + bob, 10, 9, '#e6bc94');
    rect(c, 17, 12 + bob, 3, 3, '#e6bc94');
    rect(c, 19, 10 + bob, 3, 3, '#e6bc94');
    rect(c, 7, 3 + bob, 12, 6, '#4b453b');
    rect(c, 10, 1 + bob, 7, 3, '#4b453b');
    rect(c, 7, 8 + bob, 4, 5, '#4b453b');
    rect(c, 10, 9 + bob, 3, 3, '#d5aa84');
    rect(c, 17, 9 + bob, 2, 2, '#3c4135');
    return canvas;
  }
  const step = frame === 1 ? -2 : frame === 3 ? 2 : 0;
  rect(c, 7, 25, 4, 6 + step, '#4e594c');
  rect(c, 14, 25, 4, 6 - step, '#4e594c');
  rect(c, 6, 30 + step, 5, 3, '#36443e');
  rect(c, 14, 30 - step, 5, 3, '#36443e');
  rect(c, 6, 14, 13, 13, outfit === '#db7750' ? '#f1e6cc' : outfit);
  rect(c, 3, 16 + step, 4, 9, '#e2c09a');
  rect(c, 19, 16 - step, 3, 9, '#e2c09a');
  rect(c, 7, 5, 12, 11, '#e6bc94');
  rect(c, 5, 3, 15, 7, '#4b453b');
  rect(c, 8, 1, 9, 3, '#4b453b');
  rect(c, 5, 8, 3, 5, '#4b453b');
  if (direction === 0) {
    rect(c, 7, 6, 12, 9, '#4b453b');
    rect(c, 8, 17, 10, 10, outfit);
    rect(c, 10, 19, 6, 4, '#f0ad72');
  } else {
    rect(c, 9, 10, 2, 2, '#3c4135');
    rect(c, 16, 10, 2, 2, '#3c4135');
    rect(c, 6, 17, 3, 9, outfit);
    rect(c, 16, 17, 3, 9, outfit);
    rect(c, 10, 14, 5, 1, '#bd8664');
  }
  return canvas;
}

export function drawDog(): HTMLCanvasElement {
  const [canvas, c] = makeCanvas(26, 22);
  rect(c, 4, 19, 20, 3, '#65715d44');
  rect(c, 4, 9, 17, 9, '#e3cda4');
  rect(c, 7, 16, 3, 6, '#b79267');
  rect(c, 19, 16, 3, 6, '#b79267');
  rect(c, 16, 3, 9, 11, '#e9d8b5');
  rect(c, 15, 1, 3, 7, '#a77c54');
  rect(c, 22, 1, 3, 7, '#a77c54');
  rect(c, 21, 8, 2, 2, '#3e4d40');
  rect(c, 24, 11, 2, 3, '#3e4d40');
  rect(c, 1, 4, 4, 9, '#e3cda4');
  rect(c, 15, 12, 10, 2, '#b85e48');
  return canvas;
}

export function drawScooter(): HTMLCanvasElement {
  const [canvas, c] = makeCanvas(44, 38);
  rect(c, 2, 34, 40, 3, '#66715d44');
  rect(c, 6, 29, 9, 8, '#46544b');
  rect(c, 31, 29, 9, 8, '#46544b');
  rect(c, 9, 31, 3, 4, '#a0aa94');
  rect(c, 34, 31, 3, 4, '#a0aa94');
  rect(c, 8, 24, 29, 7, '#7a9f9a');
  rect(c, 31, 18, 5, 14, '#8cb0a4');
  rect(c, 28, 16, 10, 3, '#43594e');
  rect(c, 3, 17, 16, 11, '#bd7750');
  rect(c, 3, 16, 16, 3, '#ddac77');
  rect(c, 20, 15, 8, 11, '#e8dfbd');
  rect(c, 20, 7, 10, 9, '#d9b894');
  rect(c, 18, 3, 13, 8, '#5e726b');
  rect(c, 20, 2, 9, 4, '#839991');
  rect(c, 23, 18, 10, 3, '#d9b894');
  rect(c, 18, 25, 8, 5, '#536857');
  return canvas;
}

const previews = new Map<string, string>();
export function placePreview(place: Place): string {
  const cached = previews.get(place.id);
  if (cached) return cached;
  const [canvas, c] = makeCanvas(256, 192);
  rect(c, 0, 0, 256, 192, place.tint);
  drawLandmark(c, place);
  const data = canvas.toDataURL('image/png');
  previews.set(place.id, data);
  return data;
}

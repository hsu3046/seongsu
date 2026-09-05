import { places, WORLD } from '../data/places.ts';
import type { Place, PlaceKind } from '../data/places.ts';
import { buildings } from './navigation.ts';

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

function drawBuilding(c: Context, x: number, y: number, w: number, h: number, kind: PlaceKind | 'plain', name: string) {
  const bakery = kind === 'bakery';
  const objects = kind === 'objects';
  const color = bakery ? '#d0b283' : objects ? '#b4b09a' : '#ba7a5c';
  const light = bakery ? '#dbc197' : objects ? '#c7c2a9' : '#cf9270';
  const mortar = bakery ? '#bea477' : objects ? '#a5a590' : '#a86953';
  const roofY = y + 8;
  const roofH = Math.round(h * .47);
  rect(c, x + 12, y + 15, w, h + 2, '#b5b99e');
  rect(c, x, y + 14, w, h - 14, color);
  for (let by = y + 20, row = 0; by < y + h; by += 9, row++) {
    rect(c, x, by, w, 1, mortar);
    for (let bx = x + (row % 2 ? 0 : 12); bx < x + w; bx += 24) {
      rect(c, bx, by - 8, 1, 8, mortar);
      if (noise(bx, by) > .65) rect(c, bx + 3, by - 6, 17, 4, light);
    }
  }
  rect(c, x, y + h - 6, w, 6, '#827c65');
  // Parapets, individual roof seams, and equipment give each roof a readable silhouette.
  const roof = bakery ? '#70857a' : objects ? '#929587' : '#8d8b76';
  rect(c, x - 5, roofY, w + 10, roofH, '#e0c4a3');
  rect(c, x + 5, roofY + 7, w - 10, roofH - 12, roof);
  for (let ry = roofY + 15; ry < roofY + roofH - 6; ry += 10) {
    rect(c, x + 7, ry, w - 14, 2, bakery ? '#61786f' : '#7f816e');
    for (let rx = x + 10; rx < x + w - 12; rx += 23) {
      rect(c, rx, ry - 7, 1, 7, '#a7a593');
    }
  }
  rect(c, x - 6, roofY + roofH, w + 12, 8, '#775e4d');
  rect(c, x - 7, roofY + roofH, w + 14, 3, '#e5cba8');
  rect(c, x + w - 44, roofY + 18, 26, 24, '#646c61');
  rect(c, x + w - 48, roofY + 14, 26, 24, '#c4c4ae');
  rect(c, x + w - 43, roofY + 20, 16, 12, '#939e8e');
  for (let dx = 0; dx < 4; dx++) rect(c, x + w - 42 + dx * 4, roofY + 21, 1, 10, '#737e71');
  rect(c, x + 23, roofY - 15, 20, 37, mortar);
  rect(c, x + 19, roofY - 17, 28, 7, '#e2c8a7');
  rect(c, x + 25, roofY - 16, 16, 4, '#6b5d50');
  if (kind === 'objects') {
    for (let sx = x + 50; sx < x + 150; sx += 36) {
      rect(c, sx, roofY + 23, 28, 30, '#c3d0bc');
      rect(c, sx + 3, roofY + 26, 22, 24, '#728e86');
      rect(c, sx + 4, roofY + 26, 5, 24, '#99b3a0');
    }
  }
  const signY = y + h - 83;
  const signColor = objects ? '#516c60' : bakery ? '#e9d9ae' : '#f0e3c6';
  rect(c, x + 21, signY, w - 42, 22, '#8d7457');
  rect(c, x + 18, signY - 2, w - 36, 21, signColor);
  c.fillStyle = objects ? '#eee4c9' : '#615b43';
  c.font = 'bold 11px monospace'; c.textAlign = 'center';
  c.fillText(name.toUpperCase(), x + w / 2, signY + 12);
  const facadeY = y + h - 54;
  windowPane(c, x + 22, facadeY + 4, 44, 34, kind === 'coffee');
  windowPane(c, x + w - 66, facadeY + 4, 44, 34, kind === 'coffee');
  rect(c, x + w / 2 - 21, facadeY - 3, 42, 57, '#735b43');
  rect(c, x + w / 2 - 17, facadeY + 1, 34, 52, objects ? '#4e6659' : '#6d785d');
  rect(c, x + w / 2 - 12, facadeY + 6, 24, 26, '#afc0a0');
  rect(c, x + w / 2 + 9, facadeY + 35, 3, 3, '#efd295');
  rect(c, x + w / 2 - 25, y + h, 50, 5, '#e7d7b6');
  rect(c, x + w / 2 - 29, y + h + 5, 58, 5, '#cec6a7');
  if (bakery) {
    for (let ax = x + 9; ax < x + w - 9; ax += 16) {
      rect(c, ax, facadeY - 7, 16, 12, (ax - x - 9) % 32 === 0 ? '#d7ae5e' : '#f4e7bd');
      rect(c, ax, facadeY + 5, 16, 4, (ax - x - 9) % 32 === 0 ? '#bd954b' : '#e0d4ae');
    }
  }
  planter(c, x + 9, y + h);
  planter(c, x + w - 8, y + h);
  if (kind === 'courtyard') {
    for (let vy = y + 28; vy < y + h - 30; vy += 15) shrub(c, x + w - 20, vy, 26);
  }
  rect(c, x + w + 7, y + h - 24, 19, 29, '#8b7854');
  rect(c, x + w + 9, y + h - 21, 15, 20, '#3d5e51');
  rect(c, x + w + 11, y + h - 15, 11, 2, '#e0dfbc');
  rect(c, x + w + 12, y + h - 10, 9, 2, '#e0dfbc');
}

export function drawWorld(): HTMLCanvasElement {
  const [canvas, c] = makeCanvas(WORLD.width, WORLD.height);
  rect(c, 0, 0, WORLD.width, WORLD.height, '#cbd8b7');
  for (let y = 0; y < WORLD.height; y += 9) {
    for (let x = 0; x < WORLD.width; x += 11) {
      const n = noise(x, y);
      if (n > .7) rect(c, x, y, 3, 2, n > .91 ? '#b8cba1' : '#c1d0ab');
      if (n < .018) {
        rect(c, x, y - 2, 2, 4, '#94aa7a');
        rect(c, x + 3, y - 1, 2, 3, '#94aa7a');
      }
    }
  }
  const road = (x: number, y: number, w: number, h: number) => {
    rect(c, x - 16, y - 16, w + 32, h + 32, '#b5bea4');
    rect(c, x - 14, y - 14, w + 28, h + 28, '#ebe8d4');
    rect(c, x, y, w, h, '#d4d8c7');
    for (let py = y - 12; py < y + h + 12; py += 16) {
      for (let px = x - 12; px < x + w + 12; px += 24) {
        if (px < x || px > x + w - 4 || py < y || py > y + h - 4) rect(c, px, py, 1, 10, '#d6d5bf');
      }
    }
  };
  road(32, 424, 1216, 80);
  road(32, 776, 1216, 80);
  road(600, 32, 80, 960);
  road(208, 160, 32, 736);
  road(1064, 160, 32, 616);
  for (let x = 56; x < 1220; x += 48) {
    if (x < 585 || x > 688) {
      rect(c, x, 462, 20, 2, '#ebe9d1');
      rect(c, x, 814, 20, 2, '#ebe9d1');
    }
  }
  for (let y = 64; y < 990; y += 48) {
    if ((y < 412 || y > 512) && (y < 764 || y > 864)) rect(c, 639, y, 2, 20, '#edead3');
  }
  for (const y of [407, 512, 759, 864]) {
    for (let x = 603; x < 681; x += 13) rect(c, x, y, 8, 12, '#f7f4de');
  }
  // Smaller lanes and pocket plazas make the compressed town feel lived in.
  rect(c, 264, 168, 248, 40, '#dce0c6');
  rect(c, 792, 168, 264, 56, '#dce0c6');
  rect(c, 248, 528, 296, 40, '#dce0c6');
  rect(c, 776, 528, 272, 40, '#dce0c6');
  for (const b of buildings.slice(4)) drawBuilding(c, b.x, b.y, b.w, b.h, 'plain', b.x < 200 ? 'LOCAL STUDIO' : 'SEONGSU');
  for (const p of places.filter((place) => place.kind !== 'garden')) {
    drawBuilding(c, p.building.x, p.building.y, p.building.w, p.building.h, p.kind, p.name);
  }
  // Public square, little garden, flowers, and a low picket fence.
  rect(c, 1112, 560, 132, 200, '#bdce9e');
  rect(c, 1144, 610, 22, 166, '#e7dcc0');
  rect(c, 1114, 664, 121, 18, '#e7dcc0');
  for (let fy = 564; fy < 758; fy += 20) {
    rect(c, 1110, fy, 4, 16, '#f0e6c8');
    rect(c, 1240, fy, 4, 16, '#f0e6c8');
  }
  rect(c, 1110, 570, 4, 180, '#e6dabb');
  rect(c, 1240, 570, 4, 180, '#e6dabb');
  bench(c, 1175, 710);
  bench(c, 1120, 625);
  for (let i = 0; i < 22; i++) {
    const x = 1119 + Math.round(noise(i, 1) * 112);
    const y = 684 + Math.round(noise(i, 7) * 22);
    rect(c, x, y, 2, 6, '#789660');
    rect(c, x - 1, y - 2, 4, 3, i % 2 ? '#e5c883' : '#dca88a');
  }
  const trees: [number, number, number][] = [
    [41, 72, 1.3], [103, 80, 1.5], [158, 68, 1.15], [315, 85, 1.4], [373, 128, 1.6],
    [451, 63, 1.4], [528, 172, 1], [760, 224, 1.4], [1008, 195, 1.1],
    [1157, 116, 1.7], [1220, 87, 1.5], [1264, 160, 1.3],
    [30, 559, 1.1], [104, 541, 1.3], [179, 568, 1],
    [527, 641, 1.25], [535, 717, 1], [750, 585, 1.35],
    [1146, 603, 1.15], [1213, 618, 1.5], [1226, 748, 1],
    [45, 940, 1.6], [119, 978, 1.4], [181, 928, 1.3],
    [522, 981, 1.2], [731, 982, 1.4], [1067, 990, 1.5], [1133, 924, 1.15], [1213, 978, 1.55],
  ];
  for (const [x, y, size] of trees) tree(c, x, y, size);
  for (const [x, y, w] of [[280, 154, 170], [802, 197, 130], [300, 557, 165], [825, 555, 150], [300, 886, 110]]) shrub(c, x!, y!, w);
  table(c, 535, 377, true);
  table(c, 768, 357, true);
  table(c, 531, 791, true);
  bench(c, 723, 699);
  bench(c, 76, 399);
  bike(c, 256, 412);
  bike(c, 1006, 765);
  bike(c, 770, 412);
  for (const [x, y] of [[570, 413], [708, 415], [570, 769], [708, 771], [1153, 529], [120, 879]]) lamp(c, x!, y!);
  for (const [x, y] of [[560, 233], [755, 539], [557, 849]]) {
    rect(c, x!, y!, 18, 27, '#76886e');
    rect(c, x! - 2, y! - 3, 22, 5, '#536d56');
    rect(c, x! + 4, y! + 4, 3, 17, '#98a480');
  }
  // Utility poles and stepped overhead wires, drawn on the same pixel grid.
  for (const x of [199, 704, 1109]) {
    rect(c, x, 384, 5, 40, '#8b805f');
    rect(c, x - 10, 380, 25, 4, '#6c6e58');
  }
  for (let x = 204; x < 1110; x += 3) {
    const local = (x - 204) % 500;
    const y = 381 + Math.round(Math.sin(local / 500 * Math.PI) * 21);
    rect(c, x, y, 3, 1, '#8a917b');
  }
  c.save(); c.fillStyle = '#9da990'; c.font = 'bold 10px monospace'; c.textAlign = 'center';
  c.fillText('BRICK LANE', 402, 485); c.fillText('SLOW STREET', 866, 838);
  c.translate(624, 653); c.rotate(-Math.PI / 2); c.fillText('SEONGSU WALK', 0, 0); c.restore();
  return canvas;
}

export function drawWalker(direction: number, frame: number, outfit = '#e38154'): HTMLCanvasElement {
  const [canvas, c] = makeCanvas(24, 34);
  const step = frame === 0 ? 0 : frame === 1 ? -2 : 2;
  rect(c, 4, 30, 17, 3, '#737c6255');
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
  } else if (direction === 1 || direction === 3) {
    const left = direction === 3;
    rect(c, left ? 6 : 17, 10, 2, 2, '#3c4135');
    rect(c, left ? 16 : 5, 17, 5, 11, outfit);
    rect(c, left ? 5 : 19, 12, 3, 3, '#e6bc94');
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
  if (place.kind === 'garden') {
    rect(c, 0, 138, 256, 54, '#bdce9e');
    rect(c, 110, 80, 24, 112, '#e7dcc0');
    tree(c, 73, 137, 1.8);
    tree(c, 197, 119, 1.6);
    bench(c, 155, 159);
    shrub(c, 23, 171, 56);
  } else {
    drawBuilding(c, 35, 32, 180, 144, place.kind, place.name);
    tree(c, 17, 134, .9);
  }
  const data = canvas.toDataURL('image/png');
  previews.set(place.id, data);
  return data;
}

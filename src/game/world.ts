import Phaser from 'phaser';
import { drawDog, drawScooter, drawWalker, drawWorld } from './art';
import { buildings, canWalk, findPath } from './navigation';
import { places, SPAWN, WORLD } from '../data/places';
import type { PlaceId, Point, TimeOfDay } from '../data/places';

export type Direction = 'up' | 'right' | 'down' | 'left';
export interface WorldOptions {
  position: Point;
  time: TimeOfDay;
  visited: readonly PlaceId[];
  enabled: boolean;
  onReady: () => void;
  onNear: (id: PlaceId | null) => void;
  onPosition: (position: Point) => void;
  onVisit: (id: PlaceId) => void;
  onNavigating: (moving: boolean) => void;
  onBlocked: () => void;
  onError: () => void;
}
export interface WorldController {
  destroy: () => void;
  resize: (width: number, height: number) => void;
  pause: (paused: boolean) => void;
  enable: (enabled: boolean) => void;
  setTime: (time: TimeOfDay) => void;
  setVisited: (visited: readonly PlaceId[]) => void;
  move: (direction: Direction | null) => void;
  navigate: (point: Point) => void;
  stop: () => void;
  zoom: (delta: number) => void;
  recenter: () => void;
  reset: () => void;
}

class Neighborhood extends Phaser.Scene {
  private avatar!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private controls!: Record<string, Phaser.Input.Keyboard.Key>;
  private markers = new Map<PlaceId, Phaser.GameObjects.Container>();
  private routeInk!: Phaser.GameObjects.Graphics;
  private playerArrow!: Phaser.GameObjects.Graphics;
  private nighttime!: Phaser.GameObjects.Rectangle;
  private lamps!: Phaser.GameObjects.Graphics;
  private npcs: Phaser.GameObjects.Sprite[] = [];
  private nearby: PlaceId | null = null;
  private path: Point[] = [];
  private manual: Direction | null = null;
  private direction = 2;
  private lastSave = 0;
  private simulationPaused = false;
  private inputAllowed: boolean;
  private ready = false;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private options: WorldOptions;

  constructor(options: WorldOptions) {
    super('neighborhood');
    this.options = options;
    this.inputAllowed = options.enabled;
  }

  create() {
    try {
      this.buildNeighborhood();
    } catch {
      this.options.onError();
      this.game.loop.sleep();
    }
  }

  private buildNeighborhood() {
    this.textures.addCanvas('neighborhood-art', drawWorld());
    this.add.image(0, 0, 'neighborhood-art').setOrigin(0);
    for (const outfit of ['visitor', 'neighbor', 'friend']) {
      for (let direction = 0; direction < 4; direction++) {
        for (let frame = 0; frame < 3; frame++) {
          this.textures.addCanvas(outfit + '-' + direction + '-' + frame,
            drawWalker(direction, frame, outfit === 'visitor' ? '#db7750' : outfit === 'friend' ? '#89996c' : '#778f9a'));
        }
      }
    }
    this.textures.addCanvas('dog', drawDog());
    this.textures.addCanvas('scooter', drawScooter());
    this.physics.world.setBounds(24, 24, WORLD.width - 48, WORLD.height - 48);
    const obstacles = this.physics.add.staticGroup();
    for (const b of buildings) {
      const obstacle = this.add.rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, 0, 0);
      obstacles.add(obstacle);
    }
    const initial = canWalk(this.options.position) ? this.options.position : SPAWN;
    this.avatar = this.physics.add.sprite(initial.x, initial.y, 'visitor-2-0').setOrigin(.5, 1).setDepth(20);
    this.avatar.body.setSize(10, 8);
    this.avatar.body.setOffset(7, 26);
    this.avatar.setCollideWorldBounds(true);
    this.physics.add.collider(this.avatar, obstacles);
    this.playerArrow = this.add.graphics().setDepth(21);
    this.playerArrow.fillStyle(0xfff6d8).fillRect(-6, -1, 12, 5).fillRect(-4, 4, 8, 2).fillRect(-2, 6, 4, 2);
    this.playerArrow.fillStyle(0xd17b4a).fillRect(-4, 0, 8, 2).fillRect(-2, 2, 4, 2);
    this.routeInk = this.add.graphics().setDepth(2);
    this.createMarkers();
    this.createNeighbors();
    this.nighttime = this.add.rectangle(0, 0, WORLD.width, WORLD.height, 0x243657, 0).setOrigin(0).setDepth(50);
    this.lamps = this.add.graphics().setDepth(51);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setZoom(this.scale.width < 600 ? 1.1 : 1);
    this.cameras.main.startFollow(this.avatar, true, .08, .08);
    this.cameras.main.centerOn(initial.x, initial.y);
    this.cameras.main.setRoundPixels(true);
    if (this.input.keyboard) {
      this.controls = this.input.keyboard.addKeys('W,A,S,D,UP,RIGHT,DOWN,LEFT,ENTER', false) as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard.on('keydown-ENTER', () => {
        if (!this.simulationPaused && this.inputAllowed && this.nearby) this.options.onVisit(this.nearby);
      });
    }
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.simulationPaused || !this.inputAllowed) return;
      const point = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.navigate(point);
    });
    this.ready = true;
    this.synchronizeKeyboard();
    this.setTime(this.options.time);
    this.setVisited(this.options.visited);
    this.detectNearby();
    this.events.once('postupdate', () => this.options.onReady());
    this.events.once('shutdown', () => this.options.onPosition({ x: this.avatar.x, y: this.avatar.y }));
  }

  private createMarkers() {
    for (const place of places) {
      const graphic = this.add.graphics();
      graphic.fillStyle(0x6a614a, .12).fillRect(-16, 5, 36, 29);
      graphic.fillStyle(0xfffae9).fillRect(-16, -2, 32, 28).fillRect(-12, -6, 24, 36).fillRect(-4, 28, 8, 5);
      const label = this.add.text(0, 12, place.number, {
        fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold', color: place.color,
      }).setOrigin(.5);
      const container = this.add.container(place.entrance.x, place.entrance.y - 56, [graphic, label]).setDepth(12);
      this.markers.set(place.id, container);
    }
  }

  private createNeighbors() {
    const positions = [
      [180, 483], [720, 480], [1050, 482], [594, 640], [990, 837],
      [420, 838], [718, 348], [690, 922], [345, 441],
    ];
    positions.forEach(([x, y], index) => {
      const npc = this.add.sprite(x!, y!, (index % 2 ? 'friend' : 'neighbor') + '-2-0').setOrigin(.5, 1).setDepth(19);
      this.npcs.push(npc);
    });
    const dog = this.add.sprite(760, 480, 'dog').setOrigin(.5, 1).setDepth(19);
    this.npcs.push(dog);
    this.npcs.push(this.add.sprite(190, 500, 'scooter').setOrigin(.5, 1).setDepth(19));
  }

  private detectNearby() {
    const place = places.find((p) => Phaser.Math.Distance.Between(this.avatar.x, this.avatar.y, p.entrance.x, p.entrance.y) < 49);
    const id = place?.id ?? null;
    if (id !== this.nearby) {
      this.nearby = id;
      this.options.onNear(id);
    }
  }

  setTime(period: TimeOfDay) {
    this.options.time = period;
    if (!this.ready) return;
    this.nighttime.setFillStyle(period === 'morning' ? 0xf3e8b2 : 0x20365a, period === 'night' ? .48 : period === 'morning' ? .1 : 0);
    this.lamps.clear();
    if (period === 'night') {
      this.lamps.fillStyle(0xffda83, .8);
      for (const p of places.filter((item) => item.kind !== 'garden')) {
        const b = p.building;
        this.lamps.fillRect(b.x + 26, b.y + b.h - 46, 16, 11);
        this.lamps.fillRect(b.x + b.w - 62, b.y + b.h - 46, 16, 11);
      }
      for (const [x, y] of [[570, 413], [708, 415], [570, 769], [708, 771], [1153, 529], [120, 879]]) {
        this.lamps.fillStyle(0xffe29e, .9).fillRect(x! - 5, y! - 62, 11, 10);
        this.lamps.fillStyle(0xffda83, .08).fillRect(x! - 19, y! - 75, 38, 37);
      }
    }
    const count = period === 'morning' ? 4 : period === 'night' ? 6 : 11;
    this.npcs.forEach((npc, index) => npc.setVisible(index < count));
  }

  setVisited(visited: readonly PlaceId[]) {
    this.options.visited = visited;
    if (!this.ready) return;
    for (const [id, container] of this.markers) {
      const label = container.getAt(1) as Phaser.GameObjects.Text;
      label.setText(visited.includes(id) ? '✓' : places.find((p) => p.id === id)!.number);
      label.setColor(visited.includes(id) ? '#57754b' : places.find((p) => p.id === id)!.color);
    }
  }

  enable(enabled: boolean) {
    this.inputAllowed = enabled;
    if (!enabled) this.stop();
    if (this.ready) this.synchronizeKeyboard();
  }

  private synchronizeKeyboard() {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    keyboard.enabled = this.inputAllowed && !this.simulationPaused;
    keyboard.clearCaptures();
    // Phaser must receive keys before it cancels browser scrolling; an earlier DOM
    // preventDefault makes KeyboardManager discard the event entirely.
    if (keyboard.enabled) keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.DOWN, Phaser.Input.Keyboard.KeyCodes.LEFT,
    ]);
  }

  pause(paused: boolean) {
    this.simulationPaused = paused;
    if (!this.ready) return;
    this.manual = null;
    this.controls && Object.values(this.controls).forEach((key) => key.reset());
    this.synchronizeKeyboard();
    this.avatar.setVelocity(0);
    if (paused) {
      this.options.onPosition({ x: this.avatar.x, y: this.avatar.y });
      this.physics.pause();
      this.game.loop.sleep();
    } else {
      this.physics.resume();
      this.game.loop.wake();
    }
  }

  move(direction: Direction | null) {
    if (direction) this.stop();
    this.manual = direction;
  }

  stop() {
    this.path = [];
    this.manual = null;
    this.controls && Object.values(this.controls).forEach((key) => key.reset());
    if (this.ready) {
      this.avatar.setVelocity(0);
      this.routeInk.clear();
    }
    this.options.onNavigating(false);
  }

  navigate(point: Point) {
    if (!this.ready || !this.inputAllowed || this.simulationPaused) return;
    const path = findPath(this.avatar, point);
    if (path.length === 0) { this.options.onBlocked(); return; }
    this.path = path;
    this.manual = null;
    this.routeInk.clear().lineStyle(2, 0xb97d54, .7);
    this.routeInk.beginPath().moveTo(this.avatar.x, this.avatar.y);
    path.forEach((p) => this.routeInk.lineTo(p.x, p.y));
    this.routeInk.strokePath();
    this.routeInk.fillStyle(0xe7a272, .65).fillRect(point.x - 5, point.y - 5, 10, 10);
    this.options.onNavigating(true);
  }

  reset() {
    if (!this.ready) return;
    this.stop();
    this.avatar.setPosition(SPAWN.x, SPAWN.y);
    this.avatar.body.reset(SPAWN.x, SPAWN.y);
    this.cameras.main.centerOn(SPAWN.x, SPAWN.y);
    this.detectNearby();
    this.options.onPosition({ ...SPAWN });
  }

  zoom(delta: number) {
    if (!this.ready) return;
    this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom + delta, .7, 1.6));
  }

  recenter() {
    if (this.ready) this.cameras.main.centerOn(this.avatar.x, this.avatar.y);
  }

  update(time: number) {
    if (!this.ready || this.simulationPaused) return;
    this.playerArrow.setPosition(this.avatar.x, this.avatar.y - 45);
    const frame = Math.floor(time / 160) % 3;
    if (!this.reducedMotion) {
      this.npcs.forEach((npc, index) => {
        if (!npc.visible) return;
        if (index < 3) {
          const origin = [180, 720, 1050][index]!;
          npc.x = origin + Math.sin(time / 4200 + index) * 75;
          npc.setTexture((index % 2 ? 'friend' : 'neighbor') + '-' + (Math.cos(time / 4200 + index) > 0 ? 1 : 3) + '-' + frame);
        } else if (index === 9) {
          npc.x = 755 + Math.sin(time / 4200 + 1) * 75;
          npc.setFlipX(Math.cos(time / 4200 + 1) < 0);
        } else if (index === 10) {
          npc.x = 660 + Math.sin(time / 8200) * 475;
          npc.setFlipX(Math.cos(time / 8200) < 0);
        } else if (index === 4 || index === 5) {
          npc.x = (index === 4 ? 990 : 420) + Math.sin(time / 5700 + index) * 40;
          npc.setTexture((index % 2 ? 'friend' : 'neighbor') + '-' + (Math.cos(time / 5700 + index) > 0 ? 1 : 3) + '-' + frame);
        }
      });
    }
    if (!this.inputAllowed) { this.avatar.setVelocity(0); return; }
    let direction = this.manual;
    if (this.controls) {
      if (this.controls.W?.isDown || this.controls.UP?.isDown) direction = 'up';
      else if (this.controls.D?.isDown || this.controls.RIGHT?.isDown) direction = 'right';
      else if (this.controls.S?.isDown || this.controls.DOWN?.isDown) direction = 'down';
      else if (this.controls.A?.isDown || this.controls.LEFT?.isDown) direction = 'left';
    }
    if (direction && this.path.length) {
      this.path = []; this.routeInk.clear(); this.options.onNavigating(false);
    }
    let vx = 0;
    let vy = 0;
    const speed = 140;
    if (direction) {
      vx = direction === 'left' ? -speed : direction === 'right' ? speed : 0;
      vy = direction === 'up' ? -speed : direction === 'down' ? speed : 0;
    } else if (this.path.length) {
      const target = this.path[0]!;
      const dx = target.x - this.avatar.x;
      const dy = target.y - this.avatar.y;
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        this.path.shift();
        if (!this.path.length) { this.routeInk.clear(); this.options.onNavigating(false); }
      } else if (Math.abs(dx) >= 3) vx = Math.sign(dx) * Math.min(speed, Math.abs(dx) * 24);
      else vy = Math.sign(dy) * Math.min(speed, Math.abs(dy) * 24);
    }
    this.avatar.setVelocity(vx, vy);
    if (vx || vy) this.direction = vx > 0 ? 1 : vx < 0 ? 3 : vy > 0 ? 2 : 0;
    this.avatar.setTexture('visitor-' + this.direction + '-' + (vx || vy ? frame : 0));
    this.detectNearby();
    if (time - this.lastSave > 1000) {
      this.lastSave = time;
      this.options.onPosition({ x: this.avatar.x, y: this.avatar.y });
    }
  }
}

export function createWorld(parent: HTMLElement, options: WorldOptions): WorldController {
  const scene = new Neighborhood(options);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth,
    height: parent.clientHeight,
    backgroundColor: '#cbd8b7',
    pixelArt: true, roundPixels: true,
    render: { antialias: false, transparent: false },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    fps: { target: 60, forceSetTimeOut: false },
    scene: [scene],
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.NONE },
  });
  return {
    destroy: () => {
      // Phaser destruction is deferred to a game step, including when the loop is asleep.
      game.destroy(true);
      if (game.loop.started && !game.loop.running) game.loop.wake();
    },
    resize: (w, h) => {
      if (w > 0 && h > 0 && (game.scale.width !== w || game.scale.height !== h)) {
        game.scale.resize(w, h);
        // Fullscreen and rotation should not wait for the follow camera to catch up.
        scene.recenter();
      }
    },
    pause: (paused) => scene.pause(paused),
    enable: (enabled) => scene.enable(enabled),
    setTime: (period) => scene.setTime(period),
    setVisited: (visited) => scene.setVisited(visited),
    move: (direction) => scene.move(direction),
    navigate: (point) => scene.navigate(point),
    stop: () => scene.stop(),
    zoom: (delta) => scene.zoom(delta),
    recenter: () => scene.recenter(),
    reset: () => scene.reset(),
  };
}

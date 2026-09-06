import Phaser from 'phaser';
import { streets } from '../data/geography';
import { drawDog, drawScooter, drawWalker, drawWorld } from './art';
import { canWalk, findPath } from './navigation';
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
  private npcRoutes: { from: Point; to: Point }[] = [];
  private nearby: PlaceId | null = null;
  private path: Point[] = [];
  private manual: Direction | null = null;
  private direction = 2;
  private walkTime = 0;
  private lastSave = 0;
  private simulationPaused = false;
  private inputAllowed: boolean;
  private ready = false;
  private lastWalkable: Point = { ...SPAWN };
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
        for (let frame = 0; frame < 5; frame++) {
          this.textures.addCanvas(outfit + '-' + direction + '-' + frame,
            drawWalker(direction, frame, outfit === 'visitor' ? '#db7750' : outfit === 'friend' ? '#89996c' : '#778f9a'));
        }
      }
    }
    this.textures.addCanvas('dog', drawDog());
    this.textures.addCanvas('scooter', drawScooter());
    this.physics.world.setBounds(24, 24, WORLD.width - 48, WORLD.height - 48);
    const initial = canWalk(this.options.position) ? this.options.position : SPAWN;
    this.lastWalkable = { x: initial.x, y: initial.y };
    this.avatar = this.physics.add.sprite(initial.x, initial.y, 'visitor-2-0').setOrigin(.5, 1).setDepth(20);
    this.avatar.body.setSize(10, 8);
    this.avatar.body.setOffset(7, 26);
    this.avatar.setCollideWorldBounds(true);

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
      this.controls = this.input.keyboard.addKeys('W,A,S,D,UP,RIGHT,DOWN,LEFT,E,ENTER', false) as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard.on('keydown-E', this.enterNearby, this);
      this.input.keyboard.on('keydown-ENTER', this.enterNearby, this);
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
      const container = this.add.container(place.entrance.x, place.entrance.y - 56, [graphic, label]).setDepth(12).setScale(this.scale.width < 600 ? .72 : .9);
      this.markers.set(place.id, container);
    }
  }

  private createNeighbors() {
    const candidates = streets.flatMap((street) => street.points.slice(1).map((end, index) => {
      const start = street.points[index]!;
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      const span = Math.min(60, length / 3);
      return { from: { x: middle.x - (end.x - start.x) / length * span, y: middle.y - (end.y - start.y) / length * span },
        to: { x: middle.x + (end.x - start.x) / length * span, y: middle.y + (end.y - start.y) / length * span }, length };
    })).filter((route) => route.length > 160 && canWalk(route.from) && canWalk(route.to));
    this.npcRoutes = candidates.slice(0, 8);
    this.npcRoutes.forEach((route, index) => {
      const texture = index === 6 ? 'dog' : index === 7 ? 'scooter' : (index % 2 ? 'friend' : 'neighbor') + '-2-0';
      this.npcs.push(this.add.sprite(route.from.x, route.from.y, texture).setOrigin(.5, 1).setDepth(19));
    });
  }

  private detectNearby() {
    const place = places.find((p) => Phaser.Math.Distance.Between(this.avatar.x, this.avatar.y, p.entrance.x, p.entrance.y) < 49);
    const id = place?.id ?? null;
    if (id !== this.nearby) {
      this.nearby = id;
      this.options.onNear(id);
    }
  }

  private enterNearby(event: KeyboardEvent) {
    if (this.simulationPaused || !this.inputAllowed || !this.nearby
      || event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (target instanceof HTMLElement) {
      if (target.isContentEditable || target.closest('input, textarea, select, [role="textbox"]')) return;
      // Tab navigation keeps native Enter activation. E remains the RPG action key.
      if (event.key === 'Enter' && target.closest('button, a, [role="button"]')
        && target.closest('[data-keyboard-navigation="true"]')) return;
    }
    // Cancel only a valid interaction, so a previously clicked UI button cannot
    // also activate on Enter. Movement scrolling still belongs to Phaser capture.
    event.preventDefault();
    this.options.onVisit(this.nearby);
  }

  setTime(period: TimeOfDay) {
    this.options.time = period;
    if (!this.ready) return;
    this.nighttime.setFillStyle(period === 'morning' ? 0xf3e8b2 : 0x20365a, period === 'night' ? .48 : period === 'morning' ? .1 : 0);
    this.lamps.clear();
    if (period === 'night') {
      this.lamps.fillStyle(0xffda83, .8);
      for (const p of places) {
        const b = p.building;
        this.lamps.fillRect(b.x + 8, b.y + b.h - 14, 12, 7);
        this.lamps.fillRect(b.x + b.w - 20, b.y + b.h - 14, 12, 7);
      }
      for (const [x, y] of [[465, 264], [935, 796], [1370, 965]]) {
        this.lamps.fillStyle(0xffe29e, .9).fillRect(x! - 5, y! - 62, 11, 10);
        this.lamps.fillStyle(0xffda83, .08).fillRect(x! - 19, y! - 75, 38, 37);
      }
    }
    const count = period === 'morning' ? 3 : period === 'night' ? 4 : 8;
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
    this.lastWalkable = { ...SPAWN };
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

  update(time: number, delta: number) {
    if (!this.ready || this.simulationPaused) return;
    // Arcade can integrate a fixed physics step before Scene.update. Validate the
    // actual result too, so a frame-time change cannot carry feet through a wall.
    if (!canWalk(this.avatar)) this.avatar.body.reset(this.lastWalkable.x, this.lastWalkable.y);
    else this.lastWalkable = { x: this.avatar.x, y: this.avatar.y };
    this.playerArrow.setPosition(this.avatar.x, this.avatar.y - 45);
    const frame = 1 + Math.floor(time / 120) % 4;
    if (!this.reducedMotion) {
      this.npcs.forEach((npc, index) => {
        if (!npc.visible) return;
        const route = this.npcRoutes[index]!;
        const fraction = (Math.sin(time / 5200 + index) + 1) / 2;
        const point = { x: route.from.x + (route.to.x - route.from.x) * fraction,
          y: route.from.y + (route.to.y - route.from.y) * fraction };
        if (canWalk(point)) npc.setPosition(point.x, point.y);
        if (index < 6) npc.setTexture((index % 2 ? 'friend' : 'neighbor') + '-' + (Math.cos(time / 5200 + index) > 0 ? 1 : 3) + '-' + frame);
        else npc.setFlipX(Math.cos(time / 5200 + index) < 0);
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
      while (this.path.length && Math.hypot(this.path[0]!.x - this.avatar.x, this.path[0]!.y - this.avatar.y) < 3) this.path.shift();
      const target = this.path[0];
      if (!target) { this.routeInk.clear(); this.options.onNavigating(false); }
      else {
        const dx = target.x - this.avatar.x, dy = target.y - this.avatar.y;
        const distance = Math.hypot(dx, dy);
        const velocity = Math.min(speed, distance / (Math.max(1, delta) / 1000));
        vx = dx / distance * velocity; vy = dy / distance * velocity;
      }
    }
    // Polygon buildings and the street envelope are shared with route finding.
    // Predict the physics step so held keys cannot cross façades or private blocks.
    const dt = Math.min(50, delta) / 1000;
    if ((vx || vy) && !canWalk({ x: this.avatar.x + vx * dt, y: this.avatar.y + vy * dt })) {
      vx = 0; vy = 0;
      if (this.path.length) { this.stop(); this.options.onBlocked(); }
    }
    this.avatar.setVelocity(vx, vy);
    if (vx || vy) {
      this.direction = vx > 0 ? 1 : vx < 0 ? 3 : vy > 0 ? 2 : 0;
      this.walkTime += Math.min(50, delta) * Math.hypot(vx, vy) / speed;
    } else this.walkTime = 0;
    // Idle is separate from the four-step gait; slow path segments slow the stride.
    const walkFrame = vx || vy ? 1 + Math.floor(this.walkTime / 120) % 4 : 0;
    this.avatar.setTexture('visitor-' + this.direction + '-' + walkFrame);
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

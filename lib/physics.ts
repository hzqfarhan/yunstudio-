// Verlet physics for the pass on its lanyard. Two straps hang from the neck and meet at a metal clip;
// the card is a rigid body made of six particles (4 corners, the punched slot and one point just off
// the card's plane), held together by fixed-length links. Units are metres and seconds.

export const CARD_W = 0.095; // 9.5 cm
export const CARD_H = 0.14; // 14 cm
export const CARD_T = 0.0012; // PVC thickness
export const SLOT_Y = CARD_H / 2 - 0.012; // punched slot, 1.2 cm from the top
export const SEG = 12; // segments per strap
export const WALL_Z = -0.16; // the backdrop the card cannot pass through

const NECK_Y = 0.36;
const NECK_X = 0.055;
const STRAP = 0.3;

export interface Vec {
  x: number;
  y: number;
  z: number;
}
interface Particle extends Vec {
  px: number;
  py: number;
  pz: number;
  /** inverse mass; 0 = pinned */
  w: number;
}
export interface Frame {
  o: Vec;
  x: Vec;
  y: Vec;
  z: Vec;
}
export interface CardIds {
  tl: number;
  tr: number;
  bl: number;
  br: number;
  slot: number;
  k: number;
}

export const norm = (v: Vec): Vec => {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};
export const cross = (a: Vec, b: Vec): Vec => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });

export class Lanyard {
  P: Particle[] = [];
  C: [number, number, number][] = [];
  rope1: number[] = [];
  rope2: number[] = [];
  clip = 0;
  card: CardIds = { tl: 0, tr: 0, bl: 0, br: 0, slot: 0, k: 0 };
  /** m/s², gentle by default: half of Earth's pull */
  gravity = 4.9;
  /** Hold still: the card stops where it is */
  still = false;
  grab: { local: Vec; target: Vec; w: [number, number][] } | null = null;
  private breeze = 0;

  constructor(lift = 0.05) {
    this.build(lift);
  }

  private part(x: number, y: number, z: number, w: number): number {
    this.P.push({ x, y, z, px: x, py: y, pz: z, w });
    return this.P.length - 1;
  }

  private link(i: number, j: number) {
    const a = this.P[i];
    const b = this.P[j];
    this.C.push([i, j, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)]);
  }

  /** Lay everything out at rest, then lift the card (and lower straps) by `lift` metres so it drops. */
  build(lift = 0) {
    this.P = [];
    this.C = [];
    this.rope1 = [];
    this.rope2 = [];
    this.grab = null;
    const a1 = this.part(-NECK_X, NECK_Y, 0, 0);
    const a2 = this.part(NECK_X, NECK_Y, 0, 0);
    const clipY = NECK_Y - Math.sqrt(STRAP * STRAP - NECK_X * NECK_X);
    this.clip = this.part(0, clipY, 0, 1 / 0.004);
    for (const [a, list] of [
      [a1, this.rope1],
      [a2, this.rope2],
    ] as const) {
      list.push(a);
      for (let k = 1; k < SEG; k++) {
        const t = k / SEG;
        list.push(this.part(this.P[a].x * (1 - t), NECK_Y * (1 - t) + clipY * t, 0.004 * Math.sin(t * Math.PI), 1 / 0.002));
        this.link(list[k - 1], list[k]);
      }
      list.push(this.clip);
      this.link(list[SEG - 1], this.clip);
    }
    const centerY = clipY - 0.014 - SLOT_Y;
    const wc = 1 / (0.009 / 6);
    const at = (x: number, y: number, z: number) => this.part(x + 0.004, centerY + y, z + 0.01 * (y / CARD_H), wc);
    this.card = {
      tl: at(-CARD_W / 2, CARD_H / 2, 0),
      tr: at(CARD_W / 2, CARD_H / 2, 0),
      bl: at(-CARD_W / 2, -CARD_H / 2, 0),
      br: at(CARD_W / 2, -CARD_H / 2, 0),
      slot: at(0, SLOT_Y, 0),
      k: at(0, 0, 0.04),
    };
    const ids = Object.values(this.card);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) this.link(ids[i], ids[j]);
    this.link(this.clip, this.card.slot);
    if (lift) {
      const clipNow = this.P[this.clip].y;
      for (const p of this.P) {
        if (!p.w) continue;
        const t = Math.min(1, Math.max(0, (NECK_Y - p.y) / (NECK_Y - clipNow)));
        p.y += lift * t;
        p.py = p.y;
        p.z += 0.03 * t;
        p.pz = p.z;
      }
    }
  }

  step(dt: number) {
    const P = this.P;
    if (this.still) {
      for (const p of P) {
        p.px = p.x;
        p.py = p.y;
        p.pz = p.z;
      }
      return;
    }
    const damp = 0.9978; // a little air drag so it floats down
    const g = this.gravity * dt * dt;
    this.breeze += dt;
    const idle = this.grab ? 0 : 0.0000012 * Math.sin(this.breeze * 0.9) * Math.sin(this.breeze * 0.37);
    for (const p of P) {
      if (!p.w) continue;
      const vx = (p.x - p.px) * damp;
      const vy = (p.y - p.py) * damp;
      const vz = (p.z - p.pz) * damp;
      p.px = p.x;
      p.py = p.y;
      p.pz = p.z;
      p.x += vx + idle;
      p.y += vy - g;
      p.z += vz;
    }
    for (let it = 0; it < 14; it++) {
      for (const [i, j, r] of this.C) {
        const a = P[i];
        const b = P[j];
        const s = a.w + b.w;
        if (!s) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const d = Math.hypot(dx, dy, dz) || 1e-9;
        const k = (d - r) / d / s;
        a.x += dx * k * a.w;
        a.y += dy * k * a.w;
        a.z += dz * k * a.w;
        b.x -= dx * k * b.w;
        b.y -= dy * k * b.w;
        b.z -= dz * k * b.w;
      }
      if (this.grab) {
        // pull the grabbed spot toward the pointer; the rigid links turn the pull into swing and spin
        const gp = this.toWorld(this.frame(), this.grab.local);
        const ex = this.grab.target.x - gp.x;
        const ey = this.grab.target.y - gp.y;
        const ez = this.grab.target.z - gp.z;
        for (const [id, w] of this.grab.w) {
          const p = P[id];
          p.x += ex * w;
          p.y += ey * w;
          p.z += ez * w;
        }
      }
      for (const p of P) if (p.w && p.z < WALL_Z) p.z = WALL_Z;
    }
  }

  /** The card's centre and axes, from its particles. */
  frame(): Frame {
    const P = this.P;
    const a = P[this.card.tl];
    const b = P[this.card.tr];
    const c = P[this.card.bl];
    const d = P[this.card.br];
    const o = { x: (a.x + b.x + c.x + d.x) / 4, y: (a.y + b.y + c.y + d.y) / 4, z: (a.z + b.z + c.z + d.z) / 4 };
    const x = norm({ x: b.x - a.x + d.x - c.x, y: b.y - a.y + d.y - c.y, z: b.z - a.z + d.z - c.z });
    let y = norm({ x: a.x - c.x + b.x - d.x, y: a.y - c.y + b.y - d.y, z: a.z - c.z + b.z - d.z });
    const z = norm(cross(x, y));
    y = norm(cross(z, x));
    return { o, x, y, z };
  }

  toWorld(f: Frame, l: Vec): Vec {
    return {
      x: f.o.x + f.x.x * l.x + f.y.x * l.y + f.z.x * l.z,
      y: f.o.y + f.x.y * l.x + f.y.y * l.y + f.z.y * l.z,
      z: f.o.z + f.x.z * l.x + f.y.z * l.y + f.z.z * l.z,
    };
  }

  /** Start dragging the card at a world point on its surface. */
  startGrab(point: Vec) {
    if (this.still) return false;
    const f = this.frame();
    const d = { x: point.x - f.o.x, y: point.y - f.o.y, z: point.z - f.o.z };
    const local = { x: d.x * f.x.x + d.y * f.x.y + d.z * f.x.z, y: d.x * f.y.x + d.y * f.y.y + d.z * f.y.z, z: 0 };
    const raw = Object.values(this.card).map((id): [number, number] => {
      const p = this.P[id];
      return [id, 1 / (1 + Math.hypot(p.x - point.x, p.y - point.y, p.z - point.z) / 0.03)];
    });
    const sum = raw.reduce((s, [, w]) => s + w, 0);
    this.grab = { local, target: { ...point }, w: raw.map(([id, w]) => [id, (w / sum) * 0.9]) };
    return true;
  }

  moveGrab(target: Vec) {
    if (this.grab) this.grab.target = { x: target.x, y: Math.max(target.y, -0.6), z: target.z };
  }

  endGrab() {
    this.grab = null;
  }

  /** Spin the card about its vertical axis so both sides show. */
  flip() {
    this.still = false;
    const f = this.frame();
    for (const id of Object.values(this.card)) {
      const p = this.P[id];
      const side = (p.x - f.o.x) * f.x.x + (p.y - f.o.y) * f.x.y + (p.z - f.o.z) * f.x.z;
      p.pz += side * 0.32;
      p.px -= (p.z - f.o.z) * 0.32;
    }
  }
}

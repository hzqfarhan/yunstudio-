// Cloth physics for the polo's Worn view. The polo model has about 30 000 vertices; simulating each one
// would be too slow on a phone, so the shirt is simulated as a coarser net of points (one for every 2.4 cm
// cube of fabric) linked along the fabric, and every vertex of the model follows the few net points around
// it. The model was draped on a body in Marvelous Designer, so its own shape is how the fabric hangs under
// gravity: each point is pulled back to that shape by a spring, firmly at the collar and shoulders where a
// shirt rests on the body and loosely at the hem and sleeves where it hangs free. The fabric links carry a
// pull across the cloth, and it cannot go into the wearer (lib/jerseyBody.ts). Pull the hem and let go and
// it falls back and ripples; when everything is still the net sleeps and costs nothing.
// Units are metres and seconds.

import { JB_ARM, JB_CZ, JB_NT, JB_R, JB_YS } from './jerseyBody';

export interface PieceIn {
  /** vertex positions (x, y, z), model space */
  pos: ArrayLike<number>;
  /** triangle indices */
  index: ArrayLike<number>;
}

/** Which net points a vertex follows, and how much. */
interface Skin {
  ids: Int32Array; // 4 per vertex
  w: Float32Array; // 4 per vertex
  off: Float32Array; // 3 per vertex
}

const CELL = 0.022;
const GAP = 0.004; // clearance between the shirt and the wearer

// ---------- the wearer ----------

function torsoField(x: number, y: number, z: number, gap: number) {
  const ys = JB_YS;
  const yy = Math.min(ys[0], Math.max(ys[ys.length - 1], y));
  let k = 0;
  while (k < ys.length - 2 && yy < ys[k + 1]) k++;
  const f = (ys[k] - yy) / (ys[k] - ys[k + 1]);
  const cz = JB_CZ[k] * (1 - f) + JB_CZ[k + 1] * f;
  const dz = z - cz;
  const r = Math.hypot(x, dz);
  const u = ((Math.atan2(dz, x) + Math.PI) / (2 * Math.PI)) * JB_NT - 0.5;
  const i0 = Math.floor(u);
  const g = u - i0;
  const a = ((i0 % JB_NT) + JB_NT) % JB_NT;
  const b = (a + 1) % JB_NT;
  const R0 = JB_R[k];
  const R1 = JB_R[k + 1];
  const R = (R0[a] * (1 - g) + R0[b] * g) * (1 - f) + (R1[a] * (1 - g) + R1[b] * g) * f + gap;
  return r / R - 1;
}

function armField(x: number, y: number, z: number, gap: number) {
  const { c, ax, t: T, r: Rr } = JB_ARM;
  const qx = Math.abs(x) - c[0];
  const qy = y - c[1];
  const qz = z - c[2];
  const t = qx * ax[0] + qy * ax[1] + qz * ax[2];
  if (t < T[0]) return 9;
  const tc = Math.min(t, T[T.length - 1]);
  let k = 0;
  while (k < T.length - 2 && tc > T[k + 1]) k++;
  const f = Math.min(1, Math.max(0, (tc - T[k]) / (T[k + 1] - T[k])));
  const r = Rr[k] * (1 - f) + Rr[k + 1] * f + gap;
  const dx = qx - tc * ax[0];
  const dy = qy - tc * ax[1];
  const dz = qz - tc * ax[2];
  return Math.hypot(dx, dy, dz) / r - 1;
}

/** Below 0 inside the wearer (torso, neck or arms), 0 on its surface grown by `gap`. */
export function wearerField(x: number, y: number, z: number, gap = 0) {
  if (y < JB_YS[JB_YS.length - 1]) return 9;
  return Math.min(torsoField(x, y, z, gap), armField(x, y, z, gap));
}

/** Rings of points on the wearer's surface, for drawing the faint body: torso rows and the two arms. */
export function wearerOutline() {
  const torso: number[][][] = JB_YS.map((y, k) => {
    const ring: number[][] = [];
    for (let i = 0; i <= JB_NT; i++) {
      const j = i % JB_NT;
      const th = ((j + 0.5) / JB_NT) * 2 * Math.PI - Math.PI;
      const R = JB_R[k][j];
      ring.push([Math.cos(th) * R, y, JB_CZ[k] + Math.sin(th) * R]);
    }
    return ring;
  });
  const { c, ax, t, r } = JB_ARM;
  // two directions square to the arm's axis
  let ux = -ax[1];
  let uy = ax[0];
  const ul = Math.hypot(ux, uy);
  ux /= ul;
  uy /= ul;
  const v = [ax[1] * 0 - ax[2] * uy, ax[2] * ux - ax[0] * 0, ax[0] * uy - ax[1] * ux];
  const arm: number[][][] = t.map((tt, k) => {
    const ring: number[][] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * 2 * Math.PI;
      const ca = Math.cos(a) * r[k];
      const sa = Math.sin(a) * r[k];
      ring.push([c[0] + ax[0] * tt + ux * ca + v[0] * sa, c[1] + ax[1] * tt + uy * ca + v[1] * sa, c[2] + ax[2] * tt + v[2] * sa]);
    }
    return ring;
  });
  return { torso, arm };
}

// ---------- the cloth ----------

export class Cloth {
  n = 0;
  x: Float32Array; // positions
  p: Float32Array; // previous positions
  rest: Float32Array; // positions as modelled
  /** links: pairs of point ids, rest length, stiffness */
  li: Int32Array;
  lr: Float32Array;
  lk: Float32Array;
  nbr: number[][];
  skins: Skin[] = [];
  /** spring strength pulling each point back to its draped place, per s² */
  k: Float32Array;
  /** true while the cloth is still: no step needed */
  asleep = false;
  private calm = 0;
  grab: { id: number; target: [number, number, number]; ring: [number, number][] } | null = null;
  private touch: Uint8Array;

  constructor(pieces: PieceIn[]) {
    // 1. one net point per 2 cm cell of fabric, at the middle of the vertices in it
    const cellOf = new Map<string, number>();
    const sum: number[] = [];
    const cnt: number[] = [];
    const vc: Int32Array[] = [];
    for (const pc of pieces) {
      const nv = pc.pos.length / 3;
      const ids = new Int32Array(nv);
      for (let i = 0; i < nv; i++) {
        const x = pc.pos[i * 3];
        const y = pc.pos[i * 3 + 1];
        const z = pc.pos[i * 3 + 2];
        const key = `${Math.floor(x / CELL)},${Math.floor(y / CELL)},${Math.floor(z / CELL)}`;
        let id = cellOf.get(key);
        if (id === undefined) {
          id = cnt.length;
          cellOf.set(key, id);
          cnt.push(0);
          sum.push(0, 0, 0);
        }
        cnt[id]++;
        sum[id * 3] += x;
        sum[id * 3 + 1] += y;
        sum[id * 3 + 2] += z;
        ids[i] = id;
      }
      vc.push(ids);
    }
    const n = cnt.length;
    this.n = n;
    this.x = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) this.x[i * 3 + a] = sum[i * 3 + a] / cnt[i];
    this.rest = this.x.slice();
    this.p = this.x.slice();
    this.touch = new Uint8Array(n);

    // 2. links along the fabric (triangle edges between cells), plus seams: cells close enough to touch
    const key = (a: number, b: number) => (a < b ? a * n + b : b * n + a);
    const seen = new Set<number>();
    const nbr: number[][] = Array.from({ length: n }, () => []);
    const L: number[] = [];
    const addLink = (a: number, b: number) => {
      if (a === b) return;
      const k = key(a, b);
      if (seen.has(k)) return;
      seen.add(k);
      L.push(a, b);
      nbr[a].push(b);
      nbr[b].push(a);
    };
    pieces.forEach((pc, m) => {
      const ids = vc[m];
      for (let t = 0; t < pc.index.length; t += 3) {
        const a = ids[pc.index[t]];
        const b = ids[pc.index[t + 1]];
        const c = ids[pc.index[t + 2]];
        addLink(a, b);
        addLink(b, c);
        addLink(c, a);
      }
    });
    // seams: pieces are separate meshes, so tie cells that sit next to each other
    const X = this.x;
    for (const [k0, i] of cellOf) {
      const [cx, cy, cz] = k0.split(',').map(Number);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
          for (let dz = -1; dz <= 1; dz++) {
            const j = cellOf.get(`${cx + dx},${cy + dy},${cz + dz}`);
            if (j === undefined || j <= i) continue;
            const d = Math.hypot(X[i * 3] - X[j * 3], X[i * 3 + 1] - X[j * 3 + 1], X[i * 3 + 2] - X[j * 3 + 2]);
            if (d < CELL * 1.15) addLink(i, j);
          }
    }
    const nl = L.length / 2;
    this.li = new Int32Array(L);
    this.lr = new Float32Array(nl);
    this.lk = new Float32Array(nl);
    for (let l = 0; l < nl; l++) {
      const a = L[l * 2];
      const b = L[l * 2 + 1];
      this.lr[l] = Math.hypot(X[a * 3] - X[b * 3], X[a * 3 + 1] - X[b * 3 + 1], X[a * 3 + 2] - X[b * 3 + 2]);
      this.lk[l] = 1;
    }
    this.k = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // firm where the shirt rests (collar, shoulders), loose where it hangs (hem, sleeve ends)
      const y = X[i * 3 + 1];
      const up = Math.min(1, Math.max(0, (y + 0.3) / 0.58));
      const out = Math.min(1, Math.max(0, (Math.abs(X[i * 3]) - 0.2) / 0.14));
      this.k[i] = (55 + 600 * up * up * up) * (1 - 0.6 * out);
    }
    this.nbr = nbr;

    // 4. each vertex follows its own cell and the nearest linked cells
    pieces.forEach((pc, m) => {
      const nv = pc.pos.length / 3;
      const sk: Skin = { ids: new Int32Array(nv * 4), w: new Float32Array(nv * 4), off: new Float32Array(nv * 3) };
      const own = vc[m];
      for (let v = 0; v < nv; v++) {
        const x = pc.pos[v * 3];
        const y = pc.pos[v * 3 + 1];
        const z = pc.pos[v * 3 + 2];
        const c0 = own[v];
        const cand = [c0, ...nbr[c0]]
          .map((c) => [c, Math.hypot(X[c * 3] - x, X[c * 3 + 1] - y, X[c * 3 + 2] - z)] as const)
          .sort((p, q) => p[1] - q[1])
          .slice(0, 4);
        let ws = 0;
        const w = cand.map(([, d]) => 1 / (d * d + 1e-5));
        for (const q of w) ws += q;
        let ox = x;
        let oy = y;
        let oz = z;
        for (let j = 0; j < 4; j++) {
          const c = cand[j] ? cand[j][0] : c0;
          const wj = cand[j] ? w[j] / ws : 0;
          sk.ids[v * 4 + j] = c;
          sk.w[v * 4 + j] = wj;
          ox -= wj * X[c * 3];
          oy -= wj * X[c * 3 + 1];
          oz -= wj * X[c * 3 + 2];
        }
        sk.off.set([ox, oy, oz], v * 3);
      }
      this.skins.push(sk);
    });
  }

  /**
   * Start the shirt raised by `lift` metres and a little wide, as if just pulled on and let go, so it drops
   * onto the wearer and settles (the lower it is, the later it lands, so it ripples down from the shoulders).
   */
  reset(lift = 0.07) {
    for (let i = 0; i < this.n; i++) {
      const y = this.rest[i * 3 + 1];
      const f = Math.min(1, Math.max(0, (0.35 - y) / 0.7));
      this.x[i * 3] = this.rest[i * 3] * (1 + 0.1 * f);
      this.x[i * 3 + 1] = y + lift * (0.4 + 0.6 * f);
      this.x[i * 3 + 2] = this.rest[i * 3 + 2] * (1 + 0.08 * f) + 0.02 * f;
    }
    this.p.set(this.x);
    this.grab = null;
    this.asleep = false;
    this.calm = 0;
  }

  private collide(i: number) {
    const X = this.x;
    let x = X[i * 3];
    let y = X[i * 3 + 1];
    let z = X[i * 3 + 2];
    let moved = false;
    for (let it = 0; it < 2; it++) {
      const f = wearerField(x, y, z, GAP);
      if (f >= 0) break;
      const h = 0.002;
      const gx = wearerField(x + h, y, z, GAP) - wearerField(x - h, y, z, GAP);
      const gy = wearerField(x, y + h, z, GAP) - wearerField(x, y - h, z, GAP);
      const gz = wearerField(x, y, z + h, GAP) - wearerField(x, y, z - h, GAP);
      const g2 = (gx * gx + gy * gy + gz * gz) / (4 * h * h);
      if (g2 < 1e-6) break;
      const k = (-f / g2 / (2 * h)) * 1.02;
      x += gx * k;
      y += gy * k;
      z += gz * k;
      moved = true;
    }
    if (moved) {
      X[i * 3] = x;
      X[i * 3 + 1] = y;
      X[i * 3 + 2] = z;
    }
    return moved;
  }

  step(dt: number) {
    if (this.asleep && !this.grab) return false;
    const { x: X, p: Pv, n, k: K, rest: R } = this;
    const damp = 0.965;
    const dt2 = dt * dt;
    let moving = 0;
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      const vx = (X[j] - Pv[j]) * damp;
      const vy = (X[j + 1] - Pv[j + 1]) * damp;
      const vz = (X[j + 2] - Pv[j + 2]) * damp;
      Pv[j] = X[j];
      Pv[j + 1] = X[j + 1];
      Pv[j + 2] = X[j + 2];
      const kk = K[i] * dt2;
      X[j] += vx + (R[j] - X[j]) * kk;
      X[j + 1] += vy + (R[j + 1] - X[j + 1]) * kk;
      X[j + 2] += vz + (R[j + 2] - X[j + 2]) * kk;
      moving = Math.max(moving, Math.abs(vx) + Math.abs(vy) + Math.abs(vz) + Math.abs(R[j + 1] - X[j + 1]) * 0.05);
    }
    this.touch.fill(0);
    const { li, lr, lk } = this;
    const nl = lr.length;
    for (let it = 0; it < 4; it++) {
      for (let l = 0; l < nl; l++) {
        const a = li[l * 2] * 3;
        const b = li[l * 2 + 1] * 3;
        const dx = X[b] - X[a];
        const dy = X[b + 1] - X[a + 1];
        const dz = X[b + 2] - X[a + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-9;
        const k = ((d - lr[l]) / d) * 0.5 * lk[l];
        X[a] += dx * k;
        X[a + 1] += dy * k;
        X[a + 2] += dz * k;
        X[b] -= dx * k;
        X[b + 1] -= dy * k;
        X[b + 2] -= dz * k;
      }
      if (this.grab) {
        // pull the grabbed spot (and, more gently, the fabric round it) toward the pointer
        const [tx, ty, tz] = this.grab.target;
        const g0 = this.grab.id * 3;
        const ex = tx - X[g0];
        const ey = ty - X[g0 + 1];
        const ez = tz - X[g0 + 2];
        for (const [id, w] of this.grab.ring) {
          X[id * 3] += ex * w;
          X[id * 3 + 1] += ey * w;
          X[id * 3 + 2] += ez * w;
        }
      }
      for (let i = 0; i < n; i++) if (this.collide(i)) this.touch[i] = 1;
    }
    // friction where the shirt touches the wearer
    for (let i = 0; i < n; i++) {
      if (!this.touch[i]) continue;
      const j = i * 3;
      Pv[j] += (X[j] - Pv[j]) * 0.25;
      Pv[j + 1] += (X[j + 1] - Pv[j + 1]) * 0.25;
      Pv[j + 2] += (X[j + 2] - Pv[j + 2]) * 0.25;
    }
    // fall asleep after half a second of stillness
    this.calm = moving < 0.00002 && !this.grab ? this.calm + 1 : 0;
    if (this.calm > 30) this.asleep = true;
    return true;
  }

  /** Move a piece's vertices to follow the net. */
  pose(piece: number, out: { setXYZ: (i: number, x: number, y: number, z: number) => unknown; count: number }) {
    const sk = this.skins[piece];
    const X = this.x;
    for (let v = 0; v < out.count; v++) {
      let x = sk.off[v * 3];
      let y = sk.off[v * 3 + 1];
      let z = sk.off[v * 3 + 2];
      for (let j = 0; j < 4; j++) {
        const c = sk.ids[v * 4 + j] * 3;
        const w = sk.w[v * 4 + j];
        x += w * X[c];
        y += w * X[c + 1];
        z += w * X[c + 2];
      }
      out.setXYZ(v, x, y, z);
    }
  }

  /** Start pulling the fabric at a vertex of a piece. */
  startGrab(piece: number, vertex: number, point: [number, number, number]) {
    this.asleep = false;
    this.calm = 0;
    const id = this.skins[piece].ids[vertex * 4];
    const ring: [number, number][] = [[id, 0.5]];
    for (const b of this.nbr[id]) {
      ring.push([b, 0.3]);
      for (const c of this.nbr[b]) if (c !== id && !ring.some(([q]) => q === c)) ring.push([c, 0.12]);
    }
    this.grab = { id, target: point, ring };
  }

  moveGrab(point: [number, number, number]) {
    if (this.grab) this.grab.target = point;
  }

  endGrab() {
    this.grab = null;
  }
}

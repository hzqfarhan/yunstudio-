// Shape of the 3D crew polo. Pure maths, no three.js, so it can be checked on its own.
//
// The front and back are the real print panels from the Illustrator file (public/jersey/*.webp), each
// bent into half of an oval tube so they meet at the side seams and the shoulders. The sleeves are the
// sleeve panels wrapped into short tubes, and the collar, placket and buttons are simple shapes on top.
// Units are metres; y is up, the front faces +z.

export interface Grid {
  position: Float32Array;
  uv: Float32Array;
  index: Uint32Array;
}

/** Panel size: the print panels are 0.735 wide for every 1 tall. */
export const PANEL_W = 0.52;
export const PANEL_H = PANEL_W / 0.735;
export const TOP_Y = PANEL_H / 2;

/** Half the panel width at each height, top to bottom (from the panel outline). */
const HALF_WIDTH = [
  0.31, 0.517, 0.72, 0.837, 0.829, 0.823, 0.819, 0.813, 0.81, 0.806, 0.803, 0.802, 0.8, 0.802, 0.807, 0.821, 0.845,
  0.894, 1, 1, 1, 1, 1, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.997, 0.997,
  0.997, 0.997, 0.997, 0.997, 0.997, 0.997, 0.997, 0.997, 0.997, 0.999, 0.999, 0.999, 0.999,
];
/** Where the back panel's top edge is in each column, left to right, as a share of the height. */
const TOP_EDGE = [
  0.374, 0.368, 0.36, 0.348, 0.053, 0.049, 0.044, 0.04, 0.036, 0.032, 0.027, 0.023, 0.019, 0.014, 0.01, 0.006, 0.002,
  0.014, 0.021, 0.026, 0.028, 0.031, 0.032, 0.032, 0.032, 0.031, 0.029, 0.028, 0.025, 0.02, 0.014, 0.004, 0.004, 0.008,
  0.012, 0.016, 0.02, 0.024, 0.028, 0.032, 0.036, 0.041, 0.044, 0.049, 0.332, 0.353, 0.364, 0.37, 0.375,
];

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lookup = (arr: number[], t: number) => {
  const f = clamp01(t) * (arr.length - 1);
  const i = Math.min(Math.floor(f), arr.length - 2);
  return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
};
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
/** Chest is a little deeper than the hem. */
const depth = (v: number) => 0.115 + 0.025 * smooth(0.9, 0.25, v);

/** How far the body stands out from the middle at a point (u, v on the panel, v = 0 at the top). */
function bulge(u: number, v: number, uTop: number) {
  const x = (u - 0.5) * PANEL_W;
  const hw = Math.max((lookup(HALF_WIDTH, v) * PANEL_W) / 2, 0.03);
  const nx = Math.min(Math.abs(x) / hw, 1);
  const side = Math.sqrt(Math.max(0, 1 - nx * nx));
  const taper = smooth(-0.02, 0.2, v - lookup(TOP_EDGE, uTop));
  return depth(v) * side * taper;
}

/** z of the front surface at (x, y), for things that sit on the chest. */
export function frontZ(x: number, y: number) {
  const u = x / PANEL_W + 0.5;
  return bulge(u, (TOP_Y - y) / PANEL_H, u);
}

function grid(nu: number, nv: number, at: (u: number, v: number) => [number, number, number], uvAt: (u: number, v: number) => [number, number]): Grid {
  const position = new Float32Array(nu * nv * 3);
  const uv = new Float32Array(nu * nv * 2);
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const u = i / (nu - 1);
      const v = j / (nv - 1);
      const k = j * nu + i;
      position.set(at(u, v), k * 3);
      uv.set(uvAt(u, v), k * 2);
    }
  const index = new Uint32Array((nu - 1) * (nv - 1) * 6);
  let n = 0;
  for (let j = 0; j < nv - 1; j++)
    for (let i = 0; i < nu - 1; i++) {
      const a = j * nu + i;
      const b = a + 1;
      const c = a + nu;
      const d = c + 1;
      index.set([a, c, b, b, c, d], n);
      n += 6;
    }
  return { position, uv, index };
}

/** Front or back body panel. Texture v runs top to bottom of the print. */
export function panel(back: boolean, nu = 72, nv = 110): Grid {
  return grid(
    nu,
    nv,
    (u, v) => {
      const x = (u - 0.5) * PANEL_W;
      const y = TOP_Y - v * PANEL_H;
      const z = bulge(u, v, back ? 1 - u : u);
      return back ? [-x, y, -z] : [x, y, z];
    },
    (u, v) => [u, 1 - v],
  );
}

const SLEEVE_ANGLE = (48 * Math.PI) / 180;

/** A sleeve on the right (+x, side = 1) or left (side = -1). The print's middle sits on the outside of the arm. */
export function sleeve(side: 1 | -1, nu = 64, nv = 24): Grid {
  const L = 0.25;
  const r0 = 0.072; // cuff
  const r1 = 0.092; // shoulder end
  const ax = [side * Math.cos(SLEEVE_ANGLE), -Math.sin(SLEEVE_ANGLE)];
  const n1 = [side * Math.sin(SLEEVE_ANGLE), Math.cos(SLEEVE_ANGLE)];
  const shoulder = [side * 0.2, TOP_Y - 0.045];
  const S = [shoulder[0] - r1 * n1[0] * 0.95, shoulder[1] - r1 * n1[1] * 0.95];
  const C = [S[0] + ax[0] * L, S[1] + ax[1] * L];
  return grid(
    nu,
    nv,
    (u, v) => {
      const phi = 2 * Math.PI * (u - 0.5) * -side;
      const r = r0 + (r1 - r0) * v;
      const cx = C[0] + (S[0] - C[0]) * v;
      const cy = C[1] + (S[1] - C[1]) * v;
      return [cx + r * Math.cos(phi) * n1[0], cy + r * Math.cos(phi) * n1[1], r * Math.sin(phi) * 0.85];
    },
    // the cap (top of the print) is at the shoulder end
    (u, v) => [u, v],
  );
}

/** Patch of plain body colour behind the front's neck opening, and the button placket on top of it. */
export function frontPatch(x0: number, x1: number, yBottom: number, yTop: number, lift: number, nu = 16, nv = 16): Grid {
  return grid(
    nu,
    nv,
    (u, v) => {
      const x = x0 + (x1 - x0) * u;
      const y = yTop - (yTop - yBottom) * v;
      return [x, y, frontZ(x, y) + lift];
    },
    (u, v) => [u, 1 - v],
  );
}

const NECK = { rx: 0.088, rz: 0.072, cz: 0.012, yBack: TOP_Y - 0.012, drop: 0.095 };

function neckPoint(t: number, grow: number, dy: number): [number, number, number] {
  const x = (NECK.rx + grow) * Math.sin(t);
  const z = NECK.cz + (NECK.rz + grow) * Math.cos(t);
  const y = NECK.yBack - NECK.drop * ((1 + Math.cos(t)) / 2) ** 2 + dy;
  return [x, y, z];
}

function band(rows: [number, number][], gap: number, n = 72): Grid {
  return grid(
    n,
    rows.length,
    (u, v) => {
      const t = gap + (2 * Math.PI - 2 * gap) * u;
      const [g, dy] = rows[Math.round(v * (rows.length - 1))];
      return neckPoint(t, g, dy);
    },
    (u, v) => [u, v],
  );
}

/** Polo collar: the stand round the neck, and the fall folded down over it. */
export function collar() {
  return {
    stand: band(
      [
        [0, 0],
        [0.004, 0.032],
      ],
      0.16,
    ),
    fall: band(
      [
        [0.006, 0.034],
        [0.03, -0.012],
        [0.042, -0.03],
      ],
      0.06,
    ),
  };
}

/** Placket and button positions. */
export const PLACKET = { x: 0.022, top: TOP_Y - 0.09, bottom: TOP_Y - 0.235 };
export const BUTTONS_Y = [TOP_Y - 0.125, TOP_Y - 0.165, TOP_Y - 0.205];
export const NECK_FILL = { x: 0.09, top: TOP_Y - 0.005, bottom: TOP_Y - 0.14 };
export const HEM_Y = TOP_Y - PANEL_H;

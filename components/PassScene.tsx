'use client';

// The 3D scene: the LEED 26 committee pass on its lanyard, lit like a product shot, with real gravity.
// Drag the card to swing it, flick it to spin it. Physics lives in lib/physics.ts; this file draws it.

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { CARD_H, CARD_T, CARD_W, Lanyard, SEG, SLOT_Y, WALL_Z, cross, norm } from '@/lib/physics';

export interface PassSceneProps {
  front: string;
  back: string;
  name: string;
  /** One line under the name: the role for High Committee, the committee for everyone else. */
  subtitle: string;
  /** Buttons for the bottom bar (share, save). */
  actions?: ReactNode;
  /** Open in the close-up 360° view instead of on the lanyard. */
  startClose?: boolean;
}

export default function PassScene({ front: frontSrc, back: backSrc, name, subtitle, actions, startClose = true }: PassSceneProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Lanyard | null>(null);
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState(false);
  const [free, setFree] = useState(startClose);
  const freeRef = useRef(false);
  const viewRef = useRef<{ setFree: (on: boolean) => void } | null>(null);

  if (!simRef.current) simRef.current = new Lanyard(0.05);

  useEffect(() => {
    const stage = stageRef.current;
    const sim = simRef.current;
    if (!stage || !sim) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap; // soft, blurred shadow edges
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 10);

    // soft studio reflections for the glossy PVC
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(5, 32, 16), new THREE.MeshBasicMaterial({ color: 0x2a0b5e, side: THREE.BackSide })));
    const softbox = (c: number, x: number, y: number, z: number, w: number, h: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    softbox(0xffffff, 0, 3, 2.5, 3, 1.2);
    softbox(0xff6fb8, -3.5, 0.5, 1, 1.5, 3);
    softbox(0xfff2a8, 3.5, 1, 1, 1.5, 3);
    softbox(0x9b6cff, 0, -2, -3, 4, 2);
    const envTex = pmrem.fromScene(env, 0.03).texture;
    scene.environment = envTex;

    // lights (physical units: brighter numbers than older three.js examples)
    scene.add(new THREE.HemisphereLight(0xe8dcff, 0x2b0a5c, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(0.25, 0.45, 1.2);
    key.castShadow = true;
    key.target.position.set(0, -0.02, 0);
    scene.add(key.target);
    const sc = key.shadow.camera;
    sc.left = -0.32;
    sc.right = 0.32;
    sc.top = 0.48;
    sc.bottom = -0.32;
    sc.near = 0.6;
    sc.far = 2.2;
    sc.updateProjectionMatrix();
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 9;
    key.shadow.blurSamples = 16;
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.002;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd9c8ff, 1.3);
    fill.position.set(-0.6, 0.1, 0.8);
    scene.add(fill);
    const rim = new THREE.PointLight(0xff4fa3, 0.35, 1.5, 2);
    rim.position.set(-0.35, 0.1, 0.25);
    scene.add(rim);

    // backdrop that only shows the shadow
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.28, color: 0x0a0220 }));
    wall.position.z = WALL_Z - 0.004;
    wall.receiveShadow = true;
    scene.add(wall);

    // ----- card: rounded PVC with a punched slot, printed front and back -----
    const loader = new THREE.TextureLoader();
    const tex = (src: string) => {
      const t = loader.load(src);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    };
    const shape = new THREE.Shape();
    const r = 0.006;
    const w2 = CARD_W / 2;
    const h2 = CARD_H / 2;
    shape.moveTo(-w2 + r, -h2);
    shape.lineTo(w2 - r, -h2);
    shape.quadraticCurveTo(w2, -h2, w2, -h2 + r);
    shape.lineTo(w2, h2 - r);
    shape.quadraticCurveTo(w2, h2, w2 - r, h2);
    shape.lineTo(-w2 + r, h2);
    shape.quadraticCurveTo(-w2, h2, -w2, h2 - r);
    shape.lineTo(-w2, -h2 + r);
    shape.quadraticCurveTo(-w2, -h2, -w2 + r, -h2);
    const sw = 0.0075;
    const sh = 0.0022;
    const slot = new THREE.Path();
    slot.moveTo(-sw + sh, SLOT_Y - sh);
    slot.lineTo(sw - sh, SLOT_Y - sh);
    slot.absarc(sw - sh, SLOT_Y, sh, -Math.PI / 2, Math.PI / 2, false);
    slot.lineTo(-sw + sh, SLOT_Y + sh);
    slot.absarc(-sw + sh, SLOT_Y, sh, Math.PI / 2, Math.PI * 1.5, false);
    shape.holes.push(slot);

    const face = (src: string, back: boolean) => {
      const g = new THREE.ShapeGeometry(shape, 24);
      const pos = g.attributes.position;
      const uv = g.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / CARD_W + 0.5, pos.getY(i) / CARD_H + 0.5);
      if (back) g.rotateY(Math.PI);
      g.translate(0, 0, back ? -CARD_T / 2 - 0.00005 : CARD_T / 2 + 0.00005);
      const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ map: tex(src), roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12 }));
      m.castShadow = true;
      return m;
    };
    const edgeGeo = new THREE.ExtrudeGeometry(shape, { depth: CARD_T, bevelEnabled: false, curveSegments: 24 });
    edgeGeo.translate(0, 0, -CARD_T / 2);
    const edge = new THREE.Mesh(edgeGeo, new THREE.MeshStandardMaterial({ color: 0xf4eefc, roughness: 0.5 }));
    edge.castShadow = true;
    const front = face(frontSrc, false);
    const back = face(backSrc, true);
    const cardObj = new THREE.Group();
    cardObj.add(edge, front, back);
    cardObj.matrixAutoUpdate = false;
    scene.add(cardObj);

    // ----- straps: printed ribbon -----
    const strapCanvas = document.createElement('canvas');
    strapCanvas.width = 128;
    strapCanvas.height = 1024;
    const cx = strapCanvas.getContext('2d')!;
    cx.fillStyle = '#2b0a5c';
    cx.fillRect(0, 0, 128, 1024);
    cx.fillStyle = '#ff4fa3';
    cx.fillRect(0, 0, 10, 1024);
    cx.fillRect(118, 0, 10, 1024);
    cx.save();
    cx.translate(64, 0);
    cx.rotate(Math.PI / 2);
    cx.font = '800 56px Poppins, system-ui, sans-serif';
    cx.textBaseline = 'middle';
    for (let y = 20; y < 1024; y += 330) {
      cx.fillStyle = '#ffd91a';
      cx.fillText('LEED 26', y, 2);
      cx.fillStyle = '#fff';
      cx.fillText('•', y + 250, 2);
    }
    cx.restore();
    const strapTex = new THREE.CanvasTexture(strapCanvas);
    strapTex.colorSpace = THREE.SRGBColorSpace;
    strapTex.wrapT = THREE.RepeatWrapping;
    strapTex.anisotropy = 8;
    const strapMat = new THREE.MeshStandardMaterial({ map: strapTex, roughness: 0.75, side: THREE.DoubleSide });
    const ribbon = () => {
      const g = new THREE.BufferGeometry();
      const n = SEG + 1;
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
      const uv = new Float32Array(n * 2 * 2);
      for (let i = 0; i < n; i++) {
        const v = (i / SEG) * 3;
        uv.set([0, v, 1, v], i * 4);
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const idx: number[] = [];
      for (let i = 0; i < SEG; i++) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      g.setIndex(idx);
      const m = new THREE.Mesh(g, strapMat);
      m.castShadow = true;
      m.frustumCulled = false;
      scene.add(m);
      return m;
    };
    const strap1 = ribbon();
    const strap2 = ribbon();
    const STRAP_W = 0.016;
    const updateRibbon = (mesh: THREE.Mesh, ids: number[]) => {
      const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
      const P = sim.P;
      for (let i = 0; i < ids.length; i++) {
        const p = P[ids[i]];
        const q = P[ids[Math.min(i + 1, ids.length - 1)]];
        const o = P[ids[Math.max(i - 1, 0)]];
        const t = norm({ x: q.x - o.x, y: q.y - o.y, z: q.z - o.z });
        const s = norm(cross(t, { x: 0, y: 0, z: 1 }));
        const half = (STRAP_W / 2) * (i === ids.length - 1 ? 0.45 : 1);
        pos.setXYZ(i * 2, p.x - s.x * half, p.y - s.y * half, p.z - s.z * half);
        pos.setXYZ(i * 2 + 1, p.x + s.x * half, p.y + s.y * half, p.z + s.z * half);
      }
      pos.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    };

    // ----- metal clip: ring at the straps, hook through the slot -----
    const metal = new THREE.MeshStandardMaterial({ color: 0xd9dde6, metalness: 1, roughness: 0.22 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0055, 0.0012, 12, 32), metal);
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 1, 10), metal);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.001, sw * 1.6, 10), metal);
    for (const m of [ring, hook, bar]) {
      m.castShadow = true;
      scene.add(m);
    }

    // ----- dragging -----
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane();
    const hit = new THREE.Vector3();
    const canvas = renderer.domElement;
    const setNdc = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    };
    const onDown = (e: PointerEvent) => {
      if (freeRef.current) return;
      setNdc(e);
      ray.setFromCamera(ndc, camera);
      const h = ray.intersectObjects([front, back, edge], false)[0];
      if (!h || !sim.startGrab(h.point)) return;
      plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), h.point);
      setDragging(true);
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!sim.grab) return;
      setNdc(e);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) sim.moveGrab(hit);
    };
    const onUp = () => {
      sim.endGrab();
      setDragging(false);
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    // ----- 360° view: the card alone, turned and zoomed by hand -----
    const fq = new THREE.Quaternion();
    const tq = new THREE.Quaternion();
    const axX = new THREE.Vector3(1, 0, 0);
    const axY = new THREE.Vector3(0, 1, 0);
    const spin = { x: 0, y: 0 };
    const pointers = new Map<number, { x: number; y: number }>();
    let turning: { x: number; y: number } | null = null;
    let dist = 0.3;
    let pinch0 = 0;
    let dist0 = 0;
    const homeDist = () => (camera.aspect < 0.75 ? 0.34 : 0.25);
    const clampDist = (d: number) => Math.min(0.75, Math.max(0.13, d));
    const resetFree = () => {
      fq.identity();
      spin.x = 0;
      spin.y = 0.012;
      dist = homeDist();
    };

    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (freeRef.current) camera.position.set(0, -0.03, dist);
      else camera.position.set(0, -0.02, w / h < 0.75 ? 0.66 : 0.52); // stand back further on tall phones
      camera.lookAt(0, -0.03, 0);
      camera.updateProjectionMatrix();
    };

    viewRef.current = {
      setFree: (on) => {
        freeRef.current = on;
        sim.endGrab();
        for (const m of [strap1, strap2, ring, hook, bar]) m.visible = !on;
        if (on) resetFree();
        resize();
      },
    };
    if (startClose) viewRef.current.setFree(true);
    const fDown = (e: PointerEvent) => {
      if (!freeRef.current) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      canvas.setPointerCapture(e.pointerId);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
        dist0 = dist;
        turning = null;
      } else {
        turning = { x: e.clientX, y: e.clientY };
        spin.x = 0;
        spin.y = 0;
        setDragging(true);
      }
    };
    const fMove = (e: PointerEvent) => {
      if (!freeRef.current || !pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0 && d) {
          dist = clampDist((dist0 * pinch0) / d);
          resize();
        }
        return;
      }
      if (!turning) return;
      const k = 0.008;
      const dx = e.clientX - turning.x;
      const dy = e.clientY - turning.y;
      fq.premultiply(tq.setFromAxisAngle(axY, dx * k)).premultiply(tq.setFromAxisAngle(axX, dy * k));
      spin.y = dx * k; // keeps turning a little after you let go
      spin.x = dy * k;
      turning = { x: e.clientX, y: e.clientY };
    };
    const fUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch0 = 0;
      if (!pointers.size) {
        turning = null;
        if (freeRef.current) setDragging(false);
      }
    };
    const fWheel = (e: WheelEvent) => {
      if (!freeRef.current) return;
      e.preventDefault();
      dist = clampDist(dist * Math.exp(e.deltaY * 0.0012));
      resize();
    };
    const fDouble = () => {
      if (!freeRef.current) return;
      resetFree();
      resize();
    };
    canvas.addEventListener('pointerdown', fDown);
    canvas.addEventListener('pointermove', fMove);
    canvas.addEventListener('pointerup', fUp);
    canvas.addEventListener('pointercancel', fUp);
    canvas.addEventListener('wheel', fWheel, { passive: false });
    canvas.addEventListener('dblclick', fDouble);
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    // ----- loop: fixed 240 Hz physics, draw every frame -----
    const m4 = new THREE.Matrix4();
    const vx = new THREE.Vector3();
    const vy = new THREE.Vector3();
    const vz = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const DT = 1 / 240;
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const freePos = new THREE.Vector3(0, -0.03, 0);
    const one = new THREE.Vector3(1, 1, 1);
    const loop = (now: number) => {
      acc += Math.min(0.05, (now - last) / 1000);
      last = now;
      if (freeRef.current) {
        acc = 0;
        if (!turning) {
          fq.premultiply(tq.setFromAxisAngle(axY, spin.y)).premultiply(tq.setFromAxisAngle(axX, spin.x));
          spin.x *= 0.95;
          spin.y *= 0.95;
          if (!pointers.size && Math.abs(spin.y) < 0.004) spin.y += 0.0002 * Math.sign(spin.y || 1); // a slow idle turn
        }
        cardObj.matrix.compose(freePos, fq, one);
        cardObj.matrixWorldNeedsUpdate = true;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
        return;
      }
      while (acc >= DT) {
        sim.step(DT);
        acc -= DT;
      }
      const f = sim.frame();
      m4.makeBasis(vx.set(f.x.x, f.x.y, f.x.z), vy.set(f.y.x, f.y.y, f.y.z), vz.set(f.z.x, f.z.y, f.z.z)).setPosition(f.o.x, f.o.y, f.o.z);
      cardObj.matrix.copy(m4);
      cardObj.matrixWorldNeedsUpdate = true;
      updateRibbon(strap1, sim.rope1);
      updateRibbon(strap2, sim.rope2);
      const c = sim.P[sim.clip];
      const s = sim.P[sim.card.slot];
      ring.position.set(c.x, c.y + 0.004, c.z);
      ring.lookAt(c.x + f.z.x, c.y + 0.004 + f.z.y, c.z + f.z.z);
      dir.set(s.x - c.x, s.y - c.y, s.z - c.z);
      const len = dir.length();
      hook.position.set((c.x + s.x) / 2, (c.y + s.y) / 2, (c.z + s.z) / 2);
      hook.scale.set(1, len, 1);
      hook.quaternion.setFromUnitVectors(up, dir.normalize());
      bar.position.set(s.x + f.y.x * 0.0012, s.y + f.y.y * 0.0012, s.z + f.y.z * 0.0012);
      bar.quaternion.setFromUnitVectors(up, vx.set(f.x.x, f.x.y, f.x.z));
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerdown', fDown);
      canvas.removeEventListener('pointermove', fMove);
      canvas.removeEventListener('pointerup', fUp);
      canvas.removeEventListener('pointercancel', fUp);
      canvas.removeEventListener('wheel', fWheel);
      canvas.removeEventListener('dblclick', fDouble);
      viewRef.current = null;
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            (m as THREE.MeshStandardMaterial).map?.dispose();
            m.dispose();
          }
        }
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  const sim = () => simRef.current!;
  const hold = (on: boolean) => {
    sim().still = on;
  };

  return (
    <>
      <div ref={stageRef} className={`stage${dragging ? ' is-dragging' : ''}`} aria-label={`3D preview of the LEED 26 pass of ${name}. Drag the card to turn it.`} />
      <header className="cap">
        <Link href="/" className="cap-back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          All passes
        </Link>
        <h1>{name}</h1>
        <p className="cap-sub">{subtitle}</p>
      </header>
      <div className="dock">
        <p className="dock-tip">{free ? 'Drag to turn, pinch to zoom, double-tap to reset' : 'Drag to swing, flick to spin'}</p>
        <div className="dock-row">
          <div className="modes" role="radiogroup" aria-label="View">
            {(
              [
                [true, 'Close up'],
                [false, 'Lanyard'],
              ] as const
            ).map(([on, label]) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={free === on}
                onClick={() => {
                  setFree(on);
                  hold(false);
                  if (!on) sim().build(0);
                  viewRef.current?.setFree(on);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {!free && (
            <button
              type="button"
              className="dock-btn"
              onClick={() => {
                hold(false);
                sim().flip();
              }}
            >
              Flip
            </button>
          )}
          {actions}
        </div>
      </div>
      {failed && <p className="err">The 3D view could not start on this device (WebGL is off). Try another browser.</p>}
    </>
  );
}

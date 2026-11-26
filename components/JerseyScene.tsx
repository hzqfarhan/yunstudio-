'use client';

// The LEED 26 crew polo in 3D: a Marvelous Designer polo (public/jersey/polo.glb) printed with the real
// panels from the Illustrator file (public/jersey/model-*.jpg). Each pattern piece in the model is its own
// mesh, named front, back, sleeve_left, sleeve_right, cuff_*, collar, placket, buttons and tape.
//
// Three views:
//  - Worn: the polo on a faint see-through body. It is cloth (lib/cloth.ts): it drops on and settles, and
//    you can pull the fabric and watch it fall back. Drag around it to walk round the wearer.
//  - Hanging: the polo hangs on a hanger from a rail and swings under gravity. Drag to push it, flick
//    sideways to spin it on the hook. The hem trails behind the swing like fabric does.
//  - 360: the polo stands still and you turn the camera round it.

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import StageDeco from './StageDeco';
import { Cloth, wearerOutline } from '@/lib/cloth';

// Hanger and pivot (metres, model space: the shirt is centred on the origin, 0.69 m tall).
const NECK_Z = -0.017;
const PIVOT = new THREE.Vector3(0, 0.445, NECK_Z);
const ARM = 0.42; // hook to the shirt's centre of mass
const G = 9.81;
const TARGET_Y = 0.05;

type View = 'worn' | 'hang' | 'orbit';

export default function JerseyScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const api = useRef({ turn: (_s: 'front' | 'back') => {}, setView: (_v: View) => {}, setSpin: (_on: boolean) => {} });
  const [view, setView] = useState<View>('worn');
  const [spin, setSpin] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

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
    stage.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 20);

    // soft studio light for the fabric
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
    softbox(0xffffff, 0, 2, -3, 3, 1.5);
    softbox(0xff6fb8, -3.5, 0.5, 1, 1.5, 3);
    softbox(0xfff2a8, 3.5, 1, -1, 1.5, 3);
    const envTex = pmrem.fromScene(env, 0.04).texture;
    scene.environment = envTex;
    scene.add(new THREE.HemisphereLight(0xf1e8ff, 0x2b0a5c, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(0.6, 1.2, 1.4);
    scene.add(key);
    const backLight = new THREE.DirectionalLight(0xe2d4ff, 1.6);
    backLight.position.set(-0.8, 0.8, -1.4);
    scene.add(backLight);

    // Cloth sway: every shirt material bends its lower half by these amounts, set each frame from the swing.
    const sway = { uSway: { value: new THREE.Vector2() }, uFlare: { value: 0 }, uTime: { value: 0 } };
    const withSway = <M extends THREE.Material>(m: M) => {
      m.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, sway);
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nuniform vec2 uSway;\nuniform float uFlare;\nuniform float uTime;')
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            float hang = clamp((0.33 - position.y) / 0.68, 0.0, 1.0);
            float bend = hang * hang;
            transformed.x += uSway.x * bend;
            transformed.z += uSway.y * bend;
            transformed.xz += normalize(position.xz + vec2(1e-4)) * uFlare * bend;
            transformed.x += sin(uTime * 2.3 + position.y * 9.0) * 0.0015 * bend;
            transformed.z += sin(uTime * 1.7 + position.x * 7.0) * 0.0015 * bend;`,
          );
      };
      return m;
    };

    const loader = new THREE.TextureLoader();
    const tex = (src: string) => {
      const t = loader.load(src);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    };
    const fabric = (opts: THREE.MeshPhysicalMaterialParameters) =>
      withSway(new THREE.MeshPhysicalMaterial({ roughness: 0.8, metalness: 0, sheen: 0.4, sheenRoughness: 0.55, sheenColor: new THREE.Color('#e6d2ff'), side: THREE.DoubleSide, ...opts }));
    const printed = (src: string) => fabric({ map: tex(src) });
    const MATERIALS: Record<string, THREE.Material> = {
      front: printed('/jersey/model-front.jpg'),
      back: printed('/jersey/model-back.jpg'),
      sleeve_right: printed('/jersey/model-sleeve-crew.jpg'),
      sleeve_left: printed('/jersey/model-sleeve-2026.jpg'),
      cuff_right: fabric({ color: '#c57ebf' }),
      cuff_left: fabric({ color: '#c57ebf' }),
      collar: fabric({ color: '#141217', roughness: 0.72, sheen: 0.25 }),
      placket: fabric({ color: '#3e153b' }),
      tape: fabric({ color: '#33102f' }),
      buttons: withSway(new THREE.MeshPhysicalMaterial({ color: '#0d0c10', roughness: 0.3, clearcoat: 0.6 })),
    };

    // swing (tilt about the hook) > spin (turn on the hook) > shirt + hanger, offset so the hook is the pivot
    const swingG = new THREE.Group();
    swingG.position.copy(PIVOT);
    const spinG = new THREE.Group();
    swingG.add(spinG);
    const body = new THREE.Group();
    body.position.copy(PIVOT).negate();
    spinG.add(body);
    scene.add(swingG);

    // chrome hanger: hook loop and neck above the collar, shoulder bar hidden inside the shirt
    const metal = new THREE.MeshPhysicalMaterial({ color: '#d9d6e2', metalness: 1, roughness: 0.22 });
    const hookPts: THREE.Vector3[] = [];
    for (let a = -0.25; a <= Math.PI * 1.15; a += 0.12) hookPts.push(new THREE.Vector3(Math.cos(a) * 0.024, 0.42 + Math.sin(a) * 0.024, NECK_Z));
    hookPts.reverse();
    const hangerPts = [
      ...hookPts,
      new THREE.Vector3(0.012, 0.392, NECK_Z),
      new THREE.Vector3(0, 0.37, NECK_Z),
      new THREE.Vector3(0, 0.335, NECK_Z),
      new THREE.Vector3(0.17, 0.27, NECK_Z),
      new THREE.Vector3(-0.17, 0.27, NECK_Z),
      new THREE.Vector3(0, 0.335, NECK_Z),
    ];
    const hanger = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hangerPts, false, 'centripetal'), 200, 0.0028, 10, false), metal);
    body.add(hanger);
    // the rail it hangs from (stays still)
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9, 24), metal);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, PIVOT.y - 0.004, NECK_Z);
    scene.add(rail);

    // soft round shadow under the hem
    const sc = document.createElement('canvas');
    sc.width = sc.height = 128;
    const g2 = sc.getContext('2d');
    if (g2) {
      const grad = g2.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, 'rgba(10,2,30,0.5)');
      grad.addColorStop(1, 'rgba(10,2,30,0)');
      g2.fillStyle = grad;
      g2.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(sc);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.38), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.42;
    scene.add(shadow);

    // ----- Worn view: a faint see-through wearer, and the shirt as cloth -----
    const ghostGeos: THREE.BufferGeometry[] = [];
    {
      const tube = (rings: number[][][]) => {
        const pos: number[] = [];
        const idx: number[] = [];
        const cols = rings[0].length;
        for (const ring of rings) for (const p of ring) pos.push(p[0], p[1], p[2]);
        for (let r = 0; r < rings.length - 1; r++)
          for (let c = 0; c < cols - 1; c++) {
            const q = r * cols + c;
            idx.push(q, q + cols, q + 1, q + 1, q + cols, q + cols + 1);
          }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        // make the faces point outwards
        const n = g.attributes.normal;
        const mid = rings[Math.floor(rings.length / 2)];
        const cx = mid.reduce((a, p) => a + p[0], 0) / mid.length;
        const cz = mid.reduce((a, p) => a + p[2], 0) / mid.length;
        const k = Math.floor(rings.length / 2) * cols;
        if (n.getX(k) * (mid[0][0] - cx) + n.getZ(k) * (mid[0][2] - cz) < 0) {
          for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
          g.setIndex(idx);
          g.computeVertexNormals();
        }
        return g;
      };
      const o = wearerOutline();
      ghostGeos.push(tube(o.torso), tube(o.arm), tube(o.arm.map((ring) => ring.map(([x, y, z]) => [-x, y, z]).reverse())));
    }
    // brighter at the silhouette, almost clear where it faces you, like glass
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0x6a3fc0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.FrontSide });
    ghostMat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vRim;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvec3 vn = normalize(normalMatrix * normal);\nvRim = 1.0 - abs(dot(vn, normalize(-mvPosition.xyz)));');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vRim;')
        .replace('#include <opaque_fragment>', '#include <opaque_fragment>\ngl_FragColor.a *= 0.35 + 2.2 * pow(vRim, 2.0);');
    };
    // an invisible copy drawn first fills the depth buffer, so the body hides the inside of the shirt behind it
    const ghostDepthMat = new THREE.MeshBasicMaterial({ colorWrite: false });
    const wearer = new THREE.Group();
    for (const g of ghostGeos) {
      const d = new THREE.Mesh(g, ghostDepthMat);
      d.renderOrder = -1;
      wearer.add(d, new THREE.Mesh(g, ghostMat));
    }
    scene.add(wearer);

    const shirt: THREE.Mesh[] = [];
    const restPos: Float32Array[] = [];
    const restNrm: Float32Array[] = [];
    let cloth: Cloth | null = null;
    // put the modelled shape back (for the Hanging and 360 views)
    const unpose = () => {
      shirt.forEach((m, k) => {
        (m.geometry.attributes.position.array as Float32Array).set(restPos[k]);
        (m.geometry.attributes.normal.array as Float32Array).set(restNrm[k]);
        m.geometry.attributes.position.needsUpdate = true;
        m.geometry.attributes.normal.needsUpdate = true;
      });
    };
    const pose = () => {
      if (!cloth) return;
      shirt.forEach((m, k) => {
        const pa = m.geometry.attributes.position as THREE.BufferAttribute;
        cloth!.pose(k, pa);
        pa.needsUpdate = true;
        m.geometry.computeVertexNormals();
      });
    };

    let disposed = false;
    new GLTFLoader().load(
      '/jersey/polo.glb',
      (gltf) => {
        if (disposed) return;
        gltf.scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.material = MATERIALS[o.name] ?? MATERIALS.placket;
            o.frustumCulled = false;
            shirt.push(o);
            restPos.push((o.geometry.attributes.position.array as Float32Array).slice());
            restNrm.push((o.geometry.attributes.normal.array as Float32Array).slice());
          }
        });
        body.add(gltf.scene);
        cloth = new Cloth(shirt.map((m) => ({ pos: restPos[shirt.indexOf(m)], index: m.geometry.index!.array })));
        if (mode === 'worn') {
          cloth.reset();
          pose();
        }
        setLoading(false);
      },
      undefined,
      () => {
        if (!disposed) setFailed(true);
      },
    );

    // camera: fixed in Hanging view, orbit controls in 360 view
    let mode: View = 'worn';
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, TARGET_Y, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.rotateSpeed = 0.8;
    controls.autoRotateSpeed = 1.6;
    controls.enabled = true;

    // fit the shirt, hanger and rail (about 0.9 m tall, 0.8 m wide) with room around it
    const fitDist = () => {
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      return Math.max(0.9 / (0.7 * 2 * t), 0.8 / (0.84 * 2 * t * camera.aspect));
    };
    const home = () => {
      const d = fitDist();
      camera.position.set(0, TARGET_Y + d * 0.08, d);
      controls.target.set(0, TARGET_Y, 0);
    };
    // Worn view: the wearer from the neck (y 0.45) to the hips (y -0.45), front on
    const wornDist = () => {
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      return Math.max(0.9 / (0.74 * 2 * t), 0.78 / (0.86 * 2 * t * camera.aspect));
    };
    const homeWorn = () => {
      const d = wornDist();
      camera.position.set(0, 0.02 + d * 0.06, d);
      controls.target.set(0, 0.0, 0);
    };
    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const d = mode === 'worn' ? wornDist() : fitDist();
      controls.minDistance = d * 0.4;
      controls.maxDistance = d * 1.6;
      if (mode === 'hang') home();
    };
    resize();
    // start in the Worn view
    hanger.visible = false;
    rail.visible = false;
    shadow.visible = false;
    homeWorn();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    // --- physics: a pendulum on the hook (tilt ax, az) that can also turn on the hook (yaw) ---
    const s = { ax: 0, az: 0, vx: 0, vz: 0, yaw: 0, vyaw: 0 };
    let yawGoal: number | null = null;
    let spinning = false;
    let dragging = false;
    const lag = new THREE.Vector2(); // smoothed hem offset, world space

    const step = (dt: number, t: number) => {
      const k = G / ARM;
      const damp = 0.9;
      // a gentle draught keeps it alive when nobody touches it
      const breeze = calm || dragging ? 0 : 0.06 * Math.sin(t * 0.7) + 0.04 * Math.sin(t * 1.9 + 1.3);
      s.vx += (-k * Math.sin(s.ax) - damp * s.vx) * dt;
      s.vz += (-k * Math.sin(s.az) - damp * s.vz + breeze) * dt;
      // the hook resists turning a little; Spin drives it round; Front/Back turn it to a side
      let yawAcc = -0.6 * s.vyaw;
      if (spinning) yawAcc += 1.4 * (0.9 - s.vyaw);
      if (yawGoal !== null) {
        const diff = Math.atan2(Math.sin(yawGoal - s.yaw), Math.cos(yawGoal - s.yaw));
        yawAcc += 14 * diff - 5 * s.vyaw;
        if (Math.abs(diff) < 0.004 && Math.abs(s.vyaw) < 0.02) yawGoal = null;
      }
      s.vyaw += yawAcc * dt;
      s.ax = THREE.MathUtils.clamp(s.ax + s.vx * dt, -1.1, 1.1);
      s.az = THREE.MathUtils.clamp(s.az + s.vz * dt, -1.1, 1.1);
      s.yaw += s.vyaw * dt;
    };

    // --- dragging pushes the shirt; a sideways flick spins it ---
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let grabSide = 0; // how far off-centre the grab was, for spin strength
    // Worn view: pressing on the shirt pulls the fabric; pressing beside it turns the view (OrbitControls)
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane();
    const hitP = new THREE.Vector3();
    let pulling = false;
    const setNdc = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    const onWornDown = (e: PointerEvent) => {
      if (mode !== 'worn' || !cloth) return;
      setNdc(e);
      ray.setFromCamera(ndc, camera);
      const h = ray.intersectObjects(shirt, false)[0];
      if (!h || !h.face) return;
      // the pull is ours, not a turn of the view
      controls.enabled = false;
      pulling = true;
      setPulling(true);
      controls.autoRotate = false;
      setSpin(false);
      plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), h.point);
      cloth.startGrab(shirt.indexOf(h.object as THREE.Mesh), h.face.a, [h.point.x, h.point.y, h.point.z]);
      canvas.setPointerCapture(e.pointerId);
    };
    const onWornMove = (e: PointerEvent) => {
      if (!pulling || !cloth) return;
      setNdc(e);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hitP)) cloth.moveGrab([hitP.x, hitP.y, hitP.z]);
    };
    const onWornUp = () => {
      if (!pulling) return;
      pulling = false;
      setPulling(false);
      cloth?.endGrab();
      controls.enabled = true;
    };
    canvas.addEventListener('pointerdown', onWornDown, { capture: true });
    canvas.addEventListener('pointermove', onWornMove);
    canvas.addEventListener('pointerup', onWornUp);
    canvas.addEventListener('pointercancel', onWornUp);

    const onDown = (e: PointerEvent) => {
      if (mode !== 'hang') return;
      dragging = true;
      yawGoal = null;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      const r = canvas.getBoundingClientRect();
      grabSide = Math.min(1, Math.abs(((e.clientX - r.left) / r.width - 0.5) * 2.5));
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dtm = Math.max(8, now - lastT) / 1000;
      const r = canvas.getBoundingClientRect();
      const dx = (e.clientX - lastX) / r.width;
      const dy = (e.clientY - lastY) / r.height;
      // steer the swing towards the pointer's speed (in screen widths per second):
      // sideways swings it left and right, up and down swings it towards and away from you
      s.vz += ((dx / dtm) * 1.5 - s.vz) * 0.35;
      s.vx += ((dy / dtm) * 1.0 - s.vx) * 0.25;
      // a sideways flick also turns it on the hook, more when grabbed near the edge
      const spinTo = (dx / dtm) * 3 * (0.3 + grabSide);
      if (Math.abs(spinTo) > Math.abs(s.vyaw) * 0.5) s.vyaw += (spinTo - s.vyaw) * 0.3;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    const onStart = () => {
      controls.autoRotate = false;
      setSpin(false);
    };
    controls.addEventListener('start', onStart);

    // camera goal for Front/Back in 360 view
    let camGoal: number | null = null;
    const sph = new THREE.Spherical();
    const off = new THREE.Vector3();

    api.current = {
      turn: (side) => {
        const target = side === 'front' ? 0 : Math.PI;
        if (mode === 'hang') {
          // turn the shirt itself, the short way round
          const n = Math.round((s.yaw - target) / (2 * Math.PI));
          yawGoal = target + n * 2 * Math.PI;
          spinning = false;
        } else {
          camGoal = target;
          controls.autoRotate = false;
        }
        setSpin(false);
      },
      setView: (v) => {
        const was = mode;
        mode = v;
        setView(v);
        controls.enabled = v !== 'hang';
        spinning = false;
        camGoal = null;
        const worn = v === 'worn';
        wearer.visible = worn;
        hanger.visible = !worn;
        rail.visible = !worn;
        shadow.visible = !worn;
        if (worn) {
          // stand the shirt still and upright on the wearer, and drop it on afresh
          Object.assign(s, { ax: 0, az: 0, vx: 0, vz: 0, yaw: 0, vyaw: 0 });
          yawGoal = null;
          controls.autoRotate = false;
          setSpin(false);
          homeWorn();
          resize();
          if (cloth) {
            cloth.reset();
            pose();
          }
          return;
        }
        if (was === 'worn') {
          cloth?.endGrab();
          unpose();
        }
        resize();
        if (v === 'orbit') {
          // settle the shirt facing the front, then let the camera turn round it
          home();
          Object.assign(s, { ax: 0, az: 0, vx: 0, vz: 0, vyaw: 0 });
          s.yaw = Math.atan2(Math.sin(s.yaw), Math.cos(s.yaw));
          yawGoal = 0;
          controls.autoRotate = true;
          setSpin(true);
        } else {
          controls.autoRotate = false;
          setSpin(false);
          home();
        }
      },
      setSpin: (on) => {
        if (mode !== 'hang') controls.autoRotate = on;
        else spinning = on;
        setSpin(on);
      },
    };

    let raf = 0;
    let prev = performance.now();
    let acc = 0;
    const H = 1 / 120;
    const tick = () => {
      const now = performance.now();
      acc += Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const t = now / 1000;
      if (mode === 'hang' || yawGoal !== null) {
        while (acc >= H) {
          step(H, t);
          acc -= H;
        }
      } else if (mode === 'worn' && cloth) {
        // the cloth, at 60 steps a second (at most two per frame, so a slow phone slows it rather than stalls)
        let n = 0;
        let moved = false;
        while (acc >= 1 / 60 && n < 2) {
          moved = cloth.step(1 / 60) || moved;
          acc -= 1 / 60;
          n++;
        }
        if (n === 2) acc = 0;
        if (moved) pose();
      } else acc = 0;

      swingG.rotation.set(s.ax, 0, s.az);
      spinG.rotation.y = s.yaw;

      // the hem trails behind the swing (turned into the shirt's own frame); spinning flares it out
      lag.x += (-s.vz * 0.05 - lag.x) * 0.08;
      lag.y += (s.vx * 0.05 - lag.y) * 0.08;
      const c = Math.cos(s.yaw);
      const sn = Math.sin(s.yaw);
      sway.uSway.value.set(THREE.MathUtils.clamp(c * lag.x - sn * lag.y, -0.08, 0.08), THREE.MathUtils.clamp(sn * lag.x + c * lag.y, -0.08, 0.08));
      sway.uFlare.value = Math.min(0.04, s.vyaw * s.vyaw * 0.006);
      sway.uTime.value = calm ? 0 : t;
      if (mode === 'worn') {
        // on the wearer the cloth moves for real; no painted-on sway
        sway.uSway.value.set(0, 0);
        sway.uFlare.value = 0;
        sway.uTime.value = 0;
      }

      // the floor shadow follows the hem
      shadow.position.x = Math.sin(s.az) * ARM * 1.6;
      shadow.position.z = -Math.sin(s.ax) * ARM * 1.6;

      if (camGoal !== null) {
        off.copy(camera.position).sub(controls.target);
        sph.setFromVector3(off);
        const diff = Math.atan2(Math.sin(camGoal - sph.theta), Math.cos(camGoal - sph.theta));
        if (Math.abs(diff) < 0.002) camGoal = null;
        else {
          sph.theta += diff * 0.12;
          off.setFromSpherical(sph);
          camera.position.copy(controls.target).add(off);
        }
      }
      if (mode !== 'hang') controls.update();
      else camera.lookAt(controls.target);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onWornDown, { capture: true });
      canvas.removeEventListener('pointermove', onWornMove);
      canvas.removeEventListener('pointerup', onWornUp);
      canvas.removeEventListener('pointercancel', onWornUp);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      controls.removeEventListener('start', onStart);
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      for (const m of [...Object.values(MATERIALS), metal, shadowMat, ghostMat, ghostDepthMat]) {
        (m as THREE.MeshPhysicalMaterial).map?.dispose();
        m.dispose();
      }
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <>
      <StageDeco light />
      <div ref={stageRef} className={`stage${pulling ? ' is-dragging' : ''}`} aria-label="3D preview of the LEED 26 crew polo, worn or on a hanger." />
      <header className="cap cap--light">
        <Link href="/" className="cap-back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          All passes
        </Link>
        <h1>Crew polo</h1>
        <p className="cap-sub">LEED 26, FSKTM</p>
      </header>
      <div className="dock">
        <p className="dock-tip">{view === 'worn' ? 'Pull the shirt to move it, drag beside it to turn' : view === 'hang' ? 'Drag to swing it, flick sideways to spin it' : 'Drag to turn, pinch to zoom'}</p>
        <div className="dock-row">
          <div className="modes" role="radiogroup" aria-label="View">
            {(
              [
                ['worn', 'Worn'],
                ['hang', 'Hanging'],
                ['orbit', '360°'],
              ] as const
            ).map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => api.current.setView(v)}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="dock-btn" onClick={() => api.current.turn('front')}>
            Front
          </button>
          <button type="button" className="dock-btn" onClick={() => api.current.turn('back')}>
            Back
          </button>
          <button type="button" className={`dock-btn${spin ? ' dock-btn--go' : ''}`} aria-pressed={spin} onClick={() => api.current.setSpin(!spin)}>
            Spin
          </button>
        </div>
      </div>
      {loading && !failed && <p className="jersey-loading">Loading the polo…</p>}
      {failed && <p className="err err--light">The 3D polo could not load on this device. Check your connection, or try another browser.</p>}
    </>
  );
}

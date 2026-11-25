'use client';

// 5-second intro on the crew page: the passes fly in and fan out, the title lands, then it fades to the gallery.
// Skip with the button or Esc. Plays once per browser session, and not at all with reduced motion.

import { useEffect, useState, type CSSProperties } from 'react';

// Floating LEED shapes for the background. cx/cy in % of the screen, s = size, d = delay,
// x/y/r = how far each one drifts and turns.
const Y = '#ffd91a';
const P = '#ff4fa3';
const T = '#2ee6c8';
const W = '#ffffff';
const ring = (c: string) => <circle r="3" fill="none" stroke={c} strokeWidth="1.1" />;
const tri = (c: string) => <path d="M0 -3.2 L3 2.4 L-3 2.4 Z" fill={c} />;
const zig = (c: string) => <path d="M-5 0 L-3 -2 L-1 0 L1 -2 L3 0 L5 -2" fill="none" stroke={c} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" />;
const plus = (c: string) => <path d="M-2.4 0 H2.4 M0 -2.4 V2.4" stroke={c} strokeWidth="1.1" strokeLinecap="round" />;
const spark = (c: string) => <path d="M0 -3.4 C0.5 -0.6 0.6 -0.5 3.4 0 C0.6 0.5 0.5 0.6 0 3.4 C-0.5 0.6 -0.6 0.5 -3.4 0 C-0.6 -0.5 -0.5 -0.6 0 -3.4 Z" fill={c} />;
const bolt = (c: string) => <path d="M0.8 -4 L-2.2 0.6 H0 L-0.8 4 L2.2 -0.8 H0 Z" fill={c} />;
const dot = (c: string) => <circle r="1.2" fill={c} />;
const SHAPES = [
  { el: ring(Y), cx: 10, cy: 16, s: 1.4, d: 0.1, x: 18, y: -26, r: 0 },
  { el: tri(P), cx: 86, cy: 14, s: 1.2, d: 0.3, x: -20, y: 22, r: 140 },
  { el: zig(T), cx: 16, cy: 78, s: 1.3, d: 0.5, x: 30, y: -10, r: -12 },
  { el: spark(Y), cx: 90, cy: 70, s: 1.3, d: 0.2, x: -14, y: -30, r: 90 },
  { el: plus(W), cx: 30, cy: 10, s: 1, d: 0.7, x: 10, y: 24, r: 180 },
  { el: bolt(Y), cx: 72, cy: 88, s: 1.4, d: 0.4, x: -24, y: -18, r: 18 },
  { el: dot(P), cx: 6, cy: 46, s: 1.5, d: 0.6, x: 22, y: 12, r: 0 },
  { el: ring(P), cx: 94, cy: 40, s: 1, d: 0.8, x: -18, y: 16, r: 0 },
  { el: tri(T), cx: 40, cy: 92, s: 0.9, d: 0.9, x: 16, y: -22, r: -120 },
  { el: spark(W), cx: 58, cy: 8, s: 0.8, d: 1, x: -12, y: 20, r: -90 },
  { el: zig(Y), cx: 80, cy: 26, s: 0.9, d: 1.1, x: -26, y: 8, r: 10 },
  { el: plus(P), cx: 22, cy: 58, s: 0.9, d: 1.2, x: 14, y: -16, r: -180 },
  { el: dot(T), cx: 64, cy: 74, s: 1.2, d: 1.3, x: -10, y: -14, r: 0 },
  { el: bolt(P), cx: 4, cy: 92, s: 1, d: 1.4, x: 18, y: -20, r: -16 },
];

const SEEN_KEY = 'leed26-intro-seen';
const LENGTH = 5000;
const FADE = 600;

export default function CrewIntro({ cards }: { cards: string[] }) {
  const [state, setState] = useState<'play' | 'out' | 'done'>('play');

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage blocked: just play */
    }
    if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('done');
      return;
    }
    const out = window.setTimeout(() => setState('out'), LENGTH - FADE);
    const done = window.setTimeout(() => setState('done'), LENGTH);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && skip();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(done);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const skip = () => {
    setState('out');
    window.setTimeout(() => setState('done'), 300);
  };

  if (state === 'done' || cards.length === 0) return null;
  const n = cards.length;

  return (
    <div className={`intro${state === 'out' ? ' is-out' : ''}`} role="dialog" aria-label="LEED 26 crew passes intro">
      <span className="intro-blob intro-blob--a" aria-hidden="true" />
      <span className="intro-blob intro-blob--b" aria-hidden="true" />
      <span className="intro-blob intro-blob--c" aria-hidden="true" />
      <span className="intro-dots" aria-hidden="true" />
      <div className="intro-shapes" aria-hidden="true">
        {SHAPES.map((sh, i) => (
          <span
            key={i}
            className="intro-shape"
            style={
              { left: `${sh.cx}%`, top: `${sh.cy}%`, '--k': sh.s, '--sd': `${sh.d}s`, '--sx': `${sh.x}px`, '--sy': `${sh.y}px`, '--sr': `${sh.r}deg` } as CSSProperties
            }
          >
            <svg viewBox="-6 -6 12 12">{sh.el}</svg>
          </span>
        ))}
      </div>
      <div className="intro-fan" aria-hidden="true">
        {cards.map((src, i) => {
          const k = i - (n - 1) / 2;
          return (
            <span
              key={src}
              className="intro-card"
              style={
                {
                  '--k': k,
                  '--ak': Math.abs(k),
                  '--d': `${i * 0.16}s`,
                  '--from': k < 0 ? -1 : 1,
                } as CSSProperties
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" decoding="async" />
            </span>
          );
        })}
      </div>
      <div className="intro-title">
        <p className="intro-kicker">9 &amp; 10 December 2026</p>
        <h2>LEED 26 crew</h2>
      </div>
      <button type="button" className="intro-skip" onClick={skip}>
        Skip intro
      </button>
      <span className="intro-bar" aria-hidden="true" />
    </div>
  );
}

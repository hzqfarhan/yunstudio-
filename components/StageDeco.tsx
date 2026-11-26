'use client';

// A few LEED shapes around the edges of the pass page, drifting slowly behind the card.
export const DECO: { d: string; fill?: string; stroke?: string; x: number; y: number; dx: number; dy: number; dr: number }[] = [
  { d: 'M0 -3 A3 3 0 1 0 0.01 -3', stroke: '#ffd91a', x: 8, y: 22, dx: 14, dy: -18, dr: 0 },
  { d: 'M0 -3.2 L3 2.4 L-3 2.4 Z', fill: '#ff4fa3', x: 88, y: 16, dx: -16, dy: 18, dr: 120 },
  { d: 'M-5 0 L-3 -2 L-1 0 L1 -2 L3 0 L5 -2', stroke: '#2ee6c8', x: 12, y: 70, dx: 22, dy: -10, dr: -10 },
  { d: 'M0 -3.4 C0.5 -0.6 0.6 -0.5 3.4 0 C0.6 0.5 0.5 0.6 0 3.4 C-0.5 0.6 -0.6 0.5 -3.4 0 C-0.6 -0.5 -0.5 -0.6 0 -3.4 Z', fill: '#ffd91a', x: 90, y: 60, dx: -12, dy: -20, dr: 80 },
  { d: 'M0.8 -4 L-2.2 0.6 H0 L-0.8 4 L2.2 -0.8 H0 Z', fill: '#ff4fa3', x: 6, y: 46, dx: 14, dy: 14, dr: -14 },
  { d: 'M-2.4 0 H2.4 M0 -2.4 V2.4', stroke: '#ffffff', x: 92, y: 36, dx: -10, dy: 14, dr: 160 },
];

/** Glows, dots and drifting LEED shapes behind a 3D scene. */
export default function StageDeco() {
  return (
    <div className="stage-deco" aria-hidden="true">
      {DECO.map((k, i) => (
        <span
          key={i}
          style={{ left: `${k.x}%`, top: `${k.y}%`, animationDelay: `${-i * 1.3}s`, ['--dx' as string]: `${k.dx}px`, ['--dy' as string]: `${k.dy}px`, ['--dr' as string]: `${k.dr}deg` }}
        >
          <svg viewBox="-6 -6 12 12">
            <path d={k.d} fill={k.fill ?? 'none'} stroke={k.stroke} strokeWidth={k.stroke ? 1.1 : 0} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ))}
    </div>
  );
}

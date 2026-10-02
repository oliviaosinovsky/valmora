import {useEffect, useRef, useState, type RefObject} from 'react';
import {specs} from '../content';
import {clamp, easeOutCubic, lerp, pinProgress, range} from '../lib/math';
import {onFrame} from '../lib/scroll';
import {CurveEdge} from './CurveEdge';

/**
 * The specification as an instrument cluster. The section pins while a
 * tachometer needle sweeps toward the redline with the scroll; each figure
 * takes the centre of the dial in turn and counts up to its reading, the
 * list beside it follows, and five shift lights fire as the needle nears
 * the red — flashing once it's in.
 */

const SECTION_VH = 420;
const START = -225; // dial angle for 0 rpm (degrees, 0 = east)
const SWEEP = 270;
const MAX_RPM = 8;
const REDLINE = 7;

const angleFor = (rpm: number) => ((START + (rpm / MAX_RPM) * SWEEP) * Math.PI) / 180;
const polar = (r: number, a: number) => ({x: 200 + Math.cos(a) * r, y: 200 + Math.sin(a) * r});

function Dial({needleRef, arcRef}: {needleRef: RefObject<SVGGElement | null>; arcRef: RefObject<SVGPathElement | null>}) {
  const ticks = [];
  for (let i = 0; i <= MAX_RPM * 5; i++) {
    const rpm = i / 5;
    const a = angleFor(rpm);
    const major = i % 5 === 0;
    const p1 = polar(major ? 150 : 158, a);
    const p2 = polar(168, a);
    ticks.push(<line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={rpm >= REDLINE ? '#a3303a' : 'rgb(241 236 227 / 0.6)'} strokeWidth={major ? 2 : 1} />);
    if (major) {
      const t = polar(128, a);
      ticks.push(
        <text key={`t${i}`} x={t.x} y={t.y + 5} textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="14" fill={rpm >= REDLINE ? '#c9535c' : 'rgb(241 236 227 / 0.7)'}>
          {rpm}
        </text>,
      );
    }
  }
  const r0 = polar(176, angleFor(REDLINE));
  const r1 = polar(176, angleFor(MAX_RPM));
  const s0 = polar(176, angleFor(0));
  const full = polar(176, angleFor(MAX_RPM));
  return (
    <svg viewBox="0 0 400 400" className="size-full" aria-hidden="true">
      <circle cx="200" cy="200" r="194" fill="#0f0d0b" stroke="rgb(201 163 106 / 0.5)" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="186" fill="none" stroke="rgb(241 236 227 / 0.08)" />
      {/* Red zone. */}
      <path d={`M${r0.x} ${r0.y} A176 176 0 0 1 ${r1.x} ${r1.y}`} fill="none" stroke="#a3303a" strokeWidth="6" />
      {/* Sweep trail that fills behind the needle. */}
      <path ref={arcRef} d={`M${s0.x} ${s0.y} A176 176 0 1 1 ${full.x} ${full.y}`} pathLength={1} fill="none" stroke="var(--color-brass)" strokeWidth="2" strokeDasharray="1 1" strokeDashoffset="1" opacity="0.9" />
      {ticks}
      <text x="200" y="300" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="11" letterSpacing="3" fill="rgb(241 236 227 / 0.45)">
        RPM × 1000
      </text>
      <g ref={needleRef} style={{transformOrigin: '200px 200px'}}>
        <line x1="200" y1="200" x2="200" y2="48" stroke="#e8d6b5" strokeWidth="3" strokeLinecap="round" />
        <line x1="200" y1="200" x2="200" y2="232" stroke="#e8d6b5" strokeWidth="5" strokeLinecap="round" />
      </g>
      <circle cx="200" cy="200" r="13" fill="#1b1814" stroke="var(--color-brass)" strokeWidth="1.5" />
    </svg>
  );
}

export function Specs() {
  const rootRef = useRef<HTMLElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const arcRef = useRef<SVGPathElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const ledRefs = useRef<HTMLSpanElement[]>([]);
  const rpmRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const n = specs.items.length;

  useEffect(() => {
    let lastP = -1;
    let current = -1;
    const fmt = (v: number, d: number) => v.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
    return onFrame((time) => {
      const root = rootRef.current;
      if (!root) return;
      const {p, rect, vh} = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) return;

      const u = range(p, 0.05, 0.92);
      const rpm = lerp(0.8, 7.35, easeOutCubic(u));
      const inRed = rpm >= REDLINE;
      // A little needle chatter at the redline, every frame.
      const chatter = inRed ? Math.sin(time * 0.06) * 0.6 : 0;
      needleRef.current!.style.transform = `rotate(${(rpm / MAX_RPM) * SWEEP - 135 + chatter}deg)`;

      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      arcRef.current!.style.strokeDashoffset = String(1 - rpm / MAX_RPM);
      rpmRef.current!.textContent = Math.round(rpm * 1000).toLocaleString('en-US');

      const idx = clamp(Math.floor(u * n), 0, n - 1);
      if (idx !== current) {
        current = idx;
        setActive(idx);
      }
      const local = clamp(u * n - idx);
      const item = specs.items[idx];
      valueRef.current!.textContent = fmt(item.value * easeOutCubic(clamp(local / 0.55)), item.decimals);

      ledRefs.current.forEach((led, i) => {
        const on = rpm >= 5.4 + i * 0.35;
        led.style.opacity = on ? '1' : '0.15';
        led.style.backgroundColor = i >= 3 ? '#c9535c' : '#e8c46a';
      });
    });
  }, [n]);

  const item = specs.items[active];

  return (
    <section ref={rootRef} id="specs" aria-labelledby="specs-title" className="relative bg-ink-2" style={{height: `${SECTION_VH}svh`}}>
      <CurveEdge color="var(--color-ink-2)" />
      <div className="sticky top-0 grid h-screen-s content-center gap-8 overflow-hidden px-4 pt-16 sm:px-6 md:grid-cols-12 md:gap-10 md:px-[4vw] md:pt-0">
        {/* The dial. */}
        <div className="relative mx-auto w-[min(82vw,52svh)] md:col-span-6 md:w-[min(40vw,74svh)]">
          {/* Shift lights. */}
          <div className="mb-4 flex justify-center gap-2" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                ref={(el) => {
                  if (el) ledRefs.current[i] = el;
                }}
                className="size-2.5 rounded-full shadow-[0_0_10px_currentColor] transition-opacity duration-150"
                style={{opacity: 0.15, backgroundColor: '#e8c46a'}}
              />
            ))}
          </div>
          <div className="relative aspect-square">
            <Dial needleRef={needleRef} arcRef={arcRef} />
            <div className="absolute inset-x-0 top-[57%] text-center">
              <p className="flex items-baseline justify-center gap-1.5">
                <span ref={valueRef} className="wide font-display text-[clamp(2rem,5vw,3.75rem)] leading-none font-extralight tabular-nums">
                  0
                </span>
                <span className="font-serif text-[clamp(1rem,1.8vw,1.5rem)] text-brass italic">{item.unit}</span>
              </p>
              <p className="mt-2 font-mono text-[0.625rem] tracking-[0.14em] text-chalk/60 uppercase">{item.label}</p>
            </div>
          </div>
          <p className="mt-3 text-center font-mono text-[0.625rem] tracking-[0.16em] text-chalk/45 uppercase" aria-hidden="true">
            <span ref={rpmRef}>800</span> rpm
          </p>
        </div>

        {/* The list. */}
        <div className="md:col-span-5 md:col-start-8">
          <p className="font-mono text-label text-brass uppercase">{specs.eyebrow}</p>
          <h2 id="specs-title" className="wide mt-3 font-display text-[clamp(1.5rem,2.8vw,2.75rem)] leading-none font-extralight uppercase">
            {specs.heading}
          </h2>
          <ol className="mt-6 md:mt-10">
            {specs.items.map((s, i) => {
              const on = i === active;
              const done = i < active;
              return (
                <li key={s.label} className="flex items-baseline justify-between gap-4 border-t border-chalk/10 py-2.5 md:py-3.5">
                  <span className={`font-mono text-[0.6875rem] tracking-[0.12em] uppercase transition-colors duration-500 ${on ? 'text-chalk' : done ? 'text-chalk/55' : 'text-chalk/25'}`}>
                    <span className={on ? 'text-brass' : ''}>0{i + 1}</span> · {s.label}
                  </span>
                  <span className={`wide font-display text-[clamp(1rem,1.6vw,1.375rem)] font-light tabular-nums transition-all duration-500 ${on ? 'translate-x-0 text-chalk' : done ? 'text-chalk/55' : 'translate-x-2 text-chalk/20'}`}>
                    {s.value.toLocaleString('en-US', {minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals})}
                    <span className="ml-1 font-serif text-[0.8em] italic">{s.unit}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 font-mono text-[0.625rem] tracking-[0.14em] text-chalk/40 uppercase">{specs.note}</p>
        </div>
      </div>
    </section>
  );
}

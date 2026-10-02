import {useEffect, useRef, useState} from 'react';
import {details} from '../content';
import {clamp, easeOutCubic, lerp, pinProgress, range, smoothstep} from '../lib/math';
import {onFrame, scrollToY} from '../lib/scroll';

/**
 * The exhibit tour. The revealed car fills the screen and the scroll works
 * the camera: it pushes in on each detail, holds, then eases out, travels
 * and eases back in to the next — a pull-back curve between every stop, the
 * way a camera operator would do it. A reticle locks on at each stop, a
 * leader line runs to the close-up card, and the card crossfades.
 */

const SECTION_VH = 520;
const IMG = {w: 2400, h: 1361};
const ZOOM = 2.3;

export function Details() {
  const rootRef = useRef<HTMLElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const leaderRef = useRef<SVGLineElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const n = details.items.length;

  useEffect(() => {
    let lastP = -1;
    let current = 0;
    return onFrame(() => {
      const root = rootRef.current;
      const plate = plateRef.current;
      if (!root || !plate) return;
      const {p, rect, vh} = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) return;
      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      const vw = window.innerWidth;
      const wide = vw >= 768;
      // Cover-fit the photograph to the screen.
      const s0 = Math.max(vw / IMG.w, vh / IMG.h);
      const w = IMG.w * s0;
      const h = IMG.h * s0;
      const ox = (vw - w) / 2;
      const oy = (vh - h) / 2;

      // Where a detail should land on screen while held.
      const target = wide ? {x: vw * 0.36, y: vh * 0.5} : {x: vw * 0.5, y: vh * 0.34};

      // u runs -1 (wide) → 0..n-1 (stops) → n (wide again).
      const u = lerp(-0.6, n - 0.4, range(p, 0.02, 0.98));
      const hot = (i: number) => {
        const d = details.items[clamp(i, 0, n - 1)];
        return {x: (d.x / 100) * w, y: (d.y / 100) * h};
      };

      let scale: number;
      let fx: number; // focal point in plate px
      let fy: number;
      let lock: number; // 0–1, how settled on a stop we are
      if (u <= 0) {
        // Push in from the full frame to the first stop.
        const k = smoothstep(clamp(u / 0.6 + 1));
        scale = lerp(1, ZOOM, k);
        const a = hot(0);
        // At scale 1 the plate sits at (ox, oy) when the focal is target − o.
        fx = lerp(target.x - ox, a.x, k);
        fy = lerp(target.y - oy, a.y, k);
        lock = range(k, 0.8, 1);
      } else if (u >= n - 1) {
        const k = smoothstep(clamp((u - (n - 1)) / 0.6));
        scale = lerp(ZOOM, 1, k);
        const a = hot(n - 1);
        fx = lerp(a.x, target.x - ox, k);
        fy = lerp(a.y, target.y - oy, k);
        lock = 1 - range(k, 0, 0.2);
      } else {
        const i = Math.floor(u);
        const t = u - i;
        const travel = smoothstep(range(t, 0.5, 1)); // hold for the first half
        const a = hot(i);
        const b = hot(i + 1);
        fx = lerp(a.x, b.x, travel);
        fy = lerp(a.y, b.y, travel);
        // The curve: ease out to a wider shot mid-travel, ease back in.
        scale = ZOOM - Math.sin(travel * Math.PI) * (ZOOM - 1.35);
        lock = 1 - Math.sin(travel * Math.PI);
      }

      // Put plate point (fx, fy) at the target on screen.
      plate.style.transform = `translate3d(${target.x - fx * scale}px, ${target.y - fy * scale}px, 0) scale(${scale})`;

      const idx = clamp(Math.round(u), 0, n - 1);
      if (idx !== current) {
        current = idx;
        setActive(idx);
      }

      // Reticle + leader line + card respond to how locked we are.
      const rk = easeOutCubic(lock);
      const ret = reticleRef.current!;
      ret.style.left = `${target.x}px`;
      ret.style.top = `${target.y}px`;
      ret.style.opacity = String(rk);
      ret.style.transform = `translate(-50%, -50%) scale(${lerp(1.8, 1, rk)}) rotate(${(1 - rk) * 45}deg)`;
      const card = cardRef.current!;
      const cr = card.getBoundingClientRect();
      const line = leaderRef.current!;
      line.setAttribute('x1', String(target.x + (wide ? 26 : 0)));
      line.setAttribute('y1', String(target.y + (wide ? 0 : 26)));
      line.setAttribute('x2', String(wide ? cr.left - 12 : vw / 2));
      line.setAttribute('y2', String(wide ? cr.top + 24 : cr.top - 12));
      line.style.strokeDashoffset = String(1 - rk);
      card.style.opacity = String(0.25 + rk * 0.75);
      shadeRef.current!.style.opacity = String(0.35 + rk * 0.35);
    });
  }, [n]);

  /** Clicking a stop scrolls the tour to it. */
  const goTo = (i: number) => {
    const root = rootRef.current;
    if (!root) return;
    const u = i;
    const p = lerp(0.02, 0.98, (u + 0.6) / (n - 0.4 + 0.6));
    scrollToY(root.offsetTop + p * (root.offsetHeight - window.innerHeight), false);
  };

  const item = details.items[active];

  return (
    <section ref={rootRef} id="details" aria-labelledby="details-title" className="relative bg-ink" style={{height: `${SECTION_VH}svh`}}>
      <div className="sticky top-0 h-screen-s overflow-hidden">
        <div ref={plateRef} className="absolute top-0 left-0 origin-top-left will-change-transform" style={{width: 'max(100vw, calc(100svh * 2400 / 1361))'}}>
          <img src={`${import.meta.env.BASE_URL}media/revealed.webp`} alt="The Valmora Alba GT in the museum hall." width={IMG.w} height={IMG.h} decoding="async" className="block h-auto w-full" />
        </div>
        <div ref={shadeRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_45%,rgb(12_11_10/0.85)_78%)] max-md:bg-[linear-gradient(180deg,transparent_45%,rgb(12_11_10/0.9)_70%)]" />

        {/* Reticle. */}
        <div ref={reticleRef} aria-hidden="true" className="pointer-events-none absolute size-14" style={{opacity: 0}}>
          <span className="absolute inset-0 rounded-full border border-chalk/80" />
          <span className="absolute inset-[38%] rounded-full bg-chalk shadow-[0_0_18px_rgb(241_236_227/0.9)]" />
          {[0, 90, 180, 270].map((d) => (
            <span key={d} className="absolute top-1/2 left-1/2 h-px w-3 origin-left bg-chalk" style={{transform: `rotate(${d}deg) translateX(30px)`}} />
          ))}
        </div>
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full">
          <line ref={leaderRef} pathLength={1} stroke="var(--color-brass)" strokeWidth="1" strokeDasharray="1 1" strokeDashoffset="1" />
        </svg>

        {/* Heading. */}
        <div className="absolute top-[5.5rem] left-4 sm:left-6 md:top-28 md:left-[4vw]">
          <p className="font-mono text-label text-brass uppercase">{details.eyebrow}</p>
          <h2 id="details-title" className="wide mt-3 max-w-[16ch] font-display text-[clamp(1.5rem,2.8vw,2.75rem)] leading-none font-extralight uppercase [text-shadow:0_2px_24px_rgb(0_0_0/0.6)]">
            {details.heading}
          </h2>
        </div>

        {/* Close-up card. */}
        <div ref={cardRef} className="absolute inset-x-4 bottom-20 sm:inset-x-6 md:inset-x-auto md:top-1/2 md:right-[4vw] md:bottom-auto md:w-[min(24rem,30vw)] md:-translate-y-1/2">
          <div key={item.id} className="animate-[fade-up_0.8s_cubic-bezier(0.2,0.7,0.1,1)]">
            <div className="flex items-baseline gap-4">
              <span className="wide font-display text-[clamp(3rem,6vw,5.5rem)] leading-none font-extralight text-transparent" style={{WebkitTextStroke: '1px var(--color-brass)'}}>
                {item.label}
              </span>
              <span className="font-mono text-label text-chalk/50 uppercase">/ 0{n}</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-[4px] max-md:hidden">
              <img src={item.image} alt={item.title} width={900} height={900} decoding="async" className="aspect-[4/3] w-full animate-[settle_1.8s_cubic-bezier(0.2,0.7,0.1,1)] object-cover" />
            </div>
            <h3 className="wide mt-5 font-display text-[1.375rem] font-light uppercase md:text-[1.625rem]">{item.title}</h3>
            <p className="mt-2 text-body text-chalk/75">{item.body}</p>
          </div>
        </div>

        {/* Stops. */}
        <nav aria-label="Details" className="absolute bottom-6 left-4 flex gap-5 sm:left-6 md:left-[4vw]">
          {details.items.map((d, i) => (
            <button key={d.id} type="button" onClick={() => goTo(i)} aria-current={i === active ? 'true' : undefined} className="group text-left">
              <span className={`block h-px w-12 transition-colors duration-500 md:w-20 ${i === active ? 'bg-brass' : 'bg-chalk/25 group-hover:bg-chalk/60'}`} />
              <span className={`mt-2 block font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors ${i === active ? 'text-chalk' : 'text-chalk/45'}`}>{d.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}

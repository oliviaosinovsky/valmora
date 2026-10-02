import {useEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react';
import {unveil} from '../content';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {FRAME_COUNT, loadFrames, type FrameSet} from '../lib/frames';
import {clamp, easeOutCubic, lerp, pinProgress, range, smoothstep} from '../lib/math';
import {onFrame, scrollToY} from '../lib/scroll';
import {createRemap} from '../lib/timeRemap';

/**
 * The unveiling — cut like a film, not scrubbed like a slider.
 *
 *   0.00 – 0.06  title card: REDISCOVER the CLASSICS, the arc, the handle
 *   0.03 – 0.88  the 21s film, speed-ramped: it lingers on the hero beats
 *                (headlamps through the linen, the grille uncovered, the
 *                sheet leaving the tail) and fast-forwards through the
 *                travelling shots, with eased ramps between them. Frames
 *                persist briefly at speed, which reads as motion blur.
 *                Letterbox bars close to 2.39:1 while it plays; chapter
 *                cards mark the three acts.
 *   0.86 – 1.00  name plate: VALMORA ALBA GT, 1961, the slogan
 */

const STAGE_VH = 900;
const FILM = [0.03, 0.88] as const;
const DURATION = 21;
const FPS = 24;

/** The edit: [share of the film window, seconds of film]. */
const REMAP = createRemap(
  [
    [0, 0],
    [0.11, 1.8], // hold: headlamps glowing through the linen
    [0.21, 5.6], // fast-forward: the orbit toward the nose
    [0.35, 8.4], // hold: the sheet leaves the grille, head-on
    [0.45, 12.3], // fast-forward: down the flank
    [0.62, 15.3], // hold: the linen billows off the tail
    [0.74, 17.5],
    [0.86, 19.5], // fast-forward: crane up and back
    [1, 21], // settle
  ],
  DURATION,
);

const CHAPTERS = [
  {at: 0.06, n: 'I', title: 'The veil'},
  {at: 0.33, n: 'II', title: 'The line'},
  {at: 0.6, n: 'III', title: 'Unveiled'},
];

/** Arc geometry, as shares of the viewport. Angles in degrees, 0 = east. */
const ARC = {cx: 0.46, cy: 0.62, r: 0.36, from: -58, to: 52};

type Box = {w: number; h: number};

function arcPoint(box: Box, t: number) {
  const r = Math.min(box.w * ARC.r, box.h * 0.46);
  const a = ((ARC.from + (ARC.to - ARC.from) * t) * Math.PI) / 180;
  return {x: box.w * ARC.cx + Math.cos(a) * r, y: box.h * ARC.cy + Math.sin(a) * r, r};
}

/** Film leader: 3-2-1 with a sweeping wedge while the first frames stream in. */
function Leader({progress, done}: {progress: number; done: boolean}) {
  const n = Math.max(1, 3 - Math.floor(progress * 3));
  const sweep = (progress * 3) % 1;
  const a = sweep * Math.PI * 2;
  const x = 50 + Math.sin(a) * 60;
  const y = 50 - Math.cos(a) * 60;
  const large = sweep > 0.5 ? 1 : 0;
  return (
    <div
      aria-hidden={done}
      role="status"
      className={`fixed inset-0 z-[60] grid place-items-center bg-ink transition-[opacity,visibility] duration-1000 ${done ? 'invisible opacity-0' : 'opacity-100'}`}
    >
      <span className="sr-only">Loading the film</span>
      <div className="relative size-48 md:size-60">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(241 236 227 / 0.25)" strokeWidth="0.6" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgb(241 236 227 / 0.18)" strokeWidth="0.6" />
          <path d="M50 0V100M0 50H100" stroke="rgb(241 236 227 / 0.15)" strokeWidth="0.4" />
          {sweep > 0.001 && <path d={`M50 50 L50 -10 A60 60 0 ${large} 1 ${x} ${y} Z`} fill="rgb(241 236 227 / 0.08)" />}
        </svg>
        <span className="wide absolute inset-0 grid place-items-center font-display text-[5rem] font-extralight text-chalk/90 tabular-nums">{n}</span>
      </div>
      <p className="absolute bottom-10 font-mono text-[0.625rem] tracking-[0.2em] text-chalk/50 uppercase">Valmora · Reel 01 · {Math.round(progress * 100)}%</p>
    </div>
  );
}

export function Unveil() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const arcRef = useRef<SVGSVGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<HTMLElement[]>([]);
  const yearRef = useRef<HTMLSpanElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLParagraphElement>(null);
  const barTopRef = useRef<HTMLDivElement>(null);
  const barBotRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<HTMLDivElement[]>([]);
  const flashRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box>({w: 1440, h: 900});
  const [copied, setCopied] = useState(false);
  const [load, setLoad] = useState({progress: 0, done: false});
  const dragging = useRef(false);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const frames = useRef<(HTMLImageElement | undefined)[]>(new Array(FRAME_COUNT));
  const dirty = useRef(true);

  // Stream the reel; the leader counts down over the first coarse pass.
  useEffect(() => {
    const set: FrameSet = window.matchMedia('(max-width: 767px)').matches ? 'm' : 'd';
    const NEED = 18; // frame 0 + every 32nd frame ≈ enough to scrub anywhere
    let count = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setLoad({progress: 1, done: true});
    };
    const timeout = window.setTimeout(finish, 6000);
    const cancel = loadFrames(set, (i, img) => {
      frames.current[i] = img;
      dirty.current = true;
      count++;
      if (!finished) {
        setLoad({progress: Math.min(1, count / NEED), done: false});
        if (count >= NEED) window.setTimeout(finish, 350);
      }
    });
    return () => {
      cancel();
      window.clearTimeout(timeout);
    };
  }, []);

  // Canvas backing store + arc geometry follow the viewport.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const sync = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      setBox({w: canvas.clientWidth, h: canvas.clientHeight});
      dirty.current = true;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', {alpha: false})!;
    const nearest = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        const a = frames.current[i - d];
        if (a) return a;
        const b = frames.current[i + d];
        if (b) return b;
      }
      return undefined;
    };

    let playhead = 0;
    let lastTime = 0;
    let lastImg: HTMLImageElement | undefined;
    let lastP = -1;
    let lastSpeed = '';

    return onFrame((time) => {
      const dt = lastTime ? Math.min(0.1, (time - lastTime) / 1000) : 1 / 60;
      lastTime = time;
      const root = rootRef.current;
      if (!root) return;
      const {p, rect, vh} = pinProgress(root);
      if (rect.bottom < 0) return;

      // --- The edit: scroll → remapped film time → frame. ---
      const u = range(p, ...FILM);
      const seconds = REMAP.at(u);
      const target = (seconds / DURATION) * (FRAME_COUNT - 1);
      const diff = target - playhead;
      if (reducedRef.current || dragging.current) playhead = Math.abs(diff) < 0.01 ? target : playhead + diff * 0.35;
      else if (Math.abs(diff) > 0.001) {
        const step = Math.max(FPS * 1.25, Math.abs(diff) * 3.2) * dt;
        playhead = Math.abs(diff) <= step ? target : playhead + Math.sign(diff) * step;
      }
      const moving = Math.abs(diff) > 0.4;
      const speed = u > 0 && u < 1 ? REMAP.speed(u) : 0;

      const img = nearest(Math.round(playhead));
      if (img && (dirty.current || img !== lastImg)) {
        const cw = canvas.width;
        const ch = canvas.height;
        const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const w = img.naturalWidth * s;
        const h = img.naturalHeight * s;
        // Fast-forward: let the previous frame linger under this one.
        const persist = moving && !reducedRef.current ? clamp((speed - 1.15) * 0.45, 0, 0.5) : 0;
        ctx.globalAlpha = dirty.current ? 1 : 1 - persist;
        ctx.drawImage(img, (cw - w) * 0.55, (ch - h) * 0.5, w, h);
        ctx.globalAlpha = 1;
        lastImg = img;
        dirty.current = false;
      }

      // Speed readout, outside the scroll-change guard.
      const label = moving && speed > 1.25 ? `▸▸ ${speed.toFixed(1)}×` : moving && speed < 0.8 ? `◂ ${speed.toFixed(2)}× slow` : '';
      if (label !== lastSpeed) {
        lastSpeed = label;
        speedRef.current!.textContent = label;
      }

      if (Math.abs(p - lastP) < 0.00005 && !dragging.current) return;
      lastP = p;

      // --- Title card. ---
      const out = range(p, 0.015, 0.07);
      introRef.current!.style.opacity = String(1 - out);
      introRef.current!.style.transform = `translate3d(${-out * 60}px, 0, 0)`;
      introRef.current!.style.filter = out > 0.01 ? `blur(${out * 10}px)` : '';
      bodyRef.current!.style.opacity = String(1 - out);

      // --- Letterbox: bars close to 2.39:1 with the film, open for the plate. ---
      const vw = canvas.clientWidth;
      const maxBar = vh * 0.14;
      const bar = Math.min(maxBar, Math.max(vh * 0.07, (vh - vw / 2.39) / 2));
      const lb = smoothstep(range(p, 0.02, 0.08)) * (1 - smoothstep(range(p, 0.84, 0.9)));
      const bh = bar * lb;
      barTopRef.current!.style.transform = `translate3d(0, ${bh - maxBar}px, 0)`;
      barBotRef.current!.style.transform = `translate3d(0, ${maxBar - bh}px, 0)`;

      // --- Chapter cards. ---
      CHAPTERS.forEach((c, i) => {
        const el = chapterRefs.current[i];
        const k = range(u, c.at - 0.02, c.at + 0.03) * (1 - range(u, c.at + 0.09, c.at + 0.13));
        el.style.opacity = String(k);
        el.style.transform = `translate3d(0, ${(1 - k) * 14}px, 0)`;
        el.style.letterSpacing = `${lerp(0.3, 0, k)}em`;
      });

      // --- A flashbulb as the name plate lands. ---
      const fk = range(p, 0.875, 0.885) * (1 - range(p, 0.885, 0.91));
      flashRef.current!.style.opacity = String(fk * 0.5);

      // --- Arc: the handle rides it for the whole film. ---
      const vis = (1 - range(p, 0.82, 0.88)) * (reducedRef.current ? 0 : 1);
      arcRef.current!.style.opacity = String(vis * (1 - lb * 0.6));
      handleRef.current!.style.opacity = String(vis);
      handleRef.current!.style.pointerEvents = vis > 0.2 ? 'auto' : 'none';
      const pt = arcPoint({w: vw, h: canvas.clientHeight}, u);
      handleRef.current!.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -50%)`;
      trailRef.current!.style.strokeDashoffset = String(1 - u);

      // --- Timecode. ---
      timeRef.current!.textContent = `00:${String(Math.floor(seconds)).padStart(2, '0')}:${String(Math.floor((seconds % 1) * 24)).padStart(2, '0')}`;
      hudRef.current!.style.opacity = String(range(p, 0.02, 0.06) * (1 - range(p, 0.84, 0.88)));

      // --- Name plate: each line slides in out of a blur, the year drifts. ---
      const plate = range(p, 0.87, 0.97);
      plateRef.current!.style.opacity = String(plate > 0 ? 1 : 0);
      lineRefs.current.forEach((el, i) => {
        const k = easeOutCubic(clamp((plate - i * 0.1) / 0.55));
        el.style.opacity = String(k);
        el.style.transform = `translate3d(${(1 - k) * -80}px, 0, 0)`;
        el.style.filter = k < 0.99 ? `blur(${(1 - k) * 12}px)` : '';
      });
      const yk = easeOutCubic(range(p, 0.88, 1));
      yearRef.current!.style.opacity = String(yk * 0.55);
      yearRef.current!.style.transform = `translate3d(${lerp(120, 0, yk)}px, 0, 0)`;
    });
  }, []);

  /** Drag the handle round the arc; the angle becomes a scroll position. */
  const startDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    const move = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const ang = (Math.atan2(ev.clientY - r.top - r.height * ARC.cy, ev.clientX - r.left - r.width * ARC.cx) * 180) / Math.PI;
      const t = clamp((ang - ARC.from) / (ARC.to - ARC.from));
      const p = lerp(FILM[0], FILM[1], t);
      scrollToY(root.offsetTop + p * (root.offsetHeight - window.innerHeight));
    };
    const end = () => {
      dragging.current = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  /** Keyboard: play the whole reveal. */
  const playReveal = () => {
    const root = rootRef.current;
    if (!root) return;
    scrollToY(root.offsetTop + FILM[1] * (root.offsetHeight - window.innerHeight) + 1, false);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split('#')[0]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — nothing to do */
    }
  };

  const r = Math.min(box.w * ARC.r, box.h * 0.46);
  const a0 = arcPoint(box, 0);
  const a1 = arcPoint(box, 1);
  const arcPath = `M${a0.x} ${a0.y} A${r} ${r} 0 0 1 ${a1.x} ${a1.y}`;

  return (
    <section id="top" ref={rootRef} aria-label="The unveiling" className="relative" style={{height: `${STAGE_VH}svh`}}>
      <Leader progress={load.progress} done={load.done} />
      <div className="sticky top-0 h-screen-s overflow-hidden bg-ink">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" role="img" aria-label="An oxblood grand tourer being unveiled from under a linen sheet in a marble museum hall, the camera circling it." />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_55%_55%,transparent_45%,rgb(12_11_10/0.7))]" />
        <div ref={flashRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-chalk" style={{opacity: 0}} />

        {/* Letterbox bars. */}
        <div ref={barTopRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[14svh] -translate-y-full bg-black" />
        <div ref={barBotRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[14svh] translate-y-full bg-black" />

        {/* Chapter cards, lower left inside the frame. */}
        {CHAPTERS.map((c, i) => (
          <div
            key={c.n}
            ref={(el) => {
              if (el) chapterRefs.current[i] = el;
            }}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[17svh] left-4 z-20 sm:left-6 md:left-[4vw]"
            style={{opacity: 0}}
          >
            <p className="font-mono text-[0.625rem] tracking-[0.2em] text-brass uppercase">Act {c.n}</p>
            <p className="mt-1 font-serif text-[clamp(1.75rem,3.2vw,3rem)] leading-none text-chalk italic">{c.title}</p>
          </div>
        ))}

        {/* Arc + trail. */}
        <svg ref={arcRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" viewBox={`0 0 ${box.w} ${box.h}`}>
          <path d={arcPath} fill="none" stroke="rgb(241 236 227 / 0.28)" strokeWidth="1" />
          <path ref={trailRef} d={arcPath} pathLength={1} fill="none" stroke="var(--color-brass)" strokeWidth="1.5" strokeDasharray="1 1" strokeDashoffset="1" />
        </svg>
        <button
          ref={handleRef}
          type="button"
          onPointerDown={startDrag}
          onClick={(e) => {
            if (e.detail === 0) playReveal(); // keyboard activation only
          }}
          className="group absolute top-0 left-0 z-20 flex cursor-grab items-center gap-3 active:cursor-grabbing"
          aria-label="Reveal the car"
        >
          <span className="relative grid size-5 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-chalk/40 motion-reduce:animate-none" />
            <span className="size-2.5 rounded-full bg-chalk shadow-[0_0_16px_rgb(241_236_227/0.8)] transition-transform group-hover:scale-150" />
          </span>
          <span className="font-mono text-[0.625rem] tracking-[0.18em] whitespace-nowrap text-chalk/85 uppercase">{unveil.handle}</span>
        </button>

        {/* Title card — letters rise in once the leader clears. */}
        <div ref={introRef} className="pointer-events-none absolute inset-x-4 top-[20svh] sm:inset-x-6 md:top-[22svh] md:left-[4vw]">
          <h1 className="text-hero font-extralight uppercase" aria-label={`${unveil.title[0]} ${unveil.title[1]}`}>
            <span className="wide block font-display" aria-hidden="true">
              {[...unveil.title[0]].map((ch, i) => (
                <span
                  key={i}
                  className={`inline-block ${load.done ? 'animate-[letter-in_1.4s_cubic-bezier(0.2,0.7,0.1,1)_both]' : 'opacity-0'}`}
                  style={{animationDelay: `${0.3 + i * 0.05}s`}}
                >
                  {ch}
                </span>
              ))}
            </span>
            <span aria-hidden="true" className={`block ${load.done ? 'animate-[fade-up_1.4s_cubic-bezier(0.2,0.7,0.1,1)_both] [animation-delay:0.95s]' : 'opacity-0'}`}>
              <span className="font-serif text-[0.8em] normal-case italic">the </span>
              <span className="wide font-display italic">{unveil.title[1].replace('the ', '')}</span>
            </span>
          </h1>
        </div>
        <p ref={bodyRef} className="pointer-events-none absolute right-4 bottom-[16svh] max-w-[19rem] text-[0.8125rem] leading-relaxed text-chalk/70 sm:right-6 md:right-auto md:left-[46vw]">
          {unveil.body}
        </p>

        {/* Name plate. */}
        <div ref={plateRef} className="pointer-events-none absolute inset-0" style={{opacity: 0}}>
          <div className="absolute top-[17svh] left-4 sm:left-6 md:top-[19svh] md:left-[4vw]">
            <p
              ref={(el) => {
                if (el) lineRefs.current[0] = el;
              }}
              className="wide font-display text-[clamp(1.25rem,2.6vw,2.5rem)] leading-none font-extralight tracking-[0.02em] uppercase"
            >
              {unveil.model[0]}
            </p>
            <h2
              ref={(el) => {
                if (el) lineRefs.current[1] = el;
              }}
              className="wide mt-1 font-display text-hero font-light uppercase"
            >
              {unveil.model[1]}
            </h2>
          </div>
          <span
            ref={yearRef}
            aria-hidden="true"
            className="wide absolute top-[26svh] right-4 font-display text-[clamp(4rem,12vw,12rem)] leading-none font-extralight text-transparent sm:right-6 md:right-[5vw]"
            style={{WebkitTextStroke: '1px rgb(241 236 227 / 0.7)'}}
          >
            {unveil.year}
          </span>
          <div className="absolute right-4 bottom-[11svh] text-right sm:right-6 md:top-[50svh] md:right-[4vw] md:bottom-auto">
            <p
              ref={(el) => {
                if (el) lineRefs.current[2] = el;
              }}
              className="text-[clamp(1.25rem,2.4vw,2.25rem)] leading-[1.02] uppercase"
            >
              <span className="wide block font-display font-light">
                {unveil.slogan[0].split(' ')[0]} <span className="font-serif normal-case italic">{unveil.slogan[0].split(' ')[1]}</span>
              </span>
              <span className="wide block font-display font-light">
                {unveil.slogan[1].split(' ')[0]} <span className="font-serif normal-case italic">{unveil.slogan[1].split(' ')[1]}</span>
              </span>
            </p>
            <p
              ref={(el) => {
                if (el) lineRefs.current[3] = el;
              }}
              className="mt-4 ml-auto max-w-[17rem] text-[0.8125rem] leading-relaxed text-chalk/70"
            >
              {unveil.note}
            </p>
          </div>
        </div>

        {/* Timecode + speed-ramp readout. */}
        <div ref={hudRef} aria-hidden="true" className="pointer-events-none absolute top-[5.5rem] right-4 z-20 text-right font-mono text-[0.625rem] tracking-[0.16em] text-chalk/65 uppercase sm:right-6 md:right-[4vw]" style={{opacity: 0}}>
          <p>
            Reel 01 · <span ref={timeRef}>00:00:00</span>
          </p>
          <p ref={speedRef} className="mt-1 h-3 text-brass" />
        </div>

        {/* Bottom rail. */}
        <div className="absolute inset-x-4 bottom-5 z-20 flex items-center justify-between font-mono text-[0.625rem] tracking-[0.16em] text-chalk/70 uppercase sm:inset-x-6 md:inset-x-[4vw]">
          <button type="button" onClick={share} className="hover:text-chalk">
            {copied ? 'Link copied' : 'Share'}
          </button>
          <span className="flex items-center gap-2">
            <span className="h-6 w-[1.5px] overflow-hidden rounded-full bg-chalk/20">
              <span className="block h-2 w-full animate-bounce bg-chalk motion-reduce:animate-none" />
            </span>
            Scroll
          </span>
        </div>
      </div>
    </section>
  );
}

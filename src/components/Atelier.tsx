import {useEffect, useRef} from 'react';
import {atelier} from '../content';
import {useReveals} from '../hooks/useReveals';
import {clamp, easeOutCubic, lerp, smoothstep} from '../lib/math';
import {onFrame} from '../lib/scroll';
import {CurveEdge} from './CurveEdge';
import {Marquee} from './Marquee';

/**
 * The atelier. Each photograph arrives under its own linen dust sheet, and
 * the scroll pulls it off — the sheet lifts at one corner, skews, and slides
 * away with its folds catching the light, the way the film opened. The
 * picture underneath settles from a slight zoom and the figures count up.
 */
export function Atelier() {
  const ref = useReveals<HTMLElement>();
  const figRefs = useRef<HTMLElement[]>([]);
  const sheetRefs = useRef<HTMLDivElement[]>([]);
  const imgRefs = useRef<HTMLImageElement[]>([]);
  const capRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    return onFrame(() => {
      const vh = window.innerHeight;
      figRefs.current.forEach((fig, i) => {
        const r = fig.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        // 0 as the figure's top reaches the bottom of the screen, 1 once it's
        // a third of the way up.
        const k = clamp((vh - r.top) / (vh * 0.8));
        const pull = smoothstep(clamp((k - 0.15) / 0.75));
        const dir = i % 2 ? -1 : 1;
        const sheet = sheetRefs.current[i];
        sheet.style.transform = `translate3d(${dir * pull * 105}%, ${-pull * 38}%, 0) rotate(${dir * pull * 9}deg) skewX(${dir * -pull * 14}deg)`;
        sheet.style.opacity = String(1 - smoothstep(clamp((pull - 0.7) / 0.3)));
        const off = (r.top + r.height / 2 - vh / 2) / vh;
        imgRefs.current[i].style.transform = `translate3d(0, ${off * -60}px, 0) scale(${lerp(1.28, 1.08, pull)})`;
        const cap = capRefs.current[i];
        const c = easeOutCubic(clamp((pull - 0.5) / 0.5));
        cap.style.opacity = String(c);
        cap.style.transform = `translate3d(0, ${(1 - c) * 40}px, 0)`;
      });
    });
  }, []);

  return (
    <section ref={ref} id="atelier" aria-labelledby="atelier-title" className="relative bg-ink pb-24 md:pb-36">
      <CurveEdge color="var(--color-ink)" />
      <Marquee text="Coachbuilt · Modena · MCMLXI · " />

      <div className="px-4 sm:px-6 md:px-[4vw]" data-reveal>
        <p className="font-mono text-label text-brass uppercase">{atelier.eyebrow}</p>
        <h2 id="atelier-title" className="mt-4 text-display font-extralight uppercase">
          <span className="wide block font-display">{atelier.heading[0]}</span>
          <span className="block font-serif normal-case italic">{atelier.heading[1]}</span>
        </h2>
      </div>

      <div className="mt-14 space-y-8 px-2 md:mt-20 md:space-y-16 md:px-[2vw]">
        {atelier.steps.map((s, i) => (
          <figure
            key={s.label}
            ref={(el) => {
              if (el) figRefs.current[i] = el;
            }}
            className={`relative ${i % 2 ? 'md:ml-[14vw]' : 'md:mr-[14vw]'}`}
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-[6px] md:aspect-[16/8.5]">
              <img
                ref={(el) => {
                  if (el) imgRefs.current[i] = el;
                }}
                src={s.image}
                alt=""
                width={1920}
                height={1086}
                loading="lazy"
                decoding="async"
                className="size-full object-cover will-change-transform"
                style={{transform: 'scale(1.28)'}}
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink/80 via-transparent to-transparent" />
              {/* The dust sheet: linen with folds catching a top light. */}
              <div
                ref={(el) => {
                  if (el) sheetRefs.current[i] = el;
                }}
                aria-hidden="true"
                className={`absolute -inset-[8%] will-change-transform ${i % 2 ? 'origin-top-right' : 'origin-top-left'}`}
                style={{
                  background:
                    'repeating-linear-gradient(97deg, rgb(0 0 0 / 0) 0 38px, rgb(0 0 0 / 0.1) 52px, rgb(255 255 255 / 0.18) 64px, rgb(0 0 0 / 0) 86px), repeating-linear-gradient(3deg, rgb(0 0 0 / 0.035) 0 1px, transparent 1px 3px), linear-gradient(170deg, #efe7d6, #d9ccb3 60%, #c8b99c)',
                  boxShadow: '0 30px 80px rgb(0 0 0 / 0.5)',
                }}
              />
            </div>
            <figcaption
              ref={(el) => {
                if (el) capRefs.current[i] = el;
              }}
              className={`absolute bottom-6 flex items-baseline gap-4 md:bottom-10 ${i % 2 ? 'right-6 md:right-10' : 'left-6 md:left-10'}`}
              style={{opacity: 0}}
            >
              <span className="wide font-display text-[clamp(2.5rem,7vw,6.5rem)] leading-none font-extralight">{s.n}</span>
              <span className="max-w-[12rem] font-mono text-label text-chalk/80 uppercase">{s.label}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

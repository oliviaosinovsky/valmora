import {useEffect, useRef, useState, type FormEvent} from 'react';
import {brand, enquire} from '../content';
import {useFitText} from '../hooks/useFitText';
import {useReveals} from '../hooks/useReveals';
import {clamp, easeOutCubic} from '../lib/math';
import {onFrame} from '../lib/scroll';
import {CurveEdge} from './CurveEdge';

type Status = 'idle' | 'invalid' | 'sent';

/** Request an invitation. The linen from the hero returns as the background. */
export function Enquire() {
  const ref = useReveals<HTMLElement>();
  const [status, setStatus] = useState<Status>('idle');
  const markRef = useFitText<HTMLSpanElement>();
  const letterRefs = useRef<HTMLSpanElement[]>([]);

  // The wordmark rises out of its masks, letter by letter, as you reach it.
  useEffect(() => {
    let last = -1;
    return onFrame(() => {
      const mark = markRef.current;
      if (!mark) return;
      const r = mark.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.top > vh + 50 || r.bottom < -50) return;
      const k = clamp((vh - r.top) / (r.height * 1.6 + vh * 0.25));
      if (Math.abs(k - last) < 0.0008) return;
      last = k;
      const n = letterRefs.current.length;
      letterRefs.current.forEach((el, i) => {
        const e = easeOutCubic(clamp((k - (i / n) * 0.45) / 0.55));
        el.style.transform = `translate3d(0, ${(1 - e) * 105}%, 0) rotate(${(1 - e) * 8}deg)`;
      });
    });
  }, [markRef]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      setStatus('invalid');
      form.reportValidity();
      return;
    }
    const d = new FormData(form);
    const subject = encodeURIComponent(`Private viewing — ${String(d.get('name'))}`);
    const body = encodeURIComponent(`Name: ${String(d.get('name'))}\nEmail: ${String(d.get('email'))}\nInterest: ${String(d.get('edition'))}\n\n${String(d.get('note') || '')}`);
    window.location.href = `mailto:${brand.email}?subject=${subject}&body=${body}`;
    setStatus('sent');
  };

  const field =
    'w-full border-b border-ink/25 bg-transparent py-3 text-body text-ink outline-none placeholder:text-ink/40 focus:border-oxblood user-invalid:border-oxblood-lit';

  return (
    <section ref={ref} id="enquire" aria-labelledby="enquire-title" className="relative bg-linen px-4 pt-24 pb-8 text-ink sm:px-6 md:px-[4vw] md:pt-36">
      <CurveEdge color="var(--color-linen)" />
      {/* Linen weave. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgb(12 11 10 / 0.035) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgb(12 11 10 / 0.035) 0 1px, transparent 1px 4px)',
        }}
      />
      <div className="relative grid gap-12 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-5" data-reveal>
          <p className="font-mono text-label text-oxblood uppercase">{enquire.eyebrow}</p>
          <h2 id="enquire-title" className="mt-4 text-display font-extralight uppercase">
            <span className="wide block font-display">{enquire.heading[0]}</span>
            <span className="block font-serif normal-case italic">{enquire.heading[1]}</span>
          </h2>
          <p className="mt-6 max-w-[26rem] text-body text-ink/70">{enquire.body}</p>
        </div>

        <form noValidate onSubmit={onSubmit} aria-describedby="enquire-status" className="space-y-5 md:col-span-6 md:col-start-7" data-reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-label text-ink/55 uppercase">Name</span>
              <input name="name" required autoComplete="name" placeholder="Your name" className={field} onInput={() => setStatus('idle')} />
            </label>
            <label className="block">
              <span className="font-mono text-label text-ink/55 uppercase">Email</span>
              <input name="email" type="email" required autoComplete="email" placeholder="you@domain.com" className={field} onInput={() => setStatus('idle')} />
            </label>
          </div>
          <fieldset>
            <legend className="font-mono text-label text-ink/55 uppercase">Interest</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {enquire.editions.map((ed, i) => (
                <label key={ed} className="cursor-pointer">
                  <input type="radio" name="edition" value={ed} defaultChecked={i === 0} className="peer sr-only" />
                  <span className="block rounded-full px-4 py-2 text-[0.875rem] ring-1 ring-ink/25 transition-colors peer-checked:bg-ink peer-checked:text-linen peer-checked:ring-ink peer-focus-visible:outline peer-focus-visible:outline-oxblood">
                    {ed}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="font-mono text-label text-ink/55 uppercase">Anything we should know</span>
            <textarea name="note" rows={3} placeholder="A date that suits, a car you’ve loved…" className={`${field} resize-none`} />
          </label>
          <div className="flex flex-wrap items-center gap-5 pt-2">
            <button type="submit" className="group flex items-center gap-3 rounded-full bg-oxblood px-7 py-4 font-mono text-label text-chalk uppercase transition-colors hover:bg-ink">
              Request an invitation
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </button>
            <a href={`mailto:${brand.email}`} className="font-mono text-label text-ink/60 uppercase underline-offset-4 hover:underline">
              {brand.email}
            </a>
          </div>
          <p id="enquire-status" role="status" className="min-h-[1.25rem] text-[0.8125rem] text-ink/70">
            {status === 'invalid' && 'Your name and a valid email, please.'}
            {status === 'sent' && `Your mail app should be open with the request drafted. If not: ${brand.email}.`}
          </p>
        </form>
      </div>

      {/* Wordmark, edge to edge. */}
      <p className="relative mt-24 leading-none md:mt-36" aria-hidden="true">
        <span ref={markRef} className="wide inline-block font-display leading-[0.78] font-extralight whitespace-nowrap text-oxblood">
          {[...brand.wordmark].map((ch, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.04em] align-bottom">
              <span
                ref={(el) => {
                  if (el) letterRefs.current[i] = el;
                }}
                className="inline-block origin-bottom-left will-change-transform"
                style={{transform: 'translate3d(0,105%,0)'}}
              >
                {ch}
              </span>
            </span>
          ))}
        </span>
      </p>
    </section>
  );
}

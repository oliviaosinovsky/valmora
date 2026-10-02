/**
 * Every word on the page. VALMORA is a concept marque — the car, its specs
 * and its history are illustrative, and the footer says so.
 */

export const brand = {
  name: 'Valmora',
  wordmark: 'VALMORA',
  tagline: ['A classic grand tourer', 'built as if 1961 never ended'],
  email: 'atelier@valmora.it',
};

export const nav = [
  {label: 'Design', href: '#details'},
  {label: 'Specification', href: '#specs'},
  {label: 'Atelier', href: '#atelier'},
];

export const unveil = {
  title: ['Rediscover', 'the classics'],
  body: 'A grand tourer that spent sixty years under a dust sheet — and came out exactly as it was meant to be.',
  handle: 'Drag to reveal',
  model: ['Valmora', 'Alba GT'],
  year: '1961',
  slogan: ['Looks fast', 'standing still'],
  note: 'Coachbuilt by hand in Modena. Twelve cars, each a year in the making.',
};

export type Detail = {
  id: string;
  label: string;
  title: string;
  body: string;
  /** Hotspot position over the revealed photograph, as % of its box. */
  x: number;
  y: number;
  image: string;
};

export const details: {eyebrow: string; heading: string; items: Detail[]} = {
  eyebrow: 'Design',
  heading: 'Every line drawn once.',
  items: [
    {id: 'lamp', label: '01', title: 'Crystal headlamps', body: 'Hand-blown glass over polished reflector bowls. They warm up slowly, like a valve amplifier.', x: 77.2, y: 60.8, image: `${import.meta.env.BASE_URL}media/details/lamp.webp`},
    {id: 'wheel', label: '02', title: '72-spoke wire wheels', body: 'Laced and trued by one craftsman. Centre-lock knock-offs, chromed three times.', x: 49.2, y: 70.6, image: `${import.meta.env.BASE_URL}media/details/wheel.webp`},
    {id: 'cabin', label: '03', title: 'Quilted cabin', body: 'Cream Connolly-style hide, walnut and a wood-rim wheel. The clock is wound by hand.', x: 44.4, y: 49.5, image: `${import.meta.env.BASE_URL}media/details/cabin.webp`},
    {id: 'vent', label: '04', title: 'Wing vents', body: 'Three chrome strakes that let the V12 breathe — and catch every light in the room.', x: 41.8, y: 60.4, image: `${import.meta.env.BASE_URL}media/details/vent.webp`},
  ],
};

export const specs = {
  eyebrow: 'Specification',
  heading: 'Numbers from another time.',
  note: 'Concept figures — illustrative.',
  items: [
    {value: 3.0, decimals: 1, unit: 'L', label: 'Naturally aspirated V12'},
    {value: 286, decimals: 0, unit: 'hp', label: 'at 7,200 rpm'},
    {value: 6.1, decimals: 1, unit: 's', label: '0–100 km/h'},
    {value: 248, decimals: 0, unit: 'km/h', label: 'Top speed'},
    {value: 1180, decimals: 0, unit: 'kg', label: 'Dry weight'},
    {value: 12, decimals: 0, unit: '', label: 'Cars, ever'},
  ],
};

export const atelier = {
  eyebrow: 'The atelier',
  heading: ['Coachbuilt,', 'not manufactured.'],
  steps: [
    {n: '1,400', label: 'hours of hand-beaten aluminium', image: `${import.meta.env.BASE_URL}media/atelier/front.webp`},
    {n: '11', label: 'coats of oxblood, rubbed back by hand', image: `${import.meta.env.BASE_URL}media/atelier/rear.webp`},
  ],
};

export const enquire = {
  eyebrow: 'Private viewing',
  heading: ['The sheet comes off', 'once a month.'],
  body: 'Viewings are held in the museum hall in Modena, by appointment. Tell us who you are and we’ll send an invitation.',
  editions: ['Alba GT — Coupé', 'Alba GT — Spider (2027)', 'Just a viewing'],
};

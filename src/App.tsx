import {useState} from 'react';

const asset = (name: string) => `${import.meta.env.BASE_URL}eco/${name}`;
const shop = 'https://shop.merch.google/product/google-womens-eco-tee-black-ggoegxxx1190';
const looks = [
  {name: 'On campus', number: '01', title: 'Your 9 a.m. looks good.', copy: 'Light-wash denim. Your favorite sneakers. A tote full of big ideas. Meet the tee that makes getting to class the easiest part of your day.', pieces: ['Eco Tee', 'Straight-leg jeans', 'Everyday sneakers'], color: '#dce7ef'},
  {name: 'Off the clock', number: '02', title: 'Less planning. More living.', copy: 'Pair it with leggings and an open overshirt for coffee runs, weekend walks, and the plans that happen between plans.', pieces: ['Eco Tee', 'Black leggings', 'An open overshirt'], color: '#e8e7d7'},
  {name: 'Big-idea energy', number: '03', title: 'Bring your whole self.', copy: 'A relaxed blazer and wide-leg trousers take your everyday tee from a study session to your next creative meetup. Curiosity is always in style.', pieces: ['Eco Tee', 'Relaxed blazer', 'Wide-leg trousers'], color: '#efe0dc'},
];

function ColorDots() {return <span className="color-dots" aria-hidden="true"><i/><i/><i/><i/></span>;}
function ShopLink({className = ''}: {className?: string}) {return <a className={`button ${className}`} href={shop} target="_blank" rel="noreferrer">Shop the Eco Tee <span aria-hidden="true">↗</span></a>;}

export default function App() {
  const [look, setLook] = useState(0);
  const [menu, setMenu] = useState(false);
  const current = looks[look];
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="announcement">A little style. A lot of possibility. <ColorDots/></div>
    <header className="site-header">
      <a href="#" className="wordmark" aria-label="Wear What You Value home">wear what<br/><span>you value.</span><span className="brand-dot">✳</span></a>
      <button className="menu-toggle" aria-expanded={menu} aria-controls="navigation" onClick={()=>setMenu(!menu)}>{menu ? 'Close' : 'Menu'}</button>
      <nav id="navigation" className={menu ? 'nav open' : 'nav'} aria-label="Main navigation">
        <a href="#the-tee" onClick={()=>setMenu(false)}>The tee</a><a href="#materials" onClick={()=>setMenu(false)}>The material story</a><a href="#your-way" onClick={()=>setMenu(false)}>Wear it your way</a>
      </nav>
      <a className="header-shop" href="#the-tee">Meet your everyday tee <span aria-hidden="true">↗</span></a>
    </header>
    <main id="main">
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow"><span className="tiny-line"/> THE GOOGLE WOMEN’S ECO TEE</p>
          <h1>Wear what<br/>you <em>value.</em><span className="hero-star" aria-hidden="true">✳</span></h1>
          <p className="hero-description">Good style. Big ideas. A little more intention.<br/>An everyday tee for the way you live—and the future you believe in.</p>
          <div className="hero-actions"><ShopLink/><a className="text-link" href="#materials">Get to know your tee <span aria-hidden="true">↓</span></a></div>
          <div className="hero-note"><ColorDots/><span>Style first. Values always.</span></div>
        </div>
        <div className="hero-visual"><img src={asset('campus.png')} alt="Campus styling inspiration: a woman wearing the black Google Eco Tee with light-wash jeans and a canvas tote" fetchPriority="high"/><div className="photo-label"><span>YOUR EVERYDAY, REIMAGINED</span><span>01 / THE ECO TEE</span></div><div className="image-sticker">Made for<br/><em>your kind</em><br/>of everyday.</div></div>
      </section>
      <div className="values-strip"><span>Comfort in your element</span><b>✳</b><span>Style with intention</span><b>✳</b><span>Room for big ideas</span><b>✳</b><span>Wear. Rewear. Repeat.</span></div>
      <section className="intro section-pad" aria-labelledby="intro-title">
        <p className="eyebrow">LESS JUST MERCH. MORE YOU.</p>
        <h2 id="intro-title">A good tee fits your life.<br/><em>A great one fits your values.</em></h2>
        <p>For curious minds, creative days, and a wardrobe with a little more intention. The Google Women’s Eco Tee brings simple black styling, a considered fabric blend, and a colorful spark of possibility to your everyday.</p>
        <div className="benefit-grid">
          <article><span className="benefit-symbol blue">↗</span><h3>Big ideas. Easy style.</h3><p>Wear your curiosity. A familiar wordmark connects a simple outfit to a world of creativity and technology.</p></article>
          <article><span className="benefit-symbol green">✳</span><h3>A more considered blend.</h3><p>Made with 50% Lenzing Modal and 50% combed cotton. Get to know what goes into the piece you reach for.</p></article>
          <article><span className="benefit-symbol coral">∞</span><h3>One tee. Your whole day.</h3><p>Moisture-wicking fabric and an easy-to-style silhouette, from the first lecture to the last coffee run.</p></article>
        </div>
      </section>
      <section id="the-tee" className="product-section section-pad">
        <div className="product-image"><span className="corner-label">THE EVERYDAY EDIT / 001</span><img src={asset('product.png')} alt="Original Google Women's Eco Tee: black crewneck with multicolored Google logo" loading="lazy"/><span className="product-color"><i/> BLACK, WITH A LITTLE COLOR.</span></div>
        <div className="product-copy"><p className="eyebrow">MEET YOUR NEW ROTATION REGULAR</p><h2>Simple by design.<br/><em>You by nature.</em></h2><p className="product-name">Google Women’s Eco Tee</p><p>A comfortable, everyday tee for women who care about style, technology, and a more sustainable future. Easy to wear. Easy to make your own.</p>
          <ul className="product-features"><li><span>01</span>Classic black, endless outfit possibilities</li><li><span>02</span>50% Lenzing Modal / 50% combed cotton</li><li><span>03</span>Moisture-wicking comfort for busy days</li><li><span>04</span>A colorful nod to your love of innovation</li></ul>
          <ShopLink/><p className="shop-note">View current pricing, sizes, and availability at the official Google Merchandise Store.</p>
        </div>
      </section>
      <section id="materials" className="materials section-pad">
        <div className="materials-heading"><p className="eyebrow">THE MATERIAL STORY</p><h2>Good choices start<br/>with <em>knowing more.</em></h2><p>Style with intention begins with the fabric. This tee pairs Lenzing Modal with combed cotton—two fibers, one everyday essential.</p><a className="text-link" href={shop} target="_blank" rel="noreferrer">Explore the original product details ↗</a></div>
        <div className="material-stats"><div><strong>50<span>%</span></strong><p>Lenzing Modal</p><span className="stat-note">A cellulose-based fiber in the blend.</span></div><div><strong>50<span>%</span></strong><p>Combed cotton</p><span className="stat-note">The familiar feel of an everyday favorite.</span></div><p className="material-footnote">Composition and moisture-wicking details from the Google Merchandise Store’s product listing. Thoughtful style is about understanding your choices—and wearing what you love again.</p></div>
      </section>
      <section id="your-way" className="styling section-pad">
        <div className="section-heading"><div><p className="eyebrow">ONE TEE. MANY VERSIONS OF YOU.</p><h2>Wear it <em>your way.</em></h2></div><p>For the schedule you planned.<br/>And everything that happens in between.</p></div>
        <div className="style-layout"><div className="style-photo"><img src={asset('campus.png')} alt="Styling inspiration: the black Eco Tee paired with light-wash denim and a canvas tote on campus" loading="lazy"/><span>THE CAMPUS UNIFORM, REWRITTEN.</span></div>
          <div className="style-panel" style={{backgroundColor: current.color}}><div className="style-tabs" role="tablist" aria-label="Outfit ideas">{looks.map((item,i)=><button key={item.name} id={`look-tab-${i}`} role="tab" aria-selected={look===i} aria-controls="look-panel" tabIndex={look===i?0:-1} onClick={()=>setLook(i)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=(i+(e.key==='ArrowRight'?1:2))%3;setLook(next);document.getElementById(`look-tab-${next}`)?.focus();}}}>{item.name}</button>)}</div>
          <div id="look-panel" role="tabpanel" aria-labelledby={`look-tab-${look}`} tabIndex={0}><span className="look-number">{current.number}</span><h3>{current.title}</h3><p>{current.copy}</p><div className="outfit-list">{current.pieces.map((piece,i)=><span key={piece}>{i>0&&<b>+</b>}{piece}</span>)}</div><a className="text-link" href="#the-tee">Start with the tee ↗</a></div>
          <span className="style-footer">YOUR STYLE. NO RULEBOOK.</span></div>
        </div>
      </section>
      <section className="closing section-pad"><ColorDots/><p className="eyebrow">FORWARD THINKING. EVERYDAY WEARING.</p><h2>Technology moves forward.<br/><em>Your wardrobe can too.</em></h2><p>Choose an everyday tee that brings together simple style,<br/>a considered fabric blend, and a brand that celebrates big ideas.</p><ShopLink/></section>
      <section className="faq section-pad"><h2>A few good <em>questions.</em></h2><div><details><summary>What is the Eco Tee made from?</summary><p>The original product listing specifies 50% Lenzing Modal and 50% combed cotton, with moisture-wicking fabric. See the official store for complete product information.</p></details><details><summary>How can I style it?</summary><p>Start with jeans and sneakers for class, layer it under an open overshirt for the weekend, or add a relaxed blazer for a creative meetup. The black base works with what you already own.</p></details><details><summary>Where can I find my size and buy it?</summary><p>Every “Shop the Eco Tee” button opens the official Google Merchandise Store. Check current sizes, pricing, availability, and shipping there before purchasing.</p></details></div></section>
    </main>
    <footer><a className="wordmark" href="#">wear what<br/><span>you value.</span><span className="brand-dot">✳</span></a><p>An everyday essential. A little more intention.</p><div><span>Student product-relaunch concept. Not an official Google website.</span><span>Google is a trademark of Google LLC. Lifestyle imagery is AI-generated styling inspiration.</span></div><a className="back-top" href="#">BACK TO TOP ↑</a></footer>
  </>;
}

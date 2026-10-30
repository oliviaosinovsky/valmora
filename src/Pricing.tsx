import {useState} from 'react';
import {pricingProducts} from './pricing-data';

const price = (amount:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:amount%1?2:0}).format(amount);
export default function Pricing(){
  const [selected,setSelected]=useState<string>('kit');
  const product=pricingProducts.find(p=>p.id===selected)!;
  return <section id="pricing" className="pricing-section section-pad" aria-labelledby="pricing-title">
    <div className="pricing-heading"><div><p className="eyebrow">TWO WAYS TO MEET YOUR WARDROBE</p><h2 id="pricing-title">Your closet.<br/><em>Your starting point.</em></h2></div><div className="pricing-intro"><p>Explore a camera kit with a first year of app access, or an app-only monthly option.</p><span className="concept-tag"><span aria-hidden="true">✳</span> PRODUCT CONCEPT · NOT YET FOR SALE</span></div></div>
    <div className="pricing-grid">{pricingProducts.map((p,i)=><article key={p.id} className={`price-card ${selected===p.id?'is-selected':''}`} aria-labelledby={`price-name-${p.id}`}>
      <div className="price-card-top"><span className="price-index">0{i+1}</span><span className="price-format">{p.billingModel==='bundle'?'CAMERA + APP':'APP ONLY'}</span><span className="price-glyph" aria-hidden="true">{p.id==='kit'?'◈':'✳'}</span></div>
      <h3 id={`price-name-${p.id}`}>{p.name}</h3><p className="price-description">{p.description}</p>
      <div className="public-price"><strong>{price(p.price)}</strong><span>USD<br/>{p.billingModel==='monthly'?'per month':'per kit + first year'}</span></div>
      <p className="billing-note">{p.billingModel==='monthly'?'Monthly subscription · separate from the camera-kit bundle.':'Bundle price · includes 12 months of app access.'}</p>
      <div className="proposed-heading">{p.id==='kit'?'IN THE PLANNED BUNDLE':'PLANNED APP FEATURES'}</div><ul className="price-features">{p.features.map(f=><li key={f}><span aria-hidden="true">↗</span>{f}</li>)}</ul>
      <button className="choose-option" aria-pressed={selected===p.id} aria-controls="selected-option" onClick={()=>setSelected(p.id)}>{selected===p.id?'Selected for comparison':'Explore this option'}<span aria-hidden="true">{selected===p.id?'✓':'↗'}</span><span className="sr-only"> — {p.name}</span></button>
    </article>)}</div>
    <div id="selected-option" className="selected-option" aria-live="polite" aria-atomic="true"><div className="selection-spark" aria-hidden="true">✳</div><div><p className="eyebrow">YOUR SELECTED OPTION</p><h3>{product.name}</h3><p><strong>{price(product.price)} USD</strong> {product.billingModel==='monthly'?'per month':'per kit, with the first year included'}. {product.id==='kit'?'Service pricing after the included year has not been specified.':'This is the software-only option, outside the camera-kit bundle.'}</p><small>Selection is for exploration only. It does not place an order or start a subscription.</small></div><a className="button" href="#demo">Try the concept demo <span aria-hidden="true">↗</span></a></div>
    <div className="pricing-details"><div><p className="eyebrow">CLARITY BEFORE COMMITMENT</p><h3>A few details,<br/><em>before you decide.</em></h3><p>These are selected prices for the ClosetCue concept. Proposed capabilities remain in development and have not been validated.</p></div><div className="pricing-faq">
      <details><summary>What does the camera-kit price include?</summary><p>The $199 USD planning bundle includes one retrofit camera kit, basic self-installation, and 12 months of app access. Camera-assisted wardrobe inventory and manual availability correction remain proposed features.</p></details>
      <details><summary>Do I also pay $9.99 per month for the kit?</summary><p>The kit bundle includes its first 12 months of app access. The $9.99 USD monthly plan is a separate app-only option. Pricing or renewal terms after the kit’s included year have not been specified.</p></details>
      <details><summary>Can I buy or subscribe today?</summary><p>Not yet. ClosetCue is a student venture concept. There is no checkout, payment collection, or confirmed launch date. You can explore the interactive demo using a sample wardrobe.</p><a className="text-link" href="#demo">Explore the demo ↗</a></details>
      <details><summary>Are there annual plans or optional add-ons?</summary><p>No separate annual app-only plan or optional add-ons are specified in these offers. No additional offers or discounts are shown.</p></details>
    </div></div>
  </section>;
}

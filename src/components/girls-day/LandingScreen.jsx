import { ArrowRight, Heart, ImagePlus } from "lucide-react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { girlsDayDrinks } from "../../data/girlsDayDrinks";
import FloatingDecorations, { Doodle } from "./Decorations";

export default function LandingScreen({ copy, onStart, loading }) {
  const reducedMotion = useReducedMotion();
  return <section className="gdLanding" aria-labelledby="gdLandingTitle">
    <div className="gdLandingInner">
      <div className="gdEdition"><span /><Doodle kind="bow" /><span /></div>
      <p className="gdEyebrow">{copy.edition}</p>
      <h1 id="gdLandingTitle" tabIndex={-1}>{copy.landingTitle}<br /><em>{copy.landingAccent}</em></h1>
      <p className="gdTagline">{copy.tagline}</p>
      <div className="gdDrinkScene" aria-hidden="true">
        <FloatingDecorations />
        {girlsDayDrinks.map((drink, i) => <Motion.img key={drink.id} className={`gdHeroDrink gdHeroDrink--${drink.id}`}
          src={drink.image} alt="" width="360" height="456" draggable="false"
          animate={reducedMotion ? {} : { y: [0, i ? -5 : 5, 0], rotate: i ? [9, 7, 9] : [-10, -8, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }} />)}
      </div>
      <div className="gdLandingAction">
        <p className="gdIntro">{copy.intro}</p>
        <button type="button" className="gdButton gdButton--primary" onClick={onStart} disabled={loading}>
          <ImagePlus size={19} aria-hidden="true" />{loading ? copy.photoBusy : copy.start}<ArrowRight size={18} aria-hidden="true" />
        </button>
        <p className="gdPrivacy"><Heart size={13} aria-hidden="true" />{copy.privacy}</p>
      </div>
    </div>
    <p className="gdLandingFootnote">{copy.madeWithLove}</p>
  </section>;
}

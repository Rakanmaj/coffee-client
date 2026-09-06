import { useState } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Download, Gift, Heart, Share2 } from "lucide-react";
import { downloadStory, shareStory } from "../../utils/girlsDay/shareStory";
import { girlsDaySettings } from "../../data/girlsDayCopy";
import { Doodle } from "./Decorations";

export default function StoryResult({ story, copy, onAgain }) {
  const reducedMotion = useReducedMotion();
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (sharing) return;
    setSharing(true);
    setMessage("");
    try {
      const result = await shareStory(story, copy);
      if (result === "fallback") setMessage(copy.shareFallback);
    } catch { setMessage(copy.shareError); }
    finally { setSharing(false); }
  };
  return <section className="gdResult" aria-labelledby="gdResultTitle">
    <div className="gdResultCopy">
      <p className="gdEyebrow">{copy.readyEyebrow}</p>
      <h1 id="gdResultTitle" tabIndex={-1}>{copy.readyTitle}</h1>
      <p className="gdResultIdentity"><Heart size={16} aria-hidden="true" />{copy.drinkResults[story.drinkId]}</p>
    </div>
    <div className="gdResultLayout">
      <div className="gdResultVisual">
        <Motion.img src={story.url} alt={copy.resultAlt} width="1080" height="1920" className="gdResultImage"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, rotate: -3, scale: 0.94 }} animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }} transition={{ duration: 0.45, ease: "easeOut" }} />
        {!reducedMotion && <div className="gdCelebration" aria-hidden="true">{[-1, 1].map((side) => <Motion.span key={side} initial={{ x: 0, y: 20, opacity: 0, scale: 0.6 }}
          animate={{ x: side * 112, y: [-10, -75, -98], opacity: [0, 1, 0], scale: [0.6, 1, 0.8], rotate: side * 25 }} transition={{ duration: 1.4 }}><Doodle /></Motion.span>)}</div>}
      </div>
      <div className="gdResultActions">
        <button type="button" className="gdButton gdButton--primary" onClick={share} disabled={sharing}><Share2 size={18} aria-hidden="true" />{sharing ? copy.sharing : copy.share}</button>
        <button type="button" className="gdButton gdButton--outline" onClick={() => { downloadStory(story); setMessage(copy.saveMessage); }}><Download size={18} aria-hidden="true" />{copy.save}</button>
        <p className="gdResultMessage" role="status">{message}</p>
        {girlsDaySettings.rewardEnabled && <aside className="gdReward"><Gift size={25} aria-hidden="true" /><div><h2>{copy.reward.title}</h2><p>{copy.reward.text}</p></div></aside>}
        <button type="button" className="gdTextButton gdAgain" onClick={onAgain}><ArrowLeft size={16} aria-hidden="true" />{copy.again}</button>
        <p className="gdPrivacy"><Heart size={13} aria-hidden="true" />{copy.privacy}</p>
      </div>
    </div>
  </section>;
}

import { motion as Motion, useReducedMotion } from "framer-motion";
import { girlsDayArtwork } from "../../data/girlsDayArtwork";

export function Doodle({ kind = "heart", className = "" }) {
  return <svg className={className} viewBox="0 0 66 66" fill="none" aria-hidden="true"><path d={girlsDayArtwork[kind]} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function FloatingDecorations() {
  const reducedMotion = useReducedMotion();
  return <div className="gdDecorations" aria-hidden="true">
    {["heart", "leaf", "bow"].map((kind, i) => <Motion.div key={kind} className={`gdFloat gdFloat--${kind}`}
      animate={reducedMotion ? {} : { y: [0, -7, 0], rotate: [i * 6 - 10, i * 6 - 3, i * 6 - 10] }}
      transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}><Doodle kind={kind} /></Motion.div>)}
  </div>;
}

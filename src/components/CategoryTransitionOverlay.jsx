import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import "./CategoryTransitionOverlay.css";

const category_copy = {
  hot: { title: "Hot Moment", arabic: "دافئ وطازج" },
  cold: { title: "Cold Moment", arabic: "بارد ومنعش" },
  snack: { title: "Snack Moment", arabic: "لقمة حلوة" },
};

function stroke_motion(reduced_motion, delay = 0) {
  return {
    initial: reduced_motion
      ? { opacity: 0 }
      : { opacity: 0, pathLength: 0, strokeDashoffset: 1 },
    animate: reduced_motion
      ? { opacity: 1 }
      : { opacity: 1, pathLength: 1, strokeDashoffset: 0 },
    transition: {
      duration: reduced_motion ? 0.08 : 0.48,
      delay: reduced_motion ? 0 : delay,
      ease: [0.22, 1, 0.36, 1],
    },
    style: { strokeDasharray: "1 1" },
  };
}

function HotDrawing({ reducedMotion }) {
  return (
    <svg className="momentCategoryDrawing" viewBox="0 0 112 72" aria-hidden="true">
      <Motion.path d="M30 35h45v14c0 8-6 14-14 14H44c-8 0-14-6-14-14V35Z" {...stroke_motion(reducedMotion)} />
      <Motion.path d="M75 40h6c8 0 8 13 0 13h-6" {...stroke_motion(reducedMotion, 0.08)} />
      <Motion.path className="accent" d="M42 28c-6-7 6-10 0-18" {...stroke_motion(reducedMotion, 0.13)} />
      <Motion.path className="accent" d="M59 28c-6-7 6-10 0-18" {...stroke_motion(reducedMotion, 0.19)} />
      <Motion.path d="M24 64h64" {...stroke_motion(reducedMotion, 0.24)} />
    </svg>
  );
}

function ColdDrawing({ reducedMotion }) {
  return (
    <svg className="momentCategoryDrawing cold" viewBox="0 0 112 72" aria-hidden="true">
      <Motion.path className="ice" d="M24 31 48 27l4 25-24 4-4-25Z" {...stroke_motion(reducedMotion)} />
      <Motion.path className="ice" d="m59 25 24 3-3 25-24-3 3-25Z" {...stroke_motion(reducedMotion, 0.08)} />
      <Motion.path d="m29 37 14-2M64 32l13 2" {...stroke_motion(reducedMotion, 0.15)} />
      <Motion.path className="accent" d="M92 18v12M86 24h12M89 21l6 6M95 21l-6 6" {...stroke_motion(reducedMotion, 0.22)} />
      <Motion.path d="M20 64h72" {...stroke_motion(reducedMotion, 0.27)} />
    </svg>
  );
}

function SnacksDrawing({ reducedMotion }) {
  return (
    <svg className="momentCategoryDrawing snack" viewBox="0 0 112 72" aria-hidden="true">
      <Motion.path className="caramel" d="M25 46c4-17 16-27 30-27 17 0 30 12 34 28-9 9-19 13-32 13-14 0-24-5-32-14Z" {...stroke_motion(reducedMotion)} />
      <Motion.path d="M39 28c2 11 1 20-3 27M55 20c4 12 4 26 0 39M71 25c-1 11 1 21 6 29" {...stroke_motion(reducedMotion, 0.1)} />
      <Motion.path className="caramel" d="M22 20v10M17 25h10M91 19v10M86 24h10" {...stroke_motion(reducedMotion, 0.2)} />
      <Motion.path d="M20 64h74" {...stroke_motion(reducedMotion, 0.27)} />
    </svg>
  );
}

const drawings = {
  hot: HotDrawing,
  cold: ColdDrawing,
  snack: SnacksDrawing,
};

export default function CategoryTransitionOverlay({ category, isVisible }) {
  const reduced_motion = useReducedMotion();
  const normalized_category = category === "snacks" ? "snack" : category;
  const copy = category_copy[normalized_category] || category_copy.hot;
  const Drawing = drawings[normalized_category] || HotDrawing;

  return (
    <AnimatePresence mode="wait">
      {isVisible ? (
        <Motion.div
          className="momentCategoryOverlay"
          key={normalized_category}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced_motion ? 0.08 : 0.16 }}
          role="status"
          aria-live="polite"
        >
          <Motion.div
            className={`momentCategoryLabel momentCategoryLabel-${normalized_category}`}
            initial={{ opacity: 0, y: reduced_motion ? 0 : 7, scale: reduced_motion ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduced_motion ? 0 : -5, scale: 0.98 }}
            transition={{ duration: reduced_motion ? 0.1 : 0.16, ease: "easeOut" }}
          >
            <Drawing reducedMotion={reduced_motion} />
            <Motion.div
              className="momentCategoryLabelCopy"
              initial={{ opacity: 0, y: reduced_motion ? 0 : 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: reduced_motion ? 0 : 0.34 }}
            >
              <strong>{copy.title}</strong>
              <span lang="ar" dir="rtl">{copy.arabic}</span>
            </Motion.div>
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

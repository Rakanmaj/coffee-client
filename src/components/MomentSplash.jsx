import React from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";

const ink = "#07111F";
const coffee = "#6B432B";
const ease = [0.65, 0, 0.35, 1];

function draw(delay, duration) {
  return {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { delay, duration, ease },
  };
}

export default function MomentSplash() {
  const reduceMotion = useReducedMotion();
  const timing = reduceMotion ? 0.01 : 1;

  return (
    <main className="momentDrawSplash" aria-label="Moment Drive-Through is opening">
      <Motion.svg
        className="momentDrawArtwork"
        viewBox="0 0 360 340"
        role="img"
        aria-label="Moment logo drawn with coffee beans and a car"
        initial="hidden"
        animate="visible"
      >
        <Motion.path
          {...draw(0.08 * timing, 0.25 * timing)}
          d="M176 59c-14-13 12-18 1-36M194 61c-10-10 8-15 2-27"
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth="3"
        />

        <g fill="none" stroke={coffee} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
          <Motion.path
            {...draw(0.3 * timing, 0.28 * timing)}
            d="M128 85c7-10 20-10 28-1 5 8 0 19-10 22-10 3-21-2-22-11 0-4 1-7 4-10Zm1 17c8-2 15-8 20-17"
          />
          <Motion.path
            {...draw(0.36 * timing, 0.28 * timing)}
            d="M169 90c5-11 18-14 27-7 8 7 5 18-4 23-10 6-21 3-24-6-1-4-1-7 1-10Zm4 15c7-4 12-10 16-20"
          />
          <Motion.path
            {...draw(0.42 * timing, 0.28 * timing)}
            d="M214 84c9-8 22-5 27 5 4 10-4 19-14 19-11 0-19-7-17-16 0-3 2-6 4-8Zm0 18c9-1 16-6 21-13"
          />
        </g>

        <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6">
          <Motion.path
            {...draw(0.64 * timing, 0.42 * timing)}
            d="M73 157h18l15-23h93l26 23h35c8 0 14 6 14 14v7H67v-12c0-5 2-8 6-9Z"
          />
          <Motion.path
            {...draw(0.72 * timing, 0.34 * timing)}
            d="M112 136l-8 21h92l-17-21h-67ZM90 178c0-10 7-17 17-17s17 7 17 17M220 178c0-10 7-17 17-17s17 7 17 17M54 178h246"
          />
        </g>

        <Motion.path
          {...draw(1.06 * timing, 0.55 * timing)}
          d="M45 251l4-48 17 33 19-36 2 51M101 226c0-17 9-27 22-27 14 0 22 11 20 28-1 16-10 25-23 24-12-1-19-10-19-25ZM154 251l4-48 17 33 19-36 2 51M211 204c7-4 17-5 26-3m-27 25c8-3 16-4 23-3m-24 28c10-3 21-3 30-1M249 251l3-48 31 45 3-49M296 201h35m-18 1-3 49"
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />

        <Motion.path
          {...draw(1.58 * timing, 0.25 * timing)}
          d="M91 269c53 8 117 8 179-1"
          fill="none"
          stroke={coffee}
          strokeLinecap="round"
          strokeWidth="3.2"
        />

        <Motion.text
          x="180"
          y="301"
          fill={ink}
          fontSize="13"
          letterSpacing="1.4"
          textAnchor="middle"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 0.68, y: 0 }}
          transition={{ delay: 1.8 * timing, duration: 0.28 * timing, ease: "easeOut" }}
        >
          Brewed for your moment
        </Motion.text>
      </Motion.svg>
    </main>
  );
}

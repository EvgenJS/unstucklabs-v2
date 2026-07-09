import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Props {
  startedAt: string;
}

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const AMBIENT_CYCLE_SECONDS = 300; // 5 min -- purely a slow visual loop, not a deadline

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "just started";
  if (minutes === 1) return "1 minute so far";
  return `${minutes} minutes so far`;
}

// "The glow" -- a soft, ambient radial ring instead of a numeric countdown.
// No fixed target/deadline: it fills on a slow repeating loop as ambient
// motion, drifting between the app's primary and accent colors, with a
// gentle breathing pulse. Precise elapsed time is opt-in (tap to reveal),
// never shown by default -- the brief is explicit about avoiding countdown
// pressure.
export function FocusTimer({ startedAt }: Props) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  );
  const [revealed, setRevealed] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const cycleProgress = (elapsedSeconds % AMBIENT_CYCLE_SECONDS) / AMBIENT_CYCLE_SECONDS;
  const dashOffset = CIRCUMFERENCE * (1 - cycleProgress);
  const hueMix = (Math.sin((elapsedSeconds / AMBIENT_CYCLE_SECONDS) * Math.PI * 2) + 1) / 2;

  return (
    <button
      type="button"
      onClick={() => setRevealed((r) => !r)}
      aria-label={revealed ? "Hide elapsed time" : "Show elapsed time"}
      className="group relative flex h-56 w-56 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
    >
      <motion.svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        className="absolute inset-0"
        animate={reducedMotion ? undefined : { scale: [1, 1.03, 1] }}
        transition={reducedMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="var(--color-muted)" strokeWidth="10" />
        <circle
          cx="110"
          cy="110"
          r={RADIUS}
          fill="none"
          stroke={`color-mix(in srgb, var(--color-primary) ${100 - hueMix * 100}%, var(--color-accent) ${hueMix * 100}%)`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 110 110)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </motion.svg>

      <span className="relative text-center">
        {revealed ? (
          <span className="text-sm text-foreground/60">{formatElapsed(elapsedSeconds)}</span>
        ) : (
          <span className="text-sm text-foreground/40">tap for time</span>
        )}
      </span>
    </button>
  );
}

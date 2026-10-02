"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Word = { word: string; color: string };

/**
 * Port of the reference word rotor. Every 3.2s the next word is painted,
 * the fill resets to 0 height, and 260ms later `.go` sweeps the coloured
 * copy up over it (CSS owns the 1.1s transition). Each paint also rewrites
 * --accent on <html> and announces the word to the polite live region.
 * The button is sized once to the widest word so the line never reflows.
 */
export function HeroRotor({
  words,
  initialLabel,
}: {
  words: Word[];
  initialLabel: string;
}) {
  const rotorRef = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);
  const [go, setGo] = useState(false);
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);
  const [label, setLabel] = useState(initialLabel);

  // reserveWidth(): measure every word on a hidden clone, never on React's own nodes.
  // Re-measured once web fonts are ready, so the reserve always reflects
  // Inter rather than whichever fallback happened to be on screen first.
  useLayoutEffect(() => {
    const measure = () => {
      const rotor = rotorRef.current;
      if (!rotor || !rotor.parentElement) return undefined;
      const clone = rotor.cloneNode(true) as HTMLSpanElement;
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      clone.style.position = "absolute";
      clone.style.visibility = "hidden";
      clone.style.pointerEvents = "none";
      clone.setAttribute("aria-hidden", "true");
      const btn = clone.querySelector("button")!;
      btn.style.minWidth = "";
      const base = clone.querySelector(".base")!;
      rotor.parentElement.appendChild(clone);
      let maxW = 0;
      for (const w of words) {
        base.textContent = w.word;
        const dot = document.createElement("span");
        dot.className = "crimson";
        dot.textContent = ".";
        base.appendChild(dot);
        maxW = Math.max(maxW, btn.offsetWidth);
      }
      clone.remove();
      return maxW;
    };
    let cancelled = false;
    setMinWidth(measure());
    document.fonts?.ready.then(() => {
      if (!cancelled) setMinWidth(measure());
    });
    return () => {
      cancelled = true;
    };
  }, [words]);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const timers: number[] = [];
    let idx = 0;

    const paint = (n: number) => {
      const d = words[n];
      setCurrent(n);
      document.documentElement.style.setProperty("--accent", d.color);
      setLabel(`See how we help ${d.word} businesses`);
      const live = document.getElementById("srLive");
      if (live) {
        live.textContent = "";
        live.textContent = d.word;
      }
    };

    const cycle = () => {
      setGo(false);
      paint(idx);
      timers.push(window.setTimeout(() => setGo(true), 260));
      idx = (idx + 1) % words.length;
    };

    let interval = 0;
    // First paint is deferred one tick so no state is set synchronously
    // inside the effect; visually identical to the reference's load-time run.
    timers.push(
      window.setTimeout(() => {
        if (reduce) {
          paint(0);
          setGo(true);
          return;
        }
        cycle();
        interval = window.setInterval(cycle, 3200);
      }, 0)
    );
    return () => {
      window.clearInterval(interval);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [words]);

  const d = words[current];
  return (
    <span className={go ? "rotor go" : "rotor"} id="rotor" ref={rotorRef}>
      <button
        type="button"
        id="rotorBtn"
        aria-label={label}
        style={minWidth ? { minWidth } : undefined}
        onClick={() => {
          const reduce = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches;
          document
            .getElementById("services")
            ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
        }}
      >
        <span className="base" id="rotorBase">
          {d.word}
          <span className="crimson">.</span>
        </span>
        <span className="fill" id="rotorFill" aria-hidden="true">
          <span id="rotorTop" style={{ color: d.color }}>
            {d.word}
            <span className="crimson">.</span>
          </span>
        </span>
      </button>
    </span>
  );
}

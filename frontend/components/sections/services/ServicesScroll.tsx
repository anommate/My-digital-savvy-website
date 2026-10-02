"use client";

import { useEffect } from "react";

/**
 * Scroll controller for the pinned services sequence (port of the
 * reference script). Renders nothing: the panels stay server-rendered and
 * this only toggles classes and custom properties on them.
 *
 * - scroll progress through #wdTrack picks the active panel (rAF-throttled)
 * - the arc ring rotates -15deg per step, numbers/bars/mini-index follow
 * - the progress bar width tracks raw progress
 * - --accent on <html> follows the active panel's colour
 * - cursor drift on the arc rail (fine pointers only)
 * Under reduced motion the CSS unpins and stacks the panels; nothing runs.
 */
export function ServicesScroll() {
  useEffect(() => {
    const track = document.getElementById("wdTrack");
    if (!track) return;
    const ring = document.getElementById("wdRing");
    const panels = Array.from(track.querySelectorAll<HTMLElement>(".wd-panel"));
    const nums = Array.from(track.querySelectorAll<HTMLElement>(".wd-num"));
    const bars = Array.from(track.querySelectorAll<HTMLElement>(".wd-bars i"));
    const mini = document.getElementById("wdMiniNum");
    const progressFill = document.getElementById("wdProgressFill");
    const n = panels.length;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const step = 15;
    // Server markup already shows panel 0. Starting "active" at 0 skips the
    // reference's initial --accent write, which its hero rotor (a later
    // script) immediately overrode, so the rotor's colour wins here too.
    let active = 0;
    let ticking = false;

    function setActive(i: number) {
      if (i === active) return;
      active = i;
      panels.forEach((p, k) => {
        p.classList.toggle("is-on", k === i);
        p.classList.toggle("is-out", k < i);
      });
      nums.forEach((b, k) => b.classList.toggle("is-on", k === i));
      bars.forEach((b, k) => b.classList.toggle("is-on", k <= i));
      if (mini) mini.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
      if (ring) ring.style.transform = `rotate(${-i * step}deg)`;
      const c = getComputedStyle(panels[i]).getPropertyValue("--c").trim();
      if (c) document.documentElement.style.setProperty("--accent", c);
    }

    function read() {
      ticking = false;
      const rect = track!.getBoundingClientRect();
      const total = track!.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      setActive(Math.min(n - 1, Math.floor(p * n)));
      if (progressFill) progressFill.style.width = (p * 100).toFixed(2) + "%";
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(read);
      }
    }

    if (reduce) return;

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    read();

    // arc rail cursor drift
    const cleanups: (() => void)[] = [];
    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    const stage = track.querySelector<HTMLElement>(".wd-stage");
    const rail = track.querySelector<HTMLElement>(".wd-rail");
    if (canHover && stage && rail) {
      const move = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rail.style.setProperty("--px", (px * -16).toFixed(2));
        rail.style.setProperty("--py", (py * -16).toFixed(2));
      };
      const leave = () => {
        rail.style.setProperty("--px", "0");
        rail.style.setProperty("--py", "0");
      };
      stage.addEventListener("pointermove", move);
      stage.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerleave", leave);
      });
    }

    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}

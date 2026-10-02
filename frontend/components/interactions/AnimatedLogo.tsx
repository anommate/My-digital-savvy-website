"use client";

import { useEffect, useRef } from "react";

/**
 * Port of the reference's chromaKeyLogo(): the logo video renders on a flat
 * white background, so every frame is drawn to a canvas and near-white,
 * low-saturation pixels are keyed out live, with a short feathered band.
 * The <video> is visually hidden (never display:none, which stops decoding).
 * Falls back to the plain video if the canvas can't read its own pixels.
 * Under reduced motion it draws one settled frame instead of looping.
 *
 * PERFORMANCE FLAG (deferred to the performance pass, not changed here):
 * per-frame getImageData on the main thread is the heaviest thing on the
 * page. The visually identical fix is a pre-keyed transparent asset.
 */
export function AnimatedLogo({
  canvasClassName,
  videoId,
  canvasId,
}: {
  canvasClassName: string;
  videoId: string;
  canvasId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const W = canvas.width;
    const H = canvas.height;
    let failed = false;
    let raf: number | null = null;
    video.muted = true; // React doesn't reliably reflect `muted`; play() needs it.

    function fallbackToPlainVideo() {
      if (failed || !video || !canvas) return;
      failed = true;
      canvas.style.display = "none";
      video.classList.add("chroma-fallback");
    }

    function keyFrame() {
      if (failed || !video || !ctx) return;
      try {
        ctx.drawImage(video, 0, 0, W, H);
        const frame = ctx.getImageData(0, 0, W, H);
        const d = frame.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i],
            g = d[i + 1],
            b = d[i + 2];
          const lo = Math.min(r, g, b),
            hi = Math.max(r, g, b);
          const neutral = hi - lo < 18;
          const bright = (r + g + b) / 3;
          if (neutral && bright > 224) d[i + 3] = 0;
          else if (neutral && bright > 194)
            d[i + 3] = Math.round(255 * (1 - (bright - 194) / (224 - 194)));
        }
        ctx.putImageData(frame, 0, 0);
      } catch {
        fallbackToPlainVideo();
      }
    }

    const cleanups: (() => void)[] = [];

    if (reduce) {
      const settle = () => {
        video.currentTime = Math.min(7, video.duration || 7);
        const once = () => {
          video.removeEventListener("seeked", once);
          keyFrame();
        };
        video.addEventListener("seeked", once);
        cleanups.push(() => video.removeEventListener("seeked", once));
      };
      if (video.readyState >= 1 && video.duration) settle();
      else {
        video.addEventListener("loadedmetadata", settle, { once: true });
        cleanups.push(() =>
          video.removeEventListener("loadedmetadata", settle)
        );
      }
      return () => cleanups.forEach((fn) => fn());
    }

    const loop = () => {
      keyFrame();
      if (!failed) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) loop();
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!video.paused) start();
    };
    const tryPlay = () => {
      video.play().catch(() => {});
    };

    video.addEventListener("playing", start);
    document.addEventListener("visibilitychange", onVisibility);
    if (video.readyState >= 2) tryPlay();
    else video.addEventListener("loadeddata", tryPlay, { once: true });

    return () => {
      stop();
      video.removeEventListener("playing", start);
      video.removeEventListener("loadeddata", tryPlay);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        id={videoId}
        className="logo-source-video"
        src="/logo-animation.mp4"
        muted
        loop
        playsInline
        preload="auto"
      />
      <canvas
        ref={canvasRef}
        id={canvasId}
        className={canvasClassName}
        width={480}
        height={270}
        aria-hidden="true"
      />
    </>
  );
}

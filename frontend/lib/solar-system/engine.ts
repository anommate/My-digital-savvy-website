import { BODIES, type BodyData, type MoonData } from "./data";
import { mulberry32, renderSphere } from "./textures";

/**
 * Canvas 2D renderer for the services solar-system index.
 *
 * Geometry. The orbital plane is drawn tilted: every orbit is an ellipse
 * around the Sun with the same foreshortening `k`, so the system reads as
 * one plane in depth. In a tall box (desktop rail) the long axis is
 * vertical; in a wide box (phone band, reduced-motion strip) it is
 * horizontal. Depth decides drawing order, so planets pass behind and in
 * front of the Sun.
 *
 * Nesting. Each moon's position is computed from its parent's position
 * every frame (planet = solar orbit; moon = planet + local orbit), on its
 * own ellipse in the parent's equatorial plane, with its own radius,
 * period, phase, inclination and direction. When a planet moves, its moons
 * move with it.
 *
 * Nothing here touches React or the page's CSS: all per-frame values live
 * in this closure, and the only output is pixels on the canvas.
 */

export type SolarOptions = {
  /** number of real service panels; bodies beyond it are background only */
  count: number;
  reducedMotion: boolean;
  /** the site's resolved font family, used for the active label */
  fontFamily: string;
  /** cap the frame rate (phones, coarse pointers) */
  lowPower: boolean;
};

export type SolarSnapshot = {
  mode: "vertical" | "horizontal";
  width: number;
  height: number;
  time: number;
  active: number;
  k: number;
  bodies: {
    id: string;
    x: number;
    y: number;
    r: number;
    R: number;
    theta: number;
    depth: number;
    scale: number;
  }[];
  moons: {
    id: string;
    parent: string;
    x: number;
    y: number;
    a: number;
    rho: number;
    f: number;
  }[];
};

export type SolarEngine = {
  resize(width: number, height: number): void;
  setActive(index: number, accent: string): void;
  start(): void;
  stop(): void;
  renderOnce(): void;
  destroy(): void;
  snapshot(): SolarSnapshot;
};

type RGB = [number, number, number];

type MoonState = {
  data: MoonData;
  /** orbit radius at scale 1, px */
  a: number;
  r: number;
  rho: number;
  f: number;
  color: RGB;
  x: number;
  y: number;
  depth: number;
};

type BodyState = {
  data: BodyData;
  index: number;
  r: number;
  R: number;
  rho: number;
  theta: number;
  x: number;
  y: number;
  depth: number;
  scale: number;
  moons: MoonState[];
  sprite: HTMLCanvasElement | null;
  spriteSize: number;
  ringColor: RGB;
  atmosphere: { color: RGB; alpha: number } | null;
  atmoSprite: HTMLCanvasElement | null;
};

type Star = { x: number; y: number; r: number; a: number };

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
/** active scale × nearest perspective: room each planet system needs */
const GROW = 1.32 * 1.1;
/** Saturn-style ring bands: [from, to, opacity] as fractions of ring width */
const SATURN_RINGS: [number, number, number][] = [
  [0, 0.29, 0.22],
  [0.29, 0.73, 0.95],
  [0.79, 1, 0.62],
];
const SINGLE_RING: [number, number, number][] = [[0, 1, 1]];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function parseColor(input: string, fallback: RGB): RGB {
  const s = input.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(s);
  if (short)
    return [0, 1, 2].map((i) => parseInt(short[1][i] + short[1][i], 16)) as RGB;
  const long = /^#([0-9a-f]{6})$/i.exec(s);
  if (long)
    return [0, 2, 4].map((i) => parseInt(long[1].slice(i, i + 2), 16)) as RGB;
  const fn =
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i.exec(
      s
    );
  if (fn) return [+fn[1], +fn[2], +fn[3]];
  return fallback;
}

function parseAlpha(input: string): number {
  const fn = /^rgba?\([^)]*?[,\s/]([\d.]+)\s*\)$/i.exec(input.trim());
  return fn ? clamp(+fn[1], 0, 1) : 1;
}

const rgba = (c: RGB, a: number) =>
  `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a, 0, 1).toFixed(3)})`;
const tint = (c: RGB, k: number): RGB => [
  Math.min(255, c[0] * k),
  Math.min(255, c[1] * k),
  Math.min(255, c[2] * k),
];

/** half-size of a rotated, foreshortened circle of radius a along one screen axis */
function ellipseHalf(a: number, rho: number, f: number, axis: "x" | "y") {
  const c = Math.cos(rho);
  const s = Math.sin(rho);
  return axis === "x"
    ? a * Math.sqrt(c * c + f * f * s * s)
    : a * Math.sqrt(s * s + f * f * c * c);
}

/** a soft rim glow for planets with atmospheres, drawn once per size */
function renderAtmosphere(b: BodyState, planetSize: number) {
  const atmo = b.atmosphere;
  const c = document.createElement("canvas");
  const D = Math.max(8, Math.round(planetSize * 1.3));
  c.width = D;
  c.height = D;
  const o = c.getContext("2d");
  if (!o || !atmo) return c;
  const R = D / 2;
  const r = R / 1.3;
  const g = o.createRadialGradient(R, R, r * 0.9, R, R, R);
  g.addColorStop(0, rgba(atmo.color, 0));
  g.addColorStop(0.28, rgba(atmo.color, atmo.alpha * 0.85));
  g.addColorStop(1, rgba(atmo.color, 0));
  o.fillStyle = g;
  o.fillRect(0, 0, D, D);
  return c;
}

const NOOP: SolarEngine = {
  resize() {},
  setActive() {},
  start() {},
  stop() {},
  renderOnce() {},
  destroy() {},
  snapshot: () => ({
    mode: "vertical",
    width: 0,
    height: 0,
    time: 0,
    active: -1,
    k: 0,
    bodies: [],
    moons: [],
  }),
};

export function createSolarSystem(
  canvas: HTMLCanvasElement,
  opts: SolarOptions
): SolarEngine {
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) return NOOP;
  const ctx: CanvasRenderingContext2D = maybeCtx;

  let W = 1;
  let H = 1;
  let dpr = 1;
  let vertical = true;
  let compact = false;
  let cx = 0;
  let cy = 0;
  let k = 0.25;
  let unit = 3;
  let time = 0;
  let last = 0;
  let acc = 0;
  let raf = 0;
  let running = false;
  let active = -1;
  let accent: RGB = [1, 254, 251];
  let stars: Star[] = [];
  let sunSprites: HTMLCanvasElement[] = [];
  let sunSpriteSize = 0;
  // the static parts change only on resize or a new active body, so they are
  // drawn once into two layers and blitted each frame: the faint star field
  // with the orbit halves behind the Sun, and the orbit halves in front
  let orbitLayers: { far: HTMLCanvasElement; near: HTMLCanvasElement } | null =
    null;
  let orbitKey = "";
  let labelSprite: {
    key: string;
    canvas: HTMLCanvasElement;
    w: number;
    h: number;
  } | null = null;

  const bodies: BodyState[] = BODIES.map((data, index) => ({
    data,
    index,
    r: 1,
    R: 0,
    rho: data.planeTilt * DEG,
    theta: data.phase,
    x: 0,
    y: 0,
    depth: 0,
    scale: 1,
    moons: [],
    sprite: null,
    spriteSize: 0,
    ringColor: parseColor(data.rings?.color ?? "#ffffff", [255, 255, 255]),
    atmoSprite: null,
    atmosphere: data.atmosphere
      ? {
          color: parseColor(data.atmosphere, [255, 255, 255]),
          alpha: parseAlpha(data.atmosphere),
        }
      : null,
  }));
  const sun = bodies[0];
  const mapped = (i: number) =>
    i >= 0 && i < Math.min(opts.count, bodies.length);

  /** half-extent of a planet's local system (body, rings, moons) on one axis */
  function systemHalf(b: BodyState, axis: "x" | "y") {
    let ext = b.r * GROW;
    const d = b.data;
    if (d.rings)
      ext = Math.max(
        ext,
        ellipseHalf(d.rings.outer * b.r * GROW, b.rho, d.planeFlatten, axis)
      );
    for (const m of b.moons)
      ext = Math.max(
        ext,
        ellipseHalf(m.a * GROW, m.rho, m.f, axis) + m.r * 1.2
      );
    return ext + 2;
  }

  function layout() {
    vertical = H > W * 1.15;
    const major = vertical ? H : W;
    const minor = vertical ? W : H;
    compact = minor < (vertical ? 150 : 130);
    const sunR = vertical
      ? clamp(Math.min(W * 0.13, H * 0.036), 7, 34)
      : clamp(Math.min(H * 0.17, W * 0.045), 6, 30);
    unit = sunR / BODIES[0].size;
    cx = W / 2;
    cy = H / 2;

    for (const b of bodies) {
      b.r =
        b.index === 0
          ? sunR
          : Math.max(compact ? 0.9 : 1.2, unit * b.data.size);
      const list = compact
        ? b.data.moons.filter((m) => m.essential)
        : b.data.moons;
      b.moons = list.map((m) => ({
        data: m,
        a: m.orbitRadius * b.r,
        r: Math.max(compact ? 0.6 : 0.85, unit * m.size),
        rho: b.rho + m.inclination * DEG,
        f: clamp(b.data.planeFlatten * (1 + m.inclination / 60), 0.12, 0.95),
        color: parseColor(m.color, [160, 160, 160]),
        x: 0,
        y: 0,
        depth: 0,
      }));
    }

    const majAxis = vertical ? "y" : "x";
    const minAxis = vertical ? "x" : "y";
    const outer = bodies[bodies.length - 1];
    const inner = bodies[1];
    const rMax = major / 2 - systemHalf(outer, majAxis) - 4;
    const rMin =
      sunR * 1.1 + systemHalf(inner, majAxis) + Math.max(4, sunR * 0.3);
    const span = Math.max(8, rMax - rMin);
    for (const b of bodies) if (b.index > 0) b.R = rMin + span * b.data.orbit;

    let fit = 0.34;
    for (const b of bodies)
      if (b.index > 0)
        fit = Math.min(fit, (minor / 2 - 3 - systemHalf(b, minAxis)) / b.R);
    k = clamp(fit, 0.07, 0.34);

    const rand = mulberry32(1987);
    const n = Math.round(clamp((W * H) / 7000, 10, 44));
    stars = Array.from({ length: n }, () => ({
      x: rand() * W,
      y: rand() * H,
      r: 0.35 + rand() * 0.7,
      a: 0.05 + rand() * 0.2,
    }));
  }

  function ensureSprites() {
    for (const b of bodies) {
      if (b.index === 0) continue;
      const want = Math.ceil(b.r * 2 * GROW * dpr);
      if (b.sprite && want <= b.spriteSize * 1.15 && want >= b.spriteSize * 0.6)
        continue;
      b.spriteSize = clamp(want, 6, 192);
      b.atmoSprite = b.atmosphere ? renderAtmosphere(b, b.spriteSize) : null;
      b.sprite = renderSphere(
        b.data.surface,
        b.spriteSize,
        101 + b.index * 17,
        0.3
      );
    }
    const wantSun = Math.ceil(sun.r * 2 * 1.15 * dpr);
    if (
      !sunSprites.length ||
      wantSun > sunSpriteSize * 1.15 ||
      wantSun < sunSpriteSize * 0.6
    ) {
      sunSpriteSize = clamp(wantSun, 12, 256);
      sunSprites = [
        renderSphere("sun", sunSpriteSize, 11),
        renderSphere("sun", sunSpriteSize, 12, 0.6),
      ];
    }
  }

  function place(t: number) {
    sun.x = cx;
    sun.y = cy;
    for (const b of bodies) {
      if (b.index === 0) continue;
      const th = b.data.phase + (TAU * t) / b.data.period;
      b.theta = th;
      const c = Math.cos(th);
      const s = Math.sin(th);
      if (vertical) {
        b.x = cx + k * b.R * c;
        b.y = cy + b.R * s;
        b.depth = c;
      } else {
        b.x = cx + b.R * c;
        b.y = cy + k * b.R * s;
        b.depth = s;
      }
      // moons: the parent's position plus each moon's own orbit around it
      for (const m of b.moons) {
        const ph = m.data.phase + (m.data.direction * TAU * t) / m.data.period;
        const a = m.a * b.scale;
        const lx = a * Math.cos(ph);
        const ly = a * m.f * Math.sin(ph);
        const cr = Math.cos(m.rho);
        const sr = Math.sin(m.rho);
        m.x = b.x + lx * cr - ly * sr;
        m.y = b.y + lx * sr + ly * cr;
        m.depth = Math.sin(ph);
      }
    }
  }

  function strokeOrbit(
    o: CanvasRenderingContext2D,
    b: BodyState,
    near: boolean
  ) {
    const rx = vertical ? k * b.R : b.R;
    const ry = vertical ? b.R : k * b.R;
    const from = vertical
      ? near
        ? -Math.PI / 2
        : Math.PI / 2
      : near
        ? 0
        : Math.PI;
    const isActive = b.index === active;
    o.beginPath();
    o.ellipse(cx, cy, rx, ry, 0, from, from + Math.PI);
    o.lineWidth = isActive ? 1.2 : 1;
    o.strokeStyle = isActive
      ? rgba(accent, near ? 0.42 : 0.2)
      : `rgba(255,255,255,${near ? 0.075 : 0.045})`;
    o.stroke();
  }

  function orbitLayer(near: boolean): HTMLCanvasElement | null {
    const key = `${canvas.width}x${canvas.height}|${k}|${cx},${cy}|${active}|${accent.join(",")}`;
    if (!orbitLayers || key !== orbitKey) {
      orbitKey = key;
      const make = (half: boolean) => {
        const c = document.createElement("canvas");
        c.width = canvas.width;
        c.height = canvas.height;
        const o = c.getContext("2d");
        if (o) {
          o.setTransform(dpr, 0, 0, dpr, 0, 0);
          if (!half)
            for (const st of stars) {
              o.fillStyle = `rgba(255,255,255,${st.a.toFixed(3)})`;
              o.fillRect(st.x, st.y, st.r * 1.6, st.r * 1.6);
            }
          for (const b of bodies) if (b.index > 0) strokeOrbit(o, b, half);
        }
        return c;
      };
      orbitLayers = { far: make(false), near: make(true) };
    }
    return near ? orbitLayers.near : orbitLayers.far;
  }

  function drawSun(t: number) {
    const isActive = active === 0;
    const r = sun.r * sun.scale;
    const breath = opts.reducedMotion ? 1 : 1 + 0.03 * Math.sin(t * 0.6);
    const outer = r * (isActive ? 3.1 : 2.6) * breath;
    const g = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, outer);
    g.addColorStop(0, `rgba(255,188,92,${isActive ? 0.46 : 0.34})`);
    g.addColorStop(0.3, `rgba(255,136,48,${isActive ? 0.15 : 0.1})`);
    g.addColorStop(1, "rgba(255,110,30,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, TAU);
    ctx.fill();
    // two granulation layers cross-fading: slow, subtle surface movement
    ctx.drawImage(sunSprites[0], cx - r, cy - r, r * 2, r * 2);
    ctx.globalAlpha = opts.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.45);
    ctx.drawImage(sunSprites[1], cx - r, cy - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
    if (active > 0) {
      // another body is active: the Sun steps back a little
      ctx.fillStyle = "rgba(8,8,8,0.18)";
      ctx.beginPath();
      ctx.arc(cx, cy, r + 0.5, 0, TAU);
      ctx.fill();
    }
    if (isActive) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.16 + 2, 0, TAU);
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(accent, 0.75);
      ctx.stroke();
    }
  }

  function drawRings(b: BodyState, r: number, front: boolean, dim: number) {
    const rg = b.data.rings;
    if (!rg) return;
    const inner = rg.inner * r;
    const width = (rg.outer - rg.inner) * r;
    const c = Math.cos(b.rho) * dpr;
    const sn = Math.sin(b.rho) * dpr;
    const fl = b.data.planeFlatten;
    ctx.setTransform(c, sn, -sn * fl, c * fl, b.x * dpr, b.y * dpr);
    for (const [f0, f1, op] of b.data.id === "saturn"
      ? SATURN_RINGS
      : SINGLE_RING) {
      const r0 = inner + width * f0;
      const r1 = inner + width * f1;
      ctx.beginPath();
      ctx.arc(0, 0, (r0 + r1) / 2, front ? 0 : Math.PI, front ? Math.PI : TAU);
      ctx.lineWidth = r1 - r0;
      ctx.strokeStyle = rgba(b.ringColor, rg.opacity * op * dim);
      ctx.stroke();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawMoonOrbits(b: BodyState, front: boolean, alpha: number) {
    if (alpha <= 0.002 || !b.moons.length) return;
    const from = front ? 0 : Math.PI;
    const dir = front ? 1 : -1;
    ctx.beginPath();
    for (const m of b.moons) {
      const a = m.a * b.scale;
      ctx.moveTo(
        b.x + dir * a * Math.cos(m.rho),
        b.y + dir * a * Math.sin(m.rho)
      );
      ctx.ellipse(b.x, b.y, a, a * m.f, m.rho, from, from + Math.PI);
    }
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    ctx.stroke();
  }

  function drawMoon(
    m: MoonState,
    lx: number,
    ly: number,
    alpha: number,
    grow: number,
    shaded: boolean
  ) {
    const r = m.r * grow;
    if (!shaded || r < 1.05) {
      ctx.fillStyle = rgba(m.color, alpha * 0.9);
      ctx.beginPath();
      ctx.arc(m.x, m.y, Math.max(0.6, r), 0, TAU);
      ctx.fill();
      return;
    }
    const g = ctx.createRadialGradient(
      m.x + lx * r * 0.45,
      m.y + ly * r * 0.45,
      r * 0.1,
      m.x,
      m.y,
      r * 1.05
    );
    g.addColorStop(0, rgba(tint(m.color, 1.25), alpha));
    g.addColorStop(0.55, rgba(m.color, alpha));
    g.addColorStop(1, rgba(tint(m.color, 0.28), alpha));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(m.x, m.y, r, 0, TAU);
    ctx.fill();
  }

  function drawPlanet(
    b: BodyState,
    r: number,
    lx: number,
    ly: number,
    isActive: boolean,
    dim: number
  ) {
    if (!b.sprite) return;
    if (b.rho) {
      const c = Math.cos(b.rho) * dpr;
      const sn = Math.sin(b.rho) * dpr;
      ctx.setTransform(c, sn, -sn, c, b.x * dpr, b.y * dpr);
      ctx.drawImage(b.sprite, -r, -r, r * 2, r * 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else {
      ctx.drawImage(b.sprite, b.x - r, b.y - r, r * 2, r * 2);
    }
    // night side, facing away from the Sun: a gradient filled into the disk
    const dark = isActive ? 0.5 : 0.8;
    const g = ctx.createLinearGradient(
      b.x + lx * r,
      b.y + ly * r,
      b.x - lx * r,
      b.y - ly * r
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.45, "rgba(0,0,0,0.03)");
    g.addColorStop(0.64, `rgba(0,0,0,${(dark * 0.62).toFixed(3)})`);
    g.addColorStop(1, `rgba(0,0,0,${dark})`);
    ctx.beginPath();
    ctx.arc(b.x, b.y, r + 0.3, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    // inactive bodies recede toward the background instead of turning see-through
    if (dim < 1) {
      ctx.fillStyle = `rgba(8,8,8,${(1 - dim).toFixed(3)})`;
      ctx.fill();
    }
    if (b.atmoSprite) {
      ctx.globalAlpha = dim;
      ctx.drawImage(
        b.atmoSprite,
        b.x - r * 1.3,
        b.y - r * 1.3,
        r * 2.6,
        r * 2.6
      );
      ctx.globalAlpha = 1;
    }
  }

  function drawSystem(b: BodyState) {
    const isActive = b.index === active;
    const someActive = active >= 0;
    const r = b.r * b.scale * (1 + 0.1 * b.depth);
    const dim =
      (someActive ? (isActive ? 1 : 0.58) : 0.85) *
      (0.82 + 0.09 * (b.depth + 1));
    let lx = cx - b.x;
    let ly = cy - b.y;
    const len = Math.hypot(lx, ly) || 1;
    lx /= len;
    ly /= len;
    const moonAlpha = isActive ? 1 : 0.45 * dim;
    const orbitAlpha = isActive ? 0.17 : 0.04 * dim;
    const moonGrow = isActive ? 1.15 : 1;

    if (isActive) {
      const halo = ctx.createRadialGradient(
        b.x,
        b.y,
        r * 0.9,
        b.x,
        b.y,
        r * 2.7
      );
      halo.addColorStop(0, rgba(accent, 0.17));
      halo.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r * 2.7, 0, TAU);
      ctx.fill();
    }
    drawMoonOrbits(b, false, orbitAlpha);
    for (const m of b.moons)
      if (m.depth < 0)
        drawMoon(m, lx, ly, moonAlpha * 0.85, moonGrow, isActive);
    drawRings(b, r, false, dim);
    drawPlanet(b, r, lx, ly, isActive, Math.min(1, dim));
    drawRings(b, r, true, dim);
    drawMoonOrbits(b, true, orbitAlpha);
    for (const m of b.moons)
      if (m.depth >= 0) drawMoon(m, lx, ly, moonAlpha, moonGrow, isActive);
    if (isActive && !b.data.rings) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, r * 1.18 + 1, 0, TAU);
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(accent, 0.7);
      ctx.stroke();
    }
  }

  function drawLabel() {
    if (!mapped(active)) return;
    const b = bodies[active];
    const fs = compact ? 9 : 10.5;
    const label = labelImage(active, fs);
    const w = label.w;
    let rr = b.r * b.scale * (1 + 0.1 * b.depth);
    if (b.data.rings)
      rr = Math.max(
        rr,
        ellipseHalf(
          b.data.rings.outer * rr,
          b.rho,
          b.data.planeFlatten,
          vertical ? "x" : "y"
        )
      );
    // beside the body, on the side away from the Sun so it never sits on
    // it; flips side only when it would run off the edge
    const right = b.index === 0 || b.x >= cx;
    let x = right ? b.x + rr + 9 : b.x - rr - 9 - w;
    if (x + w > W - 4) x = b.x - rr - 9 - w;
    if (x < 4) x = b.x + rr + 9;
    x = clamp(x, 4, Math.max(4, W - w - 4));
    const y = clamp(b.y - label.h / 2, 2, H - label.h - 2);
    ctx.drawImage(label.canvas, x, y, label.w, label.h);
  }

  /** "04 — EARTH" (or just "04" in a narrow gutter), drawn once and reused */
  function labelImage(index: number, fs: number) {
    const key = `${index}|${accent.join(",")}|${fs}|${W}|${dpr}`;
    if (labelSprite && labelSprite.key === key) return labelSprite;
    const font = `600 ${fs}px ${opts.fontFamily || "sans-serif"}`;
    const spacing = `${(fs * 0.12).toFixed(2)}px`;
    ctx.font = font;
    ctx.letterSpacing = spacing;
    const num = String(index + 1).padStart(2, "0");
    const wNum = ctx.measureText(num).width;
    let rest = ` — ${bodies[index].data.name.toUpperCase()}`;
    let w = wNum + ctx.measureText(rest).width;
    if (w > W - 8) {
      rest = "";
      w = wNum;
    }
    ctx.letterSpacing = "0px";
    const h = Math.ceil(fs * 1.6);
    const c = document.createElement("canvas");
    c.width = Math.ceil(w * dpr) + 2;
    c.height = Math.ceil(h * dpr);
    const o = c.getContext("2d");
    if (o) {
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      o.font = font;
      o.letterSpacing = spacing;
      o.textBaseline = "middle";
      o.fillStyle = rgba(accent, 0.95);
      o.fillText(num, 0, h / 2);
      if (rest) {
        o.fillStyle = "rgba(239,239,239,0.78)";
        o.fillText(rest, wNum, h / 2);
      }
    }
    labelSprite = { key, canvas: c, w: (c.width - 2) / dpr + 2 / dpr, h };
    return labelSprite;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const planets = bodies.slice(1).sort((a, b) => a.depth - b.depth);
    const far = orbitLayer(false);
    if (far) ctx.drawImage(far, 0, 0, W, H);
    for (const b of planets) if (b.depth < 0) drawSystem(b);
    drawSun(time);
    const near = orbitLayer(true);
    if (near) ctx.drawImage(near, 0, 0, W, H);
    for (const b of planets) if (b.depth >= 0) drawSystem(b);
    drawLabel();
  }

  const targetScale = (b: BodyState) =>
    b.index === active ? (b.index === 0 ? 1.1 : 1.32) : 1;

  function render() {
    place(time);
    draw();
  }

  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!last) {
      last = now;
      return;
    }
    let dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (opts.lowPower) {
      acc += dt;
      if (acc < 1 / 30) return;
      dt = acc;
      acc = 0;
    }
    time += dt;
    const blend = 1 - Math.exp(-dt * 5);
    for (const b of bodies) b.scale += (targetScale(b) - b.scale) * blend;
    render();
  }

  return {
    resize(width, height) {
      if (width < 2 || height < 2) return;
      W = width;
      H = height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      layout();
      ensureSprites();
      render();
    },
    setActive(index, color) {
      active = mapped(index) ? index : -1;
      accent = parseColor(color, accent);
      if (!running) {
        for (const b of bodies) b.scale = targetScale(b);
        render();
      }
    },
    start() {
      if (running || opts.reducedMotion) return;
      running = true;
      last = 0;
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    renderOnce() {
      for (const b of bodies) b.scale = targetScale(b);
      render();
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      sunSprites = [];
      orbitLayers = null;
      for (const b of bodies) {
        b.sprite = null;
        b.atmoSprite = null;
      }
      canvas.width = 0;
      canvas.height = 0;
    },
    snapshot() {
      return {
        mode: vertical ? "vertical" : "horizontal",
        width: W,
        height: H,
        time,
        active,
        k,
        bodies: bodies.map((b) => ({
          id: b.data.id,
          x: b.x,
          y: b.y,
          r: b.r,
          R: b.R,
          theta: b.theta,
          depth: b.depth,
          scale: b.scale,
        })),
        moons: bodies.flatMap((b) =>
          b.moons.map((m) => ({
            id: m.data.id,
            parent: b.data.id,
            x: m.x,
            y: m.y,
            a: m.a * b.scale,
            rho: m.rho,
            f: m.f,
          }))
        ),
      };
    },
  };
}

import type { SurfaceId } from "./data";

/**
 * Procedural sphere sprites for the solar-system index. Each body's surface
 * is generated once, in code, from seeded 3D value noise sampled directly
 * on the unit sphere (no seams, no downloaded textures), then rendered into
 * a small offscreen canvas at the size it is actually drawn. Lighting from
 * the Sun is applied per frame by the renderer, so the sprites carry only
 * colour, surface detail and a soft limb.
 */

type RGB = [number, number, number];
type Surface = (x: number, y: number, z: number, mu: number) => RGB;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];

export function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Noise = (x: number, y: number, z: number) => number;

/** 3D value noise, 0..1, smoothstep-interpolated on an integer lattice. */
function makeNoise(seed: number): Noise {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const vals = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    perm[i] = i;
    vals[i] = rand();
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = perm[i];
    perm[i] = perm[j];
    perm[j] = t;
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const h = (x: number, y: number, z: number) =>
    vals[perm[(perm[(perm[x & 255] + y) & 255] + z) & 255]];
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x, y, z) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const xf = s(x - xi);
    const yf = s(y - yi);
    const zf = s(z - zi);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const x0 = lerp(h(xi, yi, zi), h(xi + 1, yi, zi), xf);
    const x1 = lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf);
    const x2 = lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf);
    const x3 = lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf);
    return lerp(lerp(x0, x1, yf), lerp(x2, x3, yf), zf);
  };
}

function fbm(n: Noise, x: number, y: number, z: number, octaves: number) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * n(x * freq + 31.7 * i, y * freq, z * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

const asin = (y: number) => Math.asin(clamp(y, -1, 1));

function unitVector(rand: () => number): RGB {
  const u = rand() * 2 - 1;
  const t = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(t), u, s * Math.sin(t)];
}

const SURFACES: Record<SurfaceId, (seed: number) => Surface> = {
  sun: (seed) => {
    const n = makeNoise(seed);
    return (x, y, z, mu) => {
      const g = fbm(n, x * 7 + 10, y * 7, z * 7, 3);
      const fine = n(x * 22, y * 22, z * 22);
      const t = Math.sqrt(mu);
      // white-hot centre, gold, then orange-red at the limb
      const c = mix(
        [236, 92, 22],
        mix([255, 172, 52], [255, 244, 210], t * t * t),
        t
      );
      const br =
        (0.82 + 0.3 * g + 0.1 * (fine - 0.5)) * (0.6 + 0.4 * mu ** 0.5);
      return scale(c, br);
    };
  },
  mercury: (seed) => {
    const n = makeNoise(seed);
    const rand = mulberry32(seed + 7);
    const craters = Array.from({ length: 30 }, () => ({
      v: unitVector(rand),
      r: 0.05 + rand() * 0.14,
    }));
    return (x, y, z, mu) => {
      let s = 0.7 + 0.42 * fbm(n, x * 3, y * 3, z * 3, 4);
      for (const c of craters) {
        const d = Math.acos(clamp(x * c.v[0] + y * c.v[1] + z * c.v[2], -1, 1));
        if (d < c.r) {
          const q = d / c.r;
          s *= q > 0.8 ? 1.12 : 0.8 + 0.12 * q;
        }
      }
      return scale([150, 138, 126], s * (0.78 + 0.22 * mu));
    };
  },
  venus: (seed) => {
    const n = makeNoise(seed);
    return (x, y, z, mu) => {
      const warp = fbm(n, x * 3, y * 3, z * 3, 2) * 1.3;
      const sw = fbm(n, x * 2.2, y * 5.5 + warp, z * 2.2, 4);
      const c = mix(
        [204, 164, 98],
        [246, 230, 190],
        clamp(sw * 1.3 - 0.12, 0, 1)
      );
      return scale(c, 0.8 + 0.2 * mu);
    };
  },
  earth: (seed) => {
    const n = makeNoise(seed);
    const m = makeNoise(seed + 3);
    return (x, y, z, mu) => {
      const lat = Math.abs(y);
      const land = fbm(n, x * 1.7, y * 1.7, z * 1.7, 5);
      let c: RGB;
      if (land > 0.535) {
        const v = fbm(m, x * 4, y * 4, z * 4, 3);
        c = mix(
          [56, 104, 48],
          [152, 124, 80],
          clamp(v * 1.4 - 0.32 + lat * 0.45, 0, 1)
        );
      } else {
        c = mix([12, 46, 106], [28, 96, 176], clamp(land * 1.65, 0, 1));
      }
      if (lat > 0.9 + (fbm(m, x * 5, y * 5, z * 5, 2) - 0.5) * 0.12)
        c = [234, 240, 246];
      const cl = fbm(m, x * 3.2 + 5, y * 4.6, z * 3.2, 4);
      c = mix(c, [246, 248, 252], clamp((cl - 0.55) * 3.2, 0, 0.85));
      return scale(c, 0.78 + 0.22 * mu);
    };
  },
  mars: (seed) => {
    const n = makeNoise(seed);
    return (x, y, z, mu) => {
      const v = fbm(n, x * 2.6, y * 2.6, z * 2.6, 5);
      let c = mix([108, 48, 30], [208, 116, 68], clamp(v * 1.6 - 0.26, 0, 1));
      if (y > 0.92) c = mix(c, [236, 232, 228], clamp((y - 0.92) * 18, 0, 1));
      return scale(c, 0.8 + 0.2 * mu);
    };
  },
  jupiter: (seed) => {
    const n = makeNoise(seed);
    return (x, y, z, mu) => {
      const turb = fbm(n, x * 3, y * 3, z * 3, 4) - 0.5;
      const lat = asin(y);
      const band = Math.sin(lat * 9.5 + turb * 1.1);
      const fine = Math.sin(lat * 23 + turb * 2.2);
      let c = mix(
        [148, 100, 64],
        [240, 226, 198],
        clamp(0.5 + band * 0.45 + fine * 0.08, 0, 1)
      );
      c = mix(c, [126, 108, 94], clamp((Math.abs(y) - 0.8) * 3, 0, 1) * 0.6);
      // the Great Red Spot, in the southern hemisphere
      const lon = Math.atan2(x, z);
      const e = ((lon - 0.5) / 0.3) ** 2 + ((lat + 0.36) / 0.1) ** 2;
      if (e < 1) c = mix(c, [194, 94, 64], (1 - e) * 0.85);
      return scale(c, 0.74 + 0.26 * mu ** 0.6);
    };
  },
  saturn: (seed) => {
    const n = makeNoise(seed);
    return (x, y, z, mu) => {
      const turb = fbm(n, x * 2, y * 2, z * 2, 3) - 0.5;
      const band = Math.sin(asin(y) * 8 + turb * 0.6);
      let c = mix(
        [194, 164, 108],
        [240, 224, 176],
        clamp(0.55 + band * 0.3, 0, 1)
      );
      c = mix(c, [150, 160, 170], clamp((Math.abs(y) - 0.82) * 3, 0, 1) * 0.5);
      return scale(c, 0.74 + 0.26 * mu ** 0.6);
    };
  },
  uranus: (seed) => {
    const n = makeNoise(seed);
    return (x, y, z, mu) => {
      const v = fbm(n, x * 1.5, y * 4, z * 1.5, 3);
      const c = mix(
        [124, 194, 206],
        [182, 232, 238],
        clamp(0.42 + (v - 0.5) * 0.5 + y * 0.15, 0, 1)
      );
      return scale(c, 0.76 + 0.24 * mu ** 0.5);
    };
  },
  neptune: (seed) => {
    const n = makeNoise(seed);
    return (x, y, z, mu) => {
      const turb = fbm(n, x * 2.5, y * 2.5, z * 2.5, 4) - 0.5;
      const lat = asin(y);
      const band = Math.sin(lat * 7 + turb * 1.4);
      let c = mix(
        [32, 56, 148],
        [76, 120, 222],
        clamp(0.5 + band * 0.3 + turb * 0.4, 0, 1)
      );
      const lon = Math.atan2(x, z);
      const spot = ((lon - 0.9) / 0.28) ** 2 + ((lat + 0.35) / 0.09) ** 2;
      if (spot < 1) c = mix(c, [18, 28, 88], (1 - spot) * 0.8);
      const streak = ((lon + 0.4) / 0.35) ** 2 + ((lat - 0.45) / 0.025) ** 2;
      if (streak < 1) c = mix(c, [230, 238, 255], (1 - streak) * 0.7);
      return scale(c, 0.74 + 0.26 * mu ** 0.5);
    };
  },
};

/**
 * A lit-independent sphere sprite: `diameter` device pixels, equator
 * horizontal, anti-aliased edge. `spin` turns the globe about its axis so
 * two sprites of the same body can show slightly different faces.
 */
export function renderSphere(
  surface: SurfaceId,
  diameter: number,
  seed: number,
  spin = 0
): HTMLCanvasElement {
  const D = Math.max(4, Math.round(diameter));
  const canvas = document.createElement("canvas");
  canvas.width = D;
  canvas.height = D;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const img = ctx.createImageData(D, D);
  const data = img.data;
  const fn = SURFACES[surface](seed);
  const R = D / 2;
  const cs = Math.cos(spin);
  const sn = Math.sin(spin);
  for (let j = 0; j < D; j++) {
    for (let i = 0; i < D; i++) {
      const u = (i + 0.5 - R) / R;
      const v = (j + 0.5 - R) / R;
      const d = Math.sqrt(u * u + v * v);
      const cover = clamp((1 - d) * R + 0.5, 0, 1);
      if (cover <= 0) continue;
      const x = u;
      const y = -v;
      const z = Math.sqrt(Math.max(0, 1 - d * d));
      const c = fn(x * cs + z * sn, y, -x * sn + z * cs, z);
      const k = (j * D + i) * 4;
      data[k] = clamp(c[0], 0, 255);
      data[k + 1] = clamp(c[1], 0, 255);
      data[k + 2] = clamp(c[2], 0, 255);
      data[k + 3] = cover * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

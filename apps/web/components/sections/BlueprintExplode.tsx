'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap, ScrollTrigger, ensureGsapRegistered } from '@/lib/animations';
import styles from './BlueprintExplode.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE — set to true to activate canvas-based checkerboard keying.
// false = CSS mix-blend-mode: screen + filter approach (default).
// Canvas approach: removes near-neutral gray pixels by alpha-thresholding.
// ─────────────────────────────────────────────────────────────────────────────
const USE_CANVAS_KEYOUT = false;

// ── Canvas keyout — module-level cache so each src is processed once ──────────
const _cache = new Map<string, string>();

function processImage(src: string): Promise<string> {
  if (_cache.has(src)) return Promise.resolve(_cache.get(src)!);
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const c   = document.createElement('canvas');
      c.width   = img.naturalWidth;
      c.height  = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const id  = ctx.getImageData(0, 0, c.width, c.height);
      const d   = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const spread = Math.max(r, g, b) - Math.min(r, g, b);
        const lum    = (r + g + b) / 3;
        // Near-neutral gray (checkerboard squares) → alpha-fade to transparent.
        // Wireframe lines are near-white (lum ≥ 238) and are preserved.
        if (spread < 38 && lum > 85 && lum < 238) {
          // Soft edge: partially transparent toward pure white to prevent hard cutoff
          d[i + 3] = Math.round(((lum - 85) / (238 - 85)) * 55);
        }
      }
      ctx.putImageData(id, 0, 0);
      const url = c.toDataURL();
      _cache.set(src, url);
      resolve(url);
    };
    img.src = src;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PART DEFINITIONS
// base:    [x, y] from center at 1440px viewport width (assembled positions)
// explode: [x, y, rotZ] exploded positions + small rotation for depth illusion
// Positions are scaled at runtime by: window.innerWidth / 1440
// ─────────────────────────────────────────────────────────────────────────────
type PartDef = {
  id:      string;
  src:     string;
  w:       number;
  h:       number;
  z:       number;
  base:    [number, number];
  explode: [number, number, number]; // [x, y, rotateZ°]
  flip?:   { x?: boolean; y?: boolean };
};

const PARTS: PartDef[] = [
  // Chassis — anchor, stays centered
  { id: 'chassis', src: '/Chassis.png',          w: 480, h: 320, z: 3, base: [0,    0  ], explode: [0,    0,    0 ] },
  // Suspension corners — mirrored variants. Explode ~18% tighter than before.
  { id: 'suspFL',  src: '/suspensioncorner.png', w: 130, h: 130, z: 4, base: [-162, -78], explode: [-210, -133, -4] },
  { id: 'suspFR',  src: '/suspensioncorner.png', w: 130, h: 130, z: 4, base: [ 162, -78], explode: [ 210, -133,  4], flip: { x: true }        },
  { id: 'suspRL',  src: '/suspensioncorner.png', w: 130, h: 130, z: 4, base: [-162,  78], explode: [-210,  133,  3], flip: { y: true }        },
  { id: 'suspRR',  src: '/suspensioncorner.png', w: 130, h: 130, z: 4, base: [ 162,  78], explode: [ 210,  133, -3], flip: { x: true, y: true } },
  // Wheels — symmetric, restrained diagonal
  { id: 'wheelFL', src: '/wheel.png',            w: 110, h: 110, z: 5, base: [-196, -86], explode: [-267, -154, -6] },
  { id: 'wheelFR', src: '/wheel.png',            w: 110, h: 110, z: 5, base: [ 196, -86], explode: [ 267, -154,  6] },
  { id: 'wheelRL', src: '/wheel.png',            w: 110, h: 110, z: 5, base: [-196,  86], explode: [-267,  154, -5] },
  { id: 'wheelRR', src: '/wheel.png',            w: 110, h: 110, z: 5, base: [ 196,  86], explode: [ 267,  154,  5] },
  // Electronics — vertical lift, restrained
  { id: 'battery', src: '/BatteryPack.png',      w: 180, h: 110, z: 6, base: [ 52,  112], explode: [  48,  217,  2] },
  { id: 'pcb',     src: '/PCB.png',              w: 185, h: 135, z: 7, base: [-24,   18], explode: [ -23,   75, -1] },
  { id: 'jetson',  src: '/jetson.png',           w: 160, h: 120, z: 8, base: [  0,  -58], explode: [   0, -157,  0] },
  { id: 'lidar',   src: '/LIDAR.png',            w: 140, h: 100, z: 9, base: [  0, -130], explode: [   0, -261,  0] },
];

const CAR  = { src: '/car.png', w: 640, h: 430 };

// Beat D: focus sequence
const FOCUS = ['jetson', 'pcb', 'lidar', 'battery'] as const;
type FocusId = typeof FOCUS[number];
const ELEC  = new Set<string>(FOCUS);

// clamp() for responsive image widths (1440px design width = 100%)
function clampW(w: number): string {
  return `clamp(${Math.round(w * 0.42)}px, ${(w / 14.4).toFixed(1)}vw, ${w}px)`;
}

// ── Depth-parallax scale per part during Beat C (E returns all to 1) ─────────
const EXPLODE_SCALE: Record<string, number> = {
  chassis: 1.00,
  suspFL: 1.015, suspFR: 1.015, suspRL: 1.015, suspRR: 1.015,
  wheelFL: 1.03, wheelFR: 1.03, wheelRL: 1.03,  wheelRR: 1.03,
  battery: 0.99, pcb: 0.99, jetson: 1.005, lidar: 1.02,
};

// ── Filter string constants — identical function ORDER & COUNT for GSAP lerp ─
// Format: blur brightness contrast drop-shadow×3
const F_IDLE  = 'blur(0px)   brightness(1)    contrast(1)    drop-shadow(0 0 0px  rgba(255,255,255,0))    drop-shadow(0 0 0px  rgba(120,200,255,0))    drop-shadow(0 0 0px  rgba(120,200,255,0))';
const F_DIM   = 'blur(3.5px) brightness(0.28) contrast(0.85) drop-shadow(0 0 0px  rgba(255,255,255,0))    drop-shadow(0 0 0px  rgba(120,200,255,0))    drop-shadow(0 0 0px  rgba(120,200,255,0))';
const F_FOCUS = 'blur(0px)   brightness(1.22) contrast(1)    drop-shadow(0 0 10px rgba(255,255,255,0.35)) drop-shadow(0 0 28px rgba(120,200,255,0.22)) drop-shadow(0 0 55px rgba(120,200,255,0.12))';
const F_BGDIM = 'blur(0px)   brightness(0.5)  contrast(0.9)  drop-shadow(0 0 0px  rgba(255,255,255,0))    drop-shadow(0 0 0px  rgba(120,200,255,0))    drop-shadow(0 0 0px  rgba(120,200,255,0))';

// ─────────────────────────────────────────────────────────────────────────────
export default function BlueprintExplode() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cameraRef  = useRef<HTMLDivElement>(null);
  const carRef     = useRef<HTMLDivElement>(null);
  const partRefs   = useRef<Map<string, HTMLDivElement>>(new Map());

  const setPartRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) partRefs.current.set(id, el);
    else    partRefs.current.delete(id);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    ensureGsapRegistered();

    // Scale: 1 at 1440px desktop; ~0.52 on mobile
    const isMobile = window.innerWidth <= 768;
    const s = isMobile
      ? Math.min(window.innerWidth / 1440, 1) * 0.52
      : Math.min(window.innerWidth / 1440, 1);

    const camera = cameraRef.current!;
    const car    = carRef.current!;
    const refs   = partRefs.current;

    const allEls     = PARTS.map(p => refs.get(p.id)).filter((e): e is HTMLDivElement => !!e);
    const nonElecEls = PARTS.filter(p => !ELEC.has(p.id)).map(p => refs.get(p.id)).filter((e): e is HTMLDivElement => !!e);

    let tl: gsap.core.Timeline | null = null;
    let st: ScrollTrigger | null = null;
    let cancelled = false;

    const setup = async () => {
      // ── Optional canvas keyout ────────────────────────────────────────────
      if (USE_CANVAS_KEYOUT) {
        const uniqueSrcs = [...new Set(PARTS.map(p => p.src))];
        const urlMap     = new Map<string, string>();
        await Promise.all(uniqueSrcs.map(src =>
          processImage(src).then(url => urlMap.set(src, url))
        ));
        if (cancelled) return;
        refs.forEach((el, id) => {
          const part = PARTS.find(p => p.id === id);
          if (!part) return;
          const url = urlMap.get(part.src);
          if (!url) return;
          // Replace Next.js optimised img src with canvas-processed dataURL
          el.querySelectorAll('img').forEach(img => {
            img.src    = url;
            img.srcset = ''; // clear srcset so our src wins
          });
        });
      }

      if (cancelled) return;

      // ── Initial states ────────────────────────────────────────────────────
      // Camera starts pushed-back and slightly rotated (Beat A resets it)
      gsap.set(camera, { scale: 0.93, rotateZ: -0.4 });
      gsap.set(car,    { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.88, zIndex: 2 });
      PARTS.forEach(p => {
        const el = refs.get(p.id);
        if (!el) return;
        gsap.set(el, {
          xPercent: -50, yPercent: -50,
          x: p.base[0] * s, y: p.base[1] * s,
          rotation: 0, scale: 1,
          opacity: 0,
          filter:  F_IDLE,
        });
      });

      // ── Master timeline — beats keyed to new % positions (total = 10) ────
      // Beat A: 0–14%  (0–1.4)
      // Beat B: 14–32% (1.4–3.2)
      // Beat C: 32–64% (3.2–6.4)
      // Beat D: 64–86% (6.4–8.6)
      // Beat E: 86–100%(8.6–10)
      tl = gsap.timeline();

      // ── Beat A (0 → 1.4): car fade-in, camera push-in ────────────────────
      tl.to(car,    { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0);
      tl.to(camera, { scale: 1,  rotateZ: 0, duration: 1.4, ease: 'power2.out' }, 0);

      // ── Beat B (1.4 → 3.2): swap to parts, camera drifts ─────────────────
      tl.to(car,    { opacity: 0, scale: 1.06, duration: 0.9, ease: 'power2.in' }, 1.4);
      tl.to(allEls, { opacity: 1, duration: 0.85, stagger: 0.035, ease: 'power2.out' }, 1.85);
      tl.to(camera, { scale: 1.02, rotateZ: 0.3, duration: 1.2 }, 1.85);

      // ── Beat C (3.2 → 6.4): explode + depth scales + camera expands ──────
      PARTS.forEach(p => {
        const el = refs.get(p.id);
        if (!el) return;
        tl!.to(el, {
          x:        p.explode[0] * s,
          y:        p.explode[1] * s,
          rotation: p.explode[2],
          scale:    EXPLODE_SCALE[p.id] ?? 1,
          duration: 2.2,
          ease:     'power3.inOut',
        }, 3.2);
      });
      tl.to(camera, { scale: 1.07, rotateZ: 0.55, y: -14, duration: 2.2, ease: 'power2.inOut' }, 3.2);

      // ── Beat D (6.4 → 8.6): camera stabilises (tiny residual angle) ──────
      // rotateZ → 0.08 (not zero), y → -4: settled but not rigidly frozen
      tl.to(camera,     { scale: 1.04, rotateZ: 0.08, y: -4, duration: 0.7 }, 6.4);
      tl.to(nonElecEls, { filter: F_BGDIM, opacity: 0.2, duration: 0.45 }, 6.4);

      FOCUS.forEach((focusId: FocusId, i) => {
        const at    = 6.85 + i * 0.42;
        const fPart = PARTS.find(p => p.id === focusId)!;
        // Pull focused part ~35% toward center from its exploded position
        const fx    = fPart.explode[0] * s * 0.65;
        const fy    = fPart.explode[1] * s * 0.65;

        FOCUS.forEach((id: FocusId) => {
          const el = refs.get(id);
          if (!el) return;
          if (id === focusId) {
            tl!.to(el, {
              opacity:  1,
              scale:    1.08,
              x:        fx,
              y:        fy,
              rotation: 0,
              filter:   F_FOCUS,
              duration: 0.36,
              ease:     'power2.inOut',
            }, at);
          } else {
            tl!.to(el, {
              opacity:  0.12,
              scale:    0.96,
              filter:   F_DIM,
              duration: 0.28,
            }, at);
          }
        });
      });

      // ── Reset all filters/scale/opacity before reassemble ─────────────────
      tl.to(allEls, { opacity: 1, scale: 1, filter: F_IDLE, duration: 0.4 }, 8.52);

      // ── Beat E (8.6 → 10): reassemble → dissolve parts → pristine car ────
      PARTS.forEach(p => {
        const el = refs.get(p.id);
        if (!el) return;
        tl!.to(el, {
          x:        p.base[0] * s,
          y:        p.base[1] * s,
          rotation: 0,
          scale:    1,
          duration: 1.0,
          ease:     'power3.inOut',
        }, 8.6);
      });
      // Camera returns to neutral
      tl.to(camera, { scale: 1, rotateZ: 0, y: 0, duration: 1.2, ease: 'power2.inOut' }, 8.6);

      // Parts fade out while still mid-flight → clean dissolve
      tl.to(allEls, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 9.1);

      // car.png rises above parts and fades in with micro scale-settle
      tl.set(car, { zIndex: 20 }, 9.3);
      tl.to(car,  { opacity: 1, scale: 1.02, duration: 0.38, ease: 'power2.out' }, 9.35);
      tl.to(car,  { scale: 1.0, duration: 0.45, ease: 'power2.inOut' }, 9.62);

      // ── ScrollTrigger — scrub timeline to scroll position ────────────────
      st = ScrollTrigger.create({
        trigger: wrapperRef.current,
        start:   'top top',
        end:     'bottom bottom',
        scrub:   1.4,
        animation: tl,
      });

      ScrollTrigger.refresh();
    };

    setup();

    return () => {
      cancelled = true;
      st?.kill();
      tl?.kill();
    };
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.sticky}>
        <div className={styles.noise}    aria-hidden="true" />
        <div className={styles.vignette} aria-hidden="true" />

        <div className={styles.stage}>
          {/* ── Camera wrapper – GSAP drives scale/rotateZ/y ─────────────── */}
          <div ref={cameraRef} className={styles.camera}>

            {/* Full assembled car (Beat A + E only) */}
            <div ref={carRef} className={styles.part} style={{ zIndex: 2 }}>
              <Image
                src={CAR.src}
                alt="ARC autonomous vehicle – assembled blueprint"
                width={CAR.w}
                height={CAR.h}
                className={styles.carImg}
                priority
                draggable={false}
              />
            </div>

            {/* Modular parts */}
            {PARTS.map(p => {
              const flipStyle: React.CSSProperties = p.flip
                ? { transform: `scale(${p.flip.x ? -1 : 1}, ${p.flip.y ? -1 : 1})` }
                : {};

              return (
                <div
                  key={p.id}
                  ref={setPartRef(p.id)}
                  className={styles.part}
                  style={{ zIndex: p.z }}
                >
                  {/* Inner div carries the static CSS flip; GSAP never touches it */}
                  <div style={flipStyle}>
                    <Image
                      src={p.src}
                      alt={p.id}
                      width={p.w}
                      height={p.h}
                      className={styles.partImg}
                      style={{ width: clampW(p.w) }}
                      priority
                      draggable={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── HUD ── */}
        <div className={styles.hudBL}>
          <p className={styles.hudTitle}>ARC Autonomous Vehicle</p>
          <p className={styles.hudSub}>Exploded System View</p>
        </div>
        <div className={styles.hudTR}>
          <p className={styles.hudTRText}>Scroll to explore</p>
        </div>
        <p className={styles.hudBeat}>v0.1 · ARC CARLETON</p>
      </div>
    </div>
  );
}

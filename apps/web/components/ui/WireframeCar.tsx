'use client';

import { useRef, useEffect } from 'react';
import { gsap, ensureGsapRegistered, prefersReducedMotion } from '@/lib/animations';

interface WireframeCarProps {
  className?: string;
  animate?: boolean;
}

export default function WireframeCar({ className = '', animate = true }: WireframeCarProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!animate || prefersReducedMotion() || !svgRef.current) return;
    ensureGsapRegistered();

    const paths = svgRef.current.querySelectorAll('.wire-path');
    if (!paths.length) return;

    // Only animate elements that support getTotalLength (path, line, polyline, polygon)
    const animatable: SVGGeometryElement[] = [];
    paths.forEach((el) => {
      if ('getTotalLength' in el && typeof (el as SVGGeometryElement).getTotalLength === 'function') {
        const geom = el as SVGGeometryElement;
        try {
          const length = geom.getTotalLength();
          geom.style.strokeDasharray = `${length}`;
          geom.style.strokeDashoffset = `${length}`;
          animatable.push(geom);
        } catch {
          // circles and rects may not support getTotalLength in all browsers
        }
      }
    });

    if (!animatable.length) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: svgRef.current,
        start: 'top 90%',
        end: 'bottom 20%',
        scrub: 1.5,
      },
    });

    tl.to(animatable, {
      strokeDashoffset: 0,
      duration: 1,
      stagger: 0.08,
      ease: 'none',
    });

    return () => {
      tl.kill();
    };
  }, [animate]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 600 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Chassis / body outline */}
      <path
        className="wire-path"
        d="M80 180 L60 180 L50 160 L80 100 L140 70 L200 55 L360 50 L440 55 L500 75 L540 110 L555 160 L545 180 L520 180"
        stroke="var(--color-bp-cyan)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* Roof line */}
      <path
        className="wire-path"
        d="M180 55 L190 30 L350 25 L400 35 L440 55"
        stroke="var(--color-bp-cyan)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      {/* Windshield */}
      <path
        className="wire-path"
        d="M190 30 L170 65 M350 25 L380 50"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Front wheel — outer */}
      <circle
        cx="120" cy="180" r="32"
        stroke="var(--color-bp-cyan)"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Front wheel — hub */}
      <circle
        cx="120" cy="180" r="18"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.6"
        opacity="0.25"
      />
      {/* Front wheel — cross hairs */}
      <line x1="120" y1="162" x2="120" y2="198" stroke="var(--color-bp-cyan)" strokeWidth="0.4" opacity="0.2" />
      <line x1="102" y1="180" x2="138" y2="180" stroke="var(--color-bp-cyan)" strokeWidth="0.4" opacity="0.2" />
      {/* Rear wheel — outer */}
      <circle
        cx="480" cy="180" r="32"
        stroke="var(--color-bp-cyan)"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Rear wheel — hub */}
      <circle
        cx="480" cy="180" r="18"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.6"
        opacity="0.25"
      />
      {/* Rear wheel — cross hairs */}
      <line x1="480" y1="162" x2="480" y2="198" stroke="var(--color-bp-cyan)" strokeWidth="0.4" opacity="0.2" />
      <line x1="462" y1="180" x2="498" y2="180" stroke="var(--color-bp-cyan)" strokeWidth="0.4" opacity="0.2" />
      {/* Rear wing / spoiler */}
      <path
        className="wire-path"
        d="M520 50 L530 30 L545 28 L550 45"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      {/* Wing supports */}
      <path
        className="wire-path"
        d="M530 75 L530 30 M545 80 L545 28"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* Front splitter */}
      <path
        className="wire-path"
        d="M40 165 L80 165 L80 175"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
      {/* Side diffuser lines */}
      <path
        className="wire-path"
        d="M160 180 L200 175 L350 173 L430 175"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Internal structure lines */}
      <path
        className="wire-path"
        d="M200 55 L200 170 M300 50 L300 173 M400 52 L400 174"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.4"
        strokeDasharray="4 6"
        opacity="0.2"
      />
      {/* Sensor mounts (LiDAR / camera) */}
      <rect
        x="258" y="16" width="14" height="10" rx="1"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.7"
        opacity="0.4"
      />
      {/* Sensor beam cone */}
      <path
        className="wire-path"
        d="M258 21 L230 40 M272 21 L300 40"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.4"
        strokeDasharray="3 4"
        opacity="0.2"
      />
      <line
        x1="265" y1="26" x2="265" y2="50"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.4"
        strokeDasharray="2 3"
        opacity="0.25"
      />

      {/* Annotation: dimension line */}
      <line
        x1="80" y1="220" x2="520" y2="220"
        stroke="var(--color-bp-cyan)"
        strokeWidth="0.5"
        opacity="0.2"
      />
      <line x1="80" y1="214" x2="80" y2="226" stroke="var(--color-bp-cyan)" strokeWidth="0.5" opacity="0.2" />
      <line x1="520" y1="214" x2="520" y2="226" stroke="var(--color-bp-cyan)" strokeWidth="0.5" opacity="0.2" />
      <text
        x="300" y="234"
        textAnchor="middle"
        fill="var(--color-bp-cyan)"
        fontSize="8"
        fontFamily="var(--font-mono)"
        opacity="0.25"
      >
        WHEELBASE 2450mm
      </text>

      {/* Corner annotation — top left */}
      <text
        x="45" y="95"
        fill="var(--color-bp-cyan)"
        fontSize="7"
        fontFamily="var(--font-mono)"
        opacity="0.2"
      >
        SIDE ELEVATION
      </text>
      <text
        x="45" y="104"
        fill="var(--color-bp-cyan)"
        fontSize="6"
        fontFamily="var(--font-mono)"
        opacity="0.15"
      >
        SCALE 1:10
      </text>
    </svg>
  );
}

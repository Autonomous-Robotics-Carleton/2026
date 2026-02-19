'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, ensureGsapRegistered, prefersReducedMotion } from '@/lib/animations';

type ParallaxOptions = {
  speed?: number; // 0.1 = subtle, 0.3 = moderate
  direction?: 'y' | 'x';
  start?: string;
  end?: string;
};

/**
 * Applies subtle parallax movement to an element based on scroll position.
 */
export function useParallax<T extends HTMLElement>(opts: ParallaxOptions = {}) {
  const ref = useRef<T>(null);
  const { speed = 0.15, direction = 'y', start = 'top bottom', end = 'bottom top' } = opts;

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;
    ensureGsapRegistered();

    const el = ref.current;
    const distance = 60 * speed;
    const prop = direction === 'y' ? 'y' : 'x';

    const tween = gsap.fromTo(
      el,
      { [prop]: -distance },
      {
        [prop]: distance,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub: true,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [speed, direction, start, end]);

  return ref;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import ArcLogo from '@/components/ui/ArcLogo';
import { useTransition } from '@/context/TransitionContext';
import { gsap, prefersReducedMotion } from '@/lib/animations';

export default function LoadingScreen() {
  const { isInitialLoad, completeInitialLoad } = useTransition();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'logo' | 'loading' | 'complete'>('logo');
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!isInitialLoad) return;

    // Check for reduced motion
    if (prefersReducedMotion()) {
      completeInitialLoad();
      return;
    }

    // Phase 1: Show logo for 800ms
    const logoTimer = setTimeout(() => {
      setPhase('loading');
      startRef.current = performance.now();

      // Phase 2: Animate counter 0 → 100 over 1.5s
      const COUNTER_DURATION = 1500;
      const animate = (now: number) => {
        const elapsed = now - startRef.current;
        const pct = Math.min(Math.round((elapsed / COUNTER_DURATION) * 100), 100);
        setProgress(pct);
        if (pct < 100) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          // Counter complete, wait a moment then slide up
          setTimeout(() => {
            setPhase('complete');
            // Slide the loading screen up to reveal site
            gsap.to(containerRef.current, {
              yPercent: -100,
              duration: 0.8,
              ease: 'power2.out',
              onComplete: () => {
                completeInitialLoad();
              },
            });
          }, 300); // Small pause at 100% before sliding
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }, 800);

    return () => {
      clearTimeout(logoTimer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isInitialLoad, completeInitialLoad]);

  // Don't render if not initial load
  if (!isInitialLoad) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[101] flex items-center justify-center bg-bp-blue-dark"
    >
      <div className="flex items-center gap-6 md:gap-10">
        <ArcLogo className="h-10 w-auto text-white md:h-14" />

        <div
          className={`overflow-hidden transition-all duration-500 ${
            phase === 'logo' ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
          }`}
        >
          <p
            className="whitespace-nowrap text-sm tracking-widest text-fg md:text-base"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            FULL SPEED. NO HANDS.
          </p>
          <p
            className="mt-1 flex justify-between text-xs tracking-widest text-accent/60 md:text-sm"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span>LOADING&hellip;</span>
            <span>{String(progress).padStart(3, '0')}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

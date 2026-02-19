'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ArcLogo from '@/components/ui/ArcLogo';

type TransitionPhase = 'idle' | 'covering' | 'covered' | 'revealing';

interface TransitionContextValue {
  phase: TransitionPhase;
  isInitialLoad: boolean;
  navigateTo: (href: string) => void;
  completeInitialLoad: () => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function useTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useTransition must be used within TransitionProvider');
  return ctx;
}

interface TransitionProviderProps {
  children: ReactNode;
}

export function TransitionProvider({ children }: TransitionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [targetHref, setTargetHref] = useState<string | null>(null);

  // Called by LoadingScreen after it finishes its slide animation
  const completeInitialLoad = useCallback(() => {
    if (!isInitialLoad) return;
    setIsInitialLoad(false);
    setPhase('idle');
  }, [isInitialLoad]);

  // Route transition: slide down, navigate, slide up
  const navigateTo = useCallback(
    (href: string) => {
      // Normalize paths for comparison
      const normalizedHref = href.replace(/\/$/, '') || '/';
      const normalizedPathname = pathname.replace(/\/$/, '') || '/';

      // Don't navigate if already on that page
      if (normalizedHref === normalizedPathname) {
        return;
      }

      // Don't navigate if mid-transition
      if (phase !== 'idle') {
        return;
      }

      // Check reduced motion preference
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        router.push(href);
        return;
      }

      // Start transition - overlay slides down
      setTargetHref(href);
      setPhase('covering');
    },
    [pathname, phase, router]
  );

  // Handle the covering phase - wait for animation, then navigate
  useEffect(() => {
    if (phase !== 'covering' || !targetHref) return;

    const timer = setTimeout(() => {
      setPhase('covered');
      router.push(targetHref);
    }, 800);

    return () => clearTimeout(timer);
  }, [phase, targetHref, router]);

  // Handle pathname change after navigation
  useEffect(() => {
    if (phase !== 'covered' || !targetHref) return;

    const normalizedTarget = targetHref.replace(/\/$/, '') || '/';
    const normalizedPathname = pathname.replace(/\/$/, '') || '/';

    if (normalizedPathname === normalizedTarget) {
      // Page has changed, start revealing
      const timer = setTimeout(() => {
        setPhase('revealing');
        setTargetHref(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [phase, pathname, targetHref]);

  // Handle revealing phase - wait for animation to complete
  useEffect(() => {
    if (phase !== 'revealing') return;

    const timer = setTimeout(() => {
      setPhase('idle');
    }, 800);

    return () => clearTimeout(timer);
  }, [phase]);

  // Calculate overlay styles
  const isVisible = phase === 'covering' || phase === 'covered' || phase === 'revealing';
  const isDown = phase === 'covering' || phase === 'covered';

  return (
    <TransitionContext.Provider
      value={{ phase, isInitialLoad, navigateTo, completeInitialLoad }}
    >
      {children}

      {/* Transition overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bp-blue-dark)',
          transform: isDown ? 'translateY(0%)' : 'translateY(-100%)',
          transition: 'transform 800ms',
          transitionTimingFunction: phase === 'covering' ? 'ease-in' : 'ease-out',
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
        aria-hidden="true"
      >
        <ArcLogo className="h-10 w-auto text-white md:h-14" />
      </div>
    </TransitionContext.Provider>
  );
}

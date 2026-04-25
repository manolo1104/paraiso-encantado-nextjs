'use client';

import { useEffect, useRef } from 'react';
import { trackEvent, trackPageView } from '@/lib/analytics';

export function usePageTracking(pageName?: string) {
  const startTime = useRef(Date.now());
  const scrollDepths = useRef(new Set<number>());
  const exitIntentFired = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    trackPageView();

    const t30 = setTimeout(() => trackEvent('TIME_ON_PAGE_30s', { page: pageName }), 30_000);
    const t60 = setTimeout(() => trackEvent('TIME_ON_PAGE_60s', { page: pageName }), 60_000);
    const t180 = setTimeout(() => trackEvent('TIME_ON_PAGE_180s', { page: pageName }), 180_000);
    timers.current = [t30, t60, t180];

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const el = document.documentElement;
        const scrollable = el.scrollHeight - el.clientHeight;
        if (scrollable <= 0) return;
        const pct = Math.round((window.scrollY / scrollable) * 100);
        ([25, 50, 75, 100] as const).forEach((depth) => {
          if (pct >= depth && !scrollDepths.current.has(depth)) {
            scrollDepths.current.add(depth);
            trackEvent(`SCROLL_DEPTH_${depth}`, { page: pageName, depth });
          }
        });
      });
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentFired.current) {
        exitIntentFired.current = true;
        trackEvent('EXIT_INTENT_TRIGGER', { page: pageName });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      timers.current.forEach(clearTimeout);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      trackEvent('SESSION_END', { page: pageName, timeSpent });
    };
  }, [pageName]);
}

'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

export function useSectionTracking<T extends HTMLElement = HTMLElement>(sectionName: string) {
  const ref = useRef<T>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true;
          trackEvent('SECTION_VIEW', { section: sectionName });
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionName]);

  return ref;
}

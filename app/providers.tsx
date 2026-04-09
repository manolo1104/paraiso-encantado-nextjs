'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Google Tag Manager
    const gtmId = 'GTM-N98DFD9V';
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gtmId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gtmId}', {
        page_path: window.location.pathname,
      });
    `;
    document.head.appendChild(script2);

    // Google Analytics (GA4)
    const gaId = 'G-XXXXXXXXX'; // Reemplazar con tu ID real
    const script3 = document.createElement('script');
    script3.async = true;
    script3.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script3);

    const script4 = document.createElement('script');
    script4.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(script4);

    // Track page views
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_title: document.title,
      });
    }
  }, [pathname]);

  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CONSENT_KEY = 'wb_cookie_consent';

/**
 * Google Analytics 4 with Consent Mode default-denied.
 * Sends the first page view only after the local cookie banner grants consent.
 */
export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied'
          });
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            send_page_view: false
          });

          window.addEventListener('cookie-consent-granted', function() {
            gtag('consent', 'update', {
              'analytics_storage': 'granted',
              'ad_storage': 'granted',
              'ad_user_data': 'granted',
              'ad_personalization': 'granted'
            });
            gtag('event', 'page_view', {
              page_path: window.location.pathname + window.location.search,
              page_title: document.title
            });
          });
        `}
      </Script>
    </>
  );
}

/**
 * Track page views on App Router client-side navigations after consent.
 */
export function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    if (localStorage.getItem(CONSENT_KEY) !== 'granted') return;

    const qs = searchParams?.toString();
    const page_path = qs ? `${pathname}?${qs}` : pathname;

    window.gtag('event', 'page_view', {
      page_path,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

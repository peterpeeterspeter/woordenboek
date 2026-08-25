'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CONSENT_KEY = 'wb_cookie_consent';

/**
 * Google Analytics 4 with Google Consent Mode v2.
 *
 * GA4 loads and sends cookieless pings immediately (analytics_storage:
 * 'denied'). Page views are counted even without consent — just without
 * cookies. When the user accepts, consent upgrades to full cookie-based
 * tracking.
 *
 * Single page_view owner (see AnalyticsPageView below): the gtag config uses
 * send_page_view: false so the automatic config page view is suppressed, and
 * AnalyticsPageView fires exactly one page_view per load / navigation.
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

          // Consent Mode v2: default denied, but GA4 still sends cookieless pings
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'functionality_storage': 'granted',
            'security_storage': 'granted'
          });

          // send_page_view: false — AnalyticsPageView owns all page_view events.
          // Without this, the automatic config page view would double-count every
          // load alongside the manual one from AnalyticsPageView.
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname + window.location.search,
            send_page_view: false
          });

          // Upgrade to full tracking when consent is granted. Deliberately no
          // page_view here — AnalyticsPageView already covers this navigation.
          window.addEventListener('cookie-consent-granted', function() {
            gtag('consent', 'update', {
              'analytics_storage': 'granted',
              'ad_storage': 'granted',
              'ad_user_data': 'granted',
              'ad_personalization': 'granted'
            });
          });
        `}
      </Script>
    </>
  );
}

/**
 * Track page views on App Router client-side navigations.
 * Sole page_view sender: one event on mount (initial load) and one per
 * client-side navigation. No useSearchParams (fixes
 * BAILOUT_TO_CLIENT_SIDE_RENDERING); window.location carries the query string.
 * Not gated on consent — Consent Mode handles cookieless measurement.
 */
export function AnalyticsPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    window.gtag('event', 'page_view', {
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
    });
  }, [pathname]);

  return null;
}

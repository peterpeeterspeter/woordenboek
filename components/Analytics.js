'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CONSENT_KEY = 'wb_cookie_consent';

/**
 * Google Analytics 4 with Google Consent Mode v2.
 *
 * Key difference from before: GA4 loads and sends cookieless pings
 * immediately (analytics_storage: 'denied'). This means page views are
 * counted even without consent — just without cookies. When the user
 * accepts, consent upgrades to full cookie-based tracking.
 *
 * This fixes the 85% tracking drop that happened because the old code
 * used send_page_view: false, which blocked ALL tracking until the
 * consent banner (which was broken by BAILOUT_TO_CLIENT_SIDE_RENDERING)
 * was clicked.
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

          // Config WITHOUT send_page_view: false — let GA4 fire cookieless page views
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname + window.location.search
          });

          // Upgrade to full tracking when consent is granted
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
 * Note: no longer gated on consent — Consent Mode handles this.
 * Removed useSearchParams() to fix BAILOUT_TO_CLIENT_SIDE_RENDERING.
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

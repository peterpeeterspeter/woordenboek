'use client';

import { useEffect } from 'react';
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 — only loads after consent.
 * Listens for a custom 'cookie-consent' event on window.
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
          gtag('js', new Date());
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
          });
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            send_page_view: false,
          });

          // Listen for consent grant
          window.addEventListener('cookie-consent-granted', function() {
            gtag('consent', 'update', {
              'analytics_storage': 'granted',
              'ad_storage': 'granted',
              'ad_user_data': 'granted',
              'ad_personalization': 'granted',
            });
            gtag('event', 'page_view', {
              page_path: window.location.pathname,
              page_title: document.title,
            });
          });
        `}
      </Script>
    </>
  );
}

/**
 * Track page views on client-side navigation.
 */
export function AnalyticsPageView() {
  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }, []);
  return null;
}

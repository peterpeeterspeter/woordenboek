'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-4890613119082560';
const CONSENT_KEY = 'wb_cookie_consent';

/**
 * Google AdSense — load only after cookie consent to avoid duplicate/competing consent UI.
 */
export function AdSenseScript() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY) === 'granted') {
      setEnabled(true);
      return;
    }

    function onGranted() {
      setEnabled(true);
    }

    window.addEventListener('cookie-consent-granted', onGranted);
    return () => window.removeEventListener('cookie-consent-granted', onGranted);
  }, []);

  if (!enabled) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

/**
 * In-article ad unit (responsive display ad).
 * Place this between content sections on word pages.
 * Requires a specific ad slot ID from AdSense once approved.
 * Until then, auto ads will handle placement.
 */
export function AdUnit({ slot, format = 'auto', responsive = true, style }) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      // AdSense not ready yet
    }
  }, []);

  if (!slot) return null;

  return (
    <div className="ad-container" style={{ textAlign: 'center', margin: '2rem 0', ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

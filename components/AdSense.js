'use client';

import { useEffect } from 'react';
import Script from 'next/script';

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-4890613119082560';

/**
 * Google AdSense – loads the pagead script.
 * Auto ads will be enabled site-wide once the script is verified in AdSense console.
 */
export function AdSenseScript() {
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

'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'wb_cookie_consent';

/**
 * GDPR cookie consent banner.
 * Dispatches 'cookie-consent-granted' on window when accepted,
 * which GA4 and AdSense listen for to activate tracking.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'granted') {
      // Already accepted — fire consent event
      window.dispatchEvent(new Event('cookie-consent-granted'));
    } else if (!stored) {
      // Show banner after short delay to avoid layout shift
      const t = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(t);
    }
    // If 'denied', do nothing — no banner, no tracking
  }, []);

  function handleAccept() {
    localStorage.setItem(CONSENT_KEY, 'granted');
    setVisible(false);
    window.dispatchEvent(new Event('cookie-consent-granted'));
  }

  function handleDecline() {
    localStorage.setItem(CONSENT_KEY, 'denied');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie-instellingen">
      <div className="cookie-banner-inner">
        <p className="cookie-text">
          Wij gebruiken cookies voor website-analyse en het tonen van advertenties.
          Lees meer in ons{' '}
          <a href="/over" style={{ textDecoration: 'underline' }}>privacybeleid</a>.
        </p>
        <div className="cookie-actions">
          <button className="cookie-btn cookie-btn--accept" onClick={handleAccept}>
            Accepteren
          </button>
          <button className="cookie-btn cookie-btn--decline" onClick={handleDecline}>
            Weigeren
          </button>
        </div>
      </div>
    </div>
  );
}

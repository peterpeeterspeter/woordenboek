'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'wb_cookie_consent';

/**
 * GDPR cookie consent banner.
 * Uses Google Consent Mode v2 — tracking works in cookieless mode
 * before consent, then upgrades when accepted.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'granted') {
      window.dispatchEvent(new Event('cookie-consent-granted'));
    } else if (!stored) {
      // Show banner immediately — no delay (the old 1s delay caused
      // users to miss it when BAILOUT_TO_CLIENT_SIDE_RENDERING prevented
      // proper hydration)
      setVisible(true);
    }
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
          <a href="/cookies" style={{ textDecoration: 'underline' }}>cookiebeleid</a>.
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

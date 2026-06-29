import './base.css';
import './style.css';
import { Suspense } from 'react';
import { GoogleAnalytics, AnalyticsPageView } from '../components/Analytics';
import { AdSenseScript } from '../components/AdSense';
import { CookieConsent } from '../components/CookieConsent';
import HeaderSearch from '../components/HeaderSearch';

export const metadata = {
  metadataBase: new URL('https://www.woordenboek.org'),
  title: {
    default: 'Woordenboek.org — Gratis Nederlands Woordenboek',
    template: '%s — Woordenboek.org',
  },
  description:
    'Betekenis, synoniemen, vertalingen en uitspraak van 400.000+ Nederlandse woorden. Snel, gratis en zonder registratie. Blader of zoek direct.',
  keywords: ['woordenboek', 'Nederlands', 'betekenis', 'synoniemen', 'vertaling', 'Dutch dictionary', 'spelling'],
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    siteName: 'Woordenboek.org',
  },
  other: {
    'google-adsense-account': 'ca-pub-4890613119082560',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'sAJEfH0bMA7UwrbWU6HYq9EbGb-mVHDAUMyUE3XkW2Q',
  },
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Woordenboek.org',
              url: 'https://www.woordenboek.org',
              description: 'Gratis online Nederlands woordenboek met 400.000+ woorden — betekenis, synoniemen, vertalingen',
              inLanguage: 'nl',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.woordenboek.org/zoek/{search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body>
        <Header />
        <main>
          <div className="site-container">{children}</div>
        </main>
        <Footer />
        <ThemeScript />
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <AnalyticsPageView />
        </Suspense>
        <AdSenseScript />
        <CookieConsent />
      </body>
    </html>
  );
}

/* ---- Header (server component, search is client) ---- */
function Header() {
  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <a href="/" className="site-logo" aria-label="Woordenboek.org — Startpagina">
          <span className="logo-text">
            woorden<span>boek</span>
          </span>
        </a>

        <HeaderSearch />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-inner">
          <div className="footer-col">
            <h4>Woordenboek.org</h4>
            <ul>
              <li><a href="/">Startpagina</a></li>
              <li><a href="/over">Over dit woordenboek</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Blader op letter</h4>
            <ul>
              <li><a href="/letter/a">A — F</a></li>
              <li><a href="/letter/g">G — L</a></li>
              <li><a href="/letter/m">M — R</a></li>
              <li><a href="/letter/s">S — Z</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Juridisch</h4>
            <ul>
              <li><a href="/privacy">Privacybeleid</a></li>
              <li><a href="/terms">Algemene voorwaarden</a></li>
              <li><a href="/cookies">Cookiebeleid</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Bron</h4>
            <ul>
              <li><a href="https://github.com/OpenTaal/opentaal-wordlist" target="_blank" rel="noopener noreferrer">OpenTaal Woordenlijst</a></li>
              <li><a href="https://nl.wiktionary.org/" target="_blank" rel="noopener noreferrer">WikiWoordenboek</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Woordenboek.org — OpenTaal (BSD/CC-BY) &amp; WikiWoordenboek (CC-BY-SA)</span>
        </div>
      </div>
    </footer>
  );
}

/** Inline script to set theme before paint (avoids flash) */
function ThemeScript() {
  const code = `(function(){try{var t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

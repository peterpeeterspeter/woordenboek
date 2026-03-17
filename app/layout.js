import './base.css';
import './style.css';

export const metadata = {
  metadataBase: new URL('https://woordenboek.org'),
  title: {
    default: 'Woordenboek.org — Nederlands Woordenboek met 400.000+ woorden',
    template: '%s — Woordenboek.org',
  },
  description:
    'Gratis online Nederlands woordenboek met meer dan 400.000 woorden. Zoek elk Nederlands woord op, ontdek verwante woorden en blader door het alfabet.',
  keywords: ['woordenboek', 'Nederlands', 'Dutch dictionary', 'Nederlandse woorden', 'woordenlijst', 'spelling'],
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    siteName: 'Woordenboek.org',
  },
  other: {
    generator: 'Perplexity Computer',
    author: 'Perplexity Computer',
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📖</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        {/* Perplexity Computer Attribution */}
        <meta name="generator" content="Perplexity Computer" />
        <meta property="og:see_also" content="https://www.perplexity.ai/computer" />
        <link rel="author" href="https://www.perplexity.ai/computer" />

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
              url: 'https://woordenboek.org',
              description: 'Gratis online Nederlands woordenboek met meer dan 400.000 woorden',
              inLanguage: 'nl',
              creator: {
                '@type': 'SoftwareApplication',
                name: 'Perplexity Computer',
                url: 'https://www.perplexity.ai/computer',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://woordenboek.org/zoek/{search_term_string}',
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
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="3" y="4" width="20" height="26" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="9" y="2" width="20" height="26" rx="2" fill="var(--color-primary)" stroke="var(--color-primary)" strokeWidth="1" />
            <line x1="13" y1="9" x2="25" y2="9" stroke="var(--color-text-inverse)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="13" y1="13" x2="23" y2="13" stroke="var(--color-text-inverse)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            <line x1="13" y1="17" x2="21" y2="17" stroke="var(--color-text-inverse)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="13" y1="21" x2="24" y2="21" stroke="var(--color-text-inverse)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          </svg>
          <span className="logo-text">
            woorden<span>boek</span>
          </span>
        </a>

        <div className="header-actions">
          <a href="/" className="theme-toggle" aria-label="Zoeken" style={{ textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </a>
        </div>
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
            <h4>Bron</h4>
            <ul>
              <li><a href="https://github.com/OpenTaal/opentaal-wordlist" target="_blank" rel="noopener noreferrer">OpenTaal Woordenlijst</a></li>
              <li><a href="https://nl.wiktionary.org/" target="_blank" rel="noopener noreferrer">WikiWoordenboek</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Woordenboek.org — OpenTaal (BSD/CC-BY) &amp; WikiWoordenboek (CC-BY-SA)</span>
          <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer">
            Created with Perplexity Computer
          </a>
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

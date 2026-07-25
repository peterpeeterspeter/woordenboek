import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWordEntry, getWordList, GENDER_MAP, LANG_NAMES, POPULAR_WORDS } from '../../../../lib/dictionary';

/* ---------- ISR config ---------- */

// Render once on demand and cache until a deployment updates the dictionary.
export const revalidate = false;

export const dynamicParams = true;

export function generateStaticParams() {
  return POPULAR_WORDS
    .filter((w) => {
      const entry = getWordEntry(w);
      return entry?.dict?.tr?.en?.length > 0;
    })
    .map((w) => ({ woord: w }));
}

/* ---------- metadata ---------- */

export function generateMetadata({ params }) {
  const word = decodeURIComponent(params.woord);
  const entry = getWordEntry(word);
  const enWords = entry?.dict?.tr?.en;

  if (!enWords?.length) {
    return {
      title: `"${word}" in het Engels`,
      description: `Hoe zeg je ${word} in het Engels? Bekijk de vertaling en vertalingen in andere talen in ons Nederlands woordenboek.`,
      alternates: {
        canonical: `/vertaling/nederlands-engels/${encodeURIComponent(word)}`,
      },
    };
  }

  const enStr = enWords.join(', ');
  // Title mirrors "[woord] engels" search intent
  const title = `${word} in het Engels: ${enStr}`;
  const description = `${word} in het Engels: ${enStr}. Bekijk vertalingen in 14 talen, synoniemen en voorbeelden op Woordenboek.org.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    alternates: {
      canonical: `/vertaling/nederlands-engels/${encodeURIComponent(word)}`,
    },
  };
}

/* ---------- page component ---------- */

export default function VertalingPage({ params }) {
  const word = decodeURIComponent(params.woord);
  const entry = getWordEntry(word);

  if (!entry) return notFound();

  const { dict, letter } = entry;
  const displayWord = entry.word;
  const translations = dict?.tr || {};
  const enWords = translations.en || [];
  const otherLangs = Object.entries(translations).filter(([l]) => l !== 'en');

  // Need at least some translations
  if (!enWords.length && !otherLangs.length) return notFound();

  const firstDef = dict?.s?.[0]?.d?.[0]?.t;
  const genderLabel = dict?.g ? GENDER_MAP[dict.g] || dict.g : null;

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Vertaling van ${displayWord}`,
    description: enWords.length
      ? `${displayWord} in het Engels: ${enWords.join(', ')}`
      : `Vertaling van ${displayWord}`,
    url: `https://www.woordenboek.org/vertaling/nederlands-engels/${encodeURIComponent(displayWord)}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Woordenboek.org',
      url: 'https://www.woordenboek.org',
    },
    inLanguage: 'nl',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://www.woordenboek.org' },
      { '@type': 'ListItem', position: 2, name: letter, item: `https://www.woordenboek.org/letter/${letter.toLowerCase()}` },
      { '@type': 'ListItem', position: 3, name: displayWord, item: `https://www.woordenboek.org/betekenis/${encodeURIComponent(displayWord)}` },
      { '@type': 'ListItem', position: 4, name: 'Vertaling' },
    ],
  };

  // FAQ schema — targets "[woord] engels" featured snippets
  const faqLd = enWords.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: `Hoe zeg je ${displayWord} in het Engels?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${displayWord} in het Engels zeg je: ${enWords.join(', ')}.`,
      },
    }],
  } : null;

  return (
    <div className="page-content word-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <nav className="breadcrumb">
        <Link href="/">Start</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/letter/${letter.toLowerCase()}`}>{letter}</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/betekenis/${encodeURIComponent(displayWord)}`}>{displayWord}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Vertaling</span>
      </nav>

      <h1 className="word-heading">Vertaling van {displayWord}</h1>

      {/* Subtitle */}
      <div className="vertaling-subtitle">Nederlands → Engels</div>

      {/* Quick definition context */}
      {(genderLabel || firstDef) && (
        <div className="syn-context">
          {genderLabel && <span className="dict-gender">{genderLabel}</span>}
          {firstDef && <p className="syn-context-def">{firstDef}</p>}
        </div>
      )}

      {/* Main English translation — hero card */}
      {enWords.length > 0 && (
        <div className="vertaling-hero">
          <div className="vertaling-hero-label">Engelse vertaling</div>
          <div className="vertaling-hero-words">
            {enWords.map((w, i) => (
              <span key={i} className="vertaling-hero-word">{w}</span>
            ))}
          </div>
          {dict?.i && (
            <div className="vertaling-hero-ipa">/{dict.i}/</div>
          )}
        </div>
      )}

      {/* Other translations grid */}
      {otherLangs.length > 0 && (
        <section className="related-section">
          <h2 className="related-title">Vertalingen in andere talen</h2>
          <div className="dict-trans-grid">
            {otherLangs.map(([lang, words]) => (
              <div key={lang} className="dict-trans-item">
                <span className="dict-trans-lang">{LANG_NAMES[lang] || lang.toUpperCase()}</span>
                <span className="dict-trans-word">{words.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Synonyms on this page */}
      {entry.synonyms?.length > 0 && (
        <section className="related-section">
          <h2 className="related-title">Synoniemen</h2>
          <div className="related-words">
            {entry.synonyms.map((w) => (
              <Link key={w} href={`/betekenis/${encodeURIComponent(w)}`} className="related-tag">
                {w}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ section — visible text matching JSON-LD (Google requirement) */}
      {enWords.length > 0 && (
        <section className="dict-snippet-answer" style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="dict-card-title">Veelgestelde vragen</h2>
          <h3 className="dict-section-title" style={{ marginTop: 'var(--space-3)' }}>Hoe zeg je {displayWord} in het Engels?</h3>
          <p style={{ color: 'var(--color-text)' }}>
            {displayWord} in het Engels zeg je: <strong>{enWords.join(', ')}</strong>.
          </p>
        </section>
      )}

      {/* Cross-links */}
      <div className="syn-nav-links">
        <Link href={`/betekenis/${encodeURIComponent(displayWord)}`} className="syn-nav-link">
          📖 Betekenis van {displayWord}
        </Link>
        <Link href={`/synoniem/${encodeURIComponent(displayWord)}`} className="syn-nav-link">
          📝 Synoniemen van {displayWord}
        </Link>
      </div>

      <div className="dict-source-note">
        Bron: <a href="https://github.com/OpenTaal/opentaal-wordlist" target="_blank" rel="noopener noreferrer">OpenTaal</a>
        {' & '}
        <a href="https://nl.wiktionary.org/" target="_blank" rel="noopener noreferrer">WikiWoordenboek</a>
      </div>
    </div>
  );
}

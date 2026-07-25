import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWordEntry, getWordList, getDictData, GENDER_MAP, POPULAR_WORDS } from '../../../lib/dictionary';

/* ---------- ISR config ---------- */

// Render once on demand and cache until a deployment updates the dictionary.
export const revalidate = false;

export const dynamicParams = true;

export function generateStaticParams() {
  // Pre-render synonym pages for popular words that have synonyms
  return POPULAR_WORDS
    .filter((w) => {
      const entry = getWordEntry(w);
      return entry && entry.synonyms && entry.synonyms.length > 0;
    })
    .map((w) => ({ woord: w }));
}

/* ---------- metadata ---------- */

export function generateMetadata({ params }) {
  const word = decodeURIComponent(params.woord);
  const entry = getWordEntry(word);

  if (!entry || !entry.synonyms || entry.synonyms.length === 0) {
    return {
      title: `Synoniemen van "${word}"`,
      description: `Welke synoniemen heeft ${word}? Bekijk synoniemen, antoniemen en verwante woorden in ons Nederlands woordenboek.`,
      alternates: {
        canonical: `/synoniem/${encodeURIComponent(word)}`,
      },
    };
  }

  const count = entry.synonyms.length;
  const synList = entry.synonyms.slice(0, 6).join(', ');
  const description = `Synoniemen van ${word} (${count}): ${synList}${count > 6 ? ' en meer' : ''}. Bekijk alle synoniemen en antoniemen in het Nederlands woordenboek.`;
  const title = `Synoniemen van ${word} (${count})`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    alternates: {
      canonical: `/synoniem/${encodeURIComponent(word)}`,
    },
  };
}

/* ---------- page component ---------- */

export default function SynoniemPage({ params }) {
  const word = decodeURIComponent(params.woord);
  const entry = getWordEntry(word);

  if (!entry) return notFound();

  const { dict, found, synonyms, antonyms, related, letter } = entry;
  const displayWord = entry.word;

  // If the word exists but has no synonyms, still show a useful page
  const hasSynonyms = synonyms && synonyms.length > 0;
  const hasAntonyms = antonyms && antonyms.length > 0;
  const firstDef = dict?.s?.[0]?.d?.[0]?.t;
  const genderLabel = dict?.g ? GENDER_MAP[dict.g] || dict.g : null;

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Synoniemen van ${displayWord}`,
    description: hasSynonyms
      ? `Synoniemen van ${displayWord}: ${synonyms.slice(0, 5).join(', ')}`
      : `Zoek synoniemen van ${displayWord} in het Nederlands woordenboek.`,
    url: `https://www.woordenboek.org/synoniem/${encodeURIComponent(displayWord)}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Woordenboek.org',
      url: 'https://www.woordenboek.org',
    },
    inLanguage: 'nl',
  };

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://www.woordenboek.org' },
      { '@type': 'ListItem', position: 2, name: letter, item: `https://www.woordenboek.org/letter/${letter.toLowerCase()}` },
      { '@type': 'ListItem', position: 3, name: displayWord, item: `https://www.woordenboek.org/betekenis/${encodeURIComponent(displayWord)}` },
      { '@type': 'ListItem', position: 4, name: `Synoniemen` },
    ],
  };

  // FAQ schema — targets "[woord] synoniem" featured snippets
  const faqLd = hasSynonyms ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: `Wat zijn goede synoniemen van ${displayWord}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Synoniemen van ${displayWord} zijn: ${synonyms.slice(0, 8).join(', ')}${synonyms.length > 8 ? ` en nog ${synonyms.length - 8} meer` : ''}.`,
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
        <span>Synoniemen</span>
      </nav>

      <h1 className="word-heading">Synoniemen van {displayWord}</h1>

      {/* Quick definition context */}
      {(genderLabel || firstDef) && (
        <div className="syn-context">
          {genderLabel && <span className="dict-gender">{genderLabel}</span>}
          {firstDef && (
            <p className="syn-context-def">{firstDef}</p>
          )}
        </div>
      )}

      {/* Synonyms — main content */}
      {hasSynonyms ? (
        <section className="syn-main-section">
          <div className="syn-main-grid">
            {synonyms.map((syn) => {
              const synEntry = getWordEntry(syn);
              const synDef = synEntry?.dict?.s?.[0]?.d?.[0]?.t;
              return (
                <Link
                  key={syn}
                  href={`/betekenis/${encodeURIComponent(syn)}`}
                  className="syn-main-card"
                >
                  <span className="syn-main-word">{syn}</span>
                  {synDef && <span className="syn-main-def">{synDef.length > 80 ? synDef.slice(0, 77) + '…' : synDef}</span>}
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="word-info-card" style={{ marginBottom: 'var(--space-6)' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Er zijn geen synoniemen bekend voor <strong>{displayWord}</strong>.
          </p>
        </div>
      )}

      {/* Antoniemen */}
      {hasAntonyms && (
        <section className="related-section">
          <h2 className="related-title">Antoniemen (tegenstellingen)</h2>
          <div className="related-words">
            {antonyms.map((w) => (
              <Link key={w} href={`/synoniem/${encodeURIComponent(w)}`} className="related-tag related-tag--ant">
                {w}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Verwante woorden */}
      {related && related.length > 0 && (
        <section className="related-section">
          <h2 className="related-title">Verwante woorden</h2>
          <div className="related-words">
            {related.map((w) => (
              <Link key={w} href={`/betekenis/${encodeURIComponent(w)}`} className="related-tag">
                {w}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Vertalingen — quick reference */}
      {dict?.tr && Object.keys(dict.tr).length > 0 && (
        <div className="dict-translations">
          <h3 className="dict-section-title">Vertalingen</h3>
          <div className="dict-trans-grid">
            {Object.entries(dict.tr).map(([lang, words]) => (
              <div key={lang} className="dict-trans-item">
                <span className="dict-trans-lang">
                  {lang === 'en' ? 'Engels' : lang === 'fr' ? 'Frans' : lang === 'de' ? 'Duits' : lang.toUpperCase()}
                </span>
                <span className="dict-trans-word">{words.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ section — visible text matching JSON-LD (Google requirement) */}
      {hasSynonyms && (
        <section className="dict-snippet-answer" style={{ marginTop: 'var(--space-5)' }}>
          <h2 className="dict-card-title">Veelgestelde vragen</h2>
          <h3 className="dict-section-title" style={{ marginTop: 'var(--space-3)' }}>Wat zijn goede synoniemen van {displayWord}?</h3>
          <p style={{ color: 'var(--color-text)' }}>
            Synoniemen van {displayWord} zijn: {synonyms.slice(0, 8).join(', ')}{synonyms.length > 8 && ` en nog ${synonyms.length - 8} meer`}.
          </p>
        </section>
      )}

      {/* Cross-link to betekenis page */}
      <div className="syn-nav-links">
        <Link href={`/betekenis/${encodeURIComponent(displayWord)}`} className="syn-nav-link">
          📖 Betekenis van {displayWord}
        </Link>
        {dict?.tr?.en && (
          <Link href={`/vertaling/nederlands-engels/${encodeURIComponent(displayWord)}`} className="syn-nav-link">
            🌍 Vertaal {displayWord}
          </Link>
        )}
      </div>

      <div className="dict-source-note">
        Bron: <a href="https://github.com/OpenTaal/opentaal-wordlist" target="_blank" rel="noopener noreferrer">OpenTaal</a>
        {' & '}
        <a href="https://nl.wiktionary.org/" target="_blank" rel="noopener noreferrer">WikiWoordenboek</a>
      </div>
    </div>
  );
}

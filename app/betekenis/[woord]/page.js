import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWordEntry, GENDER_MAP, LANG_NAMES, POPULAR_WORDS } from '../../../lib/dictionary';

/* ---------- ISR config ---------- */

/** Revalidate every 7 days — definitions don't change often */
export const revalidate = 604800;

/**
 * dynamicParams = true (default) means words NOT in generateStaticParams
 * are rendered on-demand at request time, then cached (ISR).
 */
export const dynamicParams = true;

/**
 * Pre-render only the ~200 popular words at build time.
 * All other 162K words are generated on first request.
 */
export function generateStaticParams() {
  return POPULAR_WORDS.map((w) => ({ woord: w }));
}

/* ---------- metadata ---------- */

export function generateMetadata({ params }) {
  const word = decodeURIComponent(params.woord);
  const entry = getWordEntry(word);
  const firstDef = entry?.dict?.s?.[0]?.d?.[0]?.t;
  const description = firstDef
    ? `${word}: ${firstDef.slice(0, 150)}${firstDef.length > 150 ? '…' : ''}`
    : `Betekenis en definitie van "${word}" in het Nederlands woordenboek.`;

  return {
    title: `${word} — Betekenis & definitie`,
    description,
    openGraph: {
      title: `${word} — Betekenis & definitie — Woordenboek.org`,
      description,
    },
    alternates: {
      canonical: `/betekenis/${encodeURIComponent(word)}`,
    },
  };
}

/* ---------- page component ---------- */

export default function WordPage({ params }) {
  const word = decodeURIComponent(params.woord);
  const entry = getWordEntry(word);

  if (!entry) return notFound();

  const { dict, found, prevWord, nextWord, synonyms, antonyms, related, letter } = entry;
  const displayWord = entry.word;
  const hasDef = dict?.s?.length > 0;
  const firstDef = hasDef ? dict.s[0].d[0]?.t : undefined;
  const genderLabel = dict?.g ? GENDER_MAP[dict.g] || dict.g : null;
  const charCount = displayWord.replace(/\s/g, '').length;

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: displayWord,
    description: firstDef,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Nederlands Woordenboek',
      url: 'https://woordenboek.org',
    },
    inLanguage: 'nl',
    url: `https://woordenboek.org/betekenis/${encodeURIComponent(displayWord)}`,
    creator: {
      '@type': 'SoftwareApplication',
      name: 'Perplexity Computer',
      url: 'https://www.perplexity.ai/computer',
    },
  };

  return (
    <div className="page-content word-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="breadcrumb">
        <Link href="/">Start</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/letter/${letter.toLowerCase()}`}>{letter}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{displayWord}</span>
      </nav>

      {!found && (
        <div className="word-info-card" style={{ background: 'var(--color-accent-light)', borderColor: 'var(--color-accent)', marginBottom: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent)' }}>
            Dit woord is niet gevonden in de woordenlijst.
          </p>
        </div>
      )}

      <h1 className="word-heading">{displayWord}</h1>

      {/* Pronunciation row */}
      {(genderLabel || dict?.i) && (
        <div className="dict-pronunciation">
          {genderLabel && <span className="dict-gender">{genderLabel}</span>}
          {dict?.i && <span className="dict-ipa">{dict.i}</span>}
        </div>
      )}

      {/* Definitions */}
      {hasDef ? (
        <div className="dict-card">
          <h2 className="dict-card-title">Betekenis</h2>
          {dict.s.map((posGroup, gi) => (
            <div key={gi} className="dict-pos-group">
              <div className="dict-pos-label">{posGroup.p}</div>
              <ol className="dict-senses">
                {posGroup.d.map((d, di) => (
                  <li key={di} className="dict-sense">
                    {d.g?.length > 0 && (
                      <span className="dict-tags">{d.g.join(', ')} </span>
                    )}
                    <span className="dict-def">{d.t}</span>
                    {d.x?.map((ex, xi) => (
                      <div key={xi} className="dict-example">{ex}</div>
                    ))}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <div className="word-info-card">
          <div className="word-info-row">
            <span className="word-info-label">Letters</span>
            <span className="word-info-value">{charCount}</span>
          </div>
          <div className="word-info-row">
            <span className="word-info-label">Begint met</span>
            <span className="word-info-value">
              <Link href={`/letter/${letter.toLowerCase()}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                {letter}
              </Link>
            </span>
          </div>
        </div>
      )}

      {/* Etymology */}
      {dict?.e && (
        <div className="dict-etymology">
          <h3 className="dict-section-title">Etymologie</h3>
          <p className="dict-etym-text">{dict.e}</p>
        </div>
      )}

      {/* Synonyms */}
      {synonyms.length > 0 && (
        <section className="related-section">
          <h2 className="related-title">Synoniemen</h2>
          <div className="related-words">
            {synonyms.map((w) => (
              <Link key={w} href={`/betekenis/${encodeURIComponent(w)}`} className="related-tag">
                {w}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Antonyms */}
      {antonyms.length > 0 && (
        <section className="related-section">
          <h2 className="related-title">Antoniemen</h2>
          <div className="related-words">
            {antonyms.map((w) => (
              <Link key={w} href={`/betekenis/${encodeURIComponent(w)}`} className="related-tag related-tag--ant">
                {w}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Expressions */}
      {dict?.x?.length > 0 && (
        <div className="dict-expressions">
          <h3 className="dict-section-title">Uitdrukkingen</h3>
          <ul className="dict-expr-list">
            {dict.x.map((ex, i) => (
              <li key={i} className="dict-expr-item">
                <span className="dict-expr-text">{ex.e}</span>
                {ex.m && <span className="dict-expr-meaning"> — {ex.m}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Translations */}
      {dict?.tr && Object.keys(dict.tr).length > 0 && (
        <div className="dict-translations">
          <h3 className="dict-section-title">Vertalingen</h3>
          <div className="dict-trans-grid">
            {Object.entries(dict.tr).map(([lang, words]) => (
              <div key={lang} className="dict-trans-item">
                <span className="dict-trans-lang">{LANG_NAMES[lang] || lang}</span>
                <span className="dict-trans-word">{words.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related words (fallback when no synonyms/antonyms) */}
      {related.length > 0 && (
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

      {/* Source attribution */}
      <div className="dict-source-note">
        Bron: <a href="https://github.com/OpenTaal/opentaal-wordlist" target="_blank" rel="noopener noreferrer">OpenTaal</a>
        {hasDef && (
          <> &amp; <a href="https://nl.wiktionary.org/" target="_blank" rel="noopener noreferrer">WikiWoordenboek</a></>
        )}
      </div>

      {/* Prev/next navigation */}
      <nav className="word-nav">
        {prevWord ? (
          <Link href={`/betekenis/${encodeURIComponent(prevWord)}`}>← {prevWord}</Link>
        ) : <span />}
        {nextWord ? (
          <Link href={`/betekenis/${encodeURIComponent(nextWord)}`}>{nextWord} →</Link>
        ) : <span />}
      </nav>
    </div>
  );
}

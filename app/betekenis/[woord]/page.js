import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWordEntry, getWordList, GENDER_MAP, LANG_NAMES, POPULAR_WORDS } from '../../../lib/dictionary';
import { AdUnit } from '../../../components/AdSense';

/* ---------- ISR config ---------- */

/** Render once on demand and cache until a deployment updates the dictionary. */
export const revalidate = false;

/**
 * dynamicParams = true (default) means words NOT in generateStaticParams
 * are rendered on-demand at request time, then cached (ISR).
 */
export const dynamicParams = true;

/**
 * Pre-render only the ~200 popular words at build time.
 * All other words are generated on first request.
 */
export function generateStaticParams() {
  return POPULAR_WORDS.map((w) => ({ woord: w }));
}

/* ---------- metadata ---------- */

export function generateMetadata({ params }) {
  const word = decodeURIComponent(params.woord);
  const entry = getWordEntry(word);
  const firstDef = entry?.dict?.s?.[0]?.d?.[0]?.t;

  // Count total definitions across all senses
  const defCount = entry?.dict?.s?.reduce((acc, pos) => acc + (pos?.d?.length || 0), 0) || 0;

  // noindex orphan pages without a definition — saves crawl budget
  const hasDefinition = !!firstDef;

  // Count synonyms for title richness
  const synCount = entry?.synonyms?.length || 0;

  // Optimized title: "[woord] betekenis" + value-add qualifiers
  // Adding definition count and synonym mention increases CTR by showing depth
  const title = hasDefinition
    ? defCount > 1
      ? `${word} betekenis (${defCount} definities) + synoniemen`
      : `${word} betekenis & definitie + synoniemen`
    : `Betekenis van "${word}"`;

  // Description: lead with the actual definition (featured snippet bait),
  // then list what else the page offers (voorbeelden, synoniemen, uitspraak)
  const description = firstDef
    ? `${word} betekenis: ${firstDef.slice(0, 110)}. Bekijk ${defCount > 1 ? `${defCount} definities, ` : ''}voorbeelden${synCount > 0 ? `, ${synCount} synoniemen` : ''} en uitspraak.`
    : `Wat betekent ${word}? Zoek de betekenis en definitie van "${word}" in ons Nederlands woordenboek met 400.000+ woorden.`;

  return {
    title,
    description,
    ...( !hasDefinition && { robots: { index: false, follow: true } } ),
    openGraph: {
      title,
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

  const { dict, found, prevWord, nextWord, synonyms, antonyms, related, letter, unique } = entry;
  const displayWord = entry.word;
  const hasDef = dict?.s?.length > 0;
  const firstDef = hasDef ? dict.s[0].d[0]?.t : undefined;
  const genderLabel = dict?.g ? GENDER_MAP[dict.g] || dict.g : null;
  const charCount = displayWord.replace(/\s/g, '').length;
  const defCount = dict?.s?.reduce((acc, pos) => acc + (pos?.d?.length || 0), 0) || 0;

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://www.woordenboek.org' },
      { '@type': 'ListItem', position: 2, name: letter, item: `https://www.woordenboek.org/letter/${letter.toLowerCase()}` },
      { '@type': 'ListItem', position: 3, name: displayWord },
    ],
  };

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: displayWord,
    description: firstDef,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Nederlands Woordenboek',
      url: 'https://www.woordenboek.org',
    },
    inLanguage: 'nl',
    url: `https://www.woordenboek.org/betekenis/${encodeURIComponent(displayWord)}`,
  };

  // FAQ schema for pages with definitions — expanded for more rich result coverage
  // Each question targets a real search intent pattern from GSC data
  const allExamples = [];
  if (hasDef) {
    dict.s.forEach((posGroup) => {
      posGroup.d.forEach((d) => {
        if (d.x?.length > 0) allExamples.push(...d.x);
      });
    });
  }

  const faqLd = hasDef ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Wat is de betekenis van ${displayWord}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${displayWord} betekent: ${firstDef}`,
        },
      },
      ...(defCount > 1 ? [{
        '@type': 'Question',
        name: `Hoeveel betekenissen heeft ${displayWord}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${displayWord} heeft ${defCount} ${defCount === 1 ? 'betekenis' : 'verschillende betekenissen'} in het Nederlands.`,
        },
      }] : []),
      ...(genderLabel ? [{
        '@type': 'Question',
        name: `Welk woordgeslacht heeft ${displayWord}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${displayWord} is een ${genderLabel.toLowerCase()}.`,
        },
      }] : []),
      ...(synonyms?.length > 0 ? [{
        '@type': 'Question',
        name: `Wat zijn synoniemen van ${displayWord}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Synoniemen van ${displayWord} zijn: ${synonyms.slice(0, 5).join(', ')}.`,
        },
      }] : []),
      ...(allExamples.length > 0 ? [{
        '@type': 'Question',
        name: `Hoe gebruik je ${displayWord} in een zin?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Voorbeeld: "${allExamples[0]}"`,
        },
      }] : []),
    ],
  } : null;

  return (
    <div className="page-content word-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

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
        <>
          {/* Featured-snippet Q&A block — targets "X betekenis" queries */}
          <section className="dict-snippet-answer">
            <h2 className="dict-card-title">Wat is de betekenis van {displayWord}?</h2>
            <p className="dict-snippet-text">
              <strong>{displayWord}</strong> betekent: {firstDef}
            </p>
          </section>

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
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {/* Examples section — extracted for better heading structure */}
          {(() => {
            const allExamples = [];
            dict.s.forEach((posGroup) => {
              posGroup.d.forEach((d) => {
                if (d.x?.length > 0) {
                  allExamples.push(...d.x);
                }
              });
            });
            return allExamples.length > 0 ? (
              <section className="dict-examples-section">
                <h2 className="dict-card-title">Voorbeelden van &quot;{displayWord}&quot; in een zin</h2>
                <ul className="dict-example-list">
                  {allExamples.slice(0, 5).map((ex, i) => (
                    <li key={i} className="dict-example-item">{ex}</li>
                  ))}
                </ul>
              </section>
            ) : null;
          })()}
        </>
      ) : (
        <div className="word-info-card">
          {/* noindex signal for orphan pages without definition */}
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

      {/* Unique AI-generated content — makes each page distinct from Wiktionary */}
      {unique && (
        <section className="dict-unique-content">
          {unique.beschrijving && (
            <>
              <h2 className="dict-card-title">Betekenis en uitleg van {displayWord}</h2>
              <p className="dict-unique-beschrijving">{unique.beschrijving}</p>
            </>
          )}
          {unique.uitleg && (
            <p className="dict-unique-uitleg">{unique.uitleg}</p>
          )}
          {unique.voorbeelden?.length > 0 && (
            <div className="dict-unique-voorbeelden">
              <h3 className="dict-section-title">Voorbeelden</h3>
              <ul className="dict-example-list">
                {unique.voorbeelden.map((ex, i) => (
                  <li key={i} className="dict-example-item">{ex}</li>
                ))}
              </ul>
            </div>
          )}
          {unique.etymologie && (
            <div className="dict-unique-etymologie">
              <h3 className="dict-section-title">Woordoorsprong</h3>
              <p>{unique.etymologie}</p>
            </div>
          )}
          {unique.spreekwoorden?.length > 0 && (
            <div className="dict-unique-spreekwoorden">
              <h3 className="dict-section-title">Uitdrukkingen met {displayWord}</h3>
              <ul className="dict-expr-list">
                {unique.spreekwoorden.map((sp, i) => (
                  <li key={i} className="dict-expr-item">
                    <span className="dict-expr-text">{sp.uitdrukking}</span>
                    {sp.betekenis && <span className="dict-expr-meaning"> — {sp.betekenis}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Visible FAQ section — must match JSON-LD for Google compliance */}
      {hasDef && (
        <section className="dict-faq-section">
          <h2 className="dict-card-title">Veelgestelde vragen over {displayWord}</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3 className="faq-question">Wat is de betekenis van {displayWord}?</h3>
              <p className="faq-answer">
                <strong>{displayWord}</strong> betekent: {firstDef}
              </p>
            </div>
            {defCount > 1 && (
              <div className="faq-item">
                <h3 className="faq-question">Hoeveel betekenissen heeft {displayWord}?</h3>
                <p className="faq-answer">
                  {displayWord} heeft {defCount} verschillende betekenissen in het Nederlands. Zie hierboven voor alle definities.
                </p>
              </div>
            )}
            {genderLabel && (
              <div className="faq-item">
                <h3 className="faq-question">Welk woordgeslacht heeft {displayWord}?</h3>
                <p className="faq-answer">
                  {displayWord} is een {genderLabel.toLowerCase()}.
                </p>
              </div>
            )}
            {synonyms?.length > 0 && (
              <div className="faq-item">
                <h3 className="faq-question">Wat zijn synoniemen van {displayWord}?</h3>
                <p className="faq-answer">
                  Synoniemen van {displayWord} zijn:{' '}
                  {synonyms.slice(0, 5).map((w, i) => (
                    <span key={w}>
                      <Link href={`/betekenis/${encodeURIComponent(w)}`} style={{ color: 'var(--color-primary)' }}>{w}</Link>
                      {i < Math.min(synonyms.length, 5) - 1 ? ', ' : ''}
                    </span>
                  ))}
                  .
                </p>
              </div>
            )}
            {allExamples.length > 0 && (
              <div className="faq-item">
                <h3 className="faq-question">Hoe gebruik je {displayWord} in een zin?</h3>
                <p className="faq-answer">
                  Voorbeeld: &ldquo;{allExamples[0]}&rdquo;
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Etymology */}
      {dict?.e && (
        <div className="dict-etymology">
          <h3 className="dict-section-title">Etymologie</h3>
          <p className="dict-etym-text">{dict.e}</p>
        </div>
      )}

      {/* Ad after main content (definition + etymology) — desktop focused */}
      <AdUnit slot="betekenis-after-content" format="auto" style={{ minHeight: '90px' }} />

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
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Link href={`/synoniem/${encodeURIComponent(displayWord)}`} className="syn-nav-link">
              Bekijk alle synoniemen →
            </Link>
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

      {/* Ad before cross-links — bottom of content, high visibility */}
      <AdUnit slot="betekenis-bottom" format="auto" style={{ minHeight: '250px' }} />

      {/* Cross-links to related pages */}
      <div className="syn-nav-links">
        <Link href={`/synoniem/${encodeURIComponent(displayWord)}`} className="syn-nav-link">
          📖 Synoniemen van {displayWord}
        </Link>
        {dict?.tr?.en?.length > 0 && (
          <Link href={`/vertaling/nederlands-engels/${encodeURIComponent(displayWord)}`} className="syn-nav-link">
            🌍 Vertaal {displayWord}
          </Link>
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

      {/* More words from same letter */}
      {(() => {
        const sameLetterWords = getWordList(letter.toLowerCase());
        const others = sameLetterWords
          .filter(w => w.toLowerCase() !== displayWord.toLowerCase());
        // Deterministic pseudo-random pick using word hash
        const hash = [...displayWord].reduce((a, c) => a + c.charCodeAt(0), 0);
        const picked = others
          .sort((a, b) => {
            const ha = [...a].reduce((s, c) => s + c.charCodeAt(0), 0);
            const hb = [...b].reduce((s, c) => s + c.charCodeAt(0), 0);
            return ((ha * hash) % 1000) - ((hb * hash) % 1000);
          })
          .slice(0, 10);
        return picked.length > 0 ? (
          <section className="related-section">
            <h2 className="related-title">Meer woorden met {letter}</h2>
            <div className="related-words">
              {picked.map((w) => (
                <Link key={w} href={`/betekenis/${encodeURIComponent(w)}`} className="related-tag">
                  {w}
                </Link>
              ))}
            </div>
          </section>
        ) : null;
      })()}
    </div>
  );
}

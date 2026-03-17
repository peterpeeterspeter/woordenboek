import Link from 'next/link';
import { getWordList, LETTERS } from '../../../lib/dictionary';

export const revalidate = 3600;

export function generateMetadata({ params }) {
  const query = decodeURIComponent(params.query);
  return {
    title: `Zoeken: "${query}"`,
    description: `Zoekresultaten voor "${query}" in het Nederlands woordenboek.`,
    robots: { index: false }, // Don't index search result pages
  };
}

function highlightMatch(word, query) {
  const idx = word.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return word;
  return (
    <>
      {word.slice(0, idx)}
      <mark>{word.slice(idx, idx + query.length)}</mark>
      {word.slice(idx + query.length)}
    </>
  );
}

export default function SearchPage({ params }) {
  const query = decodeURIComponent(params.query).toLowerCase().trim();
  if (!query) return null;

  const firstChar = query[0].toUpperCase();
  const searchLetters = LETTERS.includes(firstChar.toLowerCase()) ? [firstChar.toLowerCase()] : LETTERS;

  let results = [];
  for (const l of searchLetters) {
    const words = getWordList(l);
    const matches = words.filter((w) => w.toLowerCase().includes(query));
    results.push(...matches);
    if (results.length >= 200) break;
  }

  results.sort((a, b) => {
    const al = a.toLowerCase(), bl = b.toLowerCase();
    if (al === query && bl !== query) return -1;
    if (bl === query && al !== query) return 1;
    if (al.startsWith(query) && !bl.startsWith(query)) return -1;
    if (bl.startsWith(query) && !al.startsWith(query)) return 1;
    return al.localeCompare(bl, 'nl');
  });

  return (
    <div className="page-content">
      <nav className="breadcrumb">
        <Link href="/">Start</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Zoeken: &ldquo;{decodeURIComponent(params.query)}&rdquo;</span>
      </nav>

      <div className="letter-heading">
        <span>Zoekresultaten</span>
        <span className="letter-count">
          {results.length}{results.length >= 200 ? '+' : ''} resultaten voor &ldquo;{decodeURIComponent(params.query)}&rdquo;
        </span>
      </div>

      {results.length > 0 ? (
        <div className="word-columns">
          {results.slice(0, 200).map((w) => (
            <Link key={w} href={`/betekenis/${encodeURIComponent(w)}`} className="word-link">
              {highlightMatch(w, query)}
            </Link>
          ))}
        </div>
      ) : (
        <div className="loading" style={{ flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p>Geen resultaten gevonden voor &ldquo;<strong>{decodeURIComponent(params.query)}</strong>&rdquo;</p>
          <p style={{ color: 'var(--color-text-faint)' }}>Controleer de spelling en probeer opnieuw.</p>
        </div>
      )}
    </div>
  );
}

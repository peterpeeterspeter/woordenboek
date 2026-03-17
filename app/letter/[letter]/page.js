import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWordList, LETTERS } from '../../../lib/dictionary';

export const revalidate = 86400;

export function generateStaticParams() {
  return LETTERS.map((l) => ({ letter: l }));
}

export function generateMetadata({ params }) {
  const L = params.letter.toUpperCase();
  return {
    title: `Woorden met ${L}`,
    description: `Alle Nederlandse woorden die beginnen met de letter ${L}. Blader door de woordenlijst.`,
  };
}

export default function LetterPage({ params, searchParams }) {
  const l = params.letter.toLowerCase();
  if (!LETTERS.includes(l)) return notFound();

  const L = l.toUpperCase();
  const words = getWordList(l);
  const total = words.length;

  const perPage = 500;
  const totalPages = Math.ceil(total / perPage);
  const currentPage = Math.min(Math.max(1, parseInt(searchParams?.p) || 1), totalPages);
  const start = (currentPage - 1) * perPage;
  const pageWords = words.slice(start, start + perPage);

  return (
    <div className="page-content">
      <nav className="alphabet-nav">
        {LETTERS.map((letter) => (
          <Link
            key={letter}
            href={`/letter/${letter}`}
            className={`alphabet-link${letter === l ? ' active' : ''}`}
          >
            {letter.toUpperCase()}
          </Link>
        ))}
      </nav>

      <div className="letter-heading">
        <span>{L}</span>
        <span className="letter-count">{total.toLocaleString('nl-NL')} woorden</span>
      </div>

      <div className="word-columns">
        {pageWords.map((w) => (
          <Link key={w} href={`/betekenis/${encodeURIComponent(w)}`} className="word-link">
            {w}
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {currentPage > 1 ? (
            <Link href={`/letter/${l}?p=${currentPage - 1}`} className="pagination-btn">
              ← Vorige
            </Link>
          ) : (
            <span className="pagination-btn" style={{ opacity: 0.4 }}>← Vorige</span>
          )}
          <span className="pagination-info">
            Pagina {currentPage} van {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link href={`/letter/${l}?p=${currentPage + 1}`} className="pagination-btn">
              Volgende →
            </Link>
          ) : (
            <span className="pagination-btn" style={{ opacity: 0.4 }}>Volgende →</span>
          )}
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { getIndex, LETTERS } from '../lib/dictionary';
import SearchBox from '../components/SearchBox';

export const revalidate = 86400; // 1 day

const COMMON_WORDS = [
  'avontuur','bibliotheek','chocolade','diamant','erfgoed','fietspad',
  'gezellig','horizon','ijskonijn','juweeltje','koningshuis','lentebries',
  'middernacht','nachtvlinder','ondernemer','pindakaas','regenboog','schilderij',
  'tulpenbol','uitvinding','vliegtuig','windmolen','zandkasteel','boekenplank',
  'droomwereld','fietsbel','huiskamer','koffiezetapparaat','strandwandeling','zonsondergang',
];

function getWordOfTheDay() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return COMMON_WORDS[dayOfYear % COMMON_WORDS.length];
}

export default function HomePage() {
  const index = getIndex();
  const wotd = getWordOfTheDay();

  return (
    <div className="page-content">
      <section className="hero">
        <h1 className="hero-title">Nederlands Woordenboek</h1>
        <p className="hero-subtitle">
          Meer dan 400.000 woorden doorzoekbaar. Verklaringen, synoniemen, etymologie en vertalingen.
        </p>
        <SearchBox isHero />
      </section>

      <section className="wotd-card">
        <div className="wotd-label">Woord van de dag</div>
        <div className="wotd-word">
          <Link href={`/betekenis/${encodeURIComponent(wotd)}`}>{wotd}</Link>
        </div>
      </section>

      <section>
        <h2 className="letter-heading" style={{ marginBottom: 'var(--space-6)' }}>
          Blader op letter
        </h2>
        <div className="letter-grid">
          {LETTERS.map((l) => {
            const L = l.toUpperCase();
            const count = index[L] || 0;
            return (
              <Link key={l} href={`/letter/${l}`} className="letter-grid-item">
                <span className="letter-grid-char">{L}</span>
                <span className="letter-grid-count">
                  {count.toLocaleString('nl-NL')} woorden
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="info-grid">
        <div className="info-card">
          <svg className="info-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <h3>162.000+ definities</h3>
          <p>Nederlandse verklaringen uit het WikiWoordenboek met voorbeeldzinnen, etymologie en vertalingen.</p>
        </div>
        <div className="info-card">
          <svg className="info-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <h3>Direct zoeken</h3>
          <p>Typ en vind direct woorden met onze snelle zoekfunctie. Elk woord heeft een eigen pagina.</p>
        </div>
        <div className="info-card">
          <svg className="info-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
          <h3>Open bron</h3>
          <p>Gebaseerd op de OpenTaal woordenlijst en WikiWoordenboek, vrij beschikbaar onder open licenties.</p>
        </div>
      </section>
    </div>
  );
}

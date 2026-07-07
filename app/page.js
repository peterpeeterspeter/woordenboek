import Link from 'next/link';
import { getIndex, LETTERS, POPULAR_WORDS, getWordEntry, GENDER_MAP } from '../lib/dictionary';
import SearchBox from '../components/SearchBox';
import { AdUnit } from '../components/AdSense';

export const revalidate = 86400;

export const metadata = {
  alternates: { canonical: '/' },
};

const CATEGORIES = [
  { name: 'Dieren', mark: 'Di', words: ['hond', 'kat', 'paard', 'vogel', 'konijn'] },
  { name: 'Kleuren', mark: 'Kl', words: ['rood', 'blauw', 'groen', 'geel', 'zwart'] },
  { name: 'Getallen', mark: 'Ge', words: ['een', 'twee', 'drie', 'vier', 'vijf'] },
  { name: 'Familie', mark: 'Fa', words: ['moeder', 'vader', 'broer', 'zus', 'familie'] },
  { name: 'Natuur', mark: 'Na', words: ['zon', 'maan', 'ster', 'regen', 'zee'] },
  { name: 'Eten', mark: 'Et', words: ['brood', 'kaas', 'melk', 'koffie', 'vis'] },
];

const COMMON_WORDS = [
  'avontuur', 'bibliotheek', 'chocolade', 'diamant', 'erfgoed', 'fietspad',
  'gezellig', 'horizon', 'ijskonijn', 'juweeltje', 'koningshuis', 'lentebries',
  'middernacht', 'nachtvlinder', 'ondernemer', 'pindakaas', 'regenboog', 'schilderij',
  'tulpenbol', 'uitvinding', 'vliegtuig', 'windmolen', 'zandkasteel', 'boekenplank',
  'droomwereld', 'fietsbel', 'huiskamer', 'koffiezetapparaat', 'strandwandeling', 'zonsondergang',
];

const TOP_POPULAR = POPULAR_WORDS.slice(0, 18);

function getWordOfTheDay() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return COMMON_WORDS[dayOfYear % COMMON_WORDS.length];
}

function getWotDMeaning(word) {
  const entry = getWordEntry(word);
  if (!entry || !entry.found || !entry.dict?.s?.[0]?.d?.[0]?.t) return null;
  const meaning = entry.dict.s[0].d[0].t;
  const pos = entry.dict.s[0].p || '';
  const gender = entry.dict.g && GENDER_MAP[entry.dict.g] ? GENDER_MAP[entry.dict.g] : '';
  return { meaning, pos, gender };
}

export default function HomePage() {
  const index = getIndex();
  const wotd = getWordOfTheDay();
  const wotdData = getWotDMeaning(wotd);
  const totalWords = Object.values(index).reduce((sum, count) => sum + Number(count || 0), 0);

  return (
    <div className="page-content home-page">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-copy">
          <p className="home-kicker">Gratis Nederlands woordenboek</p>
          <h1 id="home-hero-title" className="home-title">Zoek elk Nederlands woord.</h1>
          <p className="home-subtitle">
            Betekenissen, synoniemen, vervoegingen en vertalingen. Snel doorzoekbaar, zonder account.
          </p>
          <SearchBox isHero />
        </div>

        <aside className="home-hero-panel" aria-label="Woordenboek samenvatting">
          <div className="home-panel-row">
            <span className="home-panel-number">{totalWords.toLocaleString('nl-NL')}</span>
            <span className="home-panel-label">woorden in de index</span>
          </div>
          <div className="home-panel-row">
            <span className="home-panel-number">{LETTERS.length}</span>
            <span className="home-panel-label">letters om door te bladeren</span>
          </div>
          <div className="home-panel-note">
            OpenTaal en WikiWoordenboek vormen de basis. Elke zoekopdracht leidt naar een vaste, indexeerbare pagina.
          </div>
        </aside>
      </section>

      <section className="home-quick-grid" aria-label="Snelle ingangen">
        <article className="wotd-card home-wotd">
          <div className="wotd-label">Woord van de dag</div>
          <div className="wotd-main">
            <div className="wotd-left">
              <Link href={`/betekenis/${encodeURIComponent(wotd)}`} className="wotd-word">{wotd}</Link>
              {wotdData && (
                <div className="wotd-meta">
                  {wotdData.pos && <span className="wotd-pos">{wotdData.pos}</span>}
                  {wotdData.gender && <span className="wotd-gender">{wotdData.gender}</span>}
                </div>
              )}
            </div>
            {wotdData && (
              <p className="wotd-meaning">{wotdData.meaning.length > 132 ? `${wotdData.meaning.slice(0, 129)}...` : wotdData.meaning}</p>
            )}
            <Link href={`/betekenis/${encodeURIComponent(wotd)}`} className="wotd-link">
              Bekijk betekenis
            </Link>
          </div>
        </article>

        <div className="home-quick-card">
          <h2>Populaire woorden</h2>
          <div className="popular-pills compact-pills">
            {TOP_POPULAR.slice(0, 10).map((w) => (
              <Link key={w} href={`/betekenis/${encodeURIComponent(w)}`} className="popular-pill">
                {w}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <AdUnit slot="homepage-below-wotd" format="auto" style={{ minHeight: '90px' }} />

      <section className="home-section" aria-labelledby="letters-heading">
        <div className="home-section-header">
          <h2 id="letters-heading" className="section-heading">Blader op letter</h2>
          <p>Gebruik het alfabet wanneer je niet precies weet hoe een woord begint of gewoon wilt bladeren.</p>
        </div>
        <div className="letter-bar">
          {LETTERS.map((l) => {
            const L = l.toUpperCase();
            const count = index[L] || 0;
            return (
              <Link key={l} href={`/letter/${l}`} className="letter-bar-item" title={`${count.toLocaleString('nl-NL')} woorden`}>
                <span>{L}</span>
                <small>{count.toLocaleString('nl-NL')}</small>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="home-section" aria-labelledby="categories-heading">
        <div className="home-section-header">
          <h2 id="categories-heading" className="section-heading">Woorden per categorie</h2>
          <p>Een kleine selectie om sneller woorden in dezelfde context te vinden.</p>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className="category-card">
              <div className="category-header">
                <span className="category-mark">{cat.mark}</span>
                <h3>{cat.name}</h3>
              </div>
              <div className="category-words">
                {cat.words.map((w) => (
                  <Link key={w} href={`/betekenis/${encodeURIComponent(w)}`} className="category-word">
                    {w}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ext-banner">
        <div className="ext-banner-content">
          <div className="ext-banner-copy">
            <strong>Chrome-extensie</strong>
            <span>Selecteer een woord op een webpagina en open direct de betekenis.</span>
          </div>
          <a
            href="https://chromewebstore.google.com/detail/woordenboekorg-nederlands/UPLOAD_PENDING"
            className="ext-banner-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gratis installeren
          </a>
        </div>
      </section>

      <section className="info-grid" aria-label="Waarom Woordenboek.org">
        <div className="info-card info-card-featured">
          <h3>Meer dan definities</h3>
          <p>Nederlandse verklaringen met synoniemen, vervoegingen, etymologie en vertalingen waar beschikbaar.</p>
        </div>
        <div className="info-card">
          <h3>Zoekbaar en snel</h3>
          <p>Typ een woord en ga direct naar de juiste pagina. Geschikt voor mobiel, school en dagelijks gebruik.</p>
        </div>
        <div className="info-card">
          <h3>Open bronnen</h3>
          <p>Gebaseerd op OpenTaal en WikiWoordenboek, met vaste URL's voor elke betekenis.</p>
        </div>
      </section>
    </div>
  );
}

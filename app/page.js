import Link from 'next/link';
import { getIndex, LETTERS, POPULAR_WORDS, getWordEntry, GENDER_MAP } from '../lib/dictionary';
import SearchBox from '../components/SearchBox';
import { AdUnit } from '../components/AdSense';

export const revalidate = 86400; // 1 day

const CATEGORIES = [
  { name: 'Dieren', emoji: '🐕', words: ['hond','kat','paard','vogel','konijn'] },
  { name: 'Kleuren', emoji: '🎨', words: ['rood','blauw','groen','geel','zwart'] },
  { name: 'Getallen', emoji: '🔢', words: ['een','twee','drie','vier','vijf'] },
  { name: 'Familie', emoji: '👨‍👩‍👧‍👦', words: ['moeder','vader','broer','zus','familie'] },
  { name: 'Natuur', emoji: '🌿', words: ['zon','maan','ster','regen','zee'] },
  { name: 'Eten', emoji: '🍞', words: ['brood','kaas','melk','koffie','vis'] },
];

const COMMON_WORDS = [
  'avontuur','bibliotheek','chocolade','diamant','erfgoed','fietspad',
  'gezellig','horizon','ijskonijn','juweeltje','koningshuis','lentebries',
  'middernacht','nachtvlinder','ondernemer','pindakaas','regenboog','schilderij',
  'tulpenbol','uitvinding','vliegtuig','windmolen','zandkasteel','boekenplank',
  'droomwereld','fietsbel','huiskamer','koffiezetapparaat','strandwandeling','zonsondergang',
];

/* Top 15 popular words for prominent display */
const TOP_POPULAR = POPULAR_WORDS.slice(0, 15);

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

  return (
    <div className="page-content">

      {/* ===== HERO ===== */}
      <section className="hero">
        <h1 className="hero-title">Nederlands Woordenboek</h1>
        <p className="hero-subtitle">
          Meer dan 400.000 woorden doorzoekbaar. Betekenissen, synoniemen, etymologie en vertalingen.
        </p>
        <SearchBox isHero />
        <div className="hero-trust">
          <span>400.000+ woorden</span>
          <span className="hero-trust-dot">·</span>
          <span>Gratis</span>
          <span className="hero-trust-dot">·</span>
          <span>Geen registratie</span>
        </div>
      </section>

      {/* ===== WOORD VAN DE DAG ===== */}
      <section className="wotd-card">
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
            <p className="wotd-meaning">{wotdData.meaning.length > 120 ? wotdData.meaning.slice(0, 117) + '...' : wotdData.meaning}</p>
          )}
          <Link href={`/betekenis/${encodeURIComponent(wotd)}`} className="wotd-link">
            Bekijk volledige betekenis →
          </Link>
        </div>
      </section>

      {/* Ad below WotD */}
      <AdUnit slot="homepage-below-wotd" format="auto" style={{ minHeight: '90px' }} />

      {/* ===== ALFABET BALK ===== */}
      <section>
        <h2 className="section-heading">Blader op letter</h2>
        <div className="letter-bar">
          {LETTERS.map((l) => {
            const L = l.toUpperCase();
            const count = index[L] || 0;
            return (
              <Link key={l} href={`/letter/${l}`} className="letter-bar-item" title={`${count.toLocaleString('nl-NL')} woorden`}>
                {L}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== POPULAIRE WOORDEN (top 15) ===== */}
      <section>
        <h2 className="section-heading">Populaire woorden</h2>
        <div className="popular-pills">
          {TOP_POPULAR.map((w) => (
            <Link key={w} href={`/betekenis/${encodeURIComponent(w)}`} className="popular-pill">
              {w}
            </Link>
          ))}
        </div>
      </section>

      {/* ===== CATEGORIEËN ===== */}
      <section>
        <h2 className="section-heading">Woorden per categorie</h2>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className="category-card">
              <div className="category-header">
                <span className="category-emoji">{cat.emoji}</span>
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

      {/* ===== CHROME EXTENSIE ===== */}
      <section className="ext-banner">
        <div className="ext-banner-content">
          <span className="ext-banner-icon">🧩</span>
          <div>
            <strong>Chrome-extensie</strong> — Selecteer een woord op een willekeurige pagina en zie direct de betekenis.
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

      {/* ===== INFO GRID ===== */}
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

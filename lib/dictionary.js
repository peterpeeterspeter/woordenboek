/**
 * Dictionary data layer — per-letter lazy loading.
 * Never loads the full 162K dataset into memory at once.
 * Each function loads only the letter file(s) it needs.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

// A page render calls the dictionary from both generateMetadata and the page
// component. Keep a small LRU of parsed files so those calls do not repeatedly
// read and parse multi-megabyte JSON. The source-size cap keeps warm function
// instances from retaining the complete 100+ MB dataset.
const MAX_JSON_CACHE_SOURCE_BYTES = 48 * 1024 * 1024;
const jsonCache = new Map();
const wordIndexes = new WeakMap();
let jsonCacheSourceBytes = 0;

/* ---------- low-level readers (one file at a time) ---------- */

function readJSON(filename) {
  const cached = jsonCache.get(filename);
  if (cached) {
    // Refresh insertion order so Map acts as an LRU cache.
    jsonCache.delete(filename);
    jsonCache.set(filename, cached);
    return cached.value;
  }

  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;

  const source = fs.readFileSync(fp, 'utf-8');
  const value = JSON.parse(source);
  const sourceBytes = Buffer.byteLength(source);

  if (sourceBytes <= MAX_JSON_CACHE_SOURCE_BYTES) {
    jsonCache.set(filename, { value, sourceBytes });
    jsonCacheSourceBytes += sourceBytes;

    while (jsonCacheSourceBytes > MAX_JSON_CACHE_SOURCE_BYTES && jsonCache.size > 1) {
      const oldestKey = jsonCache.keys().next().value;
      const oldest = jsonCache.get(oldestKey);
      jsonCache.delete(oldestKey);
      jsonCacheSourceBytes -= oldest.sourceBytes;
    }
  }

  return value;
}

/** Word list for a single letter — string[] */
function getWordList(letter) {
  return readJSON(`${letter.toLowerCase()}.json`) || [];
}

/** Dict entries for a single letter — { [word]: entry } */
function getDictData(letter) {
  return readJSON(`${letter.toLowerCase()}_dict.json`) || {};
}

/** Unique AI-generated content for a single letter — { [word]: { beschrijving, uitleg, ... } } */
function getUniqueContent(letter) {
  return readJSON(path.join('unique', `${letter.toLowerCase()}.json`)) || {};
}

/** Letter index — { A: 24262, B: 35805, … } */
function getIndex() {
  return readJSON('index.json') || {};
}

/* ---------- single-word lookup ---------- */

function letterFor(word) {
  const c = (word[0] || '').toLowerCase();
  return LETTERS.includes(c) ? c : null;
}

/**
 * Full word entry used by /betekenis/[woord].
 * Loads exactly two files: <letter>.json + <letter>_dict.json
 */
function getWordEntry(word) {
  const letter = letterFor(word);
  if (!letter) return null;

  const wordList = getWordList(letter);
  const dictData = getDictData(letter);
  const uniqueData = getUniqueContent(letter);

  let wordIndex = wordIndexes.get(wordList);
  if (!wordIndex) {
    wordIndex = new Map();
    wordList.forEach((listedWord, index) => {
      const normalized = listedWord.toLowerCase();
      if (!wordIndex.has(normalized)) wordIndex.set(normalized, index);
    });
    wordIndexes.set(wordList, wordIndex);
  }

  const idx = wordIndex.get(word.toLowerCase()) ?? -1;
  const found = idx !== -1;
  const displayWord = found ? wordList[idx] : word;
  const dict = dictData[displayWord.toLowerCase()] || dictData[word.toLowerCase()] || null;

  if (!found && !dict) return null;

  const synonyms = dict?.y || [];
  const antonyms = dict?.n || [];
  let related = [];
  if (synonyms.length === 0 && antonyms.length === 0 && found) {
    const prefix = displayWord.toLowerCase().slice(0, Math.min(4, displayWord.length));
    related = wordList
      .filter(w => w.toLowerCase().startsWith(prefix) && w.toLowerCase() !== displayWord.toLowerCase())
      .slice(0, 12);
  }

  // Unique AI-generated content (if available for this word)
  const unique = uniqueData[displayWord.toLowerCase()] || null;

  return {
    word: displayWord,
    found,
    dict,
    unique,
    prevWord: idx > 0 ? wordList[idx - 1] : null,
    nextWord: idx < wordList.length - 1 ? wordList[idx + 1] : null,
    synonyms,
    antonyms,
    related,
    letter: letter.toUpperCase(),
  };
}

/* ---------- bulk access — one letter at a time ---------- */

/** All defined words for ONE letter (for sitemap chunks). */
function getDefinedWordsForLetter(letter) {
  const dict = getDictData(letter);
  return dict ? Object.keys(dict) : [];
}

/* ---------- constants ---------- */

const GENDER_MAP = {
  n: 'onzijdig (het)',
  m: 'mannelijk (de)',
  v: 'vrouwelijk (de)',
  'm,v': 'mannelijk/vrouwelijk (de)',
  p: 'meervoud',
  'm,v,n': 'alle geslachten',
  'm,n': 'mannelijk/onzijdig',
  'v,n': 'vrouwelijk/onzijdig',
};

const LANG_NAMES = {
  en: 'Engels', fr: 'Frans', de: 'Duits', es: 'Spaans', it: 'Italiaans',
  pt: 'Portugees', ru: 'Russisch', zh: 'Chinees', ja: 'Japans',
  ko: 'Koreaans', ar: 'Arabisch', tr: 'Turks', pl: 'Pools',
  sv: 'Zweeds', da: 'Deens',
};

/** 200 popular Dutch words to pre-render at build time. */
const POPULAR_WORDS = [
  'huis','water','fiets','boek','school','kind','man','vrouw','werk','tijd',
  'dag','jaar','land','stad','hand','oog','hoofd','deur','weg','auto',
  'eten','drinken','lopen','gaan','komen','zien','doen','maken','geven','nemen',
  'liefde','vriend','familie','moeder','vader','broer','zus','hart','leven','dood',
  'geld','prijs','winkel','markt','bank','bedrijf','klant','product','dienst','handel',
  'zon','maan','ster','wind','regen','sneeuw','zee','berg','bos','rivier',
  'rood','blauw','groen','geel','wit','zwart','groot','klein','lang','kort',
  'goed','slecht','mooi','lelijk','oud','nieuw','jong','dik','dun','snel',
  'tafel','stoel','bed','lamp','klok','spiegel','kast','vloer','muur','raam',
  'brood','kaas','melk','bier','wijn','koffie','thee','soep','vlees','vis',
  'hond','kat','paard','vogel','koe','varken','schaap','muis','konijn','beer',
  'dokter','leraar','politie','rechter','koning','soldaat','boer','bakker','slager','kok',
  'muziek','kunst','sport','film','theater','dans','schilderij','gedicht','roman','lied',
  'computer','telefoon','internet','televisie','radio','krant','brief','boekhandel','bibliotheek','museum',
  'nederland','amsterdam','rotterdam','utrecht','eindhoven','groningen','maastricht','leiden','haarlem','breda',
  'europa','amerika','afrika','azie','belgie','duitsland','frankrijk','engeland','spanje','italie',
  'januari','februari','maart','april','mei','juni','juli','augustus','september','oktober',
  'maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag','morgen','avond','nacht',
  'gezellig','lekker','alsjeblieft','dankjewel','welkom','afscheid','verjaardag','kerst','sinterklaas','vakantie',
  'chocolade','tulp','molen','kanal','polder','dijk','gracht','terras','marktplein','fietspad',
];

module.exports = {
  LETTERS,
  GENDER_MAP,
  LANG_NAMES,
  POPULAR_WORDS,
  getWordList,
  getDictData,
  getUniqueContent,
  getIndex,
  getWordEntry,
  getDefinedWordsForLetter,
};

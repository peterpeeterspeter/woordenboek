/**
 * Dictionary data layer — per-letter lazy loading.
 * Never loads the full 162K dataset into memory at once.
 * Each function loads only the letter file(s) it needs.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

/* ---------- low-level readers (one file at a time) ---------- */

function readJSON(filename) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

/** Word list for a single letter — string[] */
function getWordList(letter) {
  return readJSON(`${letter.toLowerCase()}.json`) || [];
}

/** Dict entries for a single letter — { [word]: entry } */
function getDictData(letter) {
  return readJSON(`${letter.toLowerCase()}_dict.json`) || {};
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

  const idx = wordList.findIndex(w => w.toLowerCase() === word.toLowerCase());
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

  return {
    word: displayWord,
    found,
    dict,
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
  getIndex,
  getWordEntry,
  getDefinedWordsForLetter,
};

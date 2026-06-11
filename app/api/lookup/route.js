/**
 * /api/lookup?q=woord — lightweight JSON endpoint for Chrome extension.
 * Returns meaning snippet, top synonyms, translations, and a link to the full page.
 * Kept intentionally partial so the user clicks through for the complete experience.
 */
import { getWordEntry, GENDER_MAP, LANG_NAMES } from '../../../lib/dictionary';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const raw = (url.searchParams.get('q') || '').trim().toLowerCase();

  if (!raw || raw.length < 1 || raw.length > 100) {
    return NextResponse.json(
      { error: 'Geen geldig woord opgegeven.' },
      { status: 400 }
    );
  }

  const entry = getWordEntry(raw);

  if (!entry || !entry.found) {
    return NextResponse.json(
      {
        word: raw,
        found: false,
        url: `https://www.woordenboek.org/betekenis/${encodeURIComponent(raw)}`,
        suggestion: null,
      },
      { status: 404 }
    );
  }

  const { word, dict, synonyms, antonyms } = entry;

  // --- Build a short meaning snippet (first definition only) ---
  let meaning = '';
  let gender = '';
  let ipa = '';
  let partOfSpeech = '';

  if (dict) {
    if (dict.g && GENDER_MAP[dict.g]) gender = GENDER_MAP[dict.g];
    if (dict.i) ipa = dict.i;

    const senses = dict.s;
    if (senses && Array.isArray(senses) && senses.length > 0) {
      const first = senses[0];
      if (first && first.p) partOfSpeech = first.p;
      // Data structure: { p: "woordsoort", d: [{ t: "definitie", x: [...] }, ...] }
      if (first && first.d && Array.isArray(first.d) && first.d.length > 0) {
        meaning = first.d[0].t || first.d[0].d || '';
      } else if (typeof first === 'string') {
        meaning = first;
      } else if (first && first.t) {
        meaning = first.t;
      }
    }
    // Truncate to ~200 chars for popup display
    if (meaning.length > 200) {
      meaning = meaning.slice(0, 197) + '...';
    }
  }

  // --- Top 5 synonyms and antonyms ---
  const topSynonyms = (synonyms || []).slice(0, 5);
  const topAntonyms = (antonyms || []).slice(0, 3);

  // --- Translations (top 3 languages) ---
  const translations = {};
  if (dict?.tr) {
    const priorityLangs = ['en', 'fr', 'de'];
    for (const lang of priorityLangs) {
      if (dict.tr[lang]) {
        const val = dict.tr[lang];
        translations[lang] = {
          lang: LANG_NAMES[lang] || lang,
          value: Array.isArray(val) ? val.slice(0, 3) : val,
        };
      }
    }
  }

  // --- Response ---
  return NextResponse.json({
    word,
    found: true,
    gender,
    ipa,
    partOfSpeech,
    meaning,
    synonyms: topSynonyms,
    antonyms: topAntonyms,
    translations,
    url: `https://www.woordenboek.org/betekenis/${encodeURIComponent(word)}`,
  });
}

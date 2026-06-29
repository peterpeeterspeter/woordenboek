#!/usr/bin/env python3
"""
Merge Dutch Wiktionary (nl-extract.jsonl) into existing dictionary data.

Strategy:
1. Load existing wordlists (all 408K words)
2. Identify orphan words (in wordlist but NOT in dict)
3. Stream Wiktionary JSONL, extract only Dutch (lang_code=nl) entries
4. For orphan words: create new dict entries
5. Merge into existing {letter}_dict.json files

Data format mapping (Wiktionary → our format):
  pos_title      → s[].p (part of speech label)
  senses[].glosses → s[].d[].t (definition text)
  senses[].examples → s[].d[].x (examples, extract .text)
  tags (neuter/de/etc) → g (gender)
  sounds[].ipa → i (IPA)
  etymology_texts → e
  translations → tr
  antonyms → n
  hyponyms/synonyms → y
"""
import json
import gzip
import os
import sys
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
WIKT_FILE = os.path.join(DATA_DIR, 'wiktionary', 'nl-extract.jsonl.gz')

# POS mapping: Wiktionary pos_title → our format
# Our format uses Dutch labels like "zelfstandig naamwoord"
POS_MAP = {
    'noun': 'zelfstandig naamwoord',
    'verb': 'werkwoord',
    'adj': 'bijvoeglijk naamwoord',
    'adv': 'bijwoord',
    'pron': 'voornaamwoord',
    'prep': 'voorzetsel',
    'conj': 'voegwoord',
    'intj': 'tussenwerpsel',
    'det': 'lidwoord',
    'num': 'telwoord',
    'article': 'lidwoord',
    'name': 'eigennaam',
    'part': 'partikel',
    'phrase': 'uitdrukking',
    'proverb': 'gezegde',
    'prefix': 'voorvoegsel',
    'suffix': 'achtervoegsel',
}

# Gender mapping from Wiktionary tags
GENDER_MAP = {
    'neuter': 'n',
    'masculine': 'm',
    'feminine': 'v',
    'plural': 'p',
}


def load_wordlists():
    """Load all word lists to know which words exist."""
    words = set()
    for letter in 'abcdefghijklmnopqrstuvwxyz':
        fp = os.path.join(DATA_DIR, f'{letter}.json')
        if os.path.exists(fp):
            with open(fp) as f:
                for w in json.load(f):
                    words.add(w.lower())
    return words


def load_existing_dict(letter):
    """Load existing dict data for a letter."""
    fp = os.path.join(DATA_DIR, f'{letter}_dict.json')
    if os.path.exists(fp):
        with open(fp) as f:
            return json.load(f)
    return {}


def extract_gender(entry):
    """Extract gender code from Wiktionary tags."""
    tags = entry.get('tags', [])
    for tag in tags:
        if tag in GENDER_MAP:
            return GENDER_MAP[tag]
    return None


def extract_ipa(entry):
    """Extract IPA pronunciation."""
    sounds = entry.get('sounds', [])
    for s in sounds:
        ipa = s.get('ipa')
        if ipa:
            # Prefer phonemic /ipa/ over phonetic [ipa]
            if ipa.startswith('/'):
                return ipa
    # Fallback to any IPA
    for s in sounds:
        if s.get('ipa'):
            return s['ipa']
    return None


def extract_etymology(entry):
    """Extract etymology text."""
    texts = entry.get('etymology_texts', [])
    if texts:
        return texts[0][:300]  # Cap length
    return None


def extract_translations(entry):
    """Extract translations grouped by language."""
    translations = entry.get('translations', [])
    if not translations:
        return None

    tr = defaultdict(set)
    for t in translations:
        if isinstance(t, dict):
            lang = t.get('lang_code', '')
            word = t.get('word', '')
            if lang and word and len(lang) <= 3:
                tr[lang].add(word)

    # Convert sets to lists, limit to 5 per language
    result = {}
    for lang, words in tr.items():
        if len(words) > 0:
            result[lang] = list(words)[:5]
    return result if result else None


def convert_entry(entry):
    """
    Convert a Wiktionary entry to our dict format.
    Returns None if no usable senses.
    """
    senses_data = []

    # Group senses by the entry (one Wiktionary JSONL line = one POS)
    pos_title = entry.get('pos_title') or POS_MAP.get(entry.get('pos', ''), entry.get('pos', ''))
    if pos_title in POS_MAP.values() or entry.get('pos') in POS_MAP:
        pos_label = pos_title if pos_title in POS_MAP.values() else POS_MAP.get(entry.get('pos', ''), pos_title)
    else:
        pos_label = pos_title

    raw_senses = entry.get('senses', [])
    definitions = []
    for sense in raw_senses:
        glosses = sense.get('glosses', [])
        if not glosses:
            continue

        gloss = glosses[0] if glosses else ''
        if not gloss or len(gloss) < 2:
            continue

        # Extract examples
        examples = []
        for ex in sense.get('examples', [])[:2]:
            if isinstance(ex, dict):
                text = ex.get('text', '')
                if text and len(text) < 200:
                    examples.append(text)
            elif isinstance(ex, str) and len(ex) < 200:
                examples.append(ex)

        # Extract tags/categories for this sense
        tags = []
        for cat in sense.get('categories', [])[:3]:
            # Simplify category to a tag
            cat = cat.replace('Woorden in het Nederlands', '').strip()
            if cat and len(cat) < 40:
                tags.append(cat.lower())

        def_entry = {'t': gloss}
        if examples:
            def_entry['x'] = examples
        if tags:
            def_entry['g'] = tags[:3]

        definitions.append(def_entry)

    if not definitions:
        return None

    # Build the entry in our format
    result = {
        's': [{
            'p': pos_label,
            'd': definitions[:5],  # Max 5 definitions per POS
        }]
    }

    # Add optional fields
    gender = extract_gender(entry)
    if gender:
        result['g'] = gender

    ipa = extract_ipa(entry)
    if ipa:
        result['i'] = ipa

    etym = extract_etymology(entry)
    if etym:
        result['e'] = etym

    tr = extract_translations(entry)
    if tr:
        result['tr'] = tr

    return result


def merge_entries(entries):
    """
    Multiple Wiktionary lines may have the same word (different POS).
    Merge them into a single dict entry.
    """
    if not entries:
        return None

    merged = None
    for entry in entries:
        converted = convert_entry(entry)
        if converted is None:
            continue
        if merged is None:
            merged = converted
        else:
            # Add additional POS groups
            merged['s'].extend(converted['s'])
            # Merge optional fields (don't overwrite)
            for k in ['g', 'i', 'e', 'tr']:
                if k not in merged and k in converted:
                    merged[k] = converted[k]

    return merged


def letter_for(word):
    """Get the letter file for a word."""
    c = word[0].lower() if word else ''
    if c in 'abcdefghijklmnopqrstuvwxyz':
        return c
    return None


def main():
    print("=== Woordenboek Wiktionary Merger ===")
    print()

    # Step 1: Load wordlists
    print("Loading wordlists...")
    all_words = load_wordlists()
    print(f"  Total words in wordlists: {len(all_words):,}")

    # Step 2: Load existing dicts to know which words already have definitions
    print("Loading existing dictionaries...")
    existing_dict_words = set()
    for letter in 'abcdefghijklmnopqrstuvwxyz':
        d = load_existing_dict(letter)
        existing_dict_words.update(k.lower() for k in d.keys())
    print(f"  Words with existing definitions: {len(existing_dict_words):,}")

    # Orphans = in wordlist but NOT in dict
    orphans = all_words - existing_dict_words
    print(f"  Orphan words (no definition): {len(orphans):,}")
    print()

    # Step 3: Stream Wiktionary JSONL
    print("Streaming Wiktionary JSONL...")
    # Collect entries per word (multiple POS per word)
    wikt_entries = defaultdict(list)
    total_lines = 0
    dutch_lines = 0
    orphan_hits = 0

    with gzip.open(WIKT_FILE, 'rt', encoding='utf-8') as f:
        for line in f:
            total_lines += 1
            if total_lines % 500000 == 0:
                print(f"  Processed {total_lines:,} lines... ({len(wikt_entries):,} orphan words found)")

            line = line.strip()
            if not line:
                continue

            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            # Only Dutch entries
            if entry.get('lang_code') != 'nl':
                continue

            dutch_lines += 1
            word = entry.get('word', '').lower().strip()
            if not word or len(word) < 1:
                continue

            # Only keep if this is an orphan word
            if word in orphans:
                wikt_entries[word].append(entry)
                orphan_hits += 1

    print(f"  Total lines: {total_lines:,}")
    print(f"  Dutch entries: {dutch_lines:,}")
    print(f"  Orphan words with Wiktionary data: {len(wikt_entries):,}")
    print()

    # Step 4: Convert and merge into existing dict files
    print("Converting and merging...")
    new_entries_by_letter = defaultdict(dict)
    skipped = 0

    for word, entries in wikt_entries.items():
        letter = letter_for(word)
        if not letter:
            skipped += 1
            continue

        converted = merge_entries(entries)
        if converted is None:
            skipped += 1
            continue

        # Use original casing from wordlist if possible
        new_entries_by_letter[letter][word] = converted

    total_new = sum(len(d) for d in new_entries_by_letter.values())
    print(f"  New entries created: {total_new:,}")
    print(f"  Skipped (no valid data): {skipped:,}")
    print()

    # Step 5: Merge into existing dict files
    print("Merging into dict files...")
    for letter in sorted(new_entries_by_letter.keys()):
        new = new_entries_by_letter[letter]
        existing = load_existing_dict(letter)

        before = len(existing)
        existing.update(new)
        after = len(existing)

        fp = os.path.join(DATA_DIR, f'{letter}_dict.json')
        with open(fp, 'w', encoding='utf-8') as f:
            json.dump(existing, f, ensure_ascii=False, separators=(',', ':'))

        added = after - before
        print(f"  {letter}_dict.json: {before:>6} → {after:>6} (+{added:>5})")

    print()
    print(f"=== DONE ===")
    print(f"Added {total_new:,} new definitions from Wiktionary")
    print(f"Total definitions now: {len(existing_dict_words) + total_new:,}")


if __name__ == '__main__':
    main()

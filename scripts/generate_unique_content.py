#!/usr/bin/env python3
"""
Generate unique, SEO-friendly content for top 10K Dutch words via APIYI.
Output: data/unique/[letter].json — one file per letter.
"""

import json
import os
import time
import requests
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

APIYI_KEY = "sk-K9Szt5enr24VOTyG6f01B767B381400a85B48fEd1f307f62"
API_URL = "https://api.apiyi.com/v1/chat/completions"
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
UNIQUE_DIR = os.path.join(DATA_DIR, 'unique')
os.makedirs(UNIQUE_DIR, exist_ok=True)

MAX_WORKERS = 20
BATCH_SAVE = 500  # Save progress every N words

PROMPT = """Je bent een Nederlandse taalkundige. Schrijf unieke, originele content voor het woord "{word}" in een online woordenboek. Deze content moet NIET letterlijk van WikiWoordenboek of OpenTaal komen — schrijf in je eigen woorden.

Geef je antwoord als JSON met deze velden:
{{"beschrijving": "Een natuurlijke, vlotte beschrijving van wat het woord betekent in 2-3 zinnen. Schrijf alsof je het aan iemand uitlegt. Geen droge definitie maar een heldere uitleg.", "uitleg": "3-4 zinnen met extra context: wanneer gebruik je dit woord, in welke situaties, welke nuance heeft het? Maak het praktisch en bruikbaar.", "voorbeelden": ["Eerste unieke voorbeeldzin met het woord erin.", "Tweede voorbeeldzin in een andere context.", "Derde voorbeeldzin die het woord goed illustreert."], "etymologie": "1-2 zinnen over de herkomst van het woord. Als je het niet zeker weet, schrijf dan een redelijke verklaring op basis van verwante woorden. Mag leeg zijn als echt onbekend.", "spreekwoorden": []}}

Vul "spreekwoorden" alleen in als er bekende uitdrukkingen of spreekwoorden met dit woord zijn, in dit formaat:
[{{"uitdrukking": "de uitdrukking", "betekenis": "wat het betekent"}}, ...]

Geef ALLEEN geldige JSON terug, geen markdown, geen uitleg ervoor of erna."""

def generate_for_word(word):
    """Generate unique content for a single word."""
    try:
        resp = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {APIYI_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": PROMPT.format(word=word)}],
                "temperature": 0.7,
                "max_tokens": 600,
                "response_format": {"type": "json_object"}
            },
            timeout=60
        )
        if resp.status_code != 200:
            return word, None, f"HTTP {resp.status_code}"

        content = resp.json()["choices"][0]["message"]["content"]
        data = json.loads(content)
        return word, data, None
    except json.JSONDecodeError:
        # Try to extract JSON from response
        try:
            import re
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return word, data, None
        except:
            pass
        return word, None, "JSON parse error"
    except Exception as e:
        return word, None, str(e)[:100]

def load_existing():
    """Load any previously generated content to resume."""
    existing = {}
    for letter in 'abcdefghijklmnopqrstuvwxyz':
        fp = os.path.join(UNIQUE_DIR, f'{letter}.json')
        if os.path.exists(fp):
            with open(fp, 'r') as f:
                existing.update(json.load(f))
    return existing

def save_results(results):
    """Save results grouped by letter."""
    by_letter = defaultdict(dict)
    for word, data in results.items():
        letter = word[0].lower() if word else '?'
        if letter in 'abcdefghijklmnopqrstuvwxyz':
            by_letter[letter][word] = data

    for letter, words in by_letter.items():
        fp = os.path.join(UNIQUE_DIR, f'{letter}.json')
        # Merge with existing
        existing = {}
        if os.path.exists(fp):
            with open(fp, 'r') as f:
                existing = json.load(f)
        existing.update(words)
        with open(fp, 'w') as f:
            json.dump(existing, f, ensure_ascii=False, indent=1)

def main():
    # Load word list (top10k or next10k)
    word_file = '/tmp/next10k_words.json' if os.path.exists('/tmp/next10k_words.json') else '/tmp/top10k_words.json'
    with open(word_file, 'r') as f:
        all_words = json.load(f)
    print(f"Using word list: {word_file} ({len(all_words)} words)")

    # Load existing progress
    existing = load_existing()
    print(f"Already generated: {len(existing)} words")

    # Filter out already done
    todo = [w for w in all_words if w not in existing]
    print(f"Todo: {len(todo)} words")

    if not todo:
        print("Everything done!")
        return

    results = dict(existing)
    start_time = time.time()
    completed = 0
    errors = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(generate_for_word, w): w for w in todo}

        for future in as_completed(futures):
            word, data, error = future.result()
            completed += 1

            if data:
                results[word] = data
            else:
                errors += 1
                if errors <= 5:
                    print(f"  ERROR: {word} — {error}")

            if completed % 100 == 0:
                elapsed = time.time() - start_time
                rate = completed / elapsed
                remaining = (len(todo) - completed) / rate if rate > 0 else 0
                print(f"  {completed}/{len(todo)} done ({errors} errors) — {rate:.0f}/s — ETA {remaining/60:.0f}min")

            if completed % BATCH_SAVE == 0:
                save_results(results)
                print(f"  >> Saved {len(results)} entries to disk")

    # Final save
    save_results(results)
    elapsed = time.time() - start_time
    print(f"\nDone! {completed} words in {elapsed/60:.1f}min ({errors} errors)")
    print(f"Total unique entries: {len(results)}")

    # Show sample
    sample_word = all_words[10]
    if sample_word in results:
        print(f"\n--- Sample: {sample_word} ---")
        print(json.dumps(results[sample_word], indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()

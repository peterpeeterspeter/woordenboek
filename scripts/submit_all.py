#!/usr/bin/env python3
"""
Batch submit woordenboek.org URLs to Google Indexing API.
Quota-aware: stops when 429 is hit, saves granular progress.
Resume from exact word position, not just letter-level.

Key fix: Google Indexing API allows 200 requests/day.
At that rate, 236K URLs would take 3+ years.
Strategy: submit /betekenis/ pages only (highest value),
spread across daily cron runs of ~180 URLs (safety margin).
"""
import json, time, os, sys, requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from urllib.parse import quote

DATA_DIR = os.path.join(os.getcwd(), 'data')
BASE_URL = 'https://www.woordenboek.org'
TOKEN_FILE = '/home/hermes/.hermes/google_token.json'
DELAY = 0.5  # seconds between requests (avoid burst rate limit)
MAX_PER_RUN = 180  # daily quota is 200, leave safety margin
COMMIT_FILE = '/tmp/woordenboek_indexing_commit.json'

def load_creds():
    with open(TOKEN_FILE) as f:
        td = json.load(f)
    creds = Credentials(
        token=td['token'], refresh_token=td['refresh_token'],
        token_uri=td['token_uri'], client_id=td['client_id'],
        client_secret=td['client_secret'], scopes=td['scopes']
    )
    creds.refresh(GoogleRequest())
    td['token'] = creds.token
    with open(TOKEN_FILE, 'w') as f:
        json.dump(td, f)
    return creds

def submit_url(creds, url):
    """Returns (status_code, should_stop)"""
    resp = requests.post(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        headers={'Authorization': f'Bearer {creds.token}'},
        json={"url": url, "type": "URL_UPDATED"}, timeout=15
    )
    status = resp.status_code
    # 429 = quota exhausted, stop immediately
    if status == 429:
        return status, True
    # 403 = rate limit or auth, stop
    if status == 403:
        return status, True
    return status, False

def load_commit():
    if os.path.exists(COMMIT_FILE):
        with open(COMMIT_FILE) as f:
            return json.load(f)
    return {
        'done_letters': [],
        'current_letter': None,
        'current_word_index': 0,
        'total_submitted': 0,
        'total_errors': 0,
        'last_run': None
    }

def save_commit(c):
    c['last_run'] = time.strftime('%Y-%m-%dT%H:%M:%S')
    with open(COMMIT_FILE, 'w') as f:
        json.dump(c, f)

def main():
    commit = load_commit()
    done_letters = set(commit.get('done_letters', []))
    total_submitted = commit.get('total_submitted', 0)
    total_errors = commit.get('total_errors', 0)
    run_submitted = 0

    creds = load_creds()
    last_refresh = time.time()
    quota_hit = False

    # Sort letters by size (small first for quick wins)
    all_letters = list('abcdefghijklmnopqrstuvwxyz')
    all_letters.sort(key=lambda l: os.path.getsize(os.path.join(DATA_DIR, f'{l}_dict.json')) if os.path.exists(os.path.join(DATA_DIR, f'{l}_dict.json')) else 0)

    for letter in all_letters:
        if quota_hit or run_submitted >= MAX_PER_RUN:
            break
        if letter in done_letters:
            continue

        dict_path = os.path.join(DATA_DIR, f'{letter}_dict.json')
        if not os.path.exists(dict_path):
            done_letters.add(letter)
            continue

        with open(dict_path) as f:
            d = json.load(f)

        words = list(d.keys())
        start_idx = 0
        # Resume from saved position if this is the current letter
        if commit.get('current_letter') == letter:
            start_idx = commit.get('current_word_index', 0)
            print(f"[{letter}] Resuming from word {start_idx}/{len(words)}", flush=True)
        else:
            print(f"[{letter}] {len(words)} words, starting fresh", flush=True)

        letter_submitted = 0

        for i in range(start_idx, len(words)):
            if run_submitted >= MAX_PER_RUN:
                commit['current_letter'] = letter
                commit['current_word_index'] = i
                print(f"  [{letter}] Stopping at word {i}/{len(words)} — daily quota limit ({MAX_PER_RUN})", flush=True)
                break

            word = words[i]
            entry = d[word]
            enc = quote(word, safe='')

            # SUBMIT BETEKENIS ONLY (highest value page type)
            url = f'{BASE_URL}/betekenis/{enc}'

            # Refresh token every 45 min
            if time.time() - last_refresh > 2700:
                creds = load_creds()
                last_refresh = time.time()

            status, stop = submit_url(creds, url)

            if status == 200:
                letter_submitted += 1
                run_submitted += 1
                total_submitted += 1
            elif status == 401:
                creds = load_creds()
                last_refresh = time.time()
                status, stop = submit_url(creds, url)
                if status == 200:
                    letter_submitted += 1
                    run_submitted += 1
                    total_submitted += 1
                else:
                    total_errors += 1
            else:
                total_errors += 1

            if stop:
                quota_hit = True
                commit['current_letter'] = letter
                commit['current_word_index'] = i
                print(f"  [{letter}] QUOTA HIT (429) at word {i}/{len(words)}", flush=True)
                break

            time.sleep(DELAY)

            # Progress every 50 words
            if (i + 1) % 50 == 0:
                print(f"  [{letter}] {i+1}/{len(words)} | +{letter_submitted} this letter | run total: {run_submitted}", flush=True)
        else:
            # Finished this letter completely
            print(f"  [{letter}] DONE: +{letter_submitted} submitted", flush=True)
            done_letters.add(letter)
            commit['current_letter'] = None
            commit['current_word_index'] = 0

        del d  # free memory
        commit['done_letters'] = sorted(done_letters)
        commit['total_submitted'] = total_submitted
        commit['total_errors'] = total_errors
        save_commit(commit)

    commit['done_letters'] = sorted(done_letters)
    commit['total_submitted'] = total_submitted
    commit['total_errors'] = total_errors
    save_commit(commit)

    print(f"\nRun complete: {run_submitted} submitted this run | {total_submitted:,} total | {total_errors:,} total errors", flush=True)
    if quota_hit:
        print("⚠️ Quota exhausted — will resume tomorrow", flush=True)
    remaining = 26 - len(done_letters)
    if remaining > 0:
        print(f"Letters remaining: {remaining} | Done: {', '.join(sorted(done_letters))}", flush=True)
    else:
        print("🎉 ALL LETTERS COMPLETE!", flush=True)

if __name__ == '__main__':
    main()

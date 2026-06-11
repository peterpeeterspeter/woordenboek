#!/usr/bin/env python3
"""
Batch submit all woordenboek.org URLs to Google Indexing API.
Processes one letter at a time. Refreshes token on 401.
Priority: synoniem → vertaling → betekenis per letter.
"""
import json, time, os, sys, requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from urllib.parse import quote

DATA_DIR = os.path.join(os.getcwd(), 'data')
BASE_URL = 'https://www.woordenboek.org'
TOKEN_FILE = '/home/hermes/.hermes/google_token.json'
DELAY = 0.3
COMMIT_FILE = '/tmp/woordenboek_indexing_commit.json'  # tracks which letters done

def load_creds():
    with open(TOKEN_FILE) as f:
        td = json.load(f)
    creds = Credentials(
        token=td['token'], refresh_token=td['refresh_token'],
        token_uri=td['token_uri'], client_id=td['client_id'],
        client_secret=td['client_secret'], scopes=td['scopes']
    )
    creds.refresh(GoogleRequest())
    # Save refreshed token
    td['token'] = creds.token
    with open(TOKEN_FILE, 'w') as f:
        json.dump(td, f)
    return creds

def submit_url(creds, url):
    resp = requests.post(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        headers={'Authorization': f'Bearer {creds.token}'},
        json={"url": url, "type": "URL_UPDATED"}, timeout=15
    )
    return resp.status_code

def load_commit():
    if os.path.exists(COMMIT_FILE):
        with open(COMMIT_FILE) as f:
            return json.load(f)
    return {'done_letters': [], 'total_submitted': 0, 'total_errors': 0}

def save_commit(c):
    with open(COMMIT_FILE, 'w') as f:
        json.dump(c, f)

def main():
    commit = load_commit()
    done_letters = set(commit['done_letters'])
    total_submitted = commit['total_submitted']
    total_errors = commit['total_errors']
    creds = load_creds()
    last_refresh = time.time()

    # Sort letters: small ones first (quick wins), then big ones
    all_letters = list('abcdefghijklmnopqrstuvwxyz')
    all_letters.sort(key=lambda l: os.path.getsize(os.path.join(DATA_DIR, f'{l}_dict.json')) if os.path.exists(os.path.join(DATA_DIR, f'{l}_dict.json')) else 0)

    for letter in all_letters:
        if letter in done_letters:
            continue

        dict_path = os.path.join(DATA_DIR, f'{letter}_dict.json')
        if not os.path.exists(dict_path):
            continue

        with open(dict_path) as f:
            d = json.load(f)

        # Count types
        n_syn = sum(1 for w in d if d[w].get('y') and len(d[w]['y']) > 0)
        n_vert = sum(1 for w in d if d[w].get('tr', {}).get('en'))
        n_bet = len(d)
        total_urls = n_syn + n_vert + n_bet
        print(f"[{letter}] {n_bet} words, {n_syn} syn, {n_vert} vert = {total_urls} URLs", flush=True)

        letter_submitted = 0
        letter_errors = 0

        for i, (word, entry) in enumerate(d.items()):
            enc = quote(word, safe='')

            # Build URLs in priority order
            urls = []
            if entry.get('y') and len(entry['y']) > 0:
                urls.append(f'{BASE_URL}/synoniem/{enc}')
            if entry.get('tr', {}).get('en'):
                urls.append(f'{BASE_URL}/vertaling/nederlands-engels/{enc}')
            urls.append(f'{BASE_URL}/betekenis/{enc}')

            for url in urls:
                # Refresh token every 45 min
                if time.time() - last_refresh > 2700:
                    creds = load_creds()
                    last_refresh = time.time()

                status = submit_url(creds, url)

                if status == 200:
                    letter_submitted += 1
                    total_submitted += 1
                elif status == 401:
                    # Token expired mid-run
                    creds = load_creds()
                    last_refresh = time.time()
                    status2 = submit_url(creds, url)
                    if status2 == 200:
                        letter_submitted += 1
                        total_submitted += 1
                    else:
                        letter_errors += 1
                        total_errors += 1
                else:
                    letter_errors += 1
                    total_errors += 1

                time.sleep(DELAY)

            # Progress every 200 words
            if (i + 1) % 200 == 0:
                pct = (i + 1) / len(d) * 100
                print(f"  [{letter}] {pct:.0f}% ({i+1}/{n_bet}) | +{letter_submitted} sub, +{letter_errors} err | total: {total_submitted:,}", flush=True)

        print(f"  [{letter}] DONE: +{letter_submitted} submitted, +{letter_errors} errors", flush=True)
        done_letters.add(letter)
        commit = {
            'done_letters': sorted(done_letters),
            'total_submitted': total_submitted,
            'total_errors': total_errors
        }
        save_commit(commit)
        del d  # free memory

    print(f"\nALL DONE! Total submitted: {total_submitted:,} | Total errors: {total_errors:,}", flush=True)

if __name__ == '__main__':
    main()

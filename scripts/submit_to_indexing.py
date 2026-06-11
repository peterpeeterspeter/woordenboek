#!/usr/bin/env python3
"""
Batch submit URLs to Google Indexing API for woordenboek.org
Streams one letter at a time — no need to hold all URLs in memory.
Priority order: synoniem → vertaling → betekenis per letter.
"""

import json, time, os, sys, requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from urllib.parse import quote

DATA_DIR = os.path.join(os.getcwd(), 'data')
BASE_URL = 'https://www.woordenboek.org'
PROGRESS_FILE = '/tmp/woordenboek_indexing_progress.json'
DELAY = 0.35  # ~170 req/min

def get_creds():
    with open('/home/hermes/.hermes/google_token.json') as f:
        td = json.load(f)
    creds = Credentials(
        token=td['token'], refresh_token=td['refresh_token'],
        token_uri=td['token_uri'], client_id=td['client_id'],
        client_secret=td['client_secret'], scopes=td['scopes']
    )
    if creds.expired:
        creds.refresh(GoogleRequest())
    return creds

def submit_url(creds, url):
    try:
        resp = requests.post(
            "https://indexing.googleapis.com/v3/urlNotifications:publish",
            headers={'Authorization': f'Bearer {creds.token}'},
            json={"url": url, "type": "URL_UPDATED"}, timeout=10
        )
        return resp.status_code
    except Exception as e:
        return str(e)

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {'submitted': 0, 'errors': 0}

def save_progress(p):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(p, f)

def main():
    progress = load_progress()
    submitted = progress['submitted']
    errors = progress['errors']
    creds = get_creds()
    last_refresh = time.time()
    total_submitted = 0

    print(f"Starting Indexing API submission (resuming from {submitted:,} submitted)")

    for letter in 'abcdefghijklmnopqrstuvwxyz':
        dict_path = os.path.join(DATA_DIR, f'{letter}_dict.json')
        if not os.path.exists(dict_path):
            continue

        with open(dict_path) as f:
            d = json.load(f)

        # Build URLs for this letter in priority order
        syn_urls = []
        vert_urls = []
        bet_urls = []
        for word in d:
            enc = quote(word, safe='')
            entry = d[word]
            bet_urls.append(f'{BASE_URL}/betekenis/{enc}')
            if entry.get('y') and len(entry['y']) > 0:
                syn_urls.append(f'{BASE_URL}/synoniem/{enc}')
            if entry.get('tr', {}).get('en'):
                vert_urls.append(f'{BASE_URL}/vertaling/nederlands-engels/{enc}')

        letter_urls = syn_urls + vert_urls + bet_urls
        print(f"Letter {letter}: {len(syn_urls)} syn, {len(vert_urls)} vert, {len(bet_urls)} bet = {len(letter_urls)} URLs")

        for url in letter_urls:
            # Refresh token every 50 min
            if time.time() - last_refresh > 3000:
                creds = get_creds()
                last_refresh = time.time()

            status = submit_url(creds, url)
            if status == 200:
                submitted += 1
                total_submitted += 1
            else:
                errors += 1
                if errors <= 10:
                    print(f"  ERR {status}: {url[:80]}")

            # Save progress + print status every 500
            if total_submitted % 500 == 0 and total_submitted > 0:
                save_progress({'submitted': submitted, 'errors': errors})
                print(f"  Progress: {submitted:,} submitted, {errors:,} errors")

            time.sleep(DELAY)

        # Free memory
        del d

    save_progress({'submitted': submitted, 'errors': errors})
    print(f"\nDONE! Submitted: {submitted:,} | Errors: {errors:,}")

if __name__ == '__main__':
    main()

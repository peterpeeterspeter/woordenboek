#!/usr/bin/env python3
"""
Batch submit URLs to Google Indexing API for woordenboek.org
Processes one letter at a time via command line arg.
Usage: python3 submit_letter.py a [start_index]
"""
import json, time, os, sys, requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from urllib.parse import quote

DATA_DIR = os.path.join(os.getcwd(), 'data')
BASE_URL = 'https://www.woordenboek.org'
DELAY = 0.3

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

letter = sys.argv[1].lower()
start_idx = int(sys.argv[2]) if len(sys.argv) > 2 else 0

print(f"Processing letter '{letter}' from index {start_idx}")
creds = get_creds()

dict_path = os.path.join(DATA_DIR, f'{letter}_dict.json')
with open(dict_path) as f:
    d = json.load(f)

words = list(d.keys())
print(f"Total words: {len(words)}")

submitted = 0
errors = 0

for i in range(start_idx, len(words)):
    word = words[i]
    enc = quote(word, safe='')
    entry = d[word]

    urls = []
    # Priority: synoniem, vertaling, then betekenis
    if entry.get('y') and len(entry['y']) > 0:
        urls.append(f'{BASE_URL}/synoniem/{enc}')
    if entry.get('tr', {}).get('en'):
        urls.append(f'{BASE_URL}/vertaling/nederlands-engels/{enc}')
    urls.append(f'{BASE_URL}/betekenis/{enc}')

    for url in urls:
        try:
            resp = requests.post(
                "https://indexing.googleapis.com/v3/urlNotifications:publish",
                headers={'Authorization': f'Bearer {creds.token}'},
                json={"url": url, "type": "URL_UPDATED"}, timeout=10
            )
            if resp.status_code == 200:
                submitted += 1
            else:
                errors += 1
                if errors <= 3:
                    print(f"ERR {resp.status_code}: {url[:80]}")
        except Exception as e:
            errors += 1

    if (i + 1) % 200 == 0:
        pct = (i + 1) / len(words) * 100
        print(f"  [{letter}] {pct:.0f}% ({i+1}/{len(words)}) | submitted: {submitted} | errors: {errors}")
        sys.stdout.flush()

    time.sleep(DELAY)

print(f"DONE letter '{letter}': {submitted} submitted, {errors} errors")

#!/usr/bin/env python3
"""
Submit priority newly-defined words to Google Indexing API.
These are words that have Search Console impressions but were just given definitions.
Submit the top ~180 (daily quota) by search volume.
"""
import json, time, requests, glob
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from urllib.parse import quote

BASE_URL = 'https://www.woordenboek.org'
TOKEN_FILE = '/home/hermes/.hermes/google_token.json'
DELAY = 0.5
MAX_PER_RUN = 180

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
    resp = requests.post(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        headers={'Authorization': f'Bearer {creds.token}'},
        json={"url": url, "type": "URL_UPDATED"},
        timeout=15
    )
    return resp.status_code

def main():
    # Load priority words (sorted by search volume descending)
    with open('/tmp/woordenboek_priority_words.json') as f:
        priority = json.load(f)

    print(f"Priority words to submit: {len(priority)}")
    print(f"Submitting top {min(MAX_PER_RUN, len(priority))} by search volume...\n")

    creds = load_creds()
    submitted = 0
    errors = 0
    quota_hit = False

    for i, (impr, word, original_url) in enumerate(priority[:MAX_PER_RUN]):
        enc = quote(word, safe='')
        url = f'{BASE_URL}/betekenis/{enc}'

        status = submit_url(creds, url)

        if status == 200:
            submitted += 1
            if submitted % 20 == 0 or submitted <= 5:
                print(f"  [{submitted:>3}] {impr:>5} vert  ✓  {word}")
        elif status == 429:
            print(f"\n  ⚠️  Quota hit at word {submitted}")
            quota_hit = True
            break
        elif status == 401:
            creds = load_creds()
            status = submit_url(creds, url)
            if status == 200:
                submitted += 1
            else:
                errors += 1
        else:
            errors += 1
            if errors <= 3:
                print(f"  ERROR {status}: {word}")

        time.sleep(DELAY)

    print(f"\n{'='*50}")
    print(f"Submitted: {submitted}")
    print(f"Errors: {errors}")
    if quota_hit:
        print("⚠️ Daily quota exhausted")
    remaining = len(priority) - submitted
    if remaining > 0:
        print(f"Remaining priority words: {remaining} (will submit tomorrow)")

if __name__ == '__main__':
    main()

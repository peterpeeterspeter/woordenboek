#!/usr/bin/env python3
"""
Search Console indexing monitor for woordenboek.org
Pulls indexing stats, top queries, and page performance.
Run weekly via cron.
"""
import json, sys
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build

TOKEN_FILE = '/home/hermes/.hermes/google_token.json'
SITE_URL = 'https://www.woordenboek.org/'

def get_creds():
    with open(TOKEN_FILE) as f:
        td = json.load(f)
    creds = Credentials(
        token=td['token'], refresh_token=td['refresh_token'],
        token_uri=td['token_uri'], client_id=td['client_id'],
        client_secret=td['client_secret'], scopes=td['scopes']
    )
    if creds.expired:
        creds.refresh(GoogleRequest())
    return creds

def main():
    creds = get_creds()
    service = build('searchconsole', 'v1', credentials=creds)

    end_date = datetime.now() - timedelta(days=2)  # SC data has ~2 day lag
    start_date = end_date - timedelta(days=7)

    # 1. Search analytics — top pages
    print("=== SEARCH ANALYTICS (last 7 days) ===")
    body = {
        'startDate': start_date.strftime('%Y-%m-%d'),
        'endDate': end_date.strftime('%Y-%m-%d'),
        'dimensions': ['page'],
        'rowLimit': 25,
        'orderby': [{'sortOrder': 'DESCENDING', 'sortColumn': 'clicks'}]
    }
    result = service.searchanalytics().query(siteUrl=SITE_URL, body=body).execute()
    rows = result.get('rows', [])
    if rows:
        print(f"{'Clicks':>8} {'Impr':>10} {'CTR':>8} {'Pos':>6}  URL")
        for r in rows[:15]:
            clicks = r.get('clicks', 0)
            impr = r.get('impressions', 0)
            ctr = r.get('ctr', 0) * 100
            pos = r.get('position', 0)
            url = r.get('keys', [''])[0][-60:]
            print(f"{clicks:>8} {impr:>10} {ctr:>7.1f}% {pos:>6.1f}  ...{url}")
    else:
        print("No data yet (Search Console needs a few days to collect data)")

    # 2. Top queries
    print("\n=== TOP QUERIES ===")
    body_q = {
        'startDate': start_date.strftime('%Y-%m-%d'),
        'endDate': end_date.strftime('%Y-%m-%d'),
        'dimensions': ['query'],
        'rowLimit': 20,
        'orderby': [{'sortOrder': 'DESCENDING', 'sortColumn': 'impressions'}]
    }
    result_q = service.searchanalytics().query(siteUrl=SITE_URL, body=body_q).execute()
    rows_q = result_q.get('rows', [])
    if rows_q:
        print(f"{'Impr':>10} {'Clicks':>8} {'CTR':>8} {'Pos':>6}  Query")
        for r in rows_q[:15]:
            clicks = r.get('clicks', 0)
            impr = r.get('impressions', 0)
            ctr = r.get('ctr', 0) * 100
            pos = r.get('position', 0)
            query = r.get('keys', [''])[0]
            print(f"{impr:>10} {clicks:>8} {ctr:>7.1f}% {pos:>6.1f}  {query}")
    else:
        print("No query data yet")

    # 3. Page type breakdown (betekenis vs synoniem vs vertaling)
    print("\n=== PAGE TYPE BREAKDOWN ===")
    for page_type in ['betekenis', 'synoniem', 'vertaling']:
        body_t = {
            'startDate': start_date.strftime('%Y-%m-%d'),
            'endDate': end_date.strftime('%Y-%m-%d'),
            'dimensions': ['page'],
            'dimensionFilterGroups': [{
                'filters': [{
                    'dimension': 'page',
                    'operator': 'contains',
                    'expression': f'/{page_type}/'
                }]
            }],
            'rowLimit': 1,
            'aggregationType': 'auto'
        }
        result_t = service.searchanalytics().query(siteUrl=SITE_URL, body=body_t).execute()
        rows_t = result_t.get('rows', [])
        if rows_t:
            r = rows_t[0]
            print(f"  /{page_type}/: {r.get('clicks',0)} clicks, {r.get('impressions',0)} impressions, pos {r.get('position',0):.1f}")
        else:
            print(f"  /{page_type}/: no data yet")

    # 4. Sitemap status
    print("\n=== SITEMAPS ===")
    sitemaps = service.sitemaps().list(siteUrl=SITE_URL).execute()
    for sm in sitemaps.get('sitemap', []):
        path = sm.get('path', '')[-50:]
        is_pending = sm.get('isPending', False)
        last_submitted = sm.get('lastSubmitted', 'N/A')
        errors = sm.get('errors', [])
        warnings = sm.get('warnings', [])
        contents = sm.get('contents', [])
        total_urls = sum(int(c.get("submitted", 0)) for c in contents) if contents else 0
        indexed = sum(int(c.get("indexed", 0)) for c in contents) if contents else 0
        status = "PENDING" if is_pending else sm.get('lastDownloaded', 'N/A')
        print(f"  ...{path}")
        print(f"    Submitted: {last_submitted} | URLs: {total_urls} | Indexed: {indexed}")
        if errors:
            print(f"    Errors: {len(errors)}")
        if warnings:
            print(f"    Warnings: {len(warnings)}")

    print("\n=== SUMMARY ===")
    total_clicks = sum(r.get('clicks', 0) for r in rows) if rows else 0
    total_impr = sum(r.get('impressions', 0) for r in rows) if rows else 0
    print(f"Total clicks: {total_clicks} | Total impressions: {total_impr}")
    print(f"Report period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

if __name__ == '__main__':
    main()

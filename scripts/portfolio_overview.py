#!/usr/bin/env python3
"""
Weekly portfolio overview: Search Console + GA4 for all verified sites.
Outputs structured JSON for the cron agent to analyze.
"""
import json, sys
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build

TOKEN_FILE = '/home/hermes/.hermes/google_token.json'

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
    sc = build('searchconsole', 'v1', credentials=creds)

    end_date = datetime.now() - timedelta(days=2)
    start_date = end_date - timedelta(days=7)
    prev_start = start_date - timedelta(days=7)

    # 1. Get all siteOwner sites
    sites_resp = sc.sites().list().execute()
    owner_sites = [s['siteUrl'] for s in sites_resp.get('siteEntry', []) if s.get('permissionLevel') == 'siteOwner']
    print(f"Found {len(owner_sites)} verified sites\n", flush=True)

    # 2. Search Console data per site
    sc_data = []
    for site_url in owner_sites:
        try:
            body = {
                'startDate': start_date.strftime('%Y-%m-%d'),
                'endDate': end_date.strftime('%Y-%m-%d'),
                'dimensions': [],
                'aggregationType': 'auto'
            }
            result = sc.searchanalytics().query(siteUrl=site_url, body=body).execute()
            rows = result.get('rows', [])
            current = rows[0] if rows else {}

            # Previous period for trend
            body_prev = {**body, 'startDate': prev_start.strftime('%Y-%m-%d'), 'endDate': start_date.strftime('%Y-%m-%d')}
            result_prev = sc.searchanalytics().query(siteUrl=site_url, body=body_prev).execute()
            rows_prev = result_prev.get('rows', [])
            previous = rows_prev[0] if rows_prev else {}

            clicks = current.get('clicks', 0)
            impressions = current.get('impressions', 0)
            ctr = current.get('ctr', 0) * 100
            position = current.get('position', 0)
            prev_clicks = previous.get('clicks', 0)
            prev_impressions = previous.get('impressions', 0)

            click_delta = ((clicks - prev_clicks) / prev_clicks * 100) if prev_clicks > 0 else 0
            impr_delta = ((impressions - prev_impressions) / prev_impressions * 100) if prev_impressions > 0 else 0

            sc_data.append({
                'site': site_url,
                'clicks': clicks,
                'impressions': impressions,
                'ctr': round(ctr, 2),
                'position': round(position, 1),
                'prev_clicks': prev_clicks,
                'prev_impressions': prev_impressions,
                'click_delta_pct': round(click_delta, 1),
                'impr_delta_pct': round(impr_delta, 1),
            })
        except Exception as e:
            sc_data.append({'site': site_url, 'error': str(e)[:120]})

    # Sort by clicks descending
    sc_data.sort(key=lambda x: x.get('clicks', 0), reverse=True)

    # 3. GA4 data for top sites
    print("=== SEARCH CONSOLE — TOP SITES BY CLICKS ===", flush=True)
    print(f"Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')} (vs previous week)\n", flush=True)
    print(f"{'Site':<50} {'Clicks':>8} {'Impr':>10} {'CTR':>7} {'Pos':>6} {'Δ Clicks':>10}", flush=True)
    print("-" * 95, flush=True)

    for s in sc_data[:20]:
        if 'error' in s:
            print(f"{s['site'][:50]:<50} ERROR: {s['error'][:40]}", flush=True)
            continue
        delta = s['click_delta_pct']
        delta_str = f"{'+' if delta > 0 else ''}{delta}%"
        print(f"{s['site'][:50]:<50} {s['clicks']:>8} {s['impressions']:>10} {s['ctr']:>6.1f}% {s['position']:>6.1f} {delta_str:>10}", flush=True)

    # 4. GA4 traffic for all properties
    print("\n\n=== GOOGLE ANALYTICS — TOP PROPERTIES BY USERS ===", flush=True)
    try:
        admin = build('analyticsadmin', 'v1alpha', credentials=creds)
        ga_data = []
        accounts = admin.accounts().list().execute()

        for acct in accounts.get('accounts', []):
            try:
                props = admin.properties().list(filter=f"parent:{acct['name']}").execute()
                for prop in props.get('properties', []):
                    pid = prop['name'].split('/')[-1]
                    try:
                        from google.analytics.data_v1beta import BetaAnalyticsDataClient
                        from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric, Dimension
                        # Use REST instead — simpler
                        analytics_data = build('analyticsdata', 'v1beta', credentials=creds)
                        report = analytics_data.properties().runReport(
                            property=f"properties/{pid}",
                            body={
                                'dateRanges': [{'startDate': start_date.strftime('%Y-%m-%d'), 'endDate': end_date.strftime('%Y-%m-%d')}],
                                'metrics': [{'name': 'totalUsers'}, {'name': 'screenPageViews'}, {'name': 'averageSessionDuration'}, {'name': 'bounceRate'}],
                                'dimensions': [],
                            }
                        ).execute()

                        rows = report.get('rows', [])
                        if rows:
                            vals = rows[0].get('metricValues', [])
                            users = int(vals[0].get('intValue', '0') or '0') if vals else 0
                            pv = int(vals[1].get('intValue', '0') or '0') if vals else 0
                            avg_sess = float(vals[2].get('doubleValue', '0') or '0') if len(vals) > 2 else 0
                            bounce = float(vals[3].get('doubleValue', '0') or '0') if len(vals) > 3 else 0

                            ga_data.append({
                                'property': prop.get('displayName', pid),
                                'property_id': pid,
                                'account': acct.get('displayName', ''),
                                'users': users,
                                'pageviews': pv,
                                'avg_session_sec': round(avg_sess, 1),
                                'bounce_rate': round(bounce * 100, 1) if bounce <= 1 else round(bounce, 1),
                            })
                    except Exception:
                        pass
            except Exception:
                pass

        ga_data.sort(key=lambda x: x.get('users', 0), reverse=True)
        print(f"{'Property':<35} {'Account':<25} {'Users':>8} {'PV':>10} {'AvgSess':>8} {'Bounce':>8}", flush=True)
        print("-" * 100, flush=True)
        for g in ga_data[:25]:
            print(f"{g['property'][:35]:<35} {g['account'][:25]:<25} {g['users']:>8} {g['pageviews']:>10} {g['avg_session_sec']:>7.0f}s {g['bounce_rate']:>7.1f}%", flush=True)

        # Save GA data for reference
        with open('/tmp/ga4_weekly_data.json', 'w') as f:
            json.dump(ga_data, f)

    except Exception as e:
        print(f"GA4 error: {e}", flush=True)
        ga_data = []

    # 5. Biggest movers (positive and negative trends)
    print("\n\n=== BIGGEST MOVERS (week over week) ===", flush=True)
    movers = [s for s in sc_data if 'error' not in s and s.get('prev_impressions', 0) > 10]
    movers.sort(key=lambda x: x.get('click_delta_pct', 0))
    print("--- Declining ---", flush=True)
    for s in movers[:5]:
        print(f"  {s['click_delta_pct']:>+7.1f}% clicks | {s['site'][:50]} ({s['clicks']} clicks)", flush=True)
    movers.sort(key=lambda x: x.get('click_delta_pct', 0), reverse=True)
    print("--- Growing ---", flush=True)
    for s in movers[:5]:
        print(f"  {s['click_delta_pct']:>+7.1f}% clicks | {s['site'][:50]} ({s['clicks']} clicks)", flush=True)

    # 6. Sites with zero clicks (opportunities)
    print("\n\n=== ZERO-CLICK SITES (opportunities) ===", flush=True)
    zero_click = [s for s in sc_data if 'error' not in s and s.get('clicks', 0) == 0 and s.get('impressions', 0) > 0]
    for s in zero_click[:10]:
        print(f"  {s['impressions']:>6} impr, pos {s['position']:.1f} | {s['site'][:50]}", flush=True)

    no_data = [s for s in sc_data if 'error' not in s and s.get('clicks', 0) == 0 and s.get('impressions', 0) == 0]
    print(f"\n  {len(no_data)} sites with zero impressions (not indexed or no traffic)")

    # Save all data
    with open('/tmp/sc_weekly_data.json', 'w') as f:
        json.dump({'sc_data': sc_data, 'ga_data': ga_data, 'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"}, f)

    print(f"\n\nData saved to /tmp/sc_weekly_data.json and /tmp/ga4_weekly_data.json", flush=True)
    print(f"Total: {len(sc_data)} SC sites, {len(ga_data)} GA4 properties", flush=True)

if __name__ == '__main__':
    main()

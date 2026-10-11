"""Before the iOS build: make sure Apple knows the app ID, and that the app exists in App Store Connect.
Uses the App Store Connect API key from the GitHub secrets."""
import json, os, sys, time, urllib.request, urllib.error
import jwt  # PyJWT

BUNDLE = 'com.pipsplayhouse.app'
key = open(os.environ['ASC_KEY_PATH']).read()
now = int(time.time())
token = jwt.encode({'iss': os.environ['ASC_ISSUER_ID'], 'iat': now, 'exp': now + 900, 'aud': 'appstoreconnect-v1'},
                   key, algorithm='ES256', headers={'kid': os.environ['ASC_KEY_ID'], 'typ': 'JWT'})

def api(method, path, body=None):
    req = urllib.request.Request('https://api.appstoreconnect.apple.com' + path, method=method,
                                 data=json.dumps(body).encode() if body else None,
                                 headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        print(f'App Store Connect said {e.code} for {method} {path}:', e.read().decode()[:800]); sys.exit(1)

ids = [b for b in api('GET', f'/v1/bundleIds?filter[identifier]={BUNDLE}')['data'] if b['attributes']['identifier'] == BUNDLE]
if not ids:
    ids = [api('POST', '/v1/bundleIds', {'data': {'type': 'bundleIds', 'attributes': {'identifier': BUNDLE, 'name': 'Pips Playhouse', 'platform': 'IOS'}}})['data']]
    print('Registered the app ID', BUNDLE)
else:
    print('App ID already registered:', BUNDLE)
# the app ID prefix (seedId) is the team ID, which the signing step needs
team = ids[0]['attributes'].get('seedId', '')
print('Team ID:', team)
if os.environ.get('GITHUB_OUTPUT'):
    with open(os.environ['GITHUB_OUTPUT'], 'a') as f: f.write(f'team={team}\n')
apps = api('GET', f'/v1/apps?filter[bundleId]={BUNDLE}')['data']
if not apps:
    print(f"::error::The app isn't in App Store Connect yet. In App Store Connect choose Apps, then the + button, then New App, and pick the bundle ID {BUNDLE}. Then run this build again.")
    sys.exit(1)
print('Found the app in App Store Connect:', apps[0]['attributes']['name'])

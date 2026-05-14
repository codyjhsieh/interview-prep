# interview-prep-sync — Cloudflare Worker

Tiny backend for cross-device sync of the interview-prep dashboard.
Pairs devices via short code; stores one JSON blob per code in
Cloudflare KV. ~75 lines of Worker code, free tier covers everything.

## One-time deploy (5 minutes)

```bash
# 1. Install + log in
npm i -g wrangler
wrangler login

# 2. Create the KV namespace and copy the printed id into wrangler.toml
cd cloudflare
wrangler kv namespace create STATE
#   → "id": "abc123..."   ← paste that into wrangler.toml
#   (also note the "preview_id" — only needed if you run `wrangler dev`)

# 3. Deploy
wrangler deploy
#   → prints your URL, e.g.
#   https://interview-prep-sync.<your-subdomain>.workers.dev
```

## Wire it into the frontend

Open `js/sync.js` and replace the placeholder URL on the
`SYNC_ENDPOINT` line with the URL `wrangler deploy` printed. Commit +
push; GitHub Pages picks it up automatically.

## Cost

- Free tier: 100,000 requests/day, 100,000 KV reads/day, 1,000 writes/day
- One user × two devices polling every 5s ≈ 17,280 reads/day (well under)
- KV writes happen only on saves; even heavy use stays under 1k/day

## Routes

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/` | liveness probe (returns `"interview-prep-sync ok"`) |
| `GET` | `/state/:code` | 404 if unknown; else the stored state JSON |
| `PUT` | `/state/:code` | store the body as state (max 1 MB; 90-day TTL) |
| `OPTIONS` | `/*` | CORS preflight |

## Security model

The pairing code IS the credential. Anyone who knows the code can read
or overwrite that state. Codes are 8 characters from a 31-symbol
alphabet (~40 bits of entropy); even at Cloudflare's free-tier
request budget, brute-forcing a single code is infeasible.

If a device is lost or compromised, generate a new code on a trusted
device (overwrites the old key; the old code's KV entry expires in
90 days regardless).

## Local dev

```bash
wrangler dev    # tunnel to your local worker, hits real KV preview
```

## Tear-down

```bash
wrangler delete                    # removes the deployed worker
wrangler kv namespace delete STATE # deletes all state blobs
```

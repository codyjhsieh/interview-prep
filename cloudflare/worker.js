// Cloudflare Worker — cross-device sync backend for the interview-prep
// dashboard. Pairs devices by short code; KV stores the JSON blob keyed
// by that code. CORS-permissive on purpose: the code IS the credential,
// anyone who knows it can read/write that state (which is what lets the
// second device adopt the first device's progress).
//
// Routes:
//   OPTIONS /*               → CORS preflight
//   GET     /state/:code     → 200 with state JSON, or 404 if unknown
//   PUT     /state/:code     → store state JSON (max 1 MB, 90-day TTL)
//   GET     /                → liveness probe ("sync ok")
//
// Bindings (set up in wrangler.toml):
//   STATE — KV namespace storing one JSON blob per code

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const MAX_BODY = 1_048_576; // 1 MB — generous; our state is ~50-150 KB
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(req.url);

    // Liveness
    if (url.pathname === '/' || url.pathname === '') {
      return new Response('interview-prep-sync ok', {
        headers: { 'Content-Type': 'text/plain', ...CORS },
      });
    }

    // /state/:code
    const m = url.pathname.match(/^\/state\/([A-Z0-9-]{4,20})$/i);
    if (!m) return json({ error: 'not-found' }, 404);
    const code = m[1].toUpperCase().replace(/-/g, '');

    if (req.method === 'GET') {
      const value = await env.STATE.get(code);
      if (!value) return json({ error: 'not-found' }, 404);
      return new Response(value, {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    if (req.method === 'PUT') {
      const len = parseInt(req.headers.get('content-length') || '0', 10);
      if (len > MAX_BODY) return json({ error: 'too-large' }, 413);
      const body = await req.text();
      if (body.length > MAX_BODY) return json({ error: 'too-large' }, 413);
      let parsed;
      try { parsed = JSON.parse(body); }
      catch { return json({ error: 'invalid-json' }, 400); }
      // Read-modify-write: stamp a server-issued monotonic _seq tied
      // to the code. Replaces the previous reliance on each device's
      // local Date.now() (subject to clock drift). _seq always
      // increments — even on concurrent PUTs the survivor's _seq is
      // strictly > the prior stored _seq.
      let prevSeq = 0;
      const existing = await env.STATE.get(code);
      if (existing) {
        try { prevSeq = (JSON.parse(existing)._seq || 0); }
        catch { prevSeq = 0; }
      }
      parsed._seq = prevSeq + 1;
      parsed._sv  = Date.now();          // server-stamped wall-clock (diagnostic)
      const stamped = JSON.stringify(parsed);
      await env.STATE.put(code, stamped, { expirationTtl: TTL_SECONDS });
      return json({ ok: true, savedAt: parsed._sv, _seq: parsed._seq });
    }

    return json({ error: 'method-not-allowed' }, 405);
  },
};

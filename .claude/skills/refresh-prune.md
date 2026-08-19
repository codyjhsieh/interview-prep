---
name: refresh-prune
description: Optional stage — re-fetch every company board and remove jobs whose posting IDs no longer exist. Never touches unfetchable companies.
---

# refresh-prune

Not part of `/refresh-jobs`. Run when dead links accumulate.

```bash
node scripts/check-dead.js           # report only → /tmp/dead_links.json
node scripts/check-dead.js --prune   # actually remove
```

## Guardrails

- Prunes only when: company board fetched OK AND posting ID absent from live board AND full board returned. Any one of those failing → leave alone.
- Companies whose board fetch failed are untouched.
- Follow `--prune` with `/refresh-ship` to bump cache + push.

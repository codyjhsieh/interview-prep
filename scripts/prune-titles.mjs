#!/usr/bin/env node
/* prune-titles.mjs — remove jobs whose titles belong to a role family this
 * board doesn't track. Companies left with no jobs keep their record.
 *
 *   node scripts/prune-titles.mjs --dry     # report only
 *   node scripts/prune-titles.mjs           # rewrite js/data.js
 *   node scripts/prune-titles.mjs --only mobile,frontend
 *
 * Why this exists: the merge step is additive by design, so tightening
 * TITLE_EXCLUDE in refresh-companies.py stops NEW postings in a family from
 * arriving but never removes the ones already in js/data.js. This is the
 * cleanup half of retiring a role family.
 *
 * The patterns below mirror the matching clauses in TITLE_EXCLUDE
 * (scripts/refresh-companies.py). That file is the source of truth for what
 * a fetch accepts; if you retire another family there, add it here too and
 * run this once. Deliberately narrower than re-running the whole filter:
 * that would also drop rows that fail for unrelated historical reasons
 * (managers, security engineers, titles the include-list never covered),
 * which is a different decision from retiring a family. */
'use strict';
import fs from 'node:fs';
import { readCompanies, writeCompanies } from './lib/emit-companies.mjs';

const DATA = 'js/data.js';

// Mirrors the retired-family clauses of TITLE_EXCLUDE.
const FAMILIES = {
  mobile:   /\b(mobile|android|ios|react\s+native)\b/i,
  frontend: /\b(front[\s-]?end|frontend|web\s+developer|ui\s+engineer)\b|\bui\s*\/\s*ux\b|\bengineer,\s*ui\b/i,
  research: /\b(researcher|research\s+scientist|research\s+engineer|quantitative\s+research)\b/i,
  // Sales-facing engineering. The comma form needs its trailing \b or
  // "GTM Systems Engineer, Salesforce" is caught by "sales".
  sales:    /\b(?:pre[\s-]?sales|solutions?|sales)\s+engineer(?:ing)?\b|\b(?:pre[\s-]?sales|solutions?|sales)\s+\w+\s+engineer\b|\bengineer,\s*(?:solutions?|sales|presales)\b|\bsolutions?\s+engineering\b/i,
  // Network operations only. "Software Engineer, Network Services" and
  // "ML Networking" are software roles on the network and must survive, so
  // this matches the role name rather than the word "network".
  network:  /\bnetwork\s+engineer\b|\bnetwork\s*(?:&|and|\/)\s*systems?\s+engineer\b|\b(?:software|systems?)\s+engineer,\s*network\s*$/i,
  // Not \b-wrapped: a trailing \b after "+" never matches, so "Engineer, C++"
  // would survive. Covers "C++", "C/C++", "(C++/Java)".
  cpp:      /c\s?\+\+/i,
  military: /\b(defen[cs]e|military|warfare|weapons?|munitions?|us\s+government|public\s+sector|federal|dod|national\s+security|intelligence\s+community)\b/i,
  embedded: /\b(embedded|firmware|fpga|rtos|bare[\s-]?metal|device\s+driver|microcontroller|mcu|hardware\s+engineer|electrical\s+engineer)\b/i,
  // "token" is deliberately absent — auth tokens and PCI tokenization are not
  // crypto, and including it would drop identity and payments roles.
  crypto:   /\b(crypto|blockchain|web3|stablecoin|defi|onchain|on[\s-]chain|digital\s+assets?|bitcoin|ethereum|nft|smart\s+contract)\b/i,
  // Non-engineering roles that enter through the "forward deployed" clause in
  // TITLE_INCLUDE, plus plural "Interns" which the singular pattern missed.
  nonent:   /\bforward[\s-]deployed\s+(?:\w+\s+)?(?:banker|investor|accountant|strategist|analyst|consultant|designer|architect|specialist|manager|gtm)\b|\binterns?\b|\binternships?\b/i,
};

const RETIRED_CRYPTO = [
  'alchemy',, 'amber-group',, 'anchorage-digital',, 'bastion-fi',, 'beam',
  'bitgo',, 'blackbird-labs',, 'blockchain-com',, 'blockdaemon',, 'blockworks',
  'chainalysis',, 'coinbase',, 'cointracker',, 'conduit',, 'consensys',
  'cryptio',, 'dcg',, 'dune',, 'elliptic',, 'falcon-x',
  'figment',, 'fireblocks',, 'flowdesk',, 'foundry-digital',, 'gemini',
  'goldsky',, 'grayscale',, 'halliday',, 'keyrock',, 'kraken',
  'ledger',, 'moonpay',, 'nansen',, 'notabene',, 'ondofinance',
  'paxos',, 'polymarket',, 'reservoir',, 'ripple',, 'securitize',
  'superstate',, 'taxbit',, 'tenderly',, 'trm-labs',, 'turnkey',
  'uniswap',, 'zero-hash',
];

// Employers retired outright, not by title: nearly every role at a pure-play
// military systems builder is defense work whatever the title says. Their
// records are DELETED rather than kept-but-empty (the rule for retired
// families), because they are gone from CANDIDATES too and can never
// repopulate — an empty record would be permanent dead weight.
const RETIRED_COMPANIES = new Set([
  'anduril', 'shield-ai', 'saronic', 'vannevarlabs',
  // crypto-native employers, retired 2026-08-25 (see refresh-companies.py)
  ...Array.from(new Set(RETIRED_CRYPTO)),
  // ashby/ellipsislabs is Ellipsis LABS, a DeFi protocol company — not the
  // AI code-review tool of the same name. Wrong company and a retired family.
  'ellipsis',
]);

const argv = process.argv.slice(2);
const dry = argv.includes('--dry');
const onlyArg = argv[argv.indexOf('--only') + 1];
const active = argv.includes('--only')
  ? Object.fromEntries(Object.entries(FAMILIES).filter(([k]) => onlyArg.split(',').includes(k)))
  : FAMILIES;

const { src, companies } = readCompanies(DATA);

const classify = (title) => {
  for (const [name, re] of Object.entries(active)) if (re.test(title)) return name;
  return null;
};

const dropped = [];
const emptied = [];
const kept = [];
const retired = [];
for (const c of companies) {
  if (RETIRED_COMPANIES.has(c.id)) {
    retired.push(`${c.name} (${(c.jobs || []).length} jobs)`);
    continue;
  }
  const survivors = [];
  for (const j of (c.jobs || [])) {
    const family = classify(j.title);
    if (family) dropped.push({ family, company: c.name, title: j.title });
    else survivors.push(j);
  }
  c.jobs = survivors;
  // totalRoles is documented as == jobs.length; keep that invariant true.
  if (c.totalRoles !== undefined) c.totalRoles = survivors.length;
  if (!survivors.length) emptied.push(c.name);
  // Keep the record even at zero jobs, matching check-dead.js and what the
  // UI expects: renderCompanies filters to companies with >=1 job, so an
  // empty record is invisible, while deleting it would throw away the
  // hand-written tagline and let a later refresh resurrect the company with
  // blank copy. CANDIDATES still lists them, so they repopulate on their own.
  kept.push(c);
}

const byFamily = {};
for (const d of dropped) (byFamily[d.family] ||= []).push(d);
for (const [family, list] of Object.entries(byFamily)) {
  console.log(`\n${family}: ${list.length} job(s)`);
  for (const d of list) console.log(`   ${d.company} — ${d.title}`);
}
if (retired.length) console.log(`\nretired employers removed: ${retired.join(', ')}`);
console.log(`\n${dropped.length} job(s) dropped, ${kept.length} companies kept`
  + (emptied.length ? `, ${emptied.length} left with no live roles (record retained, card hidden): ${emptied.join(', ')}` : ''));

if (dry) { console.log('\n--dry: js/data.js not modified'); process.exit(0); }
if (!dropped.length) { console.log('nothing to do'); process.exit(0); }

writeCompanies(DATA, src, kept);
console.log(`\nRewrote ${DATA}: ${kept.reduce((n, c) => n + c.jobs.length, 0)} jobs across ${kept.length} companies.`);

/* emit-companies.mjs — the one place that serializes the COMPANIES block back
 * into js/data.js. Lifted verbatim out of apply-descriptions.mjs so every tool
 * that rewrites the block (descriptions, title prune) produces byte-identical
 * formatting. merge-additive.js and check-dead.js still carry their own CommonJS
 * copies; if you touch the format here, mirror it there. */
'use strict';
import fs from 'node:fs';

export function readCompanies(dataPath) {
  const src = fs.readFileSync(dataPath, 'utf8');
  const cStart = src.indexOf('const COMPANIES = [');
  const cOpen = src.indexOf('[', cStart);
  const cEnd = src.indexOf('\n];', cOpen);
  return { src, companies: eval('(' + src.slice(cOpen, cEnd + 2) + ')') };
}

const esc = (s) => JSON.stringify(s).slice(1, -1).replace(/—/g, '\\u2014');
const emitJob = (j) => {
  let s = `      { title:"${esc(j.title)}", url:"${esc(j.url)}"`;
  if (j.level) s += `, level:"${esc(j.level)}"`;
  if (j.added) s += `, added:"${esc(j.added)}"`;
  if (j.posted) s += `, posted:"${esc(j.posted)}"`;
  if (j.desc) s += `, desc:"${esc(j.desc)}"`;
  if (j.descRaw) s += `, descRaw:"${esc(j.descRaw)}"`;
  return s + ' }';
};
export const emitCompany = (c) => {
  const L = [];
  L.push(`  { id:${JSON.stringify(c.id)}, name:"${esc(c.name)}", vertical:${JSON.stringify(c.vertical)},`);
  if (c.sub !== undefined) L.push(`    sub:"${esc(c.sub)}",`);
  if (c.tagline !== undefined) L.push(`    tagline:"${esc(c.tagline)}",`);
  const meta = [];
  if (c.stage !== undefined) meta.push(`stage:"${esc(c.stage)}"`);
  if (c.raised !== undefined) meta.push(`raised:"${esc(c.raised)}"`);
  if (c.lead !== undefined) meta.push(`lead:"${esc(c.lead)}"`);
  if (meta.length) L.push('    ' + meta.join(', ') + ',');
  if (c.badges !== undefined) L.push(`    badges:${JSON.stringify(c.badges)},`);
  if (c.totalRoles !== undefined) L.push(`    totalRoles:${c.totalRoles},`);
  if (c.notes !== undefined) L.push(`    notes:"${esc(c.notes)}",`);
  L.push('    jobs:[');
  L.push((c.jobs || []).map(emitJob).join(',\n'));
  L.push('    ] }');
  return L.join('\n');
};

export function writeCompanies(dataPath, src, companies) {
  const block = 'const COMPANIES = [\n' + companies.map(emitCompany).join(',\n') + '\n];';
  const a = src.indexOf('const COMPANIES = [');
  const e = src.indexOf('\n];', src.indexOf('[', a)) + 3;
  fs.writeFileSync(dataPath, src.slice(0, a) + block + src.slice(e));
}

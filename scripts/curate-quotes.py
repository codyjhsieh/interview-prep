import json, re
from pathlib import Path
Q = Path('/Users/codyhsieh/Desktop/Coding/InterviewPrep/js/quotes.js')
s = Q.read_text()
r = json.load(open('/tmp/quote-verification.json'))
TR = {q['text'] for b in ('partial','not-found','unsourced','fetch-failed') for q in r[b]}
def end_str(st, p):
    p += 1
    while p < len(st):
        c = st[p]
        if c == '\\': p += 2; continue
        if c == "'": return p + 1
        p += 1
    return -1
L = s.split('\n')
K = [True]*len(L)
i = 0
nc = nm = 0
miss = set(TR)
while True:
    idx = s.find('\n  add(', i)
    if idx == -1: break
    cs = idx + 1
    q = s.find("'", cs)
    qe = end_str(s, q)
    if qe == -1: break
    t = s[q+1:qe-1].replace("\\'", "'").replace("\\\\", "\\").replace('\\"', '"')
    d = 1; j = qe
    while j < len(s) and d > 0:
        c = s[j]
        if c == "'":
            ke = end_str(s, j)
            if ke == -1: break
            j = ke; continue
        if c == '(': d += 1
        elif c == ')': d -= 1
        j += 1
    if j < len(s) and s[j] == ';': j += 1
    # DO NOT advance past the trailing \n here — the next find('\n  add(',
    # j) needs that \n to anchor the next call. We count the call's
    # trailing \n for line-removal purposes via a separate j_end_line.
    j_end_line = j
    if j_end_line < len(s) and s[j_end_line] == '\n': j_end_line += 1
    nc += 1
    if t in TR:
        nm += 1
        miss.discard(t)
        a = s.count('\n', 0, cs)
        b = s.count('\n', 0, j_end_line)
        for k in range(a, b):
            K[k] = False
    i = j     # keep the trailing \n in scope for the next find()
ns = '\n'.join(x for kk,x in zip(K,L) if kk)
ns = re.sub(r'\n{4,}', '\n\n\n', ns)
Q.write_text(ns)
print('calls=%d marked=%d still_missing=%d' % (nc, nm, len(miss)))
for m in sorted(miss)[:6]:
    print('  ??', m[:90])
print('bytes=%d' % len(ns))

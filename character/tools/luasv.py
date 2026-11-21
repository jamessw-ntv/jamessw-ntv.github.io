"""Minimal WoW SavedVariables (Lua table) parser. Read-only."""
import re, sys

TOK = re.compile(r'''\s*(?:--\[\[.*?\]\]|--[^\n]*|
    (?P<str>"(?:\\.|[^"\\])*")|
    (?P<num>-?(?:0x[0-9a-fA-F]+|\d+\.?\d*(?:[eE][-+]?\d+)?))|
    (?P<name>[A-Za-z_][A-Za-z0-9_]*)|
    (?P<sym>[{}\[\]=,;]))''', re.X | re.S)

def tokens(s):
    pos = 0
    n = len(s)
    while pos < n:
        m = TOK.match(s, pos)
        if not m:
            if s[pos:].strip() == '':
                return
            raise ValueError(f"bad char at {pos}: {s[pos:pos+30]!r}")
        pos = m.end()
        for k in ('str', 'num', 'name', 'sym'):
            v = m.group(k)
            if v is not None:
                yield k, v
                break

def unq(s):
    return bytes(s[1:-1], 'utf-8').decode('unicode_escape').encode('latin-1').decode('utf-8', 'replace')

class P:
    def __init__(self, s):
        self.t = list(tokens(s)); self.i = 0
    def peek(self):
        return self.t[self.i] if self.i < len(self.t) else (None, None)
    def nxt(self):
        v = self.t[self.i]; self.i += 1; return v
    def value(self):
        k, v = self.nxt()
        if k == 'str': return unq(v)
        if k == 'num': return int(v, 16) if v.lower().startswith('0x') else (float(v) if any(c in v for c in '.eE') else int(v))
        if k == 'name':
            return {'true': True, 'false': False, 'nil': None}.get(v, v)
        if v == '{': return self.table()
        raise ValueError(v)
    def table(self):
        d = {}; idx = 1
        while True:
            k, v = self.peek()
            if v == '}': self.nxt(); return d
            if v == '[':
                self.nxt(); key = self.value(); self.nxt()  # ]
                self.nxt()  # =
                d[key] = self.value()
            elif k == 'name' and self.t[self.i+1][1] == '=':
                self.nxt(); self.nxt(); d[v] = self.value()
            else:
                d[idx] = self.value(); idx += 1
            if self.peek()[1] in (',', ';'): self.nxt()
    def top(self):
        out = {}
        while self.i < len(self.t):
            _, name = self.nxt(); self.nxt()
            out[name] = self.value()
        return out

def load(path):
    with open(path, encoding='utf-8', errors='replace') as f:
        return P(f.read()).top()

if __name__ == '__main__':
    import json
    d = load(sys.argv[1])
    print(json.dumps({k: (type(v).__name__, list(v)[:30] if isinstance(v, dict) else v) for k, v in d.items()}, default=str, indent=1)[:5000])

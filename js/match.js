// Turn regexes and phrase lists into spans: {start, end, lens, reason}.
export function regexSpans(text, re, lens, reason) {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const rx = new RegExp(re.source, flags);
  const out = [];
  let m;
  while ((m = rx.exec(text))) {
    if (m[0].length === 0) { rx.lastIndex++; continue; }
    const r = typeof reason === 'function' ? reason(m) : reason;
    out.push({ start: m.index, end: m.index + m[0].length, lens, reason: r });
  }
  return out;
}

const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Whole-word, case-insensitive phrase matching. Longer phrases win.
export function phraseSpans(text, phrases, lens, reasonFn) {
  const list = [...new Set(phrases.map(p => p.trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  if (!list.length) return [];
  const body = list.map(p => escRe(p).replace(/\s+/g, '\\s+').replace(/'/g, "['’]")).join('|');
  const rx = new RegExp(`(?<![\\w'’])(?:${body})(?![\\w'’])`, 'gi');
  const lookup = new Map(list.map(p => [p.toLowerCase().replace(/\s+/g, ' ').replace(/’/g, "'"), p]));
  return regexSpans(text, rx, lens, m => {
    const key = m[0].toLowerCase().replace(/\s+/g, ' ').replace(/’/g, "'");
    return reasonFn(lookup.get(key) ?? m[0]);
  });
}

const norm = c => (/[‘’ʼ]/.test(c) ? "'" : /[“”]/.test(c) ? '"' : /[—–]/.test(c) ? '-' : c.toLowerCase());

// Find a quote in text: exact first, then tolerant of curly quotes, dash styles, case and whitespace runs.
export function findQuote(text, quote, from = 0) {
  const q = quote.trim(); if (!q) return null;
  const i = text.indexOf(q, from);
  if (i !== -1) return { start: i, end: i + q.length };
  // Build a normalized copy of the text with an index map back to the original.
  let n = '', map = [];
  for (let k = 0; k < text.length; k++) {
    if (/\s/.test(text[k])) { if (n.endsWith(' ')) continue; n += ' '; } else n += norm(text[k]);
    map.push(k);
  }
  const nq = [...q.replace(/\s+/g, ' ')].map(norm).join('');
  const j = n.indexOf(nq);
  if (j === -1) return null;
  return { start: map[j], end: map[j + nq.length - 1] + 1 };
}

export function sentenceAround(text, start, end) {
  let a = start, b = end;
  while (a > 0 && !/[.!?\n]/.test(text[a - 1])) a--;
  while (a < start && /\s/.test(text[a])) a++;
  while (b < text.length && !/[.!?\n]/.test(text[b - 1] ?? '')) b++;
  while (b < text.length && /[.!?"”’)]/.test(text[b])) b++;
  return { start: a, end: b };
}

export function paragraphAround(text, start, end) {
  const a = text.lastIndexOf('\n\n', start); const b = text.indexOf('\n\n', end);
  return text.slice(a === -1 ? 0 : a + 2, b === -1 ? text.length : b);
}

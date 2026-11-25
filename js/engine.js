// Merge spans from many lenses into non-overlapping segments that cover the text.
export function buildSegments(text, spans) {
  const cuts = new Set([0, text.length]);
  for (const s of spans) { cuts.add(Math.max(0, s.start)); cuts.add(Math.min(text.length, s.end)); }
  const pts = [...cuts].sort((a, b) => a - b);
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (a === b) continue;
    segs.push({ start: a, end: b, text: text.slice(a, b), spans: spans.filter(s => s.start <= a && s.end >= b) });
  }
  return segs;
}

export const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Flags runs of 3+ consecutive sentences whose lengths are all within ±20% of the run's mean.
export function sentences(text) {
  return [...text.matchAll(/[^.!?\n]+[.!?]+["'”’)]*/g)].map(m => {
    const lead = m[0].length - m[0].trimStart().length;
    return { start: m.index + lead, end: m.index + m[0].length, words: m[0].trim().split(/\s+/).length };
  }).filter(s => s.words >= 3);
}
export default {
  id: 'rhythm', name: 'Rhythm', color: '#d0457a',
  source: { label: 'sentence-length variation', url: 'https://en.wikipedia.org/wiki/Burstiness' },
  run(text) {
    const s = sentences(text), hit = new Set();
    for (let i = 0; i + 2 < s.length; i++) {
      const win = s.slice(i, i + 3), mean = win.reduce((a, b) => a + b.words, 0) / 3;
      if (win.every(x => Math.abs(x.words - mean) <= mean * 0.2)) win.forEach((_, k) => hit.add(i + k));
    }
    return [...hit].map(i => ({ start: s[i].start, end: s[i].end, lens: 'rhythm',
      reason: `Rhythm: ${s[i].words} words, in a run of sentences of near-equal length. Uniform rhythm is a common machine signature.` }));
  },
};

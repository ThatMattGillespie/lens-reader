import test from 'node:test'; import assert from 'node:assert/strict';
import { findQuote, sentenceAround } from '../js/quote.js';
test('exact match', () => { assert.deepEqual(findQuote('abc def ghi', 'def'), {start:4,end:7}); });
test('tolerant match', () => {
  const src = "Well, it's  not just X.";
  const r = findQuote(src, 'it’s not just');
  assert.equal(src.slice(r.start, r.end), "it's  not just");
});
test('missing returns null', () => { assert.equal(findQuote('abc', 'zzz'), null); });
test('sentenceAround finds enclosing sentence', () => {
  const t = 'One here. Two is the target sentence! Three.';
  const s = sentenceAround(t, 12, 15);
  assert.equal(t.slice(s.start, s.end), 'Two is the target sentence!');
});

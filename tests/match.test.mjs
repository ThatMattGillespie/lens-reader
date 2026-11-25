import test from 'node:test'; import assert from 'node:assert/strict';
import { regexSpans, phraseSpans } from '../js/match.js';
test('empty match advances', () => { const s = regexSpans('abc', /x*/, 'l', 'r'); assert.equal(s.length, 0); });
test('regex spans offsets', () => { assert.deepEqual(regexSpans('a delve b', /delve/i, 'l', 'r').map(s=>[s.start,s.end]), [[2,7]]); });
test('phraseSpans respects word boundaries', () => {
  const s = phraseSpans('the keyboard is key here', ['key'], 'l', p => 'w:'+p);
  assert.deepEqual(s.map(x=>[x.start,x.end,x.reason]), [[16,19,'w:key']]);
});
test('phraseSpans prefers longest phrase', () => {
  const s = phraseSpans('a deep dive now', ['deep','deep dive'], 'l', p=>p);
  assert.deepEqual(s.map(x=>x.reason), ['deep dive']);
});

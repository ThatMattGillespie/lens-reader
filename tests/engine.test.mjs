import test from 'node:test'; import assert from 'node:assert/strict';
import { buildSegments, escapeHtml } from '../js/engine.js';
test('partial overlaps split', () => {
  const t = 'abcdefghijklmnopqrst';
  const segs = buildSegments(t, [{start:0,end:10,lens:'a',reason:'x'},{start:5,end:15,lens:'b',reason:'y'}]);
  assert.deepEqual(segs.map(s=>[s.start,s.end,s.spans.map(x=>x.lens).join('')]), [[0,5,'a'],[5,10,'ab'],[10,15,'b'],[15,20,'']]);
  assert.equal(segs.map(s=>s.text).join(''), t);
});
test('escapes html', () => { assert.equal(escapeHtml('<script>&"'), '&lt;script&gt;&amp;&quot;'); });
test('no spans gives one segment', () => { assert.equal(buildSegments('hello', []).length, 1); });
import { dedupe } from '../js/engine.js';
test('dedupe merges same-lens same-range spans', () => {
  const d = dedupe([{start:0,end:3,lens:'a',reason:'x'},{start:0,end:3,lens:'a',reason:'x'},{start:0,end:3,lens:'a',reason:'y'},{start:0,end:3,lens:'b',reason:'x'}]);
  assert.equal(d.length, 2); assert.equal(d[0].reason, 'x\ny');
});

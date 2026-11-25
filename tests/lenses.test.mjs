import test from 'node:test'; import assert from 'node:assert/strict';
import humanizer from '../js/lenses/humanizer.js';
import wikipedia from '../js/lenses/wikipedia.js';
import slopscore from '../js/lenses/slopscore.js';
import defluff from '../js/lenses/defluff.js';
import slopwords from '../js/lenses/slopwords.js';
import rhythm from '../js/lenses/rhythm.js';
const has = (spans, text, frag) => spans.some(s => text.slice(s.start, s.end).includes(frag));

test('humanizer flags isn\'t merely ... it\'s', () => {
  const t = "This isn't merely a trend; it's a testament to craft.";
  const s = humanizer.run(t);
  assert.ok(has(s, t, "isn't merely"));
  assert.ok(s.every(x => x.reason.startsWith('Humanizer §')));
});
test('wikipedia flags serves as a, not em dash', () => {
  const t = 'The hall serves as a venue — locals love it.';
  const s = wikipedia.run(t);
  assert.ok(has(s, t, 'serves as a'));
  assert.ok(!s.some(x => t.slice(x.start, x.end).includes('—')));
});
test('slopscore trigram maps to exact offsets', async () => {
  await slopscore.load({
    fetchJson: async u => u.includes('trigram') ? [['took deep breath']] : [['gaze']],
    importModule: async () => ({ STAGE1_REGEXES: { RE_X: /not just\b[^.]{1,40}?,\s*but\b/gi } }),
  });
  const t = 'She took a deep breath. It was not just fun, but art.';
  const s = slopscore.run(t);
  const tri = s.find(x => x.reason.includes('trigram'));
  assert.equal(t.slice(tri.start, tri.end), 'took a deep breath');
  assert.ok(s.some(x => x.reason.includes('RE_X')));
});
test('defluff uses lexicon and patterns', async () => {
  await defluff.load({ fetchJson: async u => u.includes('lexicon')
    ? { entries: [{ pattern: 'at the end of the day', category: 'cliche' }] }
    : { patterns: [{ name: 'p1', regex: '\\bnot\\s+just\\b', category: 'rhetoric', note: 'nj' }] } });
  const t = 'At the end of the day it is not just code.';
  const s = defluff.run(t);
  assert.ok(has(s, t, 'At the end of the day')); assert.ok(has(s, t, 'not just'));
});
test('slopwords uses ranked lists', async () => {
  await slopwords.load({ fetchJson: async u => u.includes('phrases') ? [['couldn\'t help but feel', 9]] : [['crucial', 0.1], ['strategic', 0.05]] });
  const t = 'A crucial plan. I couldn\'t help but feel it.';
  const s = slopwords.run(t);
  assert.ok(has(s, t, 'crucial')); assert.ok(has(s, t, "couldn't help but feel"));
});
test('rhythm flags even run, not varied', () => {
  const ten = 'one two three four five six seven eight nine ten.';
  const even = [ten, ten, ten].join(' ');
  assert.ok(rhythm.run(even).length > 0);
  const varied = 'one two three four. ' + 'a b c d e f g h i j k l. ' + Array(25).fill('w').join(' ') + '.';
  assert.equal(rhythm.run(varied).length, 0);
});

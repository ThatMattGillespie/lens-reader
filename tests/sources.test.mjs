import test from 'node:test'; import assert from 'node:assert/strict';
import { loadLens } from '../js/sources.js';
test('failed load isolates lens', async () => {
  const bad = { id: 'bad', load: async () => { throw new Error('404'); } };
  const good = { id: 'good', load: async () => {} };
  const [a, b] = await Promise.all([loadLens(bad), loadLens(good)]);
  assert.equal(a.ok, false); assert.match(a.error, /404/); assert.equal(b.ok, true);
  assert.equal(bad.status, 'unavailable'); assert.equal(good.status, 'ready');
});

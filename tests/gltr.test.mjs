import test from 'node:test'; import assert from 'node:assert/strict';
import { tokenOffsets, bucketOf } from '../js/lenses/gltr.js';
test('token offsets follow byte-level pieces', () => {
  assert.deepEqual(tokenOffsets('Hi there', ['Hi', ' there']), [{start:0,end:2},{start:2,end:8}]);
});
test('partial utf8 pieces merge', () => {
  const o = tokenOffsets('a é', ['a', ' �', '�'].map((p,i)=> i===2 ? '' : p));
  assert.equal(o.length, 3);
});
test('buckets', () => { assert.deepEqual([0,9,10,99,100,999,1000].map(bucketOf), [0,0,1,1,2,2,3]); });

import test from 'node:test'; import assert from 'node:assert/strict';
import { encryptKey, decryptKey, ITERATIONS } from '../js/vault.js';
const PW = 'correct horse battery staple and then some';
test('round trip', async () => {
  const v = await encryptKey('sk-ant-secret', PW, 1000);
  assert.equal(await decryptKey(v, PW), 'sk-ant-secret');
});
test('wrong password rejects', async () => {
  const v = await encryptKey('sk-ant-secret', PW, 1000);
  await assert.rejects(decryptKey(v, PW + 'x'), /password/i);
});
test('vault never contains the plain key', async () => {
  const v = await encryptKey('sk-ant-secret', PW, 1000);
  assert.ok(!JSON.stringify(v).includes('sk-ant'));
  assert.equal(v.v, 1); assert.equal(v.kdf, 'PBKDF2-SHA256');
});
test('fresh salt and iv each time', async () => {
  const a = await encryptKey('k', PW, 1000), b = await encryptKey('k', PW, 1000);
  assert.notEqual(a.salt, b.salt); assert.notEqual(a.iv, b.iv);
});
test('default iterations meet OWASP floor', () => { assert.ok(ITERATIONS >= 600000); });

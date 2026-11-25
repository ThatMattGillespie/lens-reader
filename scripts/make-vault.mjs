// Run locally: node scripts/make-vault.mjs
// Prompts for your Anthropic API key and a password (input hidden), then writes vault.json.
// Only the encrypted vault.json is published. The key and password are never written to disk.
import { writeFileSync } from 'node:fs';
import { encryptKey } from '../js/vault.js';

function ask(q) {
  return new Promise(resolve => {
    process.stdout.write(q);
    const stdin = process.stdin; let s = '';
    stdin.setRawMode?.(true); stdin.resume(); stdin.setEncoding('utf8');
    const on = ch => {
      if (ch === '\u0003') process.exit(1);
      if (ch === '\r' || ch === '\n' || ch === '\u0004') { stdin.setRawMode?.(false); stdin.pause(); stdin.off('data', on); process.stdout.write('\n'); resolve(s); return; }
      if (ch === '\u007f') s = s.slice(0, -1); else s += ch;
    };
    stdin.on('data', on);
  });
}

const key = (await ask('Anthropic API key (hidden): ')).trim();
if (!key.startsWith('sk-ant-')) { console.error('That does not look like an Anthropic key (sk-ant-…).'); process.exit(1); }
const pw = await ask('Password, 20+ characters (hidden): ');
if (pw.length < 20) { console.error('Use at least 20 characters. A long random passphrase is what keeps the public vault safe.'); process.exit(1); }
if (await ask('Repeat password (hidden): ') !== pw) { console.error('Passwords did not match.'); process.exit(1); }
console.log('Encrypting (takes a second)…');
writeFileSync(new URL('../vault.json', import.meta.url), JSON.stringify(await encryptKey(key, pw), null, 2) + '\n');
console.log('Wrote vault.json. Commit and push it to share the key with anyone who has the password.');

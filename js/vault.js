// Password-encrypted API key. PBKDF2-SHA256 (600k iterations) derives an AES-256-GCM key.
// The vault file is public; its safety rests entirely on the password being long and random.
export const ITERATIONS = 600000;
const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function derive(password, salt, iter) {
  const base = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptKey(apiKey, password, iter = ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, await derive(password, salt, iter), enc.encode(apiKey));
  return { v: 1, kdf: 'PBKDF2-SHA256', iter, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}

export async function decryptKey(vault, password) {
  if (vault?.v !== 1) throw new Error('Unknown vault format.');
  try {
    const key = await derive(password, unb64(vault.salt), vault.iter);
    return dec.decode(await subtle.decrypt({ name: 'AES-GCM', iv: unb64(vault.iv) }, key, unb64(vault.ct)));
  } catch { throw new Error('Wrong password.'); }
}

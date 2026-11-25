// Claude lens: runs on demand with the user's key; results cached per exact text.
import { claudeFlag } from '../claude.js';
let cache = { text: null, spans: [] };
export default {
  id: 'claude', name: 'Claude', color: '#e0782b', lazy: true, needsKey: true,
  source: { label: 'Claude Opus 5.5 (your key)', url: 'https://docs.claude.com' },
  cached: text => (cache.text === text ? cache.spans : null),
  async runAsync(text, _p, key) {
    if (cache.text === text) return cache.spans;
    const spans = await claudeFlag(key, text);
    cache = { text, spans };
    return spans;
  },
};

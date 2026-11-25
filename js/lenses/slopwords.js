// Ranked lists: slop-forensics essay-domain words (top 300) and antislop-sampler phrases (top 400).
import { phraseSpans } from '../match.js';
import { SRC } from '../sources.js';
let words = [], phrases = [];
export default {
  id: 'slopwords', name: 'Slop lists', color: '#f5a300',
  source: { label: 'slop-forensics + antislop', url: 'https://github.com/sam-paech/slop-forensics' },
  async load({ fetchJson }) {
    const [w, p] = await Promise.all([
      fetchJson(`${SRC.forensics}/results_by_domain/essays/slop_lists/slop_list_by_freq.json`),
      fetchJson(`${SRC.antislop}/slop_phrases_2025-04-07.json`),
    ]);
    words = w.slice(0, 300).map((x, i) => [x[0], i + 1]).filter(([x]) => x.length > 3);
    phrases = p.slice(0, 400).map((x, i) => [x[0], i + 1]);
  },
  run(text) {
    const wr = new Map(words), pr = new Map(phrases);
    return [
      ...phraseSpans(text, words.map(x => x[0]), 'slopwords', w => `slop-forensics: "${w}" ranks #${wr.get(w)} among words LLM essays overuse.`),
      ...phraseSpans(text, phrases.map(x => x[0]), 'slopwords', p => `antislop: "${p}" ranks #${pr.get(p)} among LLM stock phrases.`),
    ];
  },
};

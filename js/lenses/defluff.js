// ahmedak/defluff (MIT): its curated phrase lexicon and its rhetoric regexes.
import { regexSpans, phraseSpans } from '../match.js';
import { SRC } from '../sources.js';
let lex = [], pats = [];
export default {
  id: 'defluff', name: 'defluff', color: '#10b37d',
  source: { label: 'ahmedak/defluff', url: 'https://github.com/ahmedak/defluff' },
  async load({ fetchJson }) {
    const [l, p] = await Promise.all([
      fetchJson(`${SRC.defluff}/src/defluff/data/lexicon-v1.json`),
      fetchJson(`${SRC.defluff}/src/defluff/data/patterns-v1.json`),
    ]);
    lex = l.entries || []; pats = p.patterns || [];
  },
  run(text) {
    const out = [];
    const byCat = {};
    for (const e of lex) (byCat[e.category] ||= []).push(e.pattern);
    for (const [cat, list] of Object.entries(byCat))
      out.push(...phraseSpans(text, list, 'defluff', p => `defluff/${cat}: "${p}".`));
    for (const p of pats) {
      let re; try { re = new RegExp(p.regex, 'gi'); } catch { continue; }
      out.push(...regexSpans(text, re, 'defluff', `defluff/${p.category}: ${p.note || p.name}.`));
    }
    return out;
  },
};

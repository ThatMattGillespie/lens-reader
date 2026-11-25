// sam-paech/slop-score: its stage-1 contrast regexes, its slop word list, and its stopword-stripped trigram list.
import { regexSpans, phraseSpans } from '../match.js';
import { SRC } from '../sources.js';
const STOP = new Set("a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own s same she should so some such t than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves ll re ve d m o y ain".split(' '));
let words = [], trigrams = new Set(), regexes = {};

// Tokens with offsets; contractions like "couldn't" normalize to "could".
export function contentTokens(text) {
  const out = [];
  for (const m of text.matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)) {
    let w = m[0].toLowerCase().replace(/’/g, "'");
    w = w.replace(/n't$/, '').replace(/'(s|re|ve|ll|d|m)$/, '');
    if (w === 'ca') w = 'can'; if (w === 'wo') w = 'will';
    if (!w || STOP.has(w)) continue;
    out.push({ w, start: m.index, end: m.index + m[0].length });
  }
  return out;
}

export default {
  id: 'slopscore', name: 'slop-score', color: '#8a5cc7',
  source: { label: 'sam-paech/slop-score', url: 'https://github.com/sam-paech/slop-score' },
  async load({ fetchJson, importModule }) {
    const [w, t, mod] = await Promise.all([
      fetchJson(`${SRC.slopscore}/data/slop_list.json`),
      fetchJson(`${SRC.slopscore}/data/slop_list_trigrams.json`),
      importModule(`${SRC.slopscore}/js/regexes-stage1.js`),
    ]);
    words = w.map(x => x[0]);
    trigrams = new Set(t.map(x => x[0]));
    regexes = mod.STAGE1_REGEXES || {};
  },
  run(text) {
    const out = [];
    for (const [name, re] of Object.entries(regexes))
      out.push(...regexSpans(text, re, 'slopscore', `slop-score: not-X-but-Y contrast (${name}).`));
    out.push(...phraseSpans(text, words, 'slopscore', w => `slop-score: "${w}" is over-represented in LLM output vs human writing.`));
    const tk = contentTokens(text);
    for (let i = 0; i + 2 < tk.length; i++) {
      const key = `${tk[i].w} ${tk[i + 1].w} ${tk[i + 2].w}`;
      if (trigrams.has(key)) out.push({ start: tk[i].start, end: tk[i + 2].end, lens: 'slopscore', reason: `slop-score: slop trigram "${key}".` });
    }
    return out;
  },
};

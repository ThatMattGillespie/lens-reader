// Rules hand-written from the "Words to watch" boxes in Wikipedia:Signs of AI writing (CC BY-SA).
// Em dashes are deliberately NOT flagged: the guide now lists them as a historical indicator (2022 to Sept 2026).
import { regexSpans, phraseSpans } from '../match.js';
const P = (cat, list) => ({ cat, list });
const PHRASES = [
  P('Undue emphasis on significance, legacy, and broader trends', ['stands as','serves as a reminder','is a testament','is a reminder','crucial role','pivotal role','vital role','significant role','key role','pivotal moment','key moment','underscores its importance','highlights its significance','underscores its significance','highlights its importance','reflects broader','symbolizing its enduring','symbolizing its lasting','symbolizing its ongoing','contributing to the','setting the stage for','marking the','shaping the','represents a shift','marks a shift','key turning point','evolving landscape','focal point','indelible mark','deeply rooted','forms part of the wider']),
  P('Claims a topic shaped discussions', ['shaped conversations about','shaped discussions about','shaped debate about','shaped debates about']),
  P('Undue emphasis on notability and media coverage', ['independent coverage','media outlets','trade publications','cited in','featured in','profiled in','music outlets','business outlets','tech outlets']),
  P('Undue emphasis on online presence', ['active digital presence','strong digital presence','social media presence']),
  P('Superficial analysis (trailing -ing clause)', ['valuable insights','align with','resonate with','resonates with']),
  P('Vague expression of connection or association', ['in connection with','connected with','in association with','associated with']),
  P('Vague attribution or overgeneralized opinion', ['industry reports','observers have cited','experts argue','some critics argue','several sources','several publications']),
  P('Outline-like conclusion about challenges and future prospects', ['despite these challenges','faces several challenges','challenges and legacy','future outlook']),
  P('Avoidance of basic copulatives ("is"/"are")', ['serves as a','serves as an','stands as a','functions as a','operates as a','boasts a','boasts an','refers to']),
  P('Communication intended for the user', ['I hope this helps','Of course!','Certainly!',"You're absolutely right",'Would you like','is there anything else','let me know','more detailed breakdown','here is a']),
  P('Hedging disclaimer about source availability', ['specific details are limited','details are scarce','not widely available','not widely documented','not widely disclosed','based on available information','in the provided sources','in the available sources']),
  P('Promotional, advertisement-like language (historical, 2023–2025)', ['boasts a','vibrant','profound','exemplifies','commitment to','natural beauty','nestled','in the heart of','groundbreaking','renowned','diverse array']),
  P('Section summary (historical)', ['In summary','In conclusion']),
];
const ERAS = [
  ['2023 to mid-2024 (GPT-4 era)', ['additionally','boasts','bolstered','crucial','delve','emphasizing','enduring','garner','intricate','intricacies','interplay','key','landscape','meticulously','pivotal','underscore','tapestry','testament','valuable','vibrant']],
  ['Mid-2024 to mid-2025 (GPT-4o era)', ['align with','enhance','fostering','highlighting','showcasing']],
  ['Mid-2026 on (GPT-6 era)', ['challenge','clearer','dependable','echoed','foster','leverage','matters','multifaceted','practical','prioritize','quietly','steady','universally']],
];
const REGEX = [
  ['Negative parallelism: not just X, but also Y', /\bnot\s+(?:just|only)\b[^.!?]{1,80}?\bbut(?:\s+also)?\b/gi],
  ['Negative parallelism: not X, but Y', /\bnot\s+[^.!?,;]{1,50},\s*but\s+\w+/gi],
  ['Negative parallelism: Y rather than X', /\b\w+(?:\s+\w+){0,3}\s+rather than\s+\w+/gi],
  ['Rule of three', /\b[\w'’-]+(?:\s[\w'’-]+)?,\s[\w'’-]+(?:\s[\w'’-]+)?,?\s(?:and|or)\s[\w'’-]+(?:\s[\w'’-]+)?\b/g],
  ['Superficial analysis (trailing -ing clause)', /,\s(?:highlighting|underscoring|emphasizing|ensuring|reflecting|symbolizing|contributing to|cultivating|fostering|encompassing|enhancing)\b[^.!?]{0,60}/gi],
  ['Outline-like conclusion: "Despite its..."', /\bDespite (?:its|their|his|her)\b[^.!?]{0,80}\bfaces?\b[^.!?]{0,30}\bchallenges\b/gi],
  ['Has shaped discussions about', /\bha(?:s|ve) shaped (?:conversations|discussions|debates?) (?:about|around|on)\b/gi],
];
export default {
  id: 'wikipedia', name: 'Wikipedia', color: '#2f6bff',
  source: { label: 'Signs of AI writing', url: 'https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing' },
  run(text) {
    const out = [];
    for (const { cat, list } of PHRASES) out.push(...phraseSpans(text, list, 'wikipedia', p => `Wikipedia: ${cat} ("${p}").`));
    for (const [era, list] of ERAS) out.push(...phraseSpans(text, list, 'wikipedia', w => `Wikipedia: AI vocabulary, ${era}: "${w}".`));
    for (const [why, re] of REGEX) out.push(...regexSpans(text, re, 'wikipedia', `Wikipedia: ${why}.`));
    return out;
  },
};

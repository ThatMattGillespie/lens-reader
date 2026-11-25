// Rules hand-written from blader/humanizer SKILL.md (MIT). One rule per § of the skill.
import { regexSpans, phraseSpans } from '../match.js';
const W = list => new RegExp(`\\b(?:${list})\\b`, 'gi');
const NEG = "(?:isn['’]t|aren['’]t|wasn['’]t|weren['’]t|doesn['’]t|don['’]t|(?:is|are|was|were|it['’]s|that['’]s|this is)\\s+not)";
const RULES = [
  [1, 'Not X but Y. The negative half rejects something nobody claimed, which only adds weight.',
    new RegExp(`\\b${NEG}\\s+(?:just|only|merely|simply|about)?[^.!?;]{1,80}?[,;:—–-]\\s*(?:it['’]s|they['’]re|that['’]s|but|it is|rather)\\b`, 'gi')],
  [1, 'Not just X, but Y.', /\bnot\s+(?:just|only|merely)\b[^.!?]{1,80}?\bbut(?:\s+also)?\b/gi],
  [1, 'Split contrast across two sentences ("This does not mean X. It means Y.").',
    /\b(?:this|that|it)\s+(?:doesn['’]t|does not|isn['’]t|is not)\s+(?:mean|about)\b[^.!?]{0,100}[.!?]\s+(?:it|this)\s+(?:means|is)\b/gi],
  [1, 'X rather than Y, the reversed contrast.', /\b\w+(?:\s+\w+){0,4}\s+rather than\s+\w+/gi],
  [2, 'One-line closer that restates the paragraph.', /(?:^|(?<=\n))\s*(?:That|This) (?:is the (?:real )?(?:win|point|lesson|key)|(?:distinction )?matters|changes everything)\.\s*$/gim],
  [2, 'Dramatic prompt to pause.', /\b(?:Let that sink in|Read that again)\b/gi],
  [2, 'Row of fragments ("No X. No Y.").', /(?:\bNo\s+\w+(?:\s\w+)?\.\s+){2,}/g],
  [2, 'Closing verdict sentence.', /(?:^|(?<=[.!?]\s))(?:Overall|Ultimately|In the end),/gm],
  [3, 'Saying dressed as a hidden truth.', W("the real question is|at its core|at the heart of (?:the matter|it)|what really matters|the deeper issue|fundamentally|in reality|is the (?:language|currency|architecture) of")],
  [4, 'Staged run-up before the point.', W("let['’]s (?:dive|delve|explore|break (?:this|it) down|unpack)|here['’]s (?:the thing|what you need to know)|without further ado|the thing is|real talk|let['’]s be honest|heads up|quick note|the (?:hard|real|tricky|new) part is")],
  [4, 'Staged candor.', /(?:^|(?<=[.!?]\s))(?:Honestly\?|Look,)/gm],
  [5, 'Arguing with an objection nobody raised.', W("to be clear|don['’]t get me wrong|I['’]m not saying|this is not to say|this isn['’]t (?:mainly )?about|one might be tempted|a tempting approach would be|you might think")],
  [6, 'Forced triad: three items to sound complete.', /\b[\w'’-]+(?:\s[\w'’-]+)?,\s[\w'’-]+(?:\s[\w'’-]+)?,?\s(?:and|or)\s[\w'’-]+(?:\s[\w'’-]+)?\b/g],
  [8, 'Dash used as a universal connector.', /\s?[—–]\s?|\s--\s/g],
  [9, 'Stacked qualifiers.', W("could potentially|might arguably|may possibly|could possibly|it['’]s (?:also )?possible that|to be fair")],
  [13, 'Inflated significance.', W("stands as a testament|a testament to|pivotal (?:moment|role)|plays? a (?:key|crucial|vital|pivotal) role|marking a (?:new|significant|pivotal)|setting the stage for|reflects a broader|(?:enduring|lasting) legacy|indelible mark|evolving landscape|the future looks bright|exciting times ahead|continues to thrive|a step in the right direction")],
  [22, 'Chatbot residue meant for the asker, not the reader.', W("I hope this helps|great question|certainly!|absolutely!|feel free to|let me know if|happy to help|I['’]d be glad to|would you like me to")],
];
const WORDS12 = ['actually','additionally','align with','bolstered','crucial','deep dive','delve','delves','enduring','enhance','garner','highlights','highlighting','interplay','intricate','intricacies','key','landscape','meticulous','meticulously','pivotal','quietly','robust','showcase','showcases','showcasing','tapestry','testament','underscore','underscores','valuable','vibrant'];

export default {
  id: 'humanizer', name: 'Humanizer', color: '#ff5c39',
  source: { label: 'blader/humanizer', url: 'https://github.com/blader/humanizer' },
  run(text) {
    const out = RULES.flatMap(([n, why, re]) => regexSpans(text, re, 'humanizer', `Humanizer §${n}: ${why}`));
    return out.concat(phraseSpans(text, WORDS12, 'humanizer', w => `Humanizer §12: "${w}" is a stock AI word.`));
  },
};

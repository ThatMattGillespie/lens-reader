# Lens Reader

Paste a long text and read it through several AI-writing lenses at once. Each lens highlights passages in place, and darker highlights mean more lenses agree. There is no overall score.

Click any highlight to see why each lens flagged it. **Suggest alternatives** asks Claude for three rewrites of the sentence and checks each one against your active lenses.

## Lenses

| Lens | Source | License |
|---|---|---|
| Humanizer | [blader/humanizer](https://github.com/blader/humanizer), rules hand-written from SKILL.md | MIT |
| Wikipedia | [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), "Words to watch" lists | CC BY-SA |
| slop-score | [sam-paech/slop-score](https://github.com/sam-paech/slop-score), contrast regexes, word and trigram lists | loaded at runtime |
| defluff | [ahmedak/defluff](https://github.com/ahmedak/defluff), lexicon and patterns | MIT, loaded at runtime |
| Slop lists | [slop-forensics](https://github.com/sam-paech/slop-forensics) essay words and [antislop-sampler](https://github.com/sam-paech/antislop-sampler) phrases | loaded at runtime |
| Rhythm | Runs of near-equal sentence lengths | |
| GLTR | GPT-2 word-rank view, after [GLTR](http://gltr.io), via transformers.js | downloads about 128 MB once |
| Claude | Claude Opus 5.5 with your API key | |

Third-party lists load from jsDelivr, pinned to exact commits (see `js/sources.js`).

## Privacy

Pattern lenses and GLTR run entirely in your browser. Your Anthropic key is stored only in your browser's localStorage and sent only to api.anthropic.com, when you turn on the Claude lens or ask for alternatives.

## Run locally

```
python3 -m http.server 8000
npm test
```

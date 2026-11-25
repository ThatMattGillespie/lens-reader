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

## Sharing your API key with a password

You can let friends use your Anthropic key without giving it to them directly.

1. In the Anthropic Console, create a **separate workspace with a monthly spend limit**, and make a new key in it.
2. Run `node scripts/make-vault.mjs`. It asks for the key and a password (20+ characters; a long random passphrase is best). Neither is shown on screen or saved.
3. Commit and push the `vault.json` it creates. People unlock the key in Settings with the password.

What this protects and what it doesn't:
- `vault.json` is public. It is encrypted with AES-256-GCM using a key derived from your password (PBKDF2-SHA256, 600,000 iterations), so its safety depends on the password's length.
- Anyone who unlocks it has the real key in their browser and could copy it. Share the password only with people you'd trust with the key itself.
- To cut someone off, delete the key in the Console, make a new one, run the script with a new password, and push the new `vault.json`.

## Run locally

```
python3 -m http.server 8000
npm test
```

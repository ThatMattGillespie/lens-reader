# Lens Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static GitHub Pages site where one long text is highlighted in place by any number of toggleable AI-writing lenses, with Claude-generated alternative phrasings that are checked against the active lenses.

**Architecture:** No build step. ES modules in the browser. Each lens is a module exposing the same interface. A pure engine merges spans from the active lenses into segments, and the UI renders those segments. Third-party rule data is fetched at runtime from jsDelivr, pinned to commit SHAs, so nothing is redistributed and slop-score's unclear license isn't a problem. Claude calls go from the browser using the user's key.

**Tech Stack:** Vanilla JS (ES2022 modules), CSS custom properties, `@huggingface/transformers@3.7.5` (GPT-2 for GLTR), Anthropic Messages API over `fetch`, `node --test` for unit tests.

**Spec:** `ai-tell-checker/docs/2026-11-25-multi-lens-design.md`

## Global Constraints
- Static files only. External scripts come only from cdn.jsdelivr.net, at exact versions or commit SHAs.
- Pinned sources: slop-score `289264ab2a0df1358ef81ced3c259610ea709514`, antislop-sampler `0ae330e98fbe6f09351f2d1063a51956378a44b2`, slop-forensics `c313f042620f027d49101da3256bd306b628071a`, defluff `67c0ef388bf688194ab0667275d4898b4222e7d3`.
- Claude model `claude-opus-5-5`, effort `medium`, with server-side fallback (`anthropic-beta: server-side-fallback-2026-07-01`, `fallbacks: "default"`). Check `stop_reason === "refusal"`.
- The key is kept in localStorage under `lr_key`, and every storage access is wrapped in try/catch.
- There is no overall score or verdict anywhere in the UI.
- Light and dark themes. Works at 390px width with no horizontal scroll.
- Copy avoids em dashes and "not X but Y" phrasing, per Matt's style rule.

## Review Focus
1. **Overlapping spans from different lenses with partial overlap:** segments must split at every boundary and each segment lists every covering lens. Test: `engine.test.mjs › partial overlaps split`.
2. **Zero-length or global regexes that never advance:** a regex that matches the empty string must not hang. Test: `match.test.mjs › empty match advances`.
3. **Claude quotes with curly quotes or different whitespace from the source:** they must still map back to the text. Test: `quote.test.mjs › tolerant match`.
4. **A source CDN fetch fails:** that lens shows "unavailable" and the other lenses still run. Test: `sources.test.mjs › failed load isolates lens`.
5. **HTML in pasted text** (`<script>`, `&`): it must render as text, never as markup. Test: `engine.test.mjs › escapes html`.

---

### Task 1: Span engine and rendering model

**Files:** Create `js/engine.js`, `js/match.js`, `tests/engine.test.mjs`, `tests/match.test.mjs`, `package.json` (`{"type":"module","scripts":{"test":"node --test tests/"}}`)

**Interfaces:**
- Produces: `Span = {start:number, end:number, lens:string, reason:string}`
- `regexSpans(text, re: RegExp, lens, reason) → Span[]` (forces the `g` flag and advances past empty matches)
- `phraseSpans(text, phrases: string[], lens, reasonFn) → Span[]` (whole-word, case-insensitive, longest phrase first)
- `buildSegments(text, spans) → {start,end,text,spans:Span[]}[]` covering the whole text
- `escapeHtml(s) → string`

- [ ] Tests: partial overlaps split (spans [0,10) a and [5,15) b give 4 segments, and the middle one carries both); empty match advances; escapes html; phraseSpans respects word boundaries ("key" not inside "keyboard").
- [ ] Implement, run `npm test`, then commit.

### Task 2: Pattern lenses

**Files:** Create `js/lenses/humanizer.js`, `wikipedia.js`, `defluff.js`, `slopscore.js`, `slopwords.js`, `rhythm.js`, `js/sources.js`, `tests/lenses.test.mjs`, `tests/sources.test.mjs`

**Interfaces:**
- Each lens module default-exports `{id, name, source:{label,url}, color, load?: async(fetchJson, importModule) => void, run(text) → Span[]}`
- `sources.js`: `loadLens(lens) → Promise<{ok:boolean, error?:string}>`. A rejection marks only that lens as unavailable.
- **humanizer** (hand-written from SKILL.md, MIT, one rule per §): §1 not-X-but-Y and split contrasts, §2 closers and fragment rows, §3 sayings, §4 staged run-ups, §5 arguing with no one, §6 triads, §8 dashes, §9 stacked qualifiers, §12 word list, §13 inflated significance, plus chatbot residue. Reasons are prefixed `Humanizer §N:`.
- **wikipedia** (hand-written from the "Words to watch" boxes): significance, "has shaped discussions", notability and media coverage, superficial -ing analyses, vague connection, vague attribution, challenges and future outlook, AI vocabulary with era labels, copulative avoidance ("serves as", "boasts", "features"), negative parallelism, rule of three, collaborative communication, hedging disclaimers, puffery. It does **not** flag em dashes, because Wikipedia now lists them as a historical indicator (2022 to September 2026), and the reason text says so.
- **defluff:** fetch `src/defluff/data/patterns-v1.json` and `lexicon-v1.json`, include opt-in patterns, and give reasons as `defluff/<category>: <note or pattern>`.
- **slopscore:** import `js/regexes-stage1.js` (`STAGE1_REGEXES`), fetch `data/slop_list.json` and `data/slop_list_trigrams.json`. Trigrams are matched on a stopword-stripped token stream mapped back to character offsets, using slop-score's stopword idea with a fixed English list in the module.
- **slopwords:** slop-forensics `results_by_domain/essays/slop_lists/slop_list_by_freq.json` (top 300), plus antislop `slop_phrases_2025-04-07.json` (top 400 phrases).
- **rhythm:** split into sentences, and flag each run of 3 or more consecutive sentences whose word counts are all within ±20% of the run's mean.
- [ ] Tests run each lens on fixed fixtures with the data injected, no network: humanizer flags "isn't merely a trend; it's"; wikipedia flags "serves as a" and does not flag "—"; slopscore trigram "took a deep breath" maps to the exact offsets; rhythm flags 3 sentences of 10 words and not 4, 12 and 25; a failed load isolates the lens.
- [ ] Implement, run tests, commit.

### Task 3: GLTR lens

**Files:** Create `js/lenses/gltr.js`

**Interfaces:**
- Default-exports a lens with `kind:"wash"`. `run(text, onProgress) → Promise<{start,end,bucket:0|1|2|3}[]>`, where the buckets are rank <10, <100, <1000 and the rest.
- Loads `Xenova/gpt2` via `AutoTokenizer` and `AutoModelForCausalLM` from `https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5`. Text goes in 512-token windows with 64 tokens of overlap. Each token's rank is computed from the previous position's logits. Token offsets are mapped back to characters by decoding cumulatively.
- [ ] Verify by hand in the browser: the sample text produces mostly green (top 10) and the progress bar reaches 100%. Commit.

### Task 4: Claude client

**Files:** Create `js/claude.js`, `js/quote.js`, `tests/quote.test.mjs`

**Interfaces:**
- `findQuote(text, quote, fromIndex=0) → {start,end}|null`: exact match first, then a match that normalizes curly quotes, dashes and runs of whitespace.
- `claudeFlag(key, text, voice?) → Promise<Span[] & {unmatched:string[]}>`, using structured output schema `{items:[{quote:string, reason:string}]}`
- `claudeAlternatives(key, {sentence, paragraph, reasons, voice, avoid?:string[]}) → Promise<string[]>` (3 items)
- The lens wrapper `js/lenses/claude.js` caches results by text hash.
- [ ] Test the tolerant match: the quote `it’s not just` is found in source text `it's  not just`. Implement, commit.

### Task 5: UI

**Files:** Create `index.html`, `css/styles.css`, `js/app.js`

- Paste view, then **Read**, which switches to the reading view. **Edit text** switches back.
- A toolbar of lens chips: swatch, name, hit count, and "loading…" or "unavailable" states. GLTR and Claude chips start their run on first toggle.
- Segments render as `<span class="seg">`. The active lenses' underlines stack as inset box-shadows, 2px each, in toolbar order. A segment covered by 2 or more lenses gets `data-agree="2|3|4+"`, which darkens the background. When GLTR is on, its wash takes the background and agreement switches to a 1px outline.
- Popover on hover, focus or tap: one row per lens (swatch, lens name, reason, source link), then **Suggest alternatives**.
- Alternatives: 3 cards, each with "passes" or "caught by: lens names", run against the active pattern lenses. If all 3 fail, retry once with `avoid` set to the failing reasons. **Use this** replaces the sentence and re-runs the lenses. **Undo** sits in the toolbar.
- Settings drawer: API key, voice sample, and links to the Pangram and GPTZero free checkers.
- [ ] Visual check in Chrome at 1440 and 390, in light and dark, with no console errors. Commit.

### Task 6: Publish prep
- README with the lens sources and licenses, and a note that the key stays in the browser. `.nojekyll`. Leave `git init` and the commits local; ask Matt before creating the GitHub repo.

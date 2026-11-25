import { buildSegments, escapeHtml, dedupe } from './engine.js';
import { loadLens } from './sources.js';
import { sentenceAround, paragraphAround } from './quote.js';
import { claudeAlternatives } from './claude.js';
import { decryptKey } from './vault.js';
import humanizer from './lenses/humanizer.js';
import wikipedia from './lenses/wikipedia.js';
import slopscore from './lenses/slopscore.js';
import defluff from './lenses/defluff.js';
import slopwords from './lenses/slopwords.js';
import rhythm from './lenses/rhythm.js';
import gltr from './lenses/gltr.js';
import claude from './lenses/claude.js';

const LENSES = [humanizer, wikipedia, slopscore, defluff, slopwords, rhythm, claude, gltr];
const byId = Object.fromEntries(LENSES.map(l => [l.id, l]));
const $ = id => document.getElementById(id);
const store = {
  get: k => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: k => { try { localStorage.removeItem(k); } catch {} },
};
const session = {
  get: k => { try { return sessionStorage.getItem(k) ?? ''; } catch { return ''; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
  del: k => { try { sessionStorage.removeItem(k); } catch {} },
};
// The person's own key wins; otherwise a shared key unlocked from vault.json (this tab, or remembered).
let sharedKey = '';
const getKey = () => store.get('lr_key') || sharedKey || session.get('lr_shared') || store.get('lr_shared');
let vault = null;
fetch('vault.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(v => { vault = v; $('sharedBox').hidden = !v; updateShared(); }).catch(() => {});
function updateShared() {
  const on = !!(sharedKey || session.get('lr_shared') || store.get('lr_shared'));
  if (on) $('sharedStatus').textContent = 'Shared key unlocked.';
  $('unlockRow').hidden = on; $('lock').hidden = !on;
}

const state = {
  text: '',
  on: new Set(JSON.parse(store.get('lr_on') || '["humanizer","wikipedia"]')),
  asyncResults: {},      // lensId -> { text, spans }
  busy: new Set(),
  undo: [],
  segs: [],
};

const SAMPLE = `In today's fast-paced digital world, brand design is not just about aesthetics — it's about creating meaningful experiences that resonate with audiences. Studies show that users form opinions within milliseconds, which underscores the pivotal role of first impressions.

Let's dive into what makes a visual identity truly memorable. At its core, consistency, clarity, and creativity form a rich tapestry that elevates every touchpoint. It's important to note that this isn't merely a trend; it's a testament to the enduring power of thoughtful craft.

The studio serves as a vibrant hub for collaboration, fostering a culture of experimentation across disciplines. Experts argue that teams who embrace this approach see stronger results. Despite these challenges, the practice continues to thrive, setting the stage for a new era of design thinking.

Ultimately, the future looks bright for organizations willing to invest in a holistic approach. I hope this helps!`;

// ---------- rendering ----------
function activeSpans() {
  const spans = [];
  for (const id of state.on) {
    const lens = byId[id];
    if (lens.load && lens.status !== 'ready' && !lens.runAsync) continue;
    if (lens.runAsync) {
      const r = state.asyncResults[id];
      if (r && r.text === state.text) spans.push(...r.spans.map(s => id === 'gltr' ? { ...s, lens: 'gltr', reason: '' } : s));
    } else spans.push(...lens.run(state.text));
  }
  return dedupe(spans);
}

function render() {
  const spans = activeSpans();
  const counts = {};
  for (const s of spans) if (s.lens !== 'gltr') counts[s.lens] = (counts[s.lens] || 0) + 1;
  renderChips(counts);
  state.segs = buildSegments(state.text, spans);
  const order = LENSES.filter(l => state.on.has(l.id) && l.kind !== 'wash').map(l => l.id);
  let html = '';
  state.segs.forEach((seg, i) => {
    const hits = seg.spans.filter(s => s.lens !== 'gltr');
    const g = seg.spans.find(s => s.lens === 'gltr');
    const lensIds = order.filter(id => hits.some(h => h.lens === id));
    if (!hits.length && !g) { html += escapeHtml(seg.text); return; }
    const shadow = lensIds.map((id, k) => `inset 0 -${2 * (k + 1)}px 0 ${byId[id].color}`).join(',');
    const attrs = [`class="seg"`, `data-i="${i}"`];
    if (g) attrs.push(`data-g="${g.bucket}"`);
    if (hits.length) {
      attrs.push('data-hit', 'tabindex="0"', 'role="button"', `aria-label="Flagged by ${lensIds.map(id => byId[id].name).join(', ')}"`);
      if (lensIds.length >= 2) attrs.push(`data-agree="${Math.min(4, lensIds.length)}"`);
      attrs.push(`style="box-shadow:${shadow};padding-bottom:${2 * lensIds.length}px"`);
    }
    html += `<span ${attrs.join(' ')}>${escapeHtml(seg.text)}</span>`;
  });
  const el = $('text');
  el.innerHTML = html;
  el.classList.toggle('gltr-on', state.on.has('gltr') && !!state.asyncResults.gltr);
  $('gltrLegend').hidden = !(state.on.has('gltr') && state.asyncResults.gltr?.text === state.text);
  renderNotes();
  $('undo').disabled = !state.undo.length;
}

function renderChips(counts) {
  $('chips').innerHTML = LENSES.map(l => {
    const on = state.on.has(l.id);
    let n = '';
    if (state.busy.has(l.id) || l.status === 'loading') n = 'loading…';
    else if (l.status === 'unavailable') n = 'unavailable';
    else if (on && l.kind === 'wash') n = state.asyncResults.gltr?.text === state.text ? 'on' : '';
    else if (on && l.needsKey && state.asyncResults[l.id] && state.asyncResults[l.id].text !== state.text) n = 'text changed, click to re-run';
    else if (on) n = String(counts[l.id] || 0);
    return `<button class="chip" style="--c:${l.color}" aria-pressed="${on}" data-id="${l.id}" data-status="${l.status || ''}" title="${escapeHtml(l.source.label)}${l.error ? ': ' + escapeHtml(l.error) : ''}">
      <span class="sw"></span>${l.name}${n ? ` <span class="n">${n}</span>` : ''}</button>`;
  }).join('');
}

function renderNotes() {
  const r = state.asyncResults.claude;
  const um = state.on.has('claude') && r?.text === state.text ? r.spans.unmatched || [] : [];
  $('notes').innerHTML = um.length ? `<p>Claude also flagged passages it couldn't quote exactly:</p><ul>${um.map(u => `<li>${escapeHtml(u)}</li>`).join('')}</ul>` : '';
}

function progress(frac, label) {
  const p = $('progress');
  if (frac == null) { p.hidden = true; return; }
  p.hidden = false;
  p.querySelector('.bar').style.setProperty('--p', `${Math.round(frac * 100)}%`);
  p.querySelector('span').textContent = label;
}

// ---------- lenses ----------
async function ensureLoaded(lens) {
  if (lens.status === 'ready') return true;
  if (lens.id === 'gltr') {
    lens.status = 'loading'; render();
    try { await lens.load(null, f => progress(f, `Downloading GPT-2 (about 128 MB, once) ${Math.round(f * 100)}%`)); lens.status = 'ready'; }
    catch (e) { lens.status = 'unavailable'; lens.error = String(e.message || e); }
    progress(null); return lens.status === 'ready';
  }
  const r = await loadLens(lens);
  return r.ok;
}

async function runAsyncLens(lens) {
  if (state.asyncResults[lens.id]?.text === state.text) return;
  const key = getKey();
  if (lens.needsKey && !key) { state.on.delete(lens.id); openSettings('Unlock the shared key or add your own to use the Claude lens.'); return; }
  const text = state.text;
  state.busy.add(lens.id); render();
  try {
    const spans = await lens.runAsync(text, f => progress(f, lens.id === 'gltr' ? `Ranking words ${Math.round(f * 100)}%` : ''), key);
    state.asyncResults[lens.id] = { text, spans };
  } catch (e) {
    lens.error = String(e.message || e);
    alertInline(`${lens.name}: ${lens.error}`);
    state.on.delete(lens.id);
  }
  state.busy.delete(lens.id); progress(null); render();
}

async function toggle(id) {
  const lens = byId[id];
  const stale = lens.needsKey && state.on.has(id) && state.asyncResults[id] && state.asyncResults[id].text !== state.text;
  if (stale) { await runAsyncLens(lens); return; }
  if (state.on.has(id)) state.on.delete(id); else state.on.add(id);
  store.set('lr_on', JSON.stringify([...state.on].filter(x => !byId[x].lazy)));
  render();
  if (!state.on.has(id)) return;
  if (!(await ensureLoaded(lens))) { render(); return; }
  if (lens.runAsync) await runAsyncLens(lens); else render();
}

function alertInline(msg) {
  $('notes').insertAdjacentHTML('afterbegin', `<p class="err" role="alert">${escapeHtml(msg)}</p>`);
}

// ---------- popover ----------
const pop = $('pop');
let popSeg = null;

function openPop(el) {
  const seg = state.segs[+el.dataset.i];
  if (!seg) return;
  document.querySelectorAll('.seg.active').forEach(x => x.classList.remove('active'));
  el.classList.add('active'); popSeg = seg;
  const hits = seg.spans.filter(s => s.lens !== 'gltr');
  const rows = LENSES.filter(l => hits.some(h => h.lens === l.id)).map(l => {
    const reasons = hits.filter(h => h.lens === l.id).flatMap(h => h.reason.split('\n'))
      .map(r => r.startsWith(l.name + ': ') ? r.slice(l.name.length + 2) : r.startsWith(l.name + ' ') ? r.slice(l.name.length + 1) : r);
    return `<div class="reason" style="--c:${l.color}"><span class="sw"></span><div><b>${l.name}</b><br>${[...new Set(reasons)].map(escapeHtml).join('<br>')}<br><a href="${l.source.url}" target="_blank" rel="noopener">${escapeHtml(l.source.label)}</a></div></div>`;
  }).join('');
  pop.innerHTML = `${rows}<div class="row"><button class="btn sm" id="suggest">Suggest alternatives</button></div><div class="alts" id="alts"></div>`;
  pop.hidden = false;
  const r = el.getBoundingClientRect();
  const left = Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 16);
  pop.style.left = `${Math.max(16, left)}px`;
  pop.style.top = `${window.scrollY + r.bottom + 8}px`;
  $('suggest').onclick = () => suggest(seg);
}
function closePop() { pop.hidden = true; popSeg = null; document.querySelectorAll('.seg.active').forEach(x => x.classList.remove('active')); }

function patternCheck(sentence) {
  const caught = [];
  for (const id of state.on) {
    const l = byId[id];
    if (l.runAsync || l.status === 'unavailable' || l.id === 'rhythm') continue;
    const s = l.run(sentence);
    if (s.length) caught.push({ lens: l, reasons: [...new Set(s.map(x => x.reason))] });
  }
  return caught;
}

async function suggest(seg) {
  const key = getKey();
  if (!key) { openSettings('Unlock the shared key or add your own to get alternatives.'); return; }
  const range = sentenceAround(state.text, seg.start, seg.end);
  const sentence = state.text.slice(range.start, range.end);
  const reasons = [...new Set(seg.spans.filter(s => s.lens !== 'gltr').flatMap(s => s.reason.split('\n')))];
  const box = $('alts'); $('suggest').disabled = true;
  box.innerHTML = '<p class="hint">Asking Claude for three rewrites…</p>';
  const ask = avoid => claudeAlternatives(key, { sentence, paragraph: paragraphAround(state.text, range.start, range.end), reasons, voice: store.get('lr_voice'), avoid });
  try {
    let alts = (await ask([])).map(a => ({ a, caught: patternCheck(a) }));
    if (alts.length && alts.every(x => x.caught.length)) {
      box.innerHTML = '<p class="hint">All three were caught by a lens. Trying once more…</p>';
      const avoid = [...new Set(alts.flatMap(x => x.caught.flatMap(c => c.reasons)))];
      alts = (await ask(avoid)).map(a => ({ a, caught: patternCheck(a) }));
    }
    box.innerHTML = alts.map((x, i) => `<div class="alt"><div>${escapeHtml(x.a)}</div><div class="meta">${x.caught.length
      ? `<span>Caught by ${x.caught.map(c => c.lens.name).join(', ')}</span>` : '<span class="pass">Passes active lenses</span>'}
      <button class="btn sm ghost" data-use="${i}">Use this</button></div></div>`).join('');
    box.querySelectorAll('[data-use]').forEach(b => b.onclick = () => replace(range, alts[+b.dataset.use].a));
  } catch (e) {
    box.innerHTML = `<p class="err">${escapeHtml(e.message || String(e))}</p>`;
  }
  const s = $('suggest'); if (s) s.disabled = false;
}

function replace(range, alt) {
  state.undo.push(state.text);
  state.text = state.text.slice(0, range.start) + alt + state.text.slice(range.end);
  afterTextChange();
}
function afterTextChange() {
  closePop(); render();
  // GLTR is free to re-run; Claude bills the user's key, so it waits for a click.
  if (state.on.has('gltr') && gltr.status === 'ready') runAsyncLens(gltr);
}

// ---------- settings ----------
function openSettings(msg) {
  $('key').value = store.get('lr_key'); $('voice').value = store.get('lr_voice');
  const d = $('settings');
  $('keyHint').textContent = msg || 'Stored only in this browser and sent only to api.anthropic.com. Used by the Claude lens and by Suggest alternatives.';
  d.showModal(); render();
}

// ---------- wiring ----------
$('read').onclick = async () => {
  state.text = $('src').value.replace(/\r\n/g, '\n');
  if (!state.text.trim()) { $('src').focus(); return; }
  $('editor').hidden = true; $('reader').hidden = false;
  render();
  await Promise.all([...state.on].map(id => ensureLoaded(byId[id])));
  render();
};
$('sample').onclick = () => { $('src').value = SAMPLE; $('read').click(); };
$('edit').onclick = () => { closePop(); $('src').value = state.text; $('reader').hidden = true; $('editor').hidden = false; $('src').focus(); };
$('undo').onclick = () => { if (state.undo.length) { state.text = state.undo.pop(); afterTextChange(); } };
$('chips').onclick = e => { const b = e.target.closest('.chip'); if (b) toggle(b.dataset.id); };
$('openSettings').onclick = () => openSettings();
$('key').oninput = e => store.set('lr_key', e.target.value.trim());
$('voice').oninput = e => store.set('lr_voice', e.target.value);
$('forget').onclick = () => { store.del('lr_key'); $('key').value = ''; };
$('unlock').onclick = async e => {
  e.preventDefault();
  const pw = $('pw').value; if (!pw || !vault) return;
  $('unlock').disabled = true; $('sharedStatus').textContent = 'Unlocking…';
  try {
    sharedKey = await decryptKey(vault, pw);
    if ($('remember').checked) store.set('lr_shared', sharedKey); else session.set('lr_shared', sharedKey);
    $('pw').value = '';
  } catch (err) { $('sharedStatus').textContent = err.message; }
  $('unlock').disabled = false; updateShared();
};
$('lock').onclick = e => { e.preventDefault(); sharedKey = ''; session.del('lr_shared'); store.del('lr_shared'); $('sharedStatus').textContent = 'Shared key locked.'; updateShared(); };

$('text').addEventListener('click', e => { const s = e.target.closest('.seg[data-hit]'); if (s) { e.stopPropagation(); openPop(s); } });
$('text').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.seg[data-hit]')) { e.preventDefault(); openPop(e.target); } });
let hoverT;
$('text').addEventListener('mouseover', e => {
  const s = e.target.closest('.seg[data-hit]');
  if (!s || !matchMedia('(hover: hover)').matches || ($('alts')?.childElementCount)) return;
  clearTimeout(hoverT); hoverT = setTimeout(() => openPop(s), 250);
});
$('text').addEventListener('mouseout', () => clearTimeout(hoverT));
document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) closePop(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) closePop(); });

// Pinned third-party sources, loaded at runtime from jsDelivr (nothing redistributed).
const GH = 'https://cdn.jsdelivr.net/gh';
export const SRC = {
  slopscore: `${GH}/sam-paech/slop-score@289264ab2a0df1358ef81ced3c259610ea709514`,
  antislop: `${GH}/sam-paech/antislop-sampler@0ae330e98fbe6f09351f2d1063a51956378a44b2`,
  forensics: `${GH}/sam-paech/slop-forensics@c313f042620f027d49101da3256bd306b628071a`,
  defluff: `${GH}/ahmedak/defluff@67c0ef388bf688194ab0667275d4898b4222e7d3`,
};

export const defaultCtx = {
  fetchJson: async url => { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} loading ${url}`); return r.json(); },
  importModule: url => import(url),
};

// Loads one lens. A failure marks only that lens unavailable.
export async function loadLens(lens, ctx = defaultCtx) {
  if (!lens.load) { lens.status = 'ready'; return { ok: true }; }
  lens.status = 'loading';
  try { await lens.load(ctx); lens.status = 'ready'; return { ok: true }; }
  catch (e) { lens.status = 'unavailable'; lens.error = String(e.message || e); return { ok: false, error: lens.error }; }
}

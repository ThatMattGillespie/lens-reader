// GLTR-style lens: GPT-2 (quantized, ~128 MB, downloaded once and cached by the browser)
// ranks each token among the model's predictions. Buckets: 0 = top 10, 1 = top 100, 2 = top 1000, 3 = rarer.
const TJS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1';
const WIN = 512, OVERLAP = 64;
let tok, model, T;

// Map token ids to character ranges by decoding piece by piece (merging partial UTF-8 pieces).
export function tokenOffsets(text, pieces) {
  const out = []; let pos = 0, buf = '', from = 0;
  for (let i = 0; i < pieces.length; i++) {
    buf += pieces[i];
    if (buf.includes('�') && i < pieces.length - 1) continue;
    const at = text.indexOf(buf, pos);
    const start = at === -1 ? pos : at, end = at === -1 ? pos : at + buf.length;
    for (let k = from; k <= i; k++) out[k] = { start, end };
    pos = end; buf = ''; from = i + 1;
  }
  return out;
}
export const bucketOf = r => (r < 10 ? 0 : r < 100 ? 1 : r < 1000 ? 2 : 3);

export default {
  id: 'gltr', name: 'GLTR', kind: 'wash', color: '#14b3a3', lazy: true,
  source: { label: 'GLTR (Gehrmann et al.) via GPT-2', url: 'http://gltr.io' },
  async load(_ctx, onProgress = () => {}) {
    if (model) return;
    T = await import(TJS);
    const progress_callback = p => { if (p.status === 'progress' && p.file?.endsWith('.onnx')) onProgress(p.progress / 100, 'download'); };
    tok = await T.AutoTokenizer.from_pretrained('Xenova/gpt2');
    model = await T.AutoModelForCausalLM.from_pretrained('Xenova/gpt2', { dtype: 'q8', model_file_name: 'decoder_model_merged', progress_callback });
  },
  async runAsync(text, onProgress = () => {}) {
    const ids = Array.from(tok.encode(text));
    const pieces = ids.map(id => tok.decode([id], { skip_special_tokens: false, clean_up_tokenization_spaces: false }));
    const offs = tokenOffsets(text, pieces);
    const ranks = new Array(ids.length).fill(null);
    for (let start = 0; start < ids.length; start += WIN - OVERLAP) {
      const end = Math.min(ids.length, start + WIN), chunk = ids.slice(start, end);
      const input_ids = new T.Tensor('int64', BigInt64Array.from(chunk.map(BigInt)), [1, chunk.length]);
      const attention_mask = new T.Tensor('int64', new BigInt64Array(chunk.length).fill(1n), [1, chunk.length]);
      const { logits } = await model({ input_ids, attention_mask });
      const V = logits.dims[2], data = logits.data;
      for (let j = (start === 0 ? 1 : OVERLAP); j < chunk.length; j++) {
        const row = (j - 1) * V, target = data[row + chunk[j]];
        let r = 0; for (let v = 0; v < V; v++) if (data[row + v] > target) r++;
        ranks[start + j] = r;
      }
      onProgress(end / ids.length, 'analyze');
      await new Promise(res => setTimeout(res));
      if (end === ids.length) break;
    }
    const out = [];
    for (let i = 0; i < ids.length; i++) {
      if (ranks[i] == null || !offs[i]) continue;
      let { start, end } = offs[i];
      while (start < end && /\s/.test(text[start])) start++;
      if (start < end) out.push({ start, end, bucket: bucketOf(ranks[i]), rank: ranks[i] });
    }
    return out;
  },
};

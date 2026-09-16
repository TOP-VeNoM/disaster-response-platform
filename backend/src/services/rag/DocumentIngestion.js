const logger = require('../../utils/logger');

let embedderPromise = null;

/**
 * Lazily loads the local embedding model (all-MiniLM-L6-v2, 384-dim, ~90MB).
 * This runs in-process via @xenova/transformers (a WASM port of transformers.js)
 * so RAG works without needing a paid embeddings API — Groq itself doesn't
 * serve embeddings. First call downloads and caches the model (~30-60s);
 * subsequent calls are fast.
 *
 * NOTE: @xenova/transformers has an official successor, @huggingface/transformers
 * (same author, rebranded under HF's npm org in v3+), which resolves an
 * npm-audit-flagged protobufjs/sharp vulnerability chain in this package's
 * dependencies. It was evaluated and deliberately NOT adopted here: v4 of
 * the successor package hard-imports onnxruntime-node as a mandatory native
 * dependency even for this WASM-only use case (confirmed via HF's own docs:
 * "when running in node, we use onnxruntime-node"), and that dependency has
 * multiple open, unresolved GitHub issues around install failures (missing
 * macOS Intel bindings, corporate proxy/network failures, NuGet index
 * failures) as of early 2026. Swapping a low-real-world-risk vulnerability
 * (this package only ever processes your own trusted local SOP text, never
 * untrusted input) for a demonstrated cross-platform install fragility is a
 * worse trade, not a improvement. Revisit if a future release decouples the
 * WASM backend from the native one.
 */
async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      logger.info('Loading local embedding model (all-MiniLM-L6-v2)... first run may take a minute.');
      const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      logger.info('Embedding model loaded.');
      return embedder;
    })();
  }
  return embedderPromise;
}

/**
 * Embeds a single string into a 384-dim vector (mean-pooled, normalized).
 */
async function embedText(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Takes an array of { title, disasterType, content, steps } SOP objects,
 * embeds each one's content, and returns them ready for SOP.insertMany().
 */
async function prepareSOPsForIngestion(sopDrafts) {
  const prepared = [];
  for (const draft of sopDrafts) {
    const embedding = await embedText(`${draft.title}. ${draft.content}`);
    prepared.push({ ...draft, embedding, source: draft.source || 'seed' });
  }
  return prepared;
}

module.exports = { embedText, prepareSOPsForIngestion, getEmbedder };

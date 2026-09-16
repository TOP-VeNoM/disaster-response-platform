/**
 * Lightweight re-ranking pass over vector search results.
 *
 * This intentionally does NOT make a second LLM call to rerank — Atlas
 * Vector Search's cosine similarity already does the heavy lifting, and a
 * full cross-encoder reranker is overkill for a small SOP corpus. Instead,
 * this applies a small deterministic boost for exact disasterType matches
 * and title keyword overlap, which is enough signal to break ties without
 * adding latency or another point of LLM failure.
 */
function rerank(results, { disasterType, queryText = '' } = {}) {
  const queryWords = new Set(
    queryText.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );

  return results
    .map((r) => {
      let boost = 0;
      if (disasterType && r.disasterType === disasterType) boost += 0.05;

      const titleWords = (r.title || '').toLowerCase().split(/\W+/);
      const overlap = titleWords.filter((w) => queryWords.has(w)).length;
      boost += overlap * 0.01;

      const baseScore = typeof r.score === 'number' ? r.score : 0.5;
      return { ...r, score: baseScore + boost };
    })
    .sort((a, b) => b.score - a.score);
}

module.exports = { rerank };

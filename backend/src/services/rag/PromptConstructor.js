/**
 * Trims and formats retrieved SOP documents into a shape PromptTemplates can
 * drop straight into the plan-generation prompt. Kept separate from
 * PromptTemplates.js so retrieval-shaping and prompt-wording can change
 * independently.
 */
function buildSOPExcerpts(sopResults, { maxChars = 800 } = {}) {
  return sopResults.map((sop) => ({
    title: sop.title,
    content: sop.content.length > maxChars ? `${sop.content.slice(0, maxChars)}...` : sop.content,
    score: sop.score
  }));
}

module.exports = { buildSOPExcerpts };

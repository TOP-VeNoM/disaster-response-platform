const { chatJSON } = require('../llm/LLMClient');
const { classificationPrompt } = require('../llm/PromptTemplates');
const logger = require('../../utils/logger');

const VALID_URGENCY = ['low', 'medium', 'high', 'critical'];

/**
 * Step 2 of the agent pipeline. Asks the LLM to triage the report's urgency.
 * Falls back to a safe default ('medium', flagged with low confidence) if the
 * LLM call fails or returns something malformed — a classification failure
 * should never block a report from proceeding, it should just get flagged
 * for closer human review.
 */
async function classify({ description, disasterType }) {
  try {
    const result = await chatJSON(classificationPrompt(description, disasterType), {
      temperature: 0.1,
      maxTokens: 256
    });

    if (!VALID_URGENCY.includes(result.urgency)) {
      throw new Error(`LLM returned invalid urgency value: ${result.urgency}`);
    }

    return {
      urgency: result.urgency,
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
      reasoning: result.reasoning || ''
    };
  } catch (err) {
    logger.error(`Classifier failed, defaulting to medium urgency: ${err.message}`);
    return {
      urgency: 'medium',
      confidence: 0,
      reasoning: `Automatic classification failed (${err.message}); defaulted to medium — please verify manually.`
    };
  }
}

module.exports = { classify };

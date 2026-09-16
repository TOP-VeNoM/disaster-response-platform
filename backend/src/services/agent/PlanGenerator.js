const { chatJSON } = require('../llm/LLMClient');
const { planGenerationPrompt } = require('../llm/PromptTemplates');
const logger = require('../../utils/logger');

/**
 * Step 5 of the agent pipeline. Combines the report, classification, retrieved
 * SOPs, and tool results into a concrete draft plan. This is a *draft* —
 * HumanReviewHandler gates whether it's ever acted on.
 */
async function generatePlan({ description, disasterType, urgency, sopExcerpts, toolContext }) {
  try {
    const result = await chatJSON(
      planGenerationPrompt({ description, disasterType, urgency, sopExcerpts, toolContext }),
      { temperature: 0.4, maxTokens: 1024 }
    );

    return {
      summary: result.summary || 'No summary generated.',
      steps: Array.isArray(result.steps) ? result.steps : [],
      recommendedResources: Array.isArray(result.recommendedResources) ? result.recommendedResources : []
    };
  } catch (err) {
    logger.error(`PlanGenerator failed: ${err.message}`);
    return {
      summary: `Automatic plan generation failed (${err.message}). A human responder should draft this plan manually using the retrieved SOPs below.`,
      steps: [],
      recommendedResources: []
    };
  }
}

module.exports = { generatePlan };

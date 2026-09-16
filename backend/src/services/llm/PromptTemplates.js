/**
 * Centralized prompt strings so tone/format changes happen in one place.
 * Each function returns { system, user } for LLMClient.chat().
 */

function classificationPrompt(reportDescription, disasterType) {
  return {
    system:
      'You are an emergency triage classifier for a disaster response system. ' +
      'Given a citizen-submitted report, assess its urgency. ' +
      'Respond ONLY with valid JSON, no markdown fences, no preamble, in this exact shape: ' +
      '{"urgency": "low|medium|high|critical", "confidence": 0.0-1.0, "reasoning": "one sentence"}',
    user: `Disaster type: ${disasterType}\nReport: ${reportDescription}`
  };
}

function planGenerationPrompt({ description, disasterType, urgency, sopExcerpts, toolContext }) {
  const sopText = sopExcerpts.length
    ? sopExcerpts.map((s, i) => `[SOP ${i + 1}: ${s.title}]\n${s.content}`).join('\n\n')
    : 'No matching SOPs were found in the knowledge base.';

  const toolText = toolContext.length
    ? toolContext
        .map((t) => `${t.tool}: ${t.error ? `unavailable (${t.error})` : JSON.stringify(t.output)}`)
        .join('\n')
    : 'No tool context was gathered.';

  return {
    system:
      'You are an emergency response planning assistant. Using the retrieved Standard ' +
      'Operating Procedures and any available real-time context (weather, similar past ' +
      'incidents), generate a concrete, actionable response plan. Be specific and concise. ' +
      'This plan will be reviewed by a human responder before any action is taken — you are ' +
      'drafting a recommendation, not issuing final instructions. ' +
      'Respond ONLY with valid JSON, no markdown fences, no preamble, in this exact shape: ' +
      '{"summary": "one paragraph", "steps": ["step 1", "step 2", ...], "recommendedResources": ["resource 1", ...]}',
    user:
      `Disaster type: ${disasterType}\n` +
      `Urgency: ${urgency}\n` +
      `Report: ${description}\n\n` +
      `Relevant SOPs:\n${sopText}\n\n` +
      `Real-time context:\n${toolText}`
  };
}

module.exports = { classificationPrompt, planGenerationPrompt };

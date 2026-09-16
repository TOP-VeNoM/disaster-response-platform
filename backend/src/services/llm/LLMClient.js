const { getGroqClient, LLM_CONFIG } = require('../../config/llm');
const logger = require('../../utils/logger');
const { ExternalServiceError } = require('../../utils/errors');

/**
 * Sends a system+user prompt to Groq and returns the raw text response.
 * Kept deliberately thin (no streaming, no tool-calling loop inside the SDK
 * call itself) — the agent orchestrator handles its own tool-calling loop
 * explicitly in JS so it's easy to follow and log each step.
 */
async function chat({ system, user }, { temperature, maxTokens, jsonMode = false } = {}) {
  const client = getGroqClient();

  try {
    const completion = await client.chat.completions.create({
      model: LLM_CONFIG.model,
      temperature: temperature ?? LLM_CONFIG.defaultTemperature,
      max_tokens: maxTokens ?? LLM_CONFIG.defaultMaxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Groq returned an empty completion');
    }
    return text;
  } catch (err) {
    logger.error(`LLMClient.chat failed: ${err.message}`);
    throw new ExternalServiceError('Groq', err.message);
  }
}

/**
 * Same as chat(), but parses the response as JSON and throws a clear error
 * if the model didn't return valid JSON (which happens occasionally with
 * smaller/faster models even when explicitly asked for JSON).
 */
async function chatJSON(prompt, options = {}) {
  const raw = await chat(prompt, { ...options, jsonMode: true });
  try {
    // Strip markdown code fences defensively in case the model adds them anyway
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    logger.error(`LLMClient.chatJSON: failed to parse model output as JSON. Raw output: ${raw}`);
    throw new Error(`LLM did not return valid JSON: ${err.message}`);
  }
}

module.exports = { chat, chatJSON };

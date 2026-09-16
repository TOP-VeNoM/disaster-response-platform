const Groq = require('groq-sdk');
const logger = require('../utils/logger');

let groqClient = null;

/**
 * Lazily creates and returns a singleton Groq client.
 * Groq's SDK is OpenAI-compatible in shape (chat.completions.create),
 * which is why the rest of the app can treat this like a generic chat LLM.
 */
function getGroqClient() {
  if (groqClient) return groqClient;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    logger.warn(
      'GROQ_API_KEY is missing or still set to the placeholder value in backend/.env. ' +
      'LLM-backed features (classification, plan generation) will fail until you set a real key ' +
      'from https://console.groq.com/keys'
    );
  }

  groqClient = new Groq({ apiKey });
  return groqClient;
}

const LLM_CONFIG = {
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  defaultTemperature: 0.3,
  defaultMaxTokens: 1024
};

module.exports = { getGroqClient, LLM_CONFIG };

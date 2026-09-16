const logger = require('../../utils/logger');

/**
 * Fetches current weather for a lat/lng. Useful context for the agent when
 * planning a response to a flood/storm report (is it still raining? wind speed?).
 *
 * Gracefully degrades: if OPENWEATHER_API_KEY isn't set, returns a structured
 * "unavailable" result instead of throwing, so one missing key doesn't crash
 * the whole agent run.
 */
async function run({ lat, lng }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    logger.warn('WeatherTool: OPENWEATHER_API_KEY not set, skipping weather lookup');
    return { available: false, reason: 'OPENWEATHER_API_KEY not configured' };
  }

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { available: false, reason: 'lat/lng not provided or not numeric' };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text();
      logger.error(`WeatherTool: OpenWeather API returned ${res.status}: ${body}`);
      return { available: false, reason: `OpenWeather API error ${res.status}` };
    }

    const data = await res.json();
    return {
      available: true,
      condition: data.weather?.[0]?.main || 'unknown',
      description: data.weather?.[0]?.description || '',
      tempC: data.main?.temp,
      windSpeedMs: data.wind?.speed,
      humidity: data.main?.humidity
    };
  } catch (err) {
    logger.error(`WeatherTool failed: ${err.message}`);
    return { available: false, reason: err.message };
  }
}

module.exports = {
  name: 'get_weather',
  description: 'Get current weather conditions at a location. Input: { lat, lng }',
  run
};

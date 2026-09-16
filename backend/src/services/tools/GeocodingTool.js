const logger = require('../../utils/logger');

/**
 * Converts a free-text address into lat/lng. Tries Google's Geocoding API
 * first (reuses GOOGLE_MAPS_API_KEY, since that's already required for the
 * frontend map — no separate signup needed), falling back to OpenCage if a
 * Google key isn't configured but an OpenCage one is. Used both by the agent
 * pipeline (report just came in with an address, no coordinates yet) and by
 * the on-demand /api/reports/:id/geocode endpoint the map view calls for
 * older reports that never went through the pipeline.
 */
async function run({ address }) {
  if (!address || !address.trim()) {
    return { available: false, reason: 'address not provided' };
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    const result = await geocodeWithGoogle(address, googleKey);
    if (result.available) return result;
    logger.warn(`GeocodingTool: Google geocoding failed (${result.reason}), trying OpenCage fallback`);
  }

  const openCageKey = process.env.OPENCAGE_API_KEY;
  if (openCageKey) {
    return geocodeWithOpenCage(address, openCageKey);
  }

  return {
    available: false,
    reason: googleKey
      ? 'Google geocoding failed and no OPENCAGE_API_KEY fallback configured'
      : 'Neither GOOGLE_MAPS_API_KEY nor OPENCAGE_API_KEY is configured'
  };
}

async function geocodeWithGoogle(address, apiKey) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text();
      logger.error(`GeocodingTool: Google Geocoding API returned ${res.status}: ${body}`);
      return { available: false, reason: `Google Geocoding API error ${res.status}` };
    }

    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      return { available: false, reason: `Google Geocoding API status: ${data.status}` };
    }

    const result = data.results[0];
    return {
      available: true,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      provider: 'google'
    };
  } catch (err) {
    logger.error(`GeocodingTool (Google) failed: ${err.message}`);
    return { available: false, reason: err.message };
  }
}

async function geocodeWithOpenCage(address, apiKey) {
  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}&limit=1`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text();
      logger.error(`GeocodingTool: OpenCage API returned ${res.status}: ${body}`);
      return { available: false, reason: `OpenCage API error ${res.status}` };
    }

    const data = await res.json();
    const result = data.results?.[0];

    if (!result) {
      return { available: false, reason: 'No geocoding results for address' };
    }

    return {
      available: true,
      lat: result.geometry.lat,
      lng: result.geometry.lng,
      formattedAddress: result.formatted,
      confidence: result.confidence,
      provider: 'opencage'
    };
  } catch (err) {
    logger.error(`GeocodingTool (OpenCage) failed: ${err.message}`);
    return { available: false, reason: err.message };
  }
}

module.exports = {
  name: 'geocode_address',
  description: 'Convert an address string into lat/lng coordinates. Input: { address }',
  run
};


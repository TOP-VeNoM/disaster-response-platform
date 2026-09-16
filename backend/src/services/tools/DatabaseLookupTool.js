const Report = require('../../models/Report');
const logger = require('../../utils/logger');

/**
 * Looks up recent resolved reports of the same disaster type in the same
 * general area, so the agent can factor in "we've seen this before" context
 * (e.g. a cluster of flood reports on the same street this week).
 */
async function run({ disasterType, lat, lng, radiusKm = 5, limit = 5 }) {
  try {
    const query = { disasterType, status: 'resolved' };

    // Simple bounding-box proximity filter. Good enough for a city-scale demo;
    // swap for a proper $geoNear/2dsphere index if you need real geo-radius accuracy.
    if (typeof lat === 'number' && typeof lng === 'number') {
      const kmPerDegreeLat = 111;
      const degDelta = radiusKm / kmPerDegreeLat;
      query['location.lat'] = { $gte: lat - degDelta, $lte: lat + degDelta };
      query['location.lng'] = { $gte: lng - degDelta, $lte: lng + degDelta };
    }

    const similarReports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('description urgency status createdAt agentRun.plan.summary')
      .lean();

    return {
      available: true,
      count: similarReports.length,
      reports: similarReports.map((r) => ({
        description: r.description,
        urgency: r.urgency,
        resolvedSummary: r.agentRun?.plan?.summary || null,
        reportedAt: r.createdAt
      }))
    };
  } catch (err) {
    logger.error(`DatabaseLookupTool failed: ${err.message}`);
    return { available: false, reason: err.message };
  }
}

module.exports = {
  name: 'lookup_similar_reports',
  description:
    'Find past resolved reports of the same disaster type near a location. Input: { disasterType, lat, lng, radiusKm?, limit? }',
  run
};

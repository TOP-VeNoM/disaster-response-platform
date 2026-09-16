const Report = require('../models/Report');
const ToolRegistry = require('../services/tools/ToolRegistry');
const logger = require('../utils/logger');

/**
 * Returns every report the requester can see (same visibility rules as
 * listReports: reporters see only their own, responder/admin see all),
 * split into two groups:
 *   - geocoded: has usable lat/lng, either originally or resolved just now
 *   - ungeocodable: has neither coordinates nor a resolvable address
 *
 * Reports that had an address but no coordinates get geocoded here, on
 * demand, and the result is saved back to the report so this doesn't
 * re-run the geocoding API call on every subsequent map load — only the
 * first time a given report is viewed on the map costs an API call.
 */
async function getMapData(req, res, next) {
  try {
    const query = {};
    if (req.user.role === 'reporter') {
      query.reporter = req.user._id;
    }

    const reports = await Report.find(query).select(
      'description disasterType location urgency status createdAt'
    );

    const geocoded = [];
    const ungeocodable = [];

    // Sequential, not Promise.all: geocoding APIs (Google, OpenCage) rate-limit
    // per-second request bursts, and this only runs the network call for
    // reports actually missing coordinates — most reports on repeat page
    // loads already have lat/lng saved and skip straight to the geocoded
    // array with zero API calls.
    for (const report of reports) {
      const hasCoords = typeof report.location?.lat === 'number' && typeof report.location?.lng === 'number';

      if (hasCoords) {
        geocoded.push(report);
        continue;
      }

      if (!report.location?.address) {
        ungeocodable.push(report);
        continue;
      }

      const result = await ToolRegistry.call('geocode_address', { address: report.location.address });

      if (result.output?.available) {
        report.location.lat = result.output.lat;
        report.location.lng = result.output.lng;
        await report.save();
        geocoded.push(report);
      } else {
        logger.warn(
          `getMapData: could not geocode report ${report._id} (address: "${report.location.address}"): ${result.output?.reason || result.error}`
        );
        ungeocodable.push(report);
      }
    }

    res.json({
      geocoded,
      ungeocodable: ungeocodable.map((r) => ({
        _id: r._id,
        description: r.description,
        disasterType: r.disasterType,
        address: r.location?.address || null
      })),
      ungeocodableCount: ungeocodable.length
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMapData };

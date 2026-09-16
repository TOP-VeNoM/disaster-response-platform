/**
 * Step 1 of the agent pipeline. Deliberately simple: the report already
 * arrives structured from the frontend form (description, disasterType,
 * location), so "parsing" here just normalizes it into the shape the rest
 * of the pipeline expects, rather than running an LLM extraction pass on
 * already-structured input.
 */
function parseReport(report) {
  return {
    reportId: report._id?.toString(),
    description: report.description.trim(),
    disasterType: report.disasterType || 'other',
    location: {
      address: report.location?.address || null,
      lat: typeof report.location?.lat === 'number' ? report.location.lat : null,
      lng: typeof report.location?.lng === 'number' ? report.location.lng : null
    }
  };
}

module.exports = { parseReport };

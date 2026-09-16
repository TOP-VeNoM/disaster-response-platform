const Report = require('../models/Report');
const AgentAction = require('../models/AgentAction');

/**
 * Computes analytics over the FULL report collection (not a capped page of
 * results the way the frontend's old client-side approach did with
 * `limit: 200`) using MongoDB aggregation pipelines, so the numbers stay
 * correct regardless of how many reports exist.
 *
 * Scoped by the same reporter/responder visibility rule as everywhere else:
 * a reporter only sees analytics over their own reports.
 */
async function getAnalytics(req, res, next) {
  try {
    const baseMatch = {};
    if (req.user.role === 'reporter') {
      baseMatch.reporter = req.user._id;
    }

    const [
      byUrgency,
      byStatus,
      byDisasterType,
      dailyVolume,
      confidenceStats,
      pipelineTiming,
      reviewTiming
    ] = await Promise.all([
      Report.aggregate([
        { $match: baseMatch },
        { $group: { _id: { $ifNull: ['$urgency', 'unclassified'] }, count: { $sum: 1 } } }
      ]),
      Report.aggregate([{ $match: baseMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.aggregate([{ $match: baseMatch }, { $group: { _id: '$disasterType', count: { $sum: 1 } } }]),
      Report.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      Report.aggregate([
        { $match: { ...baseMatch, 'agentRun.classification.confidence': { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            avg: { $avg: '$agentRun.classification.confidence' },
            min: { $min: '$agentRun.classification.confidence' },
            max: { $max: '$agentRun.classification.confidence' }
          }
        }
      ]),
      // Average total agent pipeline duration per report: sum each report's
      // step durations, then average across reports. Only counts completed
      // steps with a recorded durationMs (failed/started entries don't have one).
      AgentAction.aggregate([
        { $match: { status: 'completed', durationMs: { $exists: true, $ne: null } } },
        { $group: { _id: '$report', totalMs: { $sum: '$durationMs' } } },
        { $group: { _id: null, avgMs: { $avg: '$totalMs' }, count: { $sum: 1 } } }
      ]),
      // Time from report creation to the human_review step actually
      // completing (approve or reject) — a genuine "how long did this sit
      // before a human acted on it" operational metric, computable from
      // data that already exists but was never surfaced anywhere before.
      AgentAction.aggregate([
        { $match: { step: 'human_review', status: 'completed' } },
        {
          $lookup: {
            from: 'reports',
            localField: 'report',
            foreignField: '_id',
            as: 'reportDoc'
          }
        },
        { $unwind: '$reportDoc' },
        ...(req.user.role === 'reporter' ? [{ $match: { 'reportDoc.reporter': req.user._id } }] : []),
        {
          $project: {
            waitMs: { $subtract: ['$createdAt', '$reportDoc.createdAt'] }
          }
        },
        { $group: { _id: null, avgMs: { $avg: '$waitMs' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      byUrgency: byUrgency.map((r) => ({ urgency: r._id, count: r.count })),
      byStatus: byStatus.map((r) => ({ status: r._id, count: r.count })),
      byDisasterType: byDisasterType.map((r) => ({ disasterType: r._id, count: r.count })),
      dailyVolume: dailyVolume.map((r) => ({ date: r._id, count: r.count })),
      confidence: confidenceStats[0]
        ? { avg: confidenceStats[0].avg, min: confidenceStats[0].min, max: confidenceStats[0].max }
        : null,
      avgPipelineDurationMs: pipelineTiming[0]?.avgMs ?? null,
      avgTimeToReviewMs: reviewTiming[0]?.avgMs ?? null,
      reviewedCount: reviewTiming[0]?.count ?? 0
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalytics };

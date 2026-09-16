const Report = require('../models/Report');
const { validateReportInput } = require('../utils/validators');
const { NotFoundError } = require('../utils/errors');
const { runPipeline } = require('../services/agent/AgentOrchestrator');
const logger = require('../utils/logger');

async function createReport(req, res, next) {
  try {
    const { description, disasterType, location } = req.body;
    validateReportInput({ description, disasterType, location });

    const report = await Report.create({
      reporter: req.user._id,
      description,
      disasterType,
      location
    });

    res.status(201).json({ report });

    // Kick off the agent pipeline asynchronously — the HTTP response above
    // doesn't wait on it. The frontend polls/streams status via GET
    // /api/reports/:id and /api/agent/:reportId/timeline.
    runPipeline(report._id).catch((err) => {
      logger.error(`Background agent pipeline failed for report ${report._id}: ${err.message}`);
    });
  } catch (err) {
    next(err);
  }
}

async function listReports(req, res, next) {
  try {
    const { status, disasterType, urgency, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (disasterType) query.disasterType = disasterType;
    if (urgency) query.urgency = urgency;

    // Plain regex match rather than a full MongoDB text index — this app's
    // scale doesn't need the relevance-scoring or indexing overhead a text
    // index brings, and a regex needs no schema/index migration to add.
    // Escape regex metacharacters so a search like "3.5" or "(flood)" is
    // treated as a literal string instead of malformed/unexpected regex.
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(escaped, 'i');
      query.$or = [{ description: pattern }, { 'location.address': pattern }];
    }

    // Reporters only see their own reports; responders/admins see everything
    if (req.user.role === 'reporter') {
      query.reporter = req.user._id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('reporter', 'name email')
        .lean(),
      Report.countDocuments(query)
    ]);

    res.json({ reports, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
}

async function getReport(req, res, next) {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('reviewedBy', 'name email');

    if (!report) throw new NotFoundError('Report');

    if (req.user.role === 'reporter' && report.reporter._id.toString() !== req.user._id.toString()) {
      throw new NotFoundError('Report'); // don't leak existence to other reporters
    }

    res.json({ report });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReport, listReports, getReport };

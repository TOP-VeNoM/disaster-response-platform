const HumanReviewHandler = require('../services/agent/HumanReviewHandler');
const AgentAction = require('../models/AgentAction');
const Report = require('../models/Report');
const { runPipeline } = require('../services/agent/AgentOrchestrator');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

async function approveReport(req, res, next) {
  try {
    const report = await HumanReviewHandler.approve(req.params.reportId, {
      reviewerId: req.user._id,
      notes: req.body.notes
    });
    res.json({ report });
  } catch (err) {
    next(err);
  }
}

async function rejectReport(req, res, next) {
  try {
    const report = await HumanReviewHandler.reject(req.params.reportId, {
      reviewerId: req.user._id,
      notes: req.body.notes
    });
    res.json({ report });
  } catch (err) {
    next(err);
  }
}

/**
 * Saves a responder's edited version of the draft plan. The AI's original
 * output in agentRun.plan is never modified — this writes to the separate
 * editedPlan field so both versions remain visible for audit purposes.
 * Only allowed while the report is awaiting_review: editing a plan that's
 * already been approved or rejected would rewrite history after the fact,
 * which defeats the point of keeping an audit trail at all.
 */
async function editPlan(req, res, next) {
  try {
    const { summary, steps, recommendedResources } = req.body;

    if (!summary || typeof summary !== 'string' || !summary.trim()) {
      throw new ValidationError('summary is required');
    }
    if (steps !== undefined && !Array.isArray(steps)) {
      throw new ValidationError('steps must be an array of strings');
    }
    if (recommendedResources !== undefined && !Array.isArray(recommendedResources)) {
      throw new ValidationError('recommendedResources must be an array of strings');
    }

    const report = await Report.findById(req.params.reportId);
    if (!report) throw new NotFoundError('Report');
    if (report.status !== 'awaiting_review') {
      throw new ValidationError(
        `Cannot edit the plan while report status is "${report.status}" — only reports awaiting review can be edited.`
      );
    }

    report.editedPlan = {
      summary: summary.trim(),
      steps: steps || [],
      recommendedResources: recommendedResources || [],
      editedBy: req.user._id,
      editedAt: new Date()
    };
    await report.save();

    res.json({ report });
  } catch (err) {
    next(err);
  }
}

async function getTimeline(req, res, next) {
  try {
    const actions = await AgentAction.find({ report: req.params.reportId }).sort({ createdAt: 1 });
    res.json({ actions });
  } catch (err) {
    next(err);
  }
}

/**
 * Lets a responder manually re-trigger the pipeline for a report that's
 * stuck in 'submitted' (e.g. after a transient LLM failure rolled it back).
 */
async function rerunPipeline(req, res, next) {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) throw new NotFoundError('Report');
    if (report.status === 'processing') {
      throw new ValidationError('Report is already being processed');
    }

    res.json({ message: 'Pipeline re-run started', reportId: report._id });

    runPipeline(report._id).catch((err) => {
      logger.error(`Manual pipeline re-run failed for report ${report._id}: ${err.message}`);
    });
  } catch (err) {
    next(err);
  }
}

async function listPendingReview(req, res, next) {
  try {
    const reports = await Report.find({ status: 'awaiting_review' })
      .sort({ 'agentRun.classification.urgency': -1, createdAt: 1 })
      .populate('reporter', 'name email');
    res.json({ reports });
  } catch (err) {
    next(err);
  }
}

module.exports = { approveReport, rejectReport, editPlan, getTimeline, rerunPipeline, listPendingReview };

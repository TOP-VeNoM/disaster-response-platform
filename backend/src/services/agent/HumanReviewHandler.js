const Report = require('../../models/Report');
const AgentAction = require('../../models/AgentAction');
const { NotFoundError, ValidationError } = require('../../utils/errors');

/**
 * Step 6 of the agent pipeline — but unlike steps 1-5, this one doesn't run
 * automatically. AgentOrchestrator stops at 'awaiting_review' and waits for
 * a human (via the Agent Approval Panel on the frontend) to call approve()
 * or reject() through agentController. Nothing in agentRun.plan is ever
 * auto-executed.
 */

async function approve(reportId, { reviewerId, notes = '' }) {
  const report = await Report.findById(reportId);
  if (!report) throw new NotFoundError('Report');
  if (report.status !== 'awaiting_review') {
    throw new ValidationError(`Report is in status "${report.status}", not awaiting review`);
  }

  report.status = 'approved';
  report.reviewedBy = reviewerId;
  report.reviewNotes = notes;
  await report.save();

  await AgentAction.create({
    report: report._id,
    step: 'human_review',
    status: 'completed',
    input: { action: 'approve', notes },
    output: { newStatus: 'approved' }
  });

  return report;
}

async function reject(reportId, { reviewerId, notes = '' }) {
  const report = await Report.findById(reportId);
  if (!report) throw new NotFoundError('Report');
  if (report.status !== 'awaiting_review') {
    throw new ValidationError(`Report is in status "${report.status}", not awaiting review`);
  }

  report.status = 'rejected';
  report.reviewedBy = reviewerId;
  report.reviewNotes = notes;
  await report.save();

  await AgentAction.create({
    report: report._id,
    step: 'human_review',
    status: 'completed',
    input: { action: 'reject', notes },
    output: { newStatus: 'rejected' }
  });

  return report;
}

module.exports = { approve, reject };

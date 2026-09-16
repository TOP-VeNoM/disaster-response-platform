const express = require('express');
const {
  approveReport,
  rejectReport,
  editPlan,
  getTimeline,
  rerunPipeline,
  listPendingReview
} = require('../controllers/agentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Only responders/admins can see the agent's step-by-step timeline, approve,
// reject, edit the draft plan, or trigger pipeline actions. Reporters submit
// reports and see the resulting status/plan, but not the internal audit
// trail of how the agent got there (tool failures, retrieval scores, retry
// attempts) — that's operational detail for the people acting on the
// report, not the person who filed it. This matches how incident tools like
// PagerDuty/Opsgenie scope internal timelines to responders rather than the
// reporting party.
router.get('/pending', requireRole('responder', 'admin'), listPendingReview);
router.get('/:reportId/timeline', requireRole('responder', 'admin'), getTimeline);
router.post('/:reportId/approve', requireRole('responder', 'admin'), approveReport);
router.post('/:reportId/reject', requireRole('responder', 'admin'), rejectReport);
router.post('/:reportId/edit-plan', requireRole('responder', 'admin'), editPlan);
router.post('/:reportId/rerun', requireRole('responder', 'admin'), rerunPipeline);

module.exports = router;



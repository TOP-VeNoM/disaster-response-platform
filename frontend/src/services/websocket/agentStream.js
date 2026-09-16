import { reportsApi } from '../api/reports';
import { agentApi } from '../api/agent';

/**
 * NOTE: This is a polling-based stand-in for a WebSocket stream, not a real
 * WebSocket connection. The backend's agent pipeline runs as a fire-and-forget
 * async function (see backend/src/controllers/reportController.js createReport)
 * rather than pushing over a socket, so polling is the simplest correct way
 * to reflect live progress without adding socket.io infrastructure.
 *
 * If you want true push-based updates later, the swap point is here: replace
 * the setInterval below with a socket.io client, and keep this same
 * subscribe(onUpdate) interface so components using useAgentStream don't
 * need to change.
 *
 * Report and timeline are fetched independently and deliberately NOT wrapped
 * in one try/catch. The timeline endpoint (agentApi.getTimeline) is
 * responder/admin only — a reporter viewing their own report will always get
 * a 403 on that call, which is expected, not an error condition. If both
 * calls shared one try block, that 403 would wipe out the perfectly good
 * report data too. Instead: report failures are real errors (surfaced to
 * onUpdate.error); timeline failures are treated as "no timeline available
 * to this viewer" (actions comes back empty, no error surfaced).
 */
function pollTimeline(reportId, onUpdate, intervalMs = 3000) {
  let stopped = false;

  async function tick() {
    if (stopped) return;

    let report;
    try {
      ({ report } = await reportsApi.get(reportId));
    } catch (err) {
      onUpdate({ error: err.response?.data?.error || err.message });
      return;
    }

    let actions = [];
    try {
      ({ actions } = await agentApi.getTimeline(reportId));
    } catch {
      // Expected for reporter-role viewers (403) — not a real error condition.
      // actions stays [] and the timeline UI simply won't render for them.
    }

    onUpdate({ actions, report });
  }

  tick();
  const handle = setInterval(tick, intervalMs);

  return function unsubscribe() {
    stopped = true;
    clearInterval(handle);
  };
}

export default { pollTimeline };


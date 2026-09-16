import { useState, useEffect } from 'react';
import agentStream from '../services/websocket/agentStream';

/**
 * Subscribes to live-ish updates for a report's agent pipeline via polling
 * (see services/websocket/agentStream.js for why this is polling, not a
 * real socket). Returns the latest actions + report doc, refreshed every
 * few seconds while status is still in-flight, and stops polling once the
 * report reaches a terminal-for-this-view state.
 */
const TERMINAL_STATUSES = ['awaiting_review', 'approved', 'rejected', 'resolved'];

export function useAgentStream(reportId) {
  const [actions, setActions] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reportId) return undefined;

    let unsubscribe = null;

    unsubscribe = agentStream.pollTimeline(reportId, (update) => {
      if (update.error) {
        setError(update.error);
        return;
      }
      setActions(update.actions);
      setReport(update.report);

      // Slow down polling automatically once we've reached a stable state,
      // by unsubscribing — approve/reject actions from the UI will refetch manually.
      if (update.report && TERMINAL_STATUSES.includes(update.report.status) && unsubscribe) {
        unsubscribe();
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [reportId]);

  return { actions, report, error };
}

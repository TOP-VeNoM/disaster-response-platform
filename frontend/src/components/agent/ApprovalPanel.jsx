import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { agentApi } from '../../services/api/agent';
import { disasterTypeLabel } from '../../shared/disasterTypes.js';
import { urgencyLabel, urgencyColor } from '../../shared/urgencyLevels.js';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import ActionButtons from './ActionButtons.jsx';

export default function ApprovalPanel({ report, onResolved }) {
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();

  const hasEdit = Boolean(report.editedPlan?.summary);
  const displayPlan = hasEdit ? report.editedPlan : report.agentRun?.plan;

  async function handleApprove(notes) {
    try {
      await agentApi.approve(report._id, notes);
      notify('Plan approved.', 'success');
      onResolved?.(report._id);
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to approve.', 'error');
    }
  }

  async function handleReject(notes) {
    try {
      await agentApi.reject(report._id, notes);
      notify('Plan rejected.', 'warning');
      onResolved?.(report._id);
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to reject.', 'error');
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase text-text-muted">
              {disasterTypeLabel(report.disasterType)}
            </span>
            {hasEdit && <span className="badge bg-accent-mint/15 text-accent-mint">Edited</span>}
          </div>
          <h3
            className="cursor-pointer text-sm font-semibold text-text-primary hover:underline"
            onClick={() => navigate(`/reports/${report._id}`)}
          >
            {report.description.length > 80 ? `${report.description.slice(0, 80)}...` : report.description}
          </h3>
        </div>
        {report.urgency && (
          <span className="badge text-white" style={{ backgroundColor: urgencyColor(report.urgency) }}>
            {urgencyLabel(report.urgency)}
          </span>
        )}
      </div>

      {displayPlan?.summary && <p className="mt-3 text-sm text-text-secondary">{displayPlan.summary}</p>}

      {displayPlan?.steps?.length > 0 && (
        <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-xs text-text-secondary">
          {displayPlan.steps.slice(0, 4).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
          {displayPlan.steps.length > 4 && (
            <li className="list-none text-text-muted">+{displayPlan.steps.length - 4} more...</li>
          )}
        </ol>
      )}

      <div className="mt-4">
        <ActionButtons onApprove={handleApprove} onReject={handleReject} />
      </div>
    </div>
  );
}

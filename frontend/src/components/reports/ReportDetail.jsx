import { useState, useEffect } from 'react';
import { statusLabel, statusColor, formatDate } from '../../utils/formatters';
import { disasterTypeLabel } from '../../shared/disasterTypes.js';
import { urgencyLabel, urgencyColor } from '../../shared/urgencyLevels.js';
import { useAuth } from '../../hooks/useAuth';
import { agentApi } from '../../services/api/agent';
import AgentTimeline from '../agent/AgentTimeline.jsx';
import { Pencil, X, Check, Plus, Trash2 } from 'lucide-react';

function PlanEditor({ report, onSaved, onCancel }) {
  const source = report.editedPlan?.summary ? report.editedPlan : report.agentRun.plan;
  const [summary, setSummary] = useState(source.summary || '');
  const [steps, setSteps] = useState(source.steps?.length ? [...source.steps] : ['']);
  const [resources, setResources] = useState(
    source.recommendedResources?.length ? [...source.recommendedResources] : ['']
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    if (!summary.trim()) {
      setError('Summary cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const { report: updated } = await agentApi.editPlan(report._id, {
        summary: summary.trim(),
        steps: steps.map((s) => s.trim()).filter(Boolean),
        recommendedResources: resources.map((r) => r.trim()).filter(Boolean)
      });
      onSaved(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function updateListItem(list, setList, index, value) {
    const next = [...list];
    next[index] = value;
    setList(next);
  }

  function removeListItem(list, setList, index) {
    const next = list.filter((_, i) => i !== index);
    // Guarantee at least one row stays visible — an empty array here would
    // render zero input rows, making it look like the whole section
    // vanished rather than "you cleared the last item."
    setList(next.length > 0 ? next : ['']);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Summary</label>
        <textarea rows={3} className="input" value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>

      <div>
        <label className="label">Steps</label>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input"
                value={step}
                onChange={(e) => updateListItem(steps, setSteps, i, e.target.value)}
                placeholder={`Step ${i + 1}`}
              />
              <button
                onClick={() => removeListItem(steps, setSteps, i)}
                className="btn-secondary shrink-0 px-2"
                title="Remove step"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button onClick={() => setSteps([...steps, ''])} className="flex items-center gap-1 text-xs text-accent-mint hover:underline">
            <Plus size={12} /> Add step
          </button>
        </div>
      </div>

      <div>
        <label className="label">Recommended Resources</label>
        <div className="space-y-2">
          {resources.map((res, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input"
                value={res}
                onChange={(e) => updateListItem(resources, setResources, i, e.target.value)}
                placeholder={`Resource ${i + 1}`}
              />
              <button
                onClick={() => removeListItem(resources, setResources, i)}
                className="btn-secondary shrink-0 px-2"
                title="Remove resource"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setResources([...resources, ''])}
            className="flex items-center gap-1 text-xs text-accent-mint hover:underline"
          >
            <Plus size={12} /> Add resource
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-status-critical">{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Check size={13} className="mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={onCancel} disabled={saving} className="btn-secondary">
          <X size={13} className="mr-1" /> Cancel
        </button>
      </div>
    </div>
  );
}

function PlanView({ plan, label, accent }) {
  return (
    <div>
      {label && <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: accent }}>{label}</p>}
      <p className="text-sm text-text-secondary">{plan.summary}</p>

      {plan.steps?.length > 0 && (
        <div className="mt-3">
          <h3 className="text-xs font-medium uppercase text-text-muted">Steps</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-text-secondary">
            {plan.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {plan.recommendedResources?.length > 0 && (
        <div className="mt-3">
          <h3 className="text-xs font-medium uppercase text-text-muted">Recommended Resources</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-text-secondary">
            {plan.recommendedResources.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ReportDetail({ report: initialReport, actions }) {
  const { user } = useAuth();
  const [report, setReport] = useState(initialReport);
  const [editing, setEditing] = useState(false);

  // Polling (see useAgentStream) hands us a fresh report object on every
  // tick. We mirror it into local state so edits made via PlanEditor persist
  // across re-renders, but we deliberately skip syncing while `editing` is
  // true — otherwise an in-progress poll tick could overwrite unsaved
  // changes the responder is currently typing.
  useEffect(() => {
    if (!editing) setReport(initialReport);
  }, [initialReport, editing]);

  const canEdit = (user?.role === 'responder' || user?.role === 'admin') && report.status === 'awaiting_review';
  const hasEdit = Boolean(report.editedPlan?.summary);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-text-primary">{disasterTypeLabel(report.disasterType)} Report</h1>
            <p className="mt-1 text-sm text-text-muted">Submitted {formatDate(report.createdAt)}</p>
          </div>
          <span className={`badge ${statusColor(report.status)}`}>{statusLabel(report.status)}</span>
        </div>

        <p className="mt-4 text-text-primary">{report.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <span className="text-text-muted">Location</span>
            <p className="text-text-primary">
              {report.location?.address || `${report.location?.lat}, ${report.location?.lng}` || '—'}
            </p>
          </div>
          <div>
            <span className="text-text-muted">Urgency</span>
            <p>
              {report.urgency ? (
                <span className="badge text-white" style={{ backgroundColor: urgencyColor(report.urgency) }}>
                  {urgencyLabel(report.urgency)}
                </span>
              ) : (
                <span className="text-text-muted">Pending classification</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-text-muted">Reporter</span>
            <p className="text-text-primary">{report.reporter?.name || '—'}</p>
          </div>
        </div>

        {report.agentRun?.classification?.reasoning && (
          <div className="mt-4 rounded-md bg-surface-tile p-3 text-sm text-text-secondary">
            <span className="font-medium text-text-secondary">Classifier reasoning: </span>
            {report.agentRun.classification.reasoning}
          </div>
        )}
      </div>

      {report.agentRun?.plan && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">Draft Response Plan</h2>
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-accent-mint hover:underline">
                <Pencil size={12} /> {hasEdit ? 'Edit again' : 'Edit plan'}
              </button>
            )}
          </div>

          {editing ? (
            <div className="mt-3">
              <PlanEditor
                report={report}
                onSaved={(updated) => {
                  setReport(updated);
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <div className="mt-2 space-y-5">
              {hasEdit ? (
                <>
                  <PlanView plan={report.editedPlan} label="Responder-edited version (in effect)" accent="#A9DFD8" />
                  <div className="border-t border-surface-border pt-4 opacity-70">
                    <PlanView plan={report.agentRun.plan} label="Original AI-generated version" accent="#87888C" />
                  </div>
                </>
              ) : (
                <PlanView plan={report.agentRun.plan} />
              )}
            </div>
          )}

          {report.reviewNotes && (
            <div className="mt-4 rounded-md border border-surface-border p-3 text-sm">
              <span className="font-medium text-text-secondary">Reviewer notes: </span>
              {report.reviewNotes}
            </div>
          )}
        </div>
      )}

      {report.agentRun?.retrievedSOPs?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-text-primary">Retrieved SOPs</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {report.agentRun.retrievedSOPs.map((s, i) => (
              <li key={i} className="flex justify-between text-text-secondary">
                <span>{s.title}</span>
                {typeof s.score === 'number' && (
                  <span className="text-text-muted">score: {s.score.toFixed(3)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {actions?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-text-primary">Agent Timeline</h2>
          <AgentTimeline actions={actions} />
        </div>
      )}
    </div>
  );
}


import { useState, useEffect, useCallback, useContext } from 'react';
import client from '../services/api/client';
import { useAuth } from '../hooks/useAuth';
import { disasterTypeLabel, DISASTER_TYPES } from '../shared/disasterTypes.js';
import { NotificationContext } from '../context/NotificationContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Modal from '../components/common/Modal.jsx';
import { Pencil, Trash2, Plus } from 'lucide-react';

// See note in ReportFilters.jsx: the shared `.input` class sets `w-full`,
// which a plain `w-auto` utility can't reliably override due to Tailwind
// layer ordering. Building this select's classes standalone avoids it.
const FILTER_SELECT_CLASS =
  'inline-block w-auto rounded-md border border-surface-border bg-surface-tile px-3 py-2 text-sm text-text-primary focus:border-accent-mint focus:outline-none focus:ring-1 focus:ring-accent-mint';

const EMPTY_SOP = { title: '', disasterType: 'flood', content: '', steps: [''] };

export default function SOPs() {
  const { user } = useAuth();
  const { notify } = useContext(NotificationContext);
  const [sops, setSops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  // Single modal handles both create (editingId === null) and edit
  // (editingId === the SOP's _id) to avoid duplicating near-identical form logic.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_SOP);
  const [saving, setSaving] = useState(false);

  // Test-retrieval panel
  const [query, setQuery] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);

  const fetchSOPs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/sops', { params: filterType ? { disasterType: filterType } : {} });
      setSops(data.sops);
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to load SOPs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterType, notify]);

  useEffect(() => {
    fetchSOPs();
  }, [fetchSOPs]);

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_SOP);
    setModalOpen(true);
  }

  function openEditModal(sop) {
    setEditingId(sop._id);
    setForm({
      title: sop.title,
      disasterType: sop.disasterType,
      content: sop.content,
      steps: sop.steps?.length ? [...sop.steps] : ['']
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      notify('Title and content are required.', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      disasterType: form.disasterType,
      content: form.content.trim(),
      steps: form.steps.map((s) => s.trim()).filter(Boolean)
    };
    try {
      if (editingId) {
        await client.put(`/sops/${editingId}`, payload);
        notify('SOP updated and re-embedded.', 'success');
      } else {
        await client.post('/sops', payload);
        notify('SOP added and embedded.', 'success');
      }
      setModalOpen(false);
      fetchSOPs();
    } catch (err) {
      notify(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} SOP.`, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this SOP? This cannot be undone.')) return;
    try {
      await client.delete(`/sops/${id}`);
      notify('SOP deleted.', 'success');
      fetchSOPs();
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to delete SOP.', 'error');
    }
  }

  function updateStep(index, value) {
    const next = [...form.steps];
    next[index] = value;
    setForm({ ...form, steps: next });
  }

  function removeStep(index) {
    const next = form.steps.filter((_, i) => i !== index);
    setForm({ ...form, steps: next.length > 0 ? next : [''] });
  }

  async function handleTestRetrieval(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setTesting(true);
    setTestResults(null);
    try {
      const { data } = await client.post('/sops/test-retrieval', { query, topK: 3 });
      setTestResults(data.results);
    } catch (err) {
      notify(err.response?.data?.error || 'Retrieval test failed.', 'error');
    } finally {
      setTesting(false);
    }
  }

  const isAdmin = user?.role === 'admin';
  const canTestRetrieval = user?.role === 'admin' || user?.role === 'responder';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Standard Operating Procedures</h1>
          <p className="mt-1 text-sm text-text-muted">
            The knowledge base the agent retrieves from via Atlas Vector Search.
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreateModal}>
            + Add SOP
          </button>
        )}
      </div>

      {canTestRetrieval && (
        <div className="card">
          <h2 className="font-semibold text-text-primary">Test Retrieval</h2>
          <p className="mt-1 text-xs text-text-muted">
            Run a query through the same retriever the agent uses, without submitting a full report.
          </p>
          <form onSubmit={handleTestRetrieval} className="mt-3 flex gap-2">
            <input
              className="input flex-1"
              placeholder="e.g. flash flood evacuation near school"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn-secondary" disabled={testing}>
              {testing ? 'Searching...' : 'Search'}
            </button>
          </form>

          {testResults && (
            <ul className="mt-3 space-y-2">
              {testResults.length === 0 && <p className="text-sm text-text-muted">No matching SOPs found.</p>}
              {testResults.map((r, i) => (
                <li key={i} className="rounded-md border border-surface-border p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{r.title}</span>
                    {typeof r.score === 'number' && <span className="text-xs text-text-muted">score: {r.score.toFixed(3)}</span>}
                  </div>
                  <p className="mt-1 text-text-secondary">{r.content.slice(0, 150)}...</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <select className={FILTER_SELECT_CLASS} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All disaster types</option>
          {DISASTER_TYPES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading SOPs..." />
      ) : sops.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          No SOPs found. Run <code className="rounded bg-surface-tile px-1">npm run ingest:sops</code> from the
          project root to load the sample corpus.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sops.map((sop) => (
            <div key={sop._id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium uppercase text-text-muted">
                    {disasterTypeLabel(sop.disasterType)}
                  </span>
                  <h3 className="font-semibold text-text-primary">{sop.title}</h3>
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 gap-3">
                    <button
                      onClick={() => openEditModal(sop)}
                      className="flex items-center gap-1 text-xs text-accent-mint hover:underline"
                    >
                      <Pencil size={11} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(sop._id)}
                      className="flex items-center gap-1 text-xs text-status-critical hover:underline"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-text-secondary">{sop.content.slice(0, 200)}...</p>
              {sop.steps?.length > 0 && <p className="mt-2 text-xs text-text-muted">{sop.steps.length} defined steps</p>}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit SOP' : 'Add SOP'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Embedding & Saving...' : editingId ? 'Save Changes' : 'Save SOP'}
            </button>
          </>
        }
      >
        <form className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Disaster Type</label>
            <select
              className="input"
              value={form.disasterType}
              onChange={(e) => setForm({ ...form, disasterType: e.target.value })}
            >
              {DISASTER_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Content</label>
            <textarea
              rows={6}
              className="input"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Steps (optional)</label>
            <div className="space-y-2">
              {form.steps.map((step, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input"
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                  />
                  <button type="button" onClick={() => removeStep(i)} className="btn-secondary shrink-0 px-2">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, steps: [...form.steps, ''] })}
                className="flex items-center gap-1 text-xs text-accent-mint hover:underline"
              >
                <Plus size={12} /> Add step
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}


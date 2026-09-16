import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../services/api/reports';
import { DISASTER_TYPES } from '../../shared/disasterTypes.js';
import { validateReportForm } from '../../utils/validators';
import { NotificationContext } from '../../context/NotificationContext.jsx';

export default function ReportForm() {
  const navigate = useNavigate();
  const { notify } = useContext(NotificationContext);
  const [form, setForm] = useState({
    description: '',
    disasterType: 'flood',
    address: '',
    lat: '',
    lng: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateReportForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const location = { address: form.address || undefined };
      if (form.lat !== '' && form.lng !== '') {
        location.lat = Number(form.lat);
        location.lng = Number(form.lng);
      }

      const { report } = await reportsApi.create({
        description: form.description,
        disasterType: form.disasterType,
        location
      });

      notify('Report submitted — the agent is analyzing it now.', 'success');
      navigate(`/reports/${report._id}`);
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to submit report.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      notify('Geolocation is not supported by your browser.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        notify('Location captured.', 'success');
      },
      () => notify('Could not get your location. Enter an address instead.', 'error')
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-text-primary">Submit an Emergency Report</h1>
      <p className="mt-1 text-sm text-text-muted">
        Describe the situation as clearly as possible. An AI agent will triage it and draft a
        response plan for a human responder to review.
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-5">
        <div>
          <label className="label">Disaster type</label>
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
          <label className="label">What's happening?</label>
          <textarea
            rows={4}
            className="input"
            placeholder="e.g. Flash flooding on Main Street, water rising fast near the elementary school, several cars stranded."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {errors.description && <p className="mt-1 text-xs text-status-critical">{errors.description}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0">Location</label>
            <button type="button" onClick={useMyLocation} className="text-xs text-accent-mint hover:underline">
              Use my current location
            </button>
          </div>
          <input
            className="input mt-1"
            placeholder="Address (e.g. 123 Main St, Springfield)"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              className="input"
              placeholder="Latitude"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
            <input
              className="input"
              placeholder="Longitude"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </div>
          {errors.location && <p className="mt-1 text-xs text-status-critical">{errors.location}</p>}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}

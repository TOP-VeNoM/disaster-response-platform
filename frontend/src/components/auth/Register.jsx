import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NotificationContext } from '../../context/NotificationContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'reporter' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      notify('Account created!', 'success');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-sm card">
        <h1 className="text-xl font-bold text-text-primary">Create an account</h1>
        <p className="mt-1 text-sm text-text-muted">Disaster Response Platform</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="reporter">Reporter (submit reports)</option>
              <option value="responder">Responder (review & approve plans)</option>
              <option value="admin">Admin (manage SOPs)</option>
            </select>
            <p className="mt-1 text-xs text-text-muted">
              In a real deployment, role assignment would be admin-controlled, not self-selected. It's
              open here for demo purposes.
            </p>
          </div>

          {error && <p className="text-sm text-status-critical">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-mint hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

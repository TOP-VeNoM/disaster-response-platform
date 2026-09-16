import { useState } from 'react';

export default function ActionButtons({ onApprove, onReject, disabled }) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(null); // 'approve' | 'reject' | null

  async function handle(action, fn) {
    setSubmitting(action);
    try {
      await fn(notes);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        className="input"
        rows={2}
        placeholder="Optional review notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={disabled}
      />
      <div className="flex gap-2">
        <button
          className="btn-success flex-1"
          disabled={disabled || submitting !== null}
          onClick={() => handle('approve', onApprove)}
        >
          {submitting === 'approve' ? 'Approving...' : 'Approve Plan'}
        </button>
        <button
          className="btn-danger flex-1"
          disabled={disabled || submitting !== null}
          onClick={() => handle('reject', onReject)}
        >
          {submitting === 'reject' ? 'Rejecting...' : 'Reject Plan'}
        </button>
      </div>
    </div>
  );
}

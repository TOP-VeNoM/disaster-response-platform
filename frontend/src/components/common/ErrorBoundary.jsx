import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card m-6 border border-status-critical/40 bg-status-critical/10">
          <h2 className="text-lg font-semibold text-status-critical">Something went wrong</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button className="btn-secondary mt-4" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-slate-800 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center font-bold">
                !
              </div>
              <div>
                <h2 className="text-lg font-bold">Application Error Encountered</h2>
                <p className="text-xs text-slate-400">An unexpected component error occurred.</p>
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-red-300 overflow-auto max-h-48 mb-4">
              {this.state.error?.toString()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  sessionStorage.removeItem('docushield_user');
                  sessionStorage.removeItem('docushield_token');
                  localStorage.removeItem('docushield_user');
                  localStorage.removeItem('docushield_token');
                  window.location.href = '/login';
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Reset Session & Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

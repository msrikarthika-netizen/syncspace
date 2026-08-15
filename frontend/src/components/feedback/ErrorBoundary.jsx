import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('UI error boundary caught an error:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[360px] items-center justify-center bg-[#0b0c12] p-6">
        <div className="max-w-md rounded-3xl border border-red-400/20 bg-red-500/[0.07] p-8 text-center shadow-2xl shadow-black/30">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
            <AlertTriangle size={22} />
          </div>
          <h1 className="mt-5 text-lg font-bold text-white">This workspace section could not load</h1>
          <p className="mt-2 text-sm leading-6 text-white/50">Your data has not been changed. Refresh the page to retry the administrative workspace.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#12131b] transition hover:bg-violet-100"
          >
            <RefreshCw size={15} /> Reload workspace
          </button>
        </div>
      </div>
    );
  }
}

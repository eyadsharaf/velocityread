import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort crash screen: one unexpected render/runtime throw would
 * otherwise white-screen the PWA with no way forward. Shows the message and
 * a reload button — reading position is persisted continuously, so a reload
 * loses at most a few words of progress.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('VelocityRead crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="w-full h-full flex flex-col items-center justify-center gap-4 bg-base px-6 text-center"
        >
          <div className="text-text text-lg font-semibold font-sans tracking-tight">
            Something went wrong
          </div>
          <div className="text-text-muted text-sm font-mono max-w-md break-words">
            {this.state.error.message || String(this.state.error)}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md border border-border bg-elevated px-4 h-10 text-text-secondary hover:text-text hover:border-text-dim transition-colors font-mono text-sm select-none"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

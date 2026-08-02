import React from 'react';
import { reportError } from './tauri';

interface Props {
  children: React.ReactNode;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

/** Top-level error boundary: renders a crash screen and reports the error. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportError(error.message, info.componentStack ?? undefined);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.error) {
      return <CrashScreen error={this.state.error} onReload={this.handleReset} />;
    }
    return this.props.children;
  }
}

function CrashScreen({ error, onReload }: { error: Error; onReload: () => void }): React.ReactElement {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1013'
      }}
    >
      <div style={{ maxWidth: '520px', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>💥</div>
        <h2 style={{ fontSize: '18px', color: '#f2b8b8', marginBottom: '8px' }}>OpenRev hit an unexpected error</h2>
        <p style={{ fontSize: '12px', color: '#c9c2c2', marginBottom: '16px' }}>
          The crash has been recorded. You can reload the workspace — your analysis data is safe.
        </p>
        <pre
          className="mono"
          style={{
            fontSize: '11px',
            color: '#e8a3a3',
            backgroundColor: '#12090b',
            padding: '12px',
            borderRadius: '6px',
            overflow: 'auto',
            maxHeight: '160px',
            textAlign: 'left',
            border: '1px solid #4a2525'
          }}
        >
          {error.message}
        </pre>
        <button className="btn btn-primary" onClick={onReload} style={{ marginTop: '16px' }}>
          Reload workspace
        </button>
      </div>
    </div>
  );
}

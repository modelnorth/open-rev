import React, { useCallback, useEffect, useState } from 'react';
import type { AnalysisResult, AnalysisProgress } from './types';
import { isTauri, pickApk, analyzeApk, loadBundledSample, getVersion, APP_VERSION } from './tauri';
import { LoadingScreen } from './components/LoadingScreen';
import { CrashScreen } from './components/CrashScreen';
import { OverviewView } from './components/OverviewView';
import { ResourcesView } from './components/ResourcesView';
import { GraphExplorer } from './components/GraphExplorer';
import { CodeViewer } from './components/CodeViewer';
import { ReportViewer } from './components/ReportViewer';
import './index.css';

type Tab = 'overview' | 'resources' | 'graph' | 'code' | 'report';

export const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({ phase: 'idle' });
  const [version, setVersion] = useState<string>(APP_VERSION);

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion(APP_VERSION));
  }, []);

  const runAnalysis = useCallback(async (loader: () => Promise<AnalysisResult>, name: string) => {
    setProgress({ phase: 'analyzing', stage: `Analyzing ${name}…` });
    try {
      const result = await loader();
      setAnalysis(result);
      setFileName(name);
      setProgress({ phase: 'loaded' });
    } catch (err) {
      setProgress({ phase: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  const openApk = useCallback(async () => {
    if (!isTauri()) {
      setProgress({
        phase: 'error',
        error: 'Opening an APK requires the desktop app. Use "Load sample analysis" in the web preview.'
      });
      return;
    }
    const path = await pickApk();
    if (!path) return;
    await runAnalysis(() => analyzeApk(path), path.split(/[\\/]/).pop() ?? path);
  }, [runAnalysis]);

  const loadSample = useCallback(() => {
    void runAnalysis(() => loadBundledSample(), 'SampleApp.apk (bundled real analysis)');
  }, [runAnalysis]);

  const reset = useCallback(() => {
    setProgress({ phase: 'idle' });
    setAnalysis(null);
    setFileName(null);
  }, []);

  if (progress.phase === 'analyzing') {
    return <LoadingScreen progress={progress} onCancel={reset} />;
  }
  if (progress.phase === 'error') {
    return <CrashScreen error={progress.error ?? 'Unknown error'} onRetry={reset} />;
  }

  const isTauriRuntime = isTauri();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-primary)' }}>
      <header
        style={{
          height: '46px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡ OpenRev</span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 400 }}>{version}</span>
          </div>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Workspace: <strong style={{ color: 'var(--text-primary)' }}>{fileName ?? 'none'}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => void openApk()} disabled={!isTauriRuntime}>
            📂 Open APK…
          </button>
          {!isTauriRuntime && (
            <button className="btn" onClick={loadSample}>
              🧪 Load sample analysis (web preview)
            </button>
          )}
        </div>
      </header>

      {analysis ? (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <nav
            style={{
              width: '170px',
              backgroundColor: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '8px'
            }}
          >
            {(
              [
                ['overview', '📋 Manifest'],
                ['resources', '🗂️ Resources'],
                ['graph', '🕸️ Graph'],
                ['code', '💻 Code'],
                ['report', '📊 Report']
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                className="btn"
                onClick={() => setTab(id)}
                style={{
                  justifyContent: 'flex-start',
                  backgroundColor: tab === id ? 'var(--bg-tertiary)' : 'transparent',
                  color: tab === id ? 'var(--accent-blue)' : 'var(--text-primary)',
                  borderColor: tab === id ? 'var(--accent-blue)' : 'transparent'
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          <main style={{ flex: 1, overflow: 'hidden' }}>
            {tab === 'overview' && <OverviewView analysis={analysis} />}
            {tab === 'resources' && <ResourcesView analysis={analysis} />}
            {tab === 'graph' && <GraphExplorer nodes={analysis.graph.nodes} edges={analysis.graph.edges} />}
            {tab === 'code' && <CodeViewer analysis={analysis} />}
            {tab === 'report' && <ReportViewer analysis={analysis} />}
          </main>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{ fontSize: '44px' }}>⚡</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Open an APK to begin</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '420px', textAlign: 'center' }}>
            {isTauriRuntime
              ? 'Click "Open APK…" and choose a real APK/AAB. Analysis runs the real pipeline (manifest decode, graph, jadx decompile, apktool resource decode).'
              : 'This is the web preview — no filesystem access. Click "Load sample analysis" to view a real analysis (manifest, resources, graph, decompiled code, report).'}
          </div>
          {isTauriRuntime ? (
            <button className="btn btn-primary" onClick={() => void openApk()}>
              📂 Open APK…
            </button>
          ) : (
            <button className="btn btn-primary" onClick={loadSample}>
              🧪 Load sample analysis
            </button>
          )}
        </div>
      )}

      <footer
        style={{
          height: '24px',
          backgroundColor: '#090d13',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>{analysis ? `${analysis.graph.nodes.length} nodes · ${analysis.graph.edges.length} edges` : 'Ready'}</span>
          {analysis && <span>{analysis.permissions.length} permissions</span>}
          {analysis && <span>{analysis.decompiledJavaCount ?? 0} Java files</span>}
        </div>
        <div>
          <span>OpenRev • Apache-2.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

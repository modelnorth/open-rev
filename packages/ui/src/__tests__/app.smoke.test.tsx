import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { SAMPLE_ANALYSIS } from '../sample/sampleAnalysis';
import App from '../App';

vi.mock('../tauri', () => ({
  isTauri: () => true,
  pickApk: vi.fn(async () => 'C:/tests/SampleApp.apk'),
  analyzeApk: vi.fn(async () => SAMPLE_ANALYSIS),
  reportError: vi.fn(async () => undefined),
  getVersion: vi.fn(async () => '0.1.0-alpha.2'),
  loadBundledSample: vi.fn(async () => SAMPLE_ANALYSIS),
  APP_VERSION: '0.1.0-alpha.2'
}));

const consoleErrorSpy = vi.spyOn(console, 'error');

describe('OpenRev desktop UI smoke test', () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('launches, imports a real APK via IPC, and renders every view without console errors', async () => {
    render(<App />);

    // Initial shell: no analysis yet
    expect(screen.getByText(/Open an APK to begin/i)).toBeInTheDocument();

    // "Import a real APK" - the Open APK button drives the Tauri IPC path
    const openButton = screen.getAllByRole('button', { name: /Open APK/i })[0];
    fireEvent.click(openButton);

    // Loading screen appears (progress indicator) then resolves to the analysis
    await waitFor(() => expect(screen.getAllByText(/com\.example\.two_rings/i).length).toBeGreaterThan(0), {
      timeout: 5000
    });

    // Manifest view shows real data
    expect(screen.getAllByText(/com\.example\.two_rings/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/android\.permission\.INTERNET/i)).toBeInTheDocument();

    // Graph view: real nodes/edges
    fireEvent.click(screen.getByRole('button', { name: /Graph/i }));
    expect(await screen.findByText('33 Nodes')).toBeInTheDocument();
    expect(screen.getByText('32 Edges')).toBeInTheDocument();

    // Code view: decompiled source exists
    fireEvent.click(screen.getByRole('button', { name: /Code/i }));
    await waitFor(() => expect(screen.getByText(/Decompiled Sources/i)).toBeInTheDocument());
    expect(screen.getAllByText(/MainActivity\.java/i).length).toBeGreaterThan(0);

    // Resources view: decoded layouts
    fireEvent.click(screen.getByRole('button', { name: /Resources/i }));
    await waitFor(() => expect(screen.getByText(/Layout XMLs/)).toBeInTheDocument());

    // Report view: markdown from real analysis
    fireEvent.click(screen.getByRole('button', { name: /Report/i }));
    await waitFor(() => expect(screen.getAllByText(/Analysis Report/i).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Artifact Knowledge Graph/).length).toBeGreaterThan(0);

    // No console errors during the whole flow
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('shows a crash screen on analysis failure and recovers', async () => {
    const { analyzeApk } = await import('../tauri');
    vi.mocked(analyzeApk).mockRejectedValueOnce(new Error('simulated analysis failure'));

    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /Open APK/i })[0]);

    await waitFor(() => expect(screen.getByText(/Analysis failed/i)).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getByText(/simulated analysis failure/i)).toBeInTheDocument();

    // Workspace recovery: Retry returns to the shell
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(await screen.findByText(/Open an APK to begin/i)).toBeInTheDocument();

    vi.mocked(analyzeApk).mockResolvedValue(SAMPLE_ANALYSIS);
  });
});

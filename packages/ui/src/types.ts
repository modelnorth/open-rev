export interface AnalysisGraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface AnalysisGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
}

export interface DecompiledSource {
  path: string;
  code: string;
}

export interface AnalysisResult {
  filePath: string;
  sha256: string;
  analyzedAt: string;
  packageName: string;
  versionCode: number;
  versionName?: string;
  minSdkVersion?: number;
  targetSdkVersion?: number;
  compileSdkVersion?: number;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
  exportedComponents: string[];
  launchActivity?: string;
  layoutFiles: string[];
  decodedLayouts: string[];
  graph: { nodes: AnalysisGraphNode[]; edges: AnalysisGraphEdge[] };
  decompiledJavaCount?: number;
  decompileSource?: string;
  decompileNote?: string;
  sources: DecompiledSource[];
  reportMarkdown: string;
}

export type AnalysisPhase = 'idle' | 'analyzing' | 'loaded' | 'error';

export interface AnalysisProgress {
  phase: AnalysisPhase;
  stage?: string;
  percent?: number;
  error?: string;
}

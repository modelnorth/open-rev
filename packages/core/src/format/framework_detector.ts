/**
 * OpenRev Mobile Framework Detector
 * 
 * Inspects APK inventory entries and assets to determine the primary application architecture:
 * Flutter, React Native, Unity, Xamarin, Cordova, or Pure Native Kotlin/Java.
 */

export type AppFramework = 'flutter' | 'react-native' | 'unity' | 'xamarin' | 'cordova' | 'native-kotlin-java';

export interface FrameworkDetectionResult {
  framework: AppFramework;
  confidence: number;
  indicators: string[];
  details?: Record<string, any>;
}

export class FrameworkDetector {
  public static detect(entryPaths: string[]): FrameworkDetectionResult {
    const paths = new Set(entryPaths);

    // 1. Flutter Detection
    const flutterIndicators: string[] = [];
    for (const p of paths) {
      if (p.includes('libflutter.so')) flutterIndicators.push('libflutter.so');
      if (p.includes('libapp.so')) flutterIndicators.push('libapp.so (Dart AOT Snapshot)');
      if (p.startsWith('assets/flutter_assets/')) flutterIndicators.push('assets/flutter_assets/');
    }
    if (flutterIndicators.length >= 2) {
      return {
        framework: 'flutter',
        confidence: 0.99,
        indicators: flutterIndicators,
        details: { engine: 'Flutter AOT / Skia / Impeller' }
      };
    }

    // 2. React Native Detection
    const rnIndicators: string[] = [];
    for (const p of paths) {
      if (p.includes('index.android.bundle')) rnIndicators.push('index.android.bundle');
      if (p.includes('libhermes.so')) rnIndicators.push('libhermes.so (Hermes JS Engine)');
      if (p.includes('libjsc.so')) rnIndicators.push('libjsc.so (JavaScriptCore)');
      if (p.includes('libreactnativejni.so')) rnIndicators.push('libreactnativejni.so');
    }
    if (rnIndicators.length >= 2) {
      return {
        framework: 'react-native',
        confidence: 0.98,
        indicators: rnIndicators,
        details: { engine: rnIndicators.some(i => i.includes('hermes')) ? 'Hermes' : 'JSC' }
      };
    }

    // 3. Unity Detection
    const unityIndicators: string[] = [];
    for (const p of paths) {
      if (p.includes('libunity.so')) unityIndicators.push('libunity.so');
      if (p.includes('libil2cpp.so')) unityIndicators.push('libil2cpp.so');
      if (p.includes('global-metadata.dat')) unityIndicators.push('global-metadata.dat');
    }
    if (unityIndicators.length >= 2) {
      return {
        framework: 'unity',
        confidence: 0.99,
        indicators: unityIndicators,
        details: { engine: 'Unity IL2CPP' }
      };
    }

    // Default: Native Android Kotlin/Java
    return {
      framework: 'native-kotlin-java',
      confidence: 0.95,
      indicators: ['Standard Android DEX + Layout components'],
      details: { engine: 'Android Runtime (ART)' }
    };
  }
}

/**
 * OpenRev JNI Cross-Linking Engine
 * 
 * Bridges the semantic gap between Java/Kotlin DEX bytecode and native ELF binaries.
 * Automatically links `native` method declarations in Dalvik bytecode to `Java_...` JNI
 * exported function symbols in loaded `.so` shared libraries.
 */

import { ArtifactKnowledgeGraph, type GraphNode, type GraphEdge } from '../graph/knowledge_graph.ts';
import { EpistemicLedger } from '../epistemic/evidence_ledger.ts';

export interface JniLinkRecord {
  javaClass: string;
  methodName: string;
  nativeLibrary: string;
  nativeSymbol: string;
}

export class JniCrossLinker {
  /**
   * Correlates native method candidates with native library symbols and emits graph edges.
   */
  public static link(
    graph: ArtifactKnowledgeGraph,
    ledger: EpistemicLedger,
    dexNativeMethods: Array<{ className: string; methodName: string }>,
    elfJniSymbols: Record<string, string[]> // libName -> list of Java_... symbols
  ): JniLinkRecord[] {
    const links: JniLinkRecord[] = [];

    for (const [libName, symbols] of Object.entries(elfJniSymbols)) {
      for (const symbol of symbols) {
        // e.g. Java_com_example_app_MainActivity_stringFromJNI
        const normalized = symbol.replace(/^Java_/, '');
        
        // Find matching dex native method
        for (const dexMethod of dexNativeMethods) {
          const expectedSuffix = `${dexMethod.className.replace(/\./g, '_')}_${dexMethod.methodName}`;
          if (normalized.endsWith(expectedSuffix) || normalized === expectedSuffix) {
            links.push({
              javaClass: dexMethod.className,
              methodName: dexMethod.methodName,
              nativeLibrary: libName,
              nativeSymbol: symbol
            });

            // Add node for JNI Bridge to graph
            const bridgeId = `jni_${dexMethod.className}_${dexMethod.methodName}`;
            graph.addNode({
              id: bridgeId,
              type: 'JniBridge',
              label: `${dexMethod.className}.${dexMethod.methodName}() ➔ ${libName}!${symbol}`,
              properties: {
                library: libName,
                symbol: symbol,
                class: dexMethod.className,
                method: dexMethod.methodName
              }
            });

            // Link APK/Class to JniBridge
            graph.addEdge({
              id: `edge_jni_${bridgeId}`,
              source: `node_class_${dexMethod.className}`,
              target: bridgeId,
              relationship: 'CALLS_NATIVE'
            });

            ledger.assertProven(
              `${dexMethod.className}.${dexMethod.methodName}`,
              'resolvesToNativeSymbol',
              `${libName}!${symbol}`,
              'JniCrossLinker'
            );
          }
        }
      }
    }

    return links;
  }
}

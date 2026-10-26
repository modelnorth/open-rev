/**
 * OpenRev Epistemic Evidence Ledger Standard
 * 
 * Inspired by frontier reasoning and epistemic calibration:
 * Explicitly separates what is strictly PROVEN, what is INFERRED,
 * and what is UNOBSERVED / UNKNOWN.
 * 
 * Never fabricates certainty. Tracks scan bounds, coverage, and limitations.
 */

export type EvidenceModality = 'proven' | 'inferred' | 'unobserved';

export interface EvidenceAssertion<T = any> {
  subject: string;
  predicate: string;
  value: T;
  modality: EvidenceModality;
  confidence: number; // 0.0 to 1.0 (proven = 1.0)
  source: string; // Tool / Parser / Rule name
  byteRange?: { offset: number; length: number };
  rationale?: string;
}

export interface ScanCoverageReport {
  target: string;
  totalBytes: number;
  analyzedBytes: number;
  coverageRatio: number; // 0.0 - 1.0
  parsedSections: string[];
  skippedSections: Array<{ name: string; reason: string }>;
  failureEnvelope?: string[];
}

export class EpistemicLedger {
  private assertions: EvidenceAssertion[] = [];
  private skipped: Array<{ name: string; reason: string }> = [];

  public assertProven<T>(subject: string, predicate: string, value: T, source: string, byteRange?: { offset: number; length: number }): void {
    this.assertions.push({
      subject,
      predicate,
      value,
      modality: 'proven',
      confidence: 1.0,
      source,
      byteRange
    });
  }

  public assertInferred<T>(subject: string, predicate: string, value: T, source: string, confidence: number, rationale: string): void {
    this.assertions.push({
      subject,
      predicate,
      value,
      modality: 'inferred',
      confidence: Math.min(Math.max(confidence, 0.0), 0.99),
      source,
      rationale
    });
  }

  public recordSkipped(section: string, reason: string): void {
    this.skipped.push({ name: section, reason });
  }

  public getAssertions(): EvidenceAssertion[] {
    return [...this.assertions];
  }

  public getAssertionsByModality(modality: EvidenceModality): EvidenceAssertion[] {
    return this.assertions.filter(a => a.modality === modality);
  }

  public generateCoverage(target: string, totalBytes: number, analyzedBytes: number, parsedSections: string[]): ScanCoverageReport {
    return {
      target,
      totalBytes,
      analyzedBytes,
      coverageRatio: totalBytes > 0 ? Number((analyzedBytes / totalBytes).toFixed(4)) : 0,
      parsedSections,
      skippedSections: [...this.skipped]
    };
  }
}

/**
 * OpenRev Security Sanitizer Engine
 * 
 * Protects against Path Traversal, Zip Slip vulnerabilities, malformed archive extraction,
 * and unauthorized access outside the workspace root.
 */

import { OpenRevError } from '../errors/openrev_error.ts';

export class SecuritySanitizer {
  /**
   * Sanitizes and validates a target file path against directory traversal attacks.
   */
  public static sanitizePath(targetPath: string, allowedBaseDir: string = '.'): string {
    if (!targetPath || typeof targetPath !== 'string') {
      throw OpenRevError.pathTraversal(String(targetPath));
    }

    const normalizedTarget = targetPath.replace(/\\/g, '/');
    if (normalizedTarget.includes('../') || normalizedTarget.includes('..\\')) {
      throw OpenRevError.pathTraversal(targetPath);
    }

    return normalizedTarget;
  }

  /**
   * Validates archive entries to prevent Zip Slip vulnerability during extraction.
   */
  public static validateZipEntry(entryName: string): string {
    if (!entryName || typeof entryName !== 'string') {
      throw OpenRevError.zipSlip(String(entryName));
    }

    const normalizedEntry = entryName.replace(/\\/g, '/');
    if (normalizedEntry.includes('../') || normalizedEntry.startsWith('/') || normalizedEntry.includes(':')) {
      throw OpenRevError.zipSlip(entryName);
    }

    return normalizedEntry;
  }

  /**
   * Checks file size limit before parsing to prevent Memory Exhaustion / OOM crashes.
   */
  public static validateFileSize(sizeBytes: number, maxAllowedBytes: number = 500 * 1024 * 1024): void {
    if (sizeBytes > maxAllowedBytes) {
      throw new OpenRevError({
        code: 'FILE_TOO_LARGE',
        message: `File size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds limit (${maxAllowedBytes / (1024 * 1024)} MB).`,
        cause: 'Target archive or binary is too large for single-pass memory parsing.',
        remediation: 'Increase maxAllowedBytes configuration or process binary in streaming mode.'
      });
    }
  }
}

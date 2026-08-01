/**
 * OpenRev Production Error Handling System
 * 
 * Every public API and engine operation returns structured, typed errors
 * containing an error code, message, underlying cause, and actionable remediation instructions.
 */

export type OpenRevErrorCode =
  | 'PATH_TRAVERSAL_DETECTED'
  | 'ZIP_SLIP_ATTEMPT'
  | 'MALFORMED_APK'
  | 'FILE_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'PROVIDER_EXECUTION_FAILED'
  | 'PROVIDER_NOT_FOUND'
  | 'CAPABILITY_NOT_FOUND'
  | 'CAPABILITY_EXECUTION_FAILED'
  | 'ARTIFACT_CORRUPTED'
  | 'ARTIFACT_NOT_FOUND'
  | 'GRAPH_NODE_NOT_FOUND'
  | 'GRAPH_QUERY_FAILED'
  | 'PERMISSION_DENIED'
  | 'PROCESS_CRASHED'
  | 'WORKSPACE_SAVE_FAILED'
  | 'WORKSPACE_RESTORE_FAILED';

export interface ErrorDetails {
  code: OpenRevErrorCode;
  message: string;
  cause?: string;
  remediation?: string;
  context?: Record<string, any>;
}

export class OpenRevError extends Error {
  public readonly code: OpenRevErrorCode;
  public readonly causeDetails?: string;
  public readonly remediation?: string;
  public readonly context?: Record<string, any>;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'OpenRevError';
    this.code = details.code;
    this.causeDetails = details.cause;
    this.remediation = details.remediation;
    this.context = details.context;

    Object.setPrototypeOf(this, OpenRevError.prototype);
  }

  public toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      cause: this.causeDetails,
      remediation: this.remediation,
      context: this.context
    };
  }

  public static pathTraversal(path: string): OpenRevError {
    return new OpenRevError({
      code: 'PATH_TRAVERSAL_DETECTED',
      message: `Path traversal attempt detected in target path: "${path}"`,
      cause: 'The target file path contains parent directory references ("..") or invalid characters.',
      remediation: 'Ensure target paths remain strictly inside the allowed workspace directory.'
    });
  }

  public static zipSlip(entryName: string): OpenRevError {
    return new OpenRevError({
      code: 'ZIP_SLIP_ATTEMPT',
      message: `Zip Slip vulnerability attempt detected in entry: "${entryName}"`,
      cause: 'The archive entry attempts to extract outside the designated target folder.',
      remediation: 'Sanitize archive entries to prevent extraction outside target root.'
    });
  }

  public static providerFailed(providerId: string, errorMsg: string): OpenRevError {
    return new OpenRevError({
      code: 'PROVIDER_EXECUTION_FAILED',
      message: `Provider "${providerId}" failed during execution.`,
      cause: errorMsg,
      remediation: 'Verify binary path, health checks, and target file permissions.'
    });
  }

  public static capabilityNotFound(capabilityId: string): OpenRevError {
    return new OpenRevError({
      code: 'CAPABILITY_NOT_FOUND',
      message: `Capability "${capabilityId}" is not registered.`,
      cause: 'No provider has registered a handler for this capability contract.',
      remediation: 'Ensure the necessary provider plugin is loaded in openrev.config.ts.'
    });
  }
}

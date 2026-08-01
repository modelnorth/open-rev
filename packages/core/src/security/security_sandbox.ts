/**
 * OpenRev Security Sandbox & Permission Policy Model
 * 
 * Enforces fine-grained permission controls across Plugins, Providers, Workflows, and AI Tools.
 */

export type PlatformPermission =
  | 'fs.read'
  | 'fs.write'
  | 'network.http'
  | 'device.adb'
  | 'process.execute'
  | 'ai.query';

export interface SecurityPolicy {
  subjectId: string;
  allowedPermissions: Set<PlatformPermission>;
}

export class SecuritySandbox {
  private policies: Map<string, SecurityPolicy> = new Map();

  public setPolicy(subjectId: string, permissions: PlatformPermission[]): void {
    this.policies.set(subjectId, {
      subjectId,
      allowedPermissions: new Set(permissions)
    });
  }

  public checkPermission(subjectId: string, permission: PlatformPermission): boolean {
    const policy = this.policies.get(subjectId);
    if (!policy) {
      console.warn(`[SecuritySandbox] Permission denied for ${subjectId} (No policy configured)`);
      return false;
    }

    const granted = policy.allowedPermissions.has(permission);
    if (!granted) {
      console.warn(`[SecuritySandbox] Permission ${permission} DENIED for subject: ${subjectId}`);
    }
    return granted;
  }
}

/**
 * OpenRev Universal Android Multi-Version Compatibility Matrix
 * 
 * Supports all Android API levels from API 14 (Android 4.0 Ice Cream Sandwich)
 * through API 36 (Android 16 Vanilla Ice Cream & Android 15 Vanilla Ice Cream),
 * covering permissions, security models, multi-dex, Scoped Storage, and 16KB page alignment.
 */

export interface AndroidApiMetadata {
  apiLevel: number;
  codename: string;
  versionName: string;
  releaseYear: number;
  securityMilestones: string[];
  dexMagicVersions: string[];
}

export const ANDROID_API_REGISTRY: Record<number, AndroidApiMetadata> = {
  14: { apiLevel: 14, codename: 'Ice Cream Sandwich', versionName: '4.0', releaseYear: 2011, securityMilestones: ['ASLR initial support'], dexMagicVersions: ['035'] },
  19: { apiLevel: 19, codename: 'KitKat', versionName: '4.4', releaseYear: 2013, securityMilestones: ['SELinux Enforcing mode introduced'], dexMagicVersions: ['035'] },
  21: { apiLevel: 21, codename: 'Lollipop', versionName: '5.0', releaseYear: 2014, securityMilestones: ['ART replaces Dalvik default', 'Multi-DEX support'], dexMagicVersions: ['035'] },
  23: { apiLevel: 23, codename: 'Marshmallow', versionName: '6.0', releaseYear: 2015, securityMilestones: ['Runtime permissions model', 'App Standby'], dexMagicVersions: ['035'] },
  24: { apiLevel: 24, codename: 'Nougat', versionName: '7.0', releaseYear: 2016, securityMilestones: ['File-based encryption', 'Network Security Config'], dexMagicVersions: ['037', '038'] },
  26: { apiLevel: 26, codename: 'Oreo', versionName: '8.0', releaseYear: 2017, securityMilestones: ['Background execution limits', 'OEM crypto isolation'], dexMagicVersions: ['038', '039'] },
  28: { apiLevel: 28, codename: 'Pie', versionName: '9.0', releaseYear: 2018, securityMilestones: ['Cleartext HTTP blocked by default', 'BiometricPrompt'], dexMagicVersions: ['039'] },
  29: { apiLevel: 29, codename: 'Android 10', versionName: '10.0', releaseYear: 2019, securityMilestones: ['Scoped Storage introduced', 'TLS 1.3 default'], dexMagicVersions: ['039'] },
  30: { apiLevel: 30, codename: 'Android 11', versionName: '11.0', releaseYear: 2020, securityMilestones: ['Enforced Scoped Storage', 'One-time permissions', 'Package visibility filtering (<queries>)'], dexMagicVersions: ['039'] },
  31: { apiLevel: 31, codename: 'Android 12', versionName: '12.0', releaseYear: 2021, securityMilestones: ['Mandatory android:exported on components', 'PendingIntent mutability flags'], dexMagicVersions: ['039'] },
  33: { apiLevel: 33, codename: 'Android 13', versionName: '13.0', releaseYear: 2022, securityMilestones: ['POST_NOTIFICATIONS permission', 'Granular media permissions'], dexMagicVersions: ['039', '040'] },
  34: { apiLevel: 34, codename: 'Android 14', versionName: '14.0', releaseYear: 2023, securityMilestones: ['Strict BroadcastReceiver export flags', 'Minimum installable targetSdk 23'], dexMagicVersions: ['040'] },
  35: { apiLevel: 35, codename: 'Android 15', versionName: '15.0', releaseYear: 2024, securityMilestones: ['16 KB page size support required for native libs', 'Private Space isolation'], dexMagicVersions: ['040', '041'] },
  36: { apiLevel: 36, codename: 'Android 16', versionName: '16.0', releaseYear: 2025, securityMilestones: ['Embedded Photo Picker expansion', 'Advanced Health/Security sandboxes'], dexMagicVersions: ['041'] }
};

export class AndroidVersionAuditor {
  public static auditTarget(minSdk?: number, targetSdk?: number): {
    compatibilityScore: number;
    warnings: string[];
    securityGaps: string[];
  } {
    const warnings: string[] = [];
    const securityGaps: string[] = [];

    if (!targetSdk) {
      warnings.push('APK does not explicitly specify targetSdkVersion');
      return { compatibilityScore: 50, warnings, securityGaps };
    }

    const targetInfo = ANDROID_API_REGISTRY[targetSdk];

    // Check for critical modern security milestones
    if (targetSdk < 31) {
      securityGaps.push('targetSdkVersion < 31: Missing mandatory exported attribute validation for components');
    }
    if (targetSdk < 28) {
      securityGaps.push('targetSdkVersion < 28: Cleartext HTTP traffic is permitted by default');
    }
    if (targetSdk < 23) {
      securityGaps.push('targetSdkVersion < 23: Legacy permissions model without runtime user consent prompts');
    }

    if (minSdk && minSdk < 21) {
      warnings.push(`minSdkVersion ${minSdk} requires legacy multidex support and Dalvik fallback execution`);
    }

    const compatibilityScore = Math.max(10, 100 - (securityGaps.length * 20) - (warnings.length * 10));

    return {
      compatibilityScore,
      warnings,
      securityGaps
    };
  }
}

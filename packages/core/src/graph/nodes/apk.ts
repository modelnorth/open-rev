export interface ApkNode {
  id: string;
  type: 'APK';
  label: string;
  package: string;
  versionName: string;
  versionCode: number;
  sizeBytes: number;
  minSdkVersion: number;
  targetSdkVersion: number;
  sha256: string;
}

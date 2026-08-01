/**
 * Apktool Adapter
 */
export class ApktoolAdapter {
  public static readonly toolId = 'apktool';
  public static readonly version = '2.9.3';

  public async decode(apkPath: string, outputDir: string): Promise<{ success: boolean }> {
    console.log(`[ApktoolAdapter] Decoding APK resources to ${outputDir}`);
    return { success: true };
  }
}

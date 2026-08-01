/**
 * ADB Device Adapter
 */
export class AdbAdapter {
  public static readonly toolId = 'adb';
  public static readonly version = '1.0.41';

  public async listDevices(): Promise<string[]> {
    return ['emulator-5554 (Android 14 API 34)', 'device_usb_001 (Android 13)'];
  }

  public async streamLogcat(deviceId: string, onLog: (line: string) => void): Promise<void> {
    onLog(`[ADB:${deviceId}] Started logcat stream...`);
  }
}

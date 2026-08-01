import { PluginEntry } from './registry';

export class PluginInstaller {
  private installedPlugins: Map<string, PluginEntry> = new Map();

  public async installPlugin(plugin: PluginEntry): Promise<boolean> {
    console.log(`[PluginInstaller] Downloading & extracting plugin: ${plugin.id} (${plugin.version}) from ${plugin.downloadUrl}`);
    this.installedPlugins.set(plugin.id, plugin);
    return true;
  }

  public getInstalledPlugins(): PluginEntry[] {
    return Array.from(this.installedPlugins.values());
  }
}

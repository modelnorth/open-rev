import { PluginEntry } from './registry';
import { OpenRevError, OpenRevErrorCode } from '../../core/src/errors/openrev_error.ts';

/**
 * PluginInstaller — EXPERIMENTAL.
 *
 * The marketplace plugin download/install pipeline is not implemented.
 * installPlugin() never pretends to download or extract: it returns an honest
 * error explaining the gap. Tracking installed plugins is limited to the
 * in-memory registry returned by getInstalledPlugins() (which only reflects
 * plugins registered in code, not real installs).
 */
export class PluginInstaller {
  private installedPlugins: Map<string, PluginEntry> = new Map();

  public async installPlugin(plugin: PluginEntry): Promise<boolean> {
    throw new OpenRevError({
      code: OpenRevErrorCode.CAPABILITY_NOT_FOUND,
      message: `Marketplace install is experimental and not implemented: ${plugin.id}@${plugin.version}`,
      cause: 'Plugin download, verification, and extraction are not implemented.',
      remediation: 'Install plugins by adding them to the registry directly, or wait for the marketplace installer.'
    });
  }

  public getInstalledPlugins(): PluginEntry[] {
    return Array.from(this.installedPlugins.values());
  }
}

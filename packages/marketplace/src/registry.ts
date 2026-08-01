export interface PluginEntry {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  downloadUrl: string;
  category: 'static' | 'runtime' | 'native' | 'network' | 'ai' | 'visualization';
  downloadsCount: number;
}

export class MarketplaceRegistry {
  private catalog: PluginEntry[] = [
    {
      id: 'plugin-flutter-re',
      name: 'reFlutter Decompiler Plugin',
      version: '1.2.0',
      author: 'Impact-I',
      description: 'Reverse engineering support for Flutter / Dart binaries',
      downloadUrl: 'https://marketplace.openrev.io/plugins/flutter-re.tar.gz',
      category: 'native',
      downloadsCount: 1420
    },
    {
      id: 'plugin-apkmux',
      name: 'APK-MITM Auto-Patcher',
      version: '2.1.0',
      author: 'ShroudedCode',
      description: 'Patches HTTPS network security config in APK binaries',
      downloadUrl: 'https://marketplace.openrev.io/plugins/apk-mitm.tar.gz',
      category: 'network',
      downloadsCount: 3890
    }
  ];

  public listCatalog(): PluginEntry[] {
    return this.catalog;
  }

  public search(query: string): PluginEntry[] {
    const q = query.toLowerCase();
    return this.catalog.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
}

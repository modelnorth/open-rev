/**
 * OpenRev Plugin Generator Scaffolder
 * 
 * Provides template generator for CLI command `openrev create-plugin <plugin-name>`
 */

export function createPluginScaffold(pluginName: string): Record<string, string> {
  const normalizedId = pluginName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  return {
    'package.json': JSON.stringify(
      {
        name: `openrev-plugin-${normalizedId}`,
        version: '1.0.0',
        description: `OpenRev Plugin: ${pluginName}`,
        main: 'src/index.ts',
        dependencies: {
          '@openrev/plugin-sdk': '^1.0.0'
        }
      },
      null,
      2
    ),
    'src/index.ts': `import { PluginContext } from '@openrev/plugin-sdk';

export function initializePlugin(context: PluginContext): void {
  console.log('Initializing plugin: ${pluginName}');
  
  context.registerCapability({
    id: '${normalizedId}.main_capability',
    name: '${pluginName} Capability',
    category: 'static',
    description: 'Custom capability for ${pluginName}',
    inputTypes: ['application/json'],
    outputTypes: ['application/json']
  });
}
`,
    'README.md': `# OpenRev Plugin: ${pluginName}

This plugin extends OpenRev with custom software intelligence capabilities.

## Installation
Drop into \`~/.openrev/plugins/\` or install via the OpenRev Marketplace.
`
  };
}

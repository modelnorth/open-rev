import { PluginContext } from '@openrev/plugin-sdk';

export function initializePlugin(context: PluginContext): void {
  context.registerCapability({
    id: 'static.analyze_apk',
    name: 'Static APK Analysis',
    category: 'static',
    description: 'Decodes AndroidManifest.xml and extracts package components',
    inputTypes: ['application/vnd.android.package-archive'],
    outputTypes: ['application/json']
  });

  context.registerPanel({
    id: 'panel_decompiler',
    title: 'Decompiler View',
    icon: 'code',
    location: 'main',
    componentName: 'CodeEditor'
  });
}

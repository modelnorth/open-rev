# Plugin SDK Documentation

The `@openrev/plugin-sdk` package enables third-party developers to extend OpenRev without modifying core platform code.

---

## Registration Hooks Exposed

```typescript
import { PluginContext } from '@openrev/plugin-sdk';

export function initializePlugin(context: PluginContext): void {
  // 1. Register Capability
  context.registerCapability({
    id: 'myplugin.extract_keys',
    name: 'Extract Secret Keys',
    category: 'static',
    description: 'Scans decompiled sources for API secret keys',
    inputTypes: ['application/json'],
    outputTypes: ['application/json']
  });

  // 2. Register Custom UI Panel
  context.registerPanel({
    id: 'panel_key_inspector',
    title: 'Secret Key Inspector',
    icon: 'key',
    location: 'sidebar',
    componentName: 'KeyInspectorPanel'
  });

  // 3. Register Custom Graph Node Type
  context.registerGraphNode({
    type: 'SecretKey',
    label: 'API Key Finding',
    color: '#f85149',
    icon: 'lock',
    attributes: { keyType: 'string', entropy: 'number' }
  });
}
```

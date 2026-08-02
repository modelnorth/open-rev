/**
 * OpenRev AndroidManifest Extractor
 *
 * Walks a decoded AXML element tree (from AxmlDecoder) and produces typed,
 * normalized manifest data: package identity, permissions, components
 * (activities, services, receivers, providers), intent filters, and metadata.
 *
 * This runs entirely on data decoded from the real APK binary manifest.
 */

import { AxmlDecoder, type XmlElement } from './axml_decoder.ts';

export interface ManifestApplication {
  name?: string;
  label?: string;
  allowBackup?: boolean;
  icon?: string;
  theme?: string;
  usesCleartextTraffic?: boolean;
  networkSecurityConfig?: string;
}

export interface IntentFilter {
  actions: string[];
  categories: string[];
  dataSchemes: string[];
  dataHosts: string[];
  dataPaths: string[];
  mimeTypes: string[];
}

export interface ManifestComponent {
  name: string;
  exported: boolean;
  permission?: string;
  process?: string;
  intentFilters: IntentFilter[];
  metaData: Record<string, string>;
}

export interface ManifestProvider {
  name: string;
  exported: boolean;
  authorities?: string;
  permission?: string;
  metaData: Record<string, string>;
}

export interface DecodedManifest {
  packageName: string;
  versionCode: number;
  versionName?: string;
  compileSdkVersion?: number;
  minSdkVersion?: number;
  targetSdkVersion?: number;
  application?: ManifestApplication;
  usesPermissions: string[];
  requestedFeatures: string[];
  usesLibraries: string[];
  activities: ManifestComponent[];
  services: ManifestComponent[];
  receivers: ManifestComponent[];
  providers: ManifestProvider[];
}

export class ManifestExtractor {
  private static attr(element: XmlElement, name: string): string | undefined {
    const a = element.attributes.find((x) => x.name === name);
    return a?.value;
  }

  private static boolAttr(element: XmlElement, name: string): boolean | undefined {
    const a = element.attributes.find((x) => x.name === name);
    if (!a) return undefined;
    return a.value === 'true';
  }

  private static intAttr(element: XmlElement, name: string): number | undefined {
    const a = element.attributes.find((x) => x.name === name);
    if (!a || a.value === undefined) return undefined;
    const n = parseInt(a.value, 10);
    return Number.isFinite(n) ? n : undefined;
  }

  private static collectElements(root: XmlElement): XmlElement[] {
    const out: XmlElement[] = [];
    const walk = (e: XmlElement) => {
      for (const c of e.children) {
        out.push(c);
        walk(c);
      }
    };
    walk(root);
    return out;
  }

  private static extractIntentFilters(children: XmlElement[]): IntentFilter[] {
    const filters: IntentFilter[] = [];
    for (const child of children) {
      if (child.tag !== 'intent-filter') continue;
      const filter: IntentFilter = {
        actions: [],
        categories: [],
        dataSchemes: [],
        dataHosts: [],
        dataPaths: [],
        mimeTypes: []
      };
      for (const sub of child.children) {
        switch (sub.tag) {
          case 'action':
            filter.actions.push(this.attr(sub, 'name') ?? '');
            break;
          case 'category':
            filter.categories.push(this.attr(sub, 'name') ?? '');
            break;
          case 'data':
            if (sub.attributes.some((a) => a.name === 'scheme')) filter.dataSchemes.push(this.attr(sub, 'scheme') ?? '');
            if (sub.attributes.some((a) => a.name === 'host')) filter.dataHosts.push(this.attr(sub, 'host') ?? '');
            if (sub.attributes.some((a) => a.name === 'path')) filter.dataPaths.push(this.attr(sub, 'path') ?? '');
            if (sub.attributes.some((a) => a.name === 'mimeType')) filter.mimeTypes.push(this.attr(sub, 'mimeType') ?? '');
            break;
        }
      }
      filters.push(filter);
    }
    return filters;
  }

  private static extractMetaData(children: XmlElement[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const child of children) {
      if (child.tag !== 'meta-data') continue;
      const name = this.attr(child, 'name');
      if (!name) continue;
      out[name] = this.attr(child, 'value') ?? this.attr(child, 'resource') ?? '';
    }
    return out;
  }

  public static fromBuffer(data: Buffer): DecodedManifest {
    const xml = AxmlDecoder.decode(data);
    return ManifestExtractor.fromXml(xml.root);
  }

  public static fromXml(root: XmlElement): DecodedManifest {
    if (root.tag !== 'manifest') {
      throw new Error(`Expected <manifest> root, got <${root.tag}>`);
    }

    const all = this.collectElements(root);

    const getInt = (e: XmlElement | undefined, name: string): number | undefined => (e ? this.intAttr(e, name) : undefined);

    const application = all.find((e) => e.tag === 'application');
    const usesSdk = all.find((e) => e.tag === 'uses-sdk');
    const usesPermissions = all
      .filter((e) => e.tag === 'uses-permission')
      .map((e) => this.attr(e, 'name'))
      .filter((n): n is string => !!n);

    const requestedFeatures = all
      .filter((e) => e.tag === 'uses-feature')
      .map((e) => this.attr(e, 'name'))
      .filter((n): n is string => !!n);

    const usesLibraries = all
      .filter((e) => e.tag === 'uses-library')
      .map((e) => this.attr(e, 'name'))
      .filter((n): n is string => !!n);

    const mapComponent = (e: XmlElement): ManifestComponent => ({
      name: this.attr(e, 'name') ?? '',
      exported: this.boolAttr(e, 'exported') ?? false,
      permission: this.attr(e, 'permission'),
      process: this.attr(e, 'process'),
      intentFilters: this.extractIntentFilters(e.children),
      metaData: this.extractMetaData(e.children)
    });

    const mapProvider = (e: XmlElement): ManifestProvider => ({
      name: this.attr(e, 'name') ?? '',
      exported: this.boolAttr(e, 'exported') ?? false,
      authorities: this.attr(e, 'authorities'),
      permission: this.attr(e, 'permission'),
      metaData: this.extractMetaData(e.children)
    });

    const activities = all.filter((e) => e.tag === 'activity').map(mapComponent);
    const services = all.filter((e) => e.tag === 'service').map(mapComponent);
    const receivers = all.filter((e) => e.tag === 'receiver').map(mapComponent);
    const providers = all.filter((e) => e.tag === 'provider').map(mapProvider);

    return {
      packageName: this.attr(root, 'package') ?? '',
      versionCode: getInt(root, 'versionCode') ?? 0,
      versionName: this.attr(root, 'versionName'),
      compileSdkVersion: getInt(root, 'compileSdkVersion'),
      minSdkVersion: getInt(usesSdk, 'minSdkVersion') ?? getInt(application, 'minSdkVersion'),
      targetSdkVersion: getInt(usesSdk, 'targetSdkVersion') ?? getInt(application, 'targetSdkVersion'),
      application: application
        ? {
            name: this.attr(application, 'name'),
            label: this.attr(application, 'label'),
            allowBackup: this.boolAttr(application, 'allowBackup'),
            icon: this.attr(application, 'icon'),
            theme: this.attr(application, 'theme'),
            usesCleartextTraffic: this.boolAttr(application, 'usesCleartextTraffic'),
            networkSecurityConfig: this.attr(application, 'networkSecurityConfig')
          }
        : undefined,
      usesPermissions,
      requestedFeatures,
      usesLibraries,
      activities,
      services,
      receivers,
      providers
    };
  }

  public static exportedComponents(m: DecodedManifest): ManifestComponent[] {
    return [...m.activities, ...m.services, ...m.receivers].filter((c) => c.exported);
  }

  public static findActivitiesUsingPermission(m: DecodedManifest, permission: string): ManifestComponent[] {
    return m.activities.filter((a) => a.permission === permission || a.exported);
  }
}

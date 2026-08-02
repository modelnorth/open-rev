export const SAMPLE_ANALYSIS = {
  "filePath": "tests/fixtures/SampleApp.apk",
  "sha256": "c4064367448fe5631ee3075580213f26c603164d79442725e4e065cc29c15c4a",
  "analyzedAt": "2026-08-02T17:11:54.910Z",
  "packageName": "com.example.two_rings",
  "versionCode": 1,
  "versionName": "1.0.0",
  "minSdkVersion": 24,
  "targetSdkVersion": 36,
  "compileSdkVersion": 36,
  "permissions": [
    "android.permission.INTERNET",
    "android.permission.ACCESS_NETWORK_STATE",
    "android.permission.WAKE_LOCK",
    "com.google.android.gms.permission.AD_ID",
    "android.permission.ACCESS_ADSERVICES_ATTRIBUTION",
    "android.permission.ACCESS_ADSERVICES_AD_ID",
    "com.google.android.c2dm.permission.RECEIVE",
    "com.android.vending.BILLING",
    "com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE",
    "com.google.android.providers.gsf.permission.READ_GSERVICES",
    "com.example.two_rings.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
  ],
  "activities": [
    "com.example.two_rings.MainActivity",
    "com.google.firebase.auth.internal.GenericIdpActivity",
    "com.google.firebase.auth.internal.RecaptchaActivity",
    "com.google.android.gms.auth.api.signin.internal.SignInHubActivity",
    "com.revenuecat.purchases.amazon.purchasing.ProxyAmazonBillingActivity",
    "com.revenuecat.purchases.SimulatedStoreErrorDialogActivity",
    "com.android.billingclient.api.ProxyBillingActivity",
    "com.android.billingclient.api.ProxyBillingActivityV2",
    "com.google.android.gms.common.api.GoogleApiActivity"
  ],
  "services": [
    "com.google.firebase.components.ComponentDiscoveryService",
    "com.google.firebase.sessions.SessionLifecycleService",
    "com.google.android.gms.auth.api.signin.RevocationBoundService",
    "com.google.android.gms.measurement.AppMeasurementService",
    "com.google.android.gms.measurement.AppMeasurementJobService",
    "com.google.android.datatransport.runtime.backends.TransportBackendDiscovery",
    "com.google.android.datatransport.runtime.scheduling.jobscheduling.JobInfoSchedulerService"
  ],
  "receivers": [
    "com.amazon.device.iap.ResponseReceiver",
    "com.google.android.gms.measurement.AppMeasurementReceiver",
    "androidx.profileinstaller.ProfileInstallReceiver",
    "com.google.android.datatransport.runtime.scheduling.jobscheduling.AlarmManagerSchedulerBroadcastReceiver"
  ],
  "providers": [
    "com.google.firebase.provider.FirebaseInitProvider",
    "androidx.startup.InitializationProvider"
  ],
  "exportedComponents": [
    "com.example.two_rings.MainActivity",
    "com.google.firebase.auth.internal.GenericIdpActivity",
    "com.google.firebase.auth.internal.RecaptchaActivity",
    "com.google.android.gms.auth.api.signin.RevocationBoundService",
    "com.amazon.device.iap.ResponseReceiver",
    "androidx.profileinstaller.ProfileInstallReceiver"
  ],
  "launchActivity": "com.example.two_rings.MainActivity",
  "layoutFiles": [
    "res/layout-v21/notification_action.xml",
    "res/layout-v21/notification_action_tombstone.xml",
    "res/layout-v21/notification_template_custom_big.xml",
    "res/layout-v21/notification_template_icon_group.xml",
    "res/layout/browser_actions_context_menu_page.xml",
    "res/layout/browser_actions_context_menu_row.xml",
    "res/layout/custom_dialog.xml",
    "res/layout/ime_base_split_test_activity.xml",
    "res/layout/ime_secondary_split_test_activity.xml",
    "res/layout/notification_template_part_chronometer.xml",
    "res/layout/notification_template_part_time.xml"
  ],
  "decodedLayouts": [
    "apktool/res\\layout\\browser_actions_context_menu_page.xml",
    "apktool/res\\layout\\browser_actions_context_menu_row.xml",
    "apktool/res\\layout\\custom_dialog.xml",
    "apktool/res\\layout\\ime_base_split_test_activity.xml",
    "apktool/res\\layout\\ime_secondary_split_test_activity.xml",
    "apktool/res\\layout\\notification_action.xml",
    "apktool/res\\layout\\notification_action_tombstone.xml",
    "apktool/res\\layout\\notification_template_custom_big.xml",
    "apktool/res\\layout\\notification_template_icon_group.xml",
    "apktool/res\\layout\\notification_template_part_chronometer.xml",
    "apktool/res\\layout\\notification_template_part_time.xml"
  ],
  "graph": {
    "nodes": [
      {
        "id": "apk_c4064367448f",
        "type": "APK",
        "label": "SampleApp.apk",
        "properties": {
          "package": "com.example.two_rings",
          "sha256": "c4064367448fe5631ee3075580213f26c603164d79442725e4e065cc29c15c4a",
          "sizeBytes": 253589,
          "entryCount": 15
        }
      },
      {
        "id": "manifest_c4064367448f",
        "type": "Manifest",
        "label": "AndroidManifest.xml",
        "properties": {
          "package": "com.example.two_rings",
          "versionCode": 1,
          "versionName": "1.0.0"
        }
      },
      {
        "id": "act_t5ui0n",
        "type": "Activity",
        "label": "MainActivity",
        "properties": {
          "name": "com.example.two_rings.MainActivity",
          "exported": true
        }
      },
      {
        "id": "act_1grcxp3",
        "type": "Activity",
        "label": "GenericIdpActivity",
        "properties": {
          "name": "com.google.firebase.auth.internal.GenericIdpActivity",
          "exported": true
        }
      },
      {
        "id": "act_onpjgs",
        "type": "Activity",
        "label": "RecaptchaActivity",
        "properties": {
          "name": "com.google.firebase.auth.internal.RecaptchaActivity",
          "exported": true
        }
      },
      {
        "id": "act_1ps13sb",
        "type": "Activity",
        "label": "SignInHubActivity",
        "properties": {
          "name": "com.google.android.gms.auth.api.signin.internal.SignInHubActivity",
          "exported": false
        }
      },
      {
        "id": "act_1uodcu9",
        "type": "Activity",
        "label": "ProxyAmazonBillingActivity",
        "properties": {
          "name": "com.revenuecat.purchases.amazon.purchasing.ProxyAmazonBillingActivity",
          "exported": false
        }
      },
      {
        "id": "act_yg8ywr",
        "type": "Activity",
        "label": "SimulatedStoreErrorDialogActivity",
        "properties": {
          "name": "com.revenuecat.purchases.SimulatedStoreErrorDialogActivity",
          "exported": false
        }
      },
      {
        "id": "act_dogcv8",
        "type": "Activity",
        "label": "ProxyBillingActivity",
        "properties": {
          "name": "com.android.billingclient.api.ProxyBillingActivity",
          "exported": false
        }
      },
      {
        "id": "act_52te4g",
        "type": "Activity",
        "label": "ProxyBillingActivityV2",
        "properties": {
          "name": "com.android.billingclient.api.ProxyBillingActivityV2",
          "exported": false
        }
      },
      {
        "id": "act_1hgagv5",
        "type": "Activity",
        "label": "GoogleApiActivity",
        "properties": {
          "name": "com.google.android.gms.common.api.GoogleApiActivity",
          "exported": false
        }
      },
      {
        "id": "svc_25fpih",
        "type": "Service",
        "label": "ComponentDiscoveryService",
        "properties": {
          "name": "com.google.firebase.components.ComponentDiscoveryService",
          "exported": false
        }
      },
      {
        "id": "svc_sw1gnj",
        "type": "Service",
        "label": "SessionLifecycleService",
        "properties": {
          "name": "com.google.firebase.sessions.SessionLifecycleService",
          "exported": false
        }
      },
      {
        "id": "svc_h3l2nj",
        "type": "Service",
        "label": "RevocationBoundService",
        "properties": {
          "name": "com.google.android.gms.auth.api.signin.RevocationBoundService",
          "exported": true
        }
      },
      {
        "id": "svc_fsy8n4",
        "type": "Service",
        "label": "AppMeasurementService",
        "properties": {
          "name": "com.google.android.gms.measurement.AppMeasurementService",
          "exported": false
        }
      },
      {
        "id": "svc_1qci959",
        "type": "Service",
        "label": "AppMeasurementJobService",
        "properties": {
          "name": "com.google.android.gms.measurement.AppMeasurementJobService",
          "exported": false
        }
      },
      {
        "id": "svc_1atuc8y",
        "type": "Service",
        "label": "TransportBackendDiscovery",
        "properties": {
          "name": "com.google.android.datatransport.runtime.backends.TransportBackendDiscovery",
          "exported": false
        }
      },
      {
        "id": "svc_10fem4a",
        "type": "Service",
        "label": "JobInfoSchedulerService",
        "properties": {
          "name": "com.google.android.datatransport.runtime.scheduling.jobscheduling.JobInfoSchedulerService",
          "exported": false
        }
      },
      {
        "id": "rec_10sz62p",
        "type": "Receiver",
        "label": "ResponseReceiver",
        "properties": {
          "name": "com.amazon.device.iap.ResponseReceiver",
          "exported": true
        }
      },
      {
        "id": "rec_rk675w",
        "type": "Receiver",
        "label": "AppMeasurementReceiver",
        "properties": {
          "name": "com.google.android.gms.measurement.AppMeasurementReceiver",
          "exported": false
        }
      },
      {
        "id": "rec_2ttzfv",
        "type": "Receiver",
        "label": "ProfileInstallReceiver",
        "properties": {
          "name": "androidx.profileinstaller.ProfileInstallReceiver",
          "exported": true
        }
      },
      {
        "id": "rec_h5aza4",
        "type": "Receiver",
        "label": "AlarmManagerSchedulerBroadcastReceiver",
        "properties": {
          "name": "com.google.android.datatransport.runtime.scheduling.jobscheduling.AlarmManagerSchedulerBroadcastReceiver",
          "exported": false
        }
      },
      {
        "id": "perm_1ookk1t",
        "type": "Permission",
        "label": "INTERNET",
        "properties": {
          "name": "android.permission.INTERNET"
        }
      },
      {
        "id": "perm_6i7oo5",
        "type": "Permission",
        "label": "ACCESS_NETWORK_STATE",
        "properties": {
          "name": "android.permission.ACCESS_NETWORK_STATE"
        }
      },
      {
        "id": "perm_wo3rty",
        "type": "Permission",
        "label": "WAKE_LOCK",
        "properties": {
          "name": "android.permission.WAKE_LOCK"
        }
      },
      {
        "id": "perm_urk080",
        "type": "Permission",
        "label": "AD_ID",
        "properties": {
          "name": "com.google.android.gms.permission.AD_ID"
        }
      },
      {
        "id": "perm_bezzj0",
        "type": "Permission",
        "label": "ACCESS_ADSERVICES_ATTRIBUTION",
        "properties": {
          "name": "android.permission.ACCESS_ADSERVICES_ATTRIBUTION"
        }
      },
      {
        "id": "perm_1jw0nuc",
        "type": "Permission",
        "label": "ACCESS_ADSERVICES_AD_ID",
        "properties": {
          "name": "android.permission.ACCESS_ADSERVICES_AD_ID"
        }
      },
      {
        "id": "perm_13l70vn",
        "type": "Permission",
        "label": "RECEIVE",
        "properties": {
          "name": "com.google.android.c2dm.permission.RECEIVE"
        }
      },
      {
        "id": "perm_1qck2vy",
        "type": "Permission",
        "label": "BILLING",
        "properties": {
          "name": "com.android.vending.BILLING"
        }
      },
      {
        "id": "perm_10vszrq",
        "type": "Permission",
        "label": "BIND_GET_INSTALL_REFERRER_SERVICE",
        "properties": {
          "name": "com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE"
        }
      },
      {
        "id": "perm_170opuc",
        "type": "Permission",
        "label": "READ_GSERVICES",
        "properties": {
          "name": "com.google.android.providers.gsf.permission.READ_GSERVICES"
        }
      },
      {
        "id": "perm_1jvkgj2",
        "type": "Permission",
        "label": "DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION",
        "properties": {
          "name": "com.example.two_rings.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
        }
      }
    ],
    "edges": [
      {
        "id": "e_apk_c4064367448f_manifest",
        "source": "apk_c4064367448f",
        "target": "manifest_c4064367448f",
        "relationship": "CONTAINS"
      },
      {
        "id": "e_manifest_act_t5ui0n",
        "source": "manifest_c4064367448f",
        "target": "act_t5ui0n",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_act_1grcxp3",
        "source": "manifest_c4064367448f",
        "target": "act_1grcxp3",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_act_onpjgs",
        "source": "manifest_c4064367448f",
        "target": "act_onpjgs",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_act_1ps13sb",
        "source": "manifest_c4064367448f",
        "target": "act_1ps13sb",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_act_1uodcu9",
        "source": "manifest_c4064367448f",
        "target": "act_1uodcu9",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_act_yg8ywr",
        "source": "manifest_c4064367448f",
        "target": "act_yg8ywr",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_act_dogcv8",
        "source": "manifest_c4064367448f",
        "target": "act_dogcv8",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_act_52te4g",
        "source": "manifest_c4064367448f",
        "target": "act_52te4g",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_act_1hgagv5",
        "source": "manifest_c4064367448f",
        "target": "act_1hgagv5",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_svc_25fpih",
        "source": "manifest_c4064367448f",
        "target": "svc_25fpih",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_svc_sw1gnj",
        "source": "manifest_c4064367448f",
        "target": "svc_sw1gnj",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_svc_h3l2nj",
        "source": "manifest_c4064367448f",
        "target": "svc_h3l2nj",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_svc_fsy8n4",
        "source": "manifest_c4064367448f",
        "target": "svc_fsy8n4",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_svc_1qci959",
        "source": "manifest_c4064367448f",
        "target": "svc_1qci959",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_svc_1atuc8y",
        "source": "manifest_c4064367448f",
        "target": "svc_1atuc8y",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_svc_10fem4a",
        "source": "manifest_c4064367448f",
        "target": "svc_10fem4a",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_rec_10sz62p",
        "source": "manifest_c4064367448f",
        "target": "rec_10sz62p",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_rec_rk675w",
        "source": "manifest_c4064367448f",
        "target": "rec_rk675w",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_rec_2ttzfv",
        "source": "manifest_c4064367448f",
        "target": "rec_2ttzfv",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_rec_h5aza4",
        "source": "manifest_c4064367448f",
        "target": "rec_h5aza4",
        "relationship": "DECLARES"
      },
      {
        "id": "e_manifest_perm_1ookk1t",
        "source": "manifest_c4064367448f",
        "target": "perm_1ookk1t",
        "relationship": "USES_PERMISSION"
      },
      {
        "id": "e_manifest_perm_6i7oo5",
        "source": "manifest_c4064367448f",
        "target": "perm_6i7oo5",
        "relationship": "USES_PERMISSION"
      },
      {
        "id": "e_manifest_perm_wo3rty",
        "source": "manifest_c4064367448f",
        "target": "perm_wo3rty",
        "relationship": "USES_PERMISSION"
      },
      {
        "id": "e_manifest_perm_urk080",
        "source": "manifest_c4064367448f",
        "target": "perm_urk080",
        "relationship": "USES_PERMISSION"
      },
      {
        "id": "e_manifest_perm_bezzj0",
        "source": "manifest_c4064367448f",
        "target": "perm_bezzj0",
        "relationship": "USES_PERMISSION"
      },
      {
        "id": "e_manifest_perm_1jw0nuc",
        "source": "manifest_c4064367448f",
        "target": "perm_1jw0nuc",
        "relationship": "USES_PERMISSION"
      },
      {
        "id": "e_manifest_perm_13l70vn",
        "source": "manifest_c4064367448f",
        "target": "perm_13l70vn",
        "relationship": "USES_PERMISSION"
      },
      {
        "id": "e_manifest_perm_1qck2vy",
        "source": "manifest_c4064367448f",
        "target": "perm_1qck2vy",
        "relationship": "USES_PERMISSION"
      },
      {
        "id": "e_manifest_perm_10vszrq",
        "source": "manifest_c4064367448f",
        "target": "perm_10vszrq",
        "relationship": "USES_PERMISSION"
      },
      {
        "id": "e_manifest_perm_170opuc",
        "source": "manifest_c4064367448f",
        "target": "perm_170opuc",
        "relationship": "USES_PERMISSION"
      },
      {
        "id": "e_manifest_perm_1jvkgj2",
        "source": "manifest_c4064367448f",
        "target": "perm_1jvkgj2",
        "relationship": "USES_PERMISSION"
      }
    ]
  },
  "decompiledJavaCount": 2,
  "decompileSource": "native",
  "sources": [
    {
      "path": "sources/com\\example\\two_rings\\MainActivity.java",
      "code": "package com.example.two_rings;\r\n\r\nimport io.flutter.embedding.android.FlutterActivity;\r\nimport kotlin.Metadata;\r\n\r\n/* JADX INFO: compiled from: MainActivity.kt */\r\n/* JADX INFO: loaded from: classes.dex */\r\n@Metadata(d1 = {\"\\u0000\\f\\n\\u0002\\u0018\\u0002\\n\\u0002\\u0018\\u0002\\n\\u0002\\b\\u0003\\u0018\\u00002\\u00020\\u0001B\\u0007┬ó\\u0006\\u0004\\b\\u0002\\u0010\\u0003┬¿\\u0006\\u0004\"}, d2 = {\"Lcom/example/two_rings/MainActivity;\", \"Lio/flutter/embedding/android/FlutterActivity;\", \"<init>\", \"()V\", \"app_debug\"}, k = 1, mv = {2, 3, 0}, xi = 48)\r\npublic final class MainActivity extends FlutterActivity {\r\n}\r\n"
    }
  ],
  "reportMarkdown": "# OpenRev Analysis Report: SampleApp.apk\n\n**Generated At**: 2026-08-02T17:11:54.904Z  \n**Target Application**: SampleApp.apk  \n**Package Name**: com.example.two_rings  \n**SHA-256**: c4064367448fe5631ee3075580213f26c603164d79442725e4e065cc29c15c4a  \n\n---\n\n## Executive Summary\n\nOpenRev parsed the binary AndroidManifest.xml and extracted declared components, permissions, and requested platform features directly from the artifact.\n\n- **Total Graph Nodes**: 33\n- **Total Relationships**: 32\n- **Activities Declared**: 9\n- **Services Declared**: 7\n- **Receivers Declared**: 4\n- **Permissions Requested**: 11\n- **Exported Components (attack surface)**: 6\n\n---\n\n## Discovered Components\n\n### Activities\n- **MainActivity** *(exported)*\n- **GenericIdpActivity** *(exported)*\n- **RecaptchaActivity** *(exported)*\n- **SignInHubActivity**\n- **ProxyAmazonBillingActivity**\n- **SimulatedStoreErrorDialogActivity**\n- **ProxyBillingActivity**\n- **ProxyBillingActivityV2**\n- **GoogleApiActivity**\n\n### Services\n- **ComponentDiscoveryService**\n- **SessionLifecycleService**\n- **RevocationBoundService** *(exported)*\n- **AppMeasurementService**\n- **AppMeasurementJobService**\n- **TransportBackendDiscovery**\n- **JobInfoSchedulerService**\n\n### Receivers\n- **ResponseReceiver** *(exported)*\n- **AppMeasurementReceiver**\n- **ProfileInstallReceiver** *(exported)*\n- **AlarmManagerSchedulerBroadcastReceiver**\n\n### Exported Attack Surface\n- `com.example.two_rings.MainActivity` (Activity)\n- `com.google.firebase.auth.internal.GenericIdpActivity` (Activity)\n- `com.google.firebase.auth.internal.RecaptchaActivity` (Activity)\n- `com.google.android.gms.auth.api.signin.RevocationBoundService` (Service)\n- `com.amazon.device.iap.ResponseReceiver` (Receiver)\n- `androidx.profileinstaller.ProfileInstallReceiver` (Receiver)\n\n### Permissions Requested\n- `android.permission.INTERNET`\n- `android.permission.ACCESS_NETWORK_STATE`\n- `android.permission.WAKE_LOCK`\n- `com.google.android.gms.permission.AD_ID`\n- `android.permission.ACCESS_ADSERVICES_ATTRIBUTION`\n- `android.permission.ACCESS_ADSERVICES_AD_ID`\n- `com.google.android.c2dm.permission.RECEIVE`\n- `com.android.vending.BILLING`\n- `com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE`\n- `com.google.android.providers.gsf.permission.READ_GSERVICES`\n- `com.example.two_rings.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`\n\n---\n\n## Artifact Knowledge Graph (Mermaid)\n\n```mermaid\ngraph TD\n    apk_c4064367448f[\"SampleApp.apk\"] -->|CONTAINS| manifest_c4064367448f[\"AndroidManifest.xml\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| act_t5ui0n[\"MainActivity\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| act_1grcxp3[\"GenericIdpActivity\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| act_onpjgs[\"RecaptchaActivity\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| act_1ps13sb[\"SignInHubActivity\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| act_1uodcu9[\"ProxyAmazonBillingActivity\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| act_yg8ywr[\"SimulatedStoreErrorDialogActivity\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| act_dogcv8[\"ProxyBillingActivity\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| act_52te4g[\"ProxyBillingActivityV2\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| act_1hgagv5[\"GoogleApiActivity\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| svc_25fpih[\"ComponentDiscoveryService\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| svc_sw1gnj[\"SessionLifecycleService\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| svc_h3l2nj[\"RevocationBoundService\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| svc_fsy8n4[\"AppMeasurementService\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| svc_1qci959[\"AppMeasurementJobService\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| svc_1atuc8y[\"TransportBackendDiscovery\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| svc_10fem4a[\"JobInfoSchedulerService\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| rec_10sz62p[\"ResponseReceiver\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| rec_rk675w[\"AppMeasurementReceiver\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| rec_2ttzfv[\"ProfileInstallReceiver\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|DECLARES| rec_h5aza4[\"AlarmManagerSchedulerBroadcastReceiver\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_1ookk1t[\"INTERNET\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_6i7oo5[\"ACCESS_NETWORK_STATE\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_wo3rty[\"WAKE_LOCK\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_urk080[\"AD_ID\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_bezzj0[\"ACCESS_ADSERVICES_ATTRIBUTION\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_1jw0nuc[\"ACCESS_ADSERVICES_AD_ID\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_13l70vn[\"RECEIVE\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_1qck2vy[\"BILLING\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_10vszrq[\"BIND_GET_INSTALL_REFERRER_SERVICE\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_170opuc[\"READ_GSERVICES\"]\n    manifest_c4064367448f[\"AndroidManifest.xml\"] -->|USES_PERMISSION| perm_1jvkgj2[\"DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION\"]\n```\n\n---\n\n*Report generated automatically by OpenRev from real artifact analysis.*\n"
};

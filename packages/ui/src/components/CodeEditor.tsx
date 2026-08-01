import React, { useState } from 'react';

export const CodeEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'java' | 'smali' | 'xml' | 'json'>('java');

  const files = {
    java: `package com.example.sampleapp;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import okhttp3.OkHttpClient;
import okhttp3.Request;

public class MainActivity extends AppCompatActivity {
    private static final String AUTH_ENDPOINT = "https://api.example.com/api/v1/auth/login";
    private OkHttpClient httpClient;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        this.httpClient = new OkHttpClient();
        initAuthenticationFlow();
    }

    private void initAuthenticationFlow() {
        Request request = new Request.Builder()
                .url(AUTH_ENDPOINT)
                .addHeader("User-Agent", "SampleApp/1.0.0")
                .build();
        // Dispatched async request
    }
}`,
    smali: `.class public Lcom/example/sampleapp/MainActivity;
.super Landroidx/appcompat/app/AppCompatActivity;
.source "MainActivity.java"

# static fields
.field private static final AUTH_ENDPOINT:Ljava/lang/String; = "https://api.example.com/api/v1/auth/login"

# direct methods
.method public constructor <init>()V
    .registers 1
    invoke-direct {p0}, Landroidx/appcompat/app/AppCompatActivity;-><init>()V
    return-void
.end method`,
    xml: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.sampleapp"
    android:versionCode="100"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
    json: `{
  "package": "com.example.sampleapp",
  "minSdkVersion": 26,
  "targetSdkVersion": 34,
  "permissions": [
    "android.permission.INTERNET",
    "android.permission.ACCESS_NETWORK_STATE"
  ],
  "activities": [
    "com.example.sampleapp.MainActivity",
    "com.example.sampleapp.LoginActivity"
  ]
}`
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* File Tab Bar */}
      <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '0 12px' }}>
        <button
          onClick={() => setActiveTab('java')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'java' ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === 'java' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'java' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '12px'
          }}
        >
          MainActivity.java
        </button>
        <button
          onClick={() => setActiveTab('smali')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'smali' ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === 'smali' ? 'var(--accent-purple)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'smali' ? '2px solid var(--accent-purple)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '12px'
          }}
        >
          MainActivity.smali
        </button>
        <button
          onClick={() => setActiveTab('xml')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'xml' ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === 'xml' ? 'var(--accent-green)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'xml' ? '2px solid var(--accent-green)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '12px'
          }}
        >
          AndroidManifest.xml
        </button>
        <button
          onClick={() => setActiveTab('json')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'json' ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === 'json' ? 'var(--accent-orange)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'json' ? '2px solid var(--accent-orange)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '12px'
          }}
        >
          Metadata.json
        </button>
      </div>

      {/* Editor Content */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        <pre className="mono" style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {files[activeTab]}
        </pre>
      </div>
    </div>
  );
};

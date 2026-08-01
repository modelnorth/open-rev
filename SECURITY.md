# OpenRev Security Policy

The OpenRev project takes security seriously. As a software intelligence platform handling untrusted third-party binaries (APKs, archives, plugins, providers), security validation is built into the core engine.

---

## 🔒 Security Model & Sandbox Controls

1. **Untrusted Input Handling**: All imported APK binaries, archives, manifest XMLs, and plugin code are treated as untrusted.
2. **Zip Slip Prevention**: The engine enforces strict archive entry validation (`SecuritySanitizer.validateZipEntry`) preventing path traversal extraction outside target workspace directories.
3. **Path Traversal Protection**: All file paths are sanitized (`SecuritySanitizer.sanitizePath`) to block directory escape attempts (`../`).
4. **Out-of-Process Isolation**: Plugins run in an isolated process (`ExtensionHostManager`) with explicit permission policy checks (`SecuritySandbox`).

---

## 🐛 Reporting a Vulnerability

If you discover a security vulnerability or exploit in OpenRev:
1. **Do NOT open a public GitHub issue.**
2. Send an encrypted email to `security@openrev.io` with details, reproduction steps, and proof of concept.
3. The maintainers will respond within 48 hours and coordinate a patch release.

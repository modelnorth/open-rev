// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::time::Duration;

use serde::Serialize;
use tauri::api::dialog::blocking::FileDialogBuilder;
use tokio::process::Command;
use tokio::time::timeout;

const APP_VERSION: &str = "0.1.0-alpha.2";

/// Analysis result passed straight through from the Node sidecar as JSON.
/// The frontend consumes the exact same shape the pipeline produces.
type AnalysisResult = serde_json::Value;

/// The Node analysis sidecar (packages/desktop/sidecar/analyze.mjs) runs the
/// REAL pipeline (decode -> graph -> search -> SQLite -> report -> decompile).
fn sidecar_path() -> PathBuf {
    if let Ok(p) = std::env::var("OPENREV_SIDECAR") {
        return PathBuf::from(p);
    }
    // Dev layout: CARGO_MANIFEST_DIR = packages/desktop/src-tauri
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("sidecar")
        .join("analyze.mjs")
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SidecarOutput {
    stdout: String,
    stderr: String,
    exit_code: i32,
}

/// Run the Node sidecar, capture stdout/stderr/exit code with a timeout.
async fn run_sidecar(apk_path: &str) -> Result<SidecarOutput, String> {
    let sidecar = sidecar_path();
    if !sidecar.exists() {
        return Err(format!(
            "analysis sidecar not found at {} (set OPENREV_SIDECAR to override)",
            sidecar.display()
        ));
    }

    let output = timeout(
        Duration::from_secs(600),
        Command::new("node")
            .arg("--import")
            .arg("tsx")
            .arg(&sidecar)
            .arg(apk_path)
            .output(),
    )
    .await
    .map_err(|_| format!("analysis timed out after 600s: {}", apk_path))?
    .map_err(|e| format!("failed to spawn node sidecar: {e}"))?;

    Ok(SidecarOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

/// Native file dialog to pick an APK/AAB. Returns the path or null on cancel.
#[tauri::command]
fn pick_apk() -> Option<String> {
    FileDialogBuilder::new()
        .add_filter("Android Package", &["apk", "aab"])
        .pick_file()
        .map(|p| p.to_string_lossy().into_owned())
}

/// Analyze an APK: spawns the real Node sidecar and returns its JSON result.
#[tauri::command]
async fn analyze_apk(apk_path: String) -> Result<AnalysisResult, String> {
    let run = run_sidecar(&apk_path).await?;
    if run.exit_code != 0 {
        return Err(format!(
            "analysis failed (exit {}): {}",
            run.exit_code,
            if run.stderr.trim().is_empty() {
                run.stdout
            } else {
                run.stderr
            }
        ));
    }
    serde_json::from_str(&run.stdout)
        .map_err(|e| format!("invalid analysis output from sidecar: {e}"))
}

/// Best-effort frontend error reporting to the desktop host.
#[tauri::command]
fn report_error(message: String, detail: Option<String>) {
    eprintln!("[OpenRev] frontend error: {message}");
    if let Some(d) = detail {
        eprintln!("[OpenRev] frontend error detail: {d}");
    }
}

#[tauri::command]
fn get_version() -> String {
    APP_VERSION.to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            pick_apk,
            analyze_apk,
            report_error,
            get_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenRev Tauri application");
}

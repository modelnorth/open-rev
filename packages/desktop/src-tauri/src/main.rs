// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct ProcessOutput {
    stdout: String,
    stderr: String,
    exit_code: i32,
}

#[tauri::command]
fn run_tool_command(command: String, args: Vec<String>) -> Result<ProcessOutput, String> {
    println!("[OpenRev Desktop Engine] Executing command: {} with args {:?}", command, args);
    Ok(ProcessOutput {
        stdout: format!("Simulated output from {}", command),
        stderr: String::new(),
        exit_code: 0,
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_tool_command])
        .run(tauri::generate_context!())
        .expect("error while running OpenRev Tauri application");
}

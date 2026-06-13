use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;
use sysinfo::{Disks, System};
use tauri::{Manager, State};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce
};

use argon2::Argon2;
use rand::RngCore;
use base64::{engine::general_purpose, Engine as _};

fn derive_key(password: &str, salt: &[u8]) -> [u8; 32] {
    let mut key = [0u8; 32];

    Argon2::default()
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .unwrap();

    key
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Domain {
	Todos,
	Commands,
	Howto,
	Projects,
	Finance,
	Calendar,
	PersGoal,
	Profgoal,
	Profhighlights,
	Workspaces,
	Fields,
}

#[derive(Debug, Deserialize)]
pub struct SaveUserDataRequest {
    pub domain: Domain,
    pub data: serde_json::Value,
}

fn encrypt_data(password: &str, plaintext: &str) -> Result<String, String> {
    let mut salt = [0u8; 16];
    let mut nonce_bytes = [0u8; 12];

    rand::thread_rng().fill_bytes(&mut salt);
    rand::thread_rng().fill_bytes(&mut nonce_bytes);

    let key = derive_key(password, &salt);

    let cipher = Aes256Gcm::new((&key).into());
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| e.to_string())?;

    Ok(format!(
        "{}:{}:{}",
        general_purpose::STANDARD.encode(salt),
        general_purpose::STANDARD.encode(nonce_bytes),
        general_purpose::STANDARD.encode(ciphertext)
    ))
}

fn decrypt_data(password: &str, encrypted: &str) -> Result<String, String> {
    let parts: Vec<&str> = encrypted.split(':').collect();

    if parts.len() != 3 {
        return Err("Invalid encrypted format".to_string());
    }

    let salt = general_purpose::STANDARD.decode(parts[0]).map_err(|e| e.to_string())?;
    let nonce_bytes = general_purpose::STANDARD.decode(parts[1]).map_err(|e| e.to_string())?;
    let ciphertext = general_purpose::STANDARD.decode(parts[2]).map_err(|e| e.to_string())?;

    let key = derive_key(password, &salt);

    let cipher = Aes256Gcm::new((&key).into());
    let nonce = Nonce::from_slice(&nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "Decryption failed (wrong password or corrupted data)".to_string())?;

    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

#[tauri::command]
fn encrypt_highlights(password: String, data: String) -> Result<String, String> {
    encrypt_data(&password, &data)
}

#[tauri::command]
fn decrypt_highlights(password: String, encrypted: String) -> Result<String, String> {
    decrypt_data(&password, &encrypted)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TauriApp {
    pub id: String,
    pub name: String,
    pub description: String,
    pub path: PathBuf,
    pub executable: String,
    pub icon: Option<String>,
    pub status: AppStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppStatus {
    Running,
    Stopped,
    Error,
}

type AppRegistry = Mutex<HashMap<String, TauriApp>>;

fn get_registry_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    Ok(app_dir.join("registry.json"))
}

fn load_registry(app_handle: &tauri::AppHandle) -> Result<HashMap<String, TauriApp>, String> {
    let registry_path = get_registry_path(app_handle)?;
    
    if !registry_path.exists() {
        return Ok(HashMap::new());
    }
    
    let content = fs::read_to_string(&registry_path)
        .map_err(|e| format!("Failed to read registry: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse registry: {}", e))
}

fn save_registry(app_handle: &tauri::AppHandle, apps: &HashMap<String, TauriApp>) -> Result<(), String> {
    let registry_path = get_registry_path(app_handle)?;
    
    let content = serde_json::to_string_pretty(apps)
        .map_err(|e| format!("Failed to serialize registry: {}", e))?;
    
    fs::write(&registry_path, content)
        .map_err(|e| format!("Failed to write registry: {}", e))
}

#[tauri::command]
async fn get_registered_apps(registry: State<'_, AppRegistry>) -> Result<Vec<TauriApp>, String> {
    let apps = registry.lock().map_err(|e| e.to_string())?;
    Ok(apps.values().cloned().collect())
}

#[tauri::command]
async fn register_app(
    app: TauriApp,
    registry: State<'_, AppRegistry>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut apps = registry.lock().map_err(|e| e.to_string())?;
    apps.insert(app.id.clone(), app);
    save_registry(&app_handle, &apps)?;
    Ok(())
}

fn user_home_dir() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        if let Ok(profile) = std::env::var("USERPROFILE") {
            return Some(PathBuf::from(profile));
        }

        if let (Ok(drive), Ok(path)) = (std::env::var("HOMEDRIVE"), std::env::var("HOMEPATH")) {
            return Some(PathBuf::from(format!("{}{}", drive, path)));
        }

        None
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::env::var("HOME").ok().map(PathBuf::from)
    }
}

fn expand_home_path(path: &Path) -> Result<PathBuf, String> {
    let path_str = path.to_string_lossy();

    if path_str == "~" {
        return user_home_dir().ok_or_else(|| "Could not determine user home directory".to_string());
    }

    if path_str.starts_with("~/") || path_str.starts_with("~\\") {
        let home = user_home_dir().ok_or_else(|| "Could not determine user home directory".to_string())?;
        let rest = path_str
            .trim_start_matches('~')
            .trim_start_matches('/')
            .trim_start_matches('\\');
        return Ok(home.join(rest));
    }

    Ok(path.to_path_buf())
}

fn platform_command_name(program: &str) -> String {
    #[cfg(target_os = "windows")]
    {
        match program.to_ascii_lowercase().as_str() {
            "pnpm" => "pnpm.cmd".to_string(),
            "npm" => "npm.cmd".to_string(),
            "yarn" => "yarn.cmd".to_string(),
            "npx" => "npx.cmd".to_string(),
            _ => program.to_string(),
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        program.to_string()
    }
}

fn split_command_line(command: &str) -> Vec<String> {
    let mut parts = Vec::new();
    let mut current = String::new();
    let mut quote: Option<char> = None;

    for ch in command.chars() {
        match ch {
            '"' | '\'' => {
                if quote == Some(ch) {
                    quote = None;
                } else if quote.is_none() {
                    quote = Some(ch);
                } else {
                    current.push(ch);
                }
            }
            ch if ch.is_whitespace() && quote.is_none() => {
                if !current.is_empty() {
                    parts.push(current.clone());
                    current.clear();
                }
            }
            _ => current.push(ch),
        }
    }

    if !current.is_empty() {
        parts.push(current);
    }

    parts
}

fn nvidia_smi_command() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        if let Ok(program_files) = std::env::var("ProgramFiles") {
            let candidate = PathBuf::from(program_files)
                .join("NVIDIA Corporation")
                .join("NVSMI")
                .join("nvidia-smi.exe");

            if candidate.exists() {
                return candidate;
            }
        }

        PathBuf::from("nvidia-smi.exe")
    }

    #[cfg(not(target_os = "windows"))]
    {
        PathBuf::from("nvidia-smi")
    }
}

#[tauri::command]
async fn launch_app(
    app_id: String,
    registry: State<'_, AppRegistry>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut apps = registry.lock().map_err(|e| e.to_string())?;
    
    if let Some(app) = apps.get_mut(&app_id) {
        let workdir = expand_home_path(&app.path)?;

        // Parse executable into command and arguments.
        // Supports single-word commands, commands with args, and quoted executable paths with spaces.
        let parts = split_command_line(&app.executable);
        if parts.is_empty() {
            return Err("Executable is empty".to_string());
        }

        let program_name = parts[0].as_str();
        let extra_args = &parts[1..];
        let program = platform_command_name(program_name);
        let mut cmd = Command::new(&program);

        if extra_args.is_empty() {
            // Only apply special-case defaults when no explicit args provided.
            match program_name {
                // Support running package.json scripts like: pnpm run tauri:dev.
                "pnpm" => {
                    cmd.arg("run").arg("tauri:dev");
                }
                // Support cargo tauri dev.
                "cargo" => {
                    cmd.arg("tauri").arg("dev");
                }
                _ => {}
            }
        } else {
            // User provided explicit arguments in the executable string.
            for arg in extra_args {
                cmd.arg(arg);
            }
        }

        let result = cmd.current_dir(&workdir).spawn();

        match result {
            Ok(_) => {
                app.status = AppStatus::Running;
                save_registry(&app_handle, &apps)?;
                Ok(())
            }
            Err(e) => {
                app.status = AppStatus::Error;
                save_registry(&app_handle, &apps)?;
                Err(format!("Failed to launch app: {}", e))
            }
        }
    } else {
        Err(format!("App with id '{}' not found", app_id))
    }
}

#[tauri::command]
async fn stop_app(
    app_id: String,
    registry: State<'_, AppRegistry>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut apps = registry.lock().map_err(|e| e.to_string())?;
    
    if let Some(app) = apps.get_mut(&app_id) {
        app.status = AppStatus::Stopped;
        save_registry(&app_handle, &apps)?;
        // Note: In a real implementation, you'd track process IDs to properly terminate apps
        Ok(())
    } else {
        Err(format!("App with id '{}' not found", app_id))
    }
}

#[tauri::command]
async fn remove_app(
    app_id: String,
    registry: State<'_, AppRegistry>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut apps = registry.lock().map_err(|e| e.to_string())?;
    
    if apps.remove(&app_id).is_some() {
        save_registry(&app_handle, &apps)?;
        Ok(())
    } else {
        Err(format!("App with id '{}' not found", app_id))
    }
}

// System monitoring commands
#[tauri::command]
fn get_ram_usage() -> Result<(f64, f64, f64), String> {
    // Returns (used_gb, total_gb, percent).
    // Uses sysinfo so this works on Windows, Linux, and macOS.
    let mut system = System::new();
    system.refresh_memory();

    let total_bytes = system.total_memory() as f64;
    let used_bytes = system.used_memory() as f64;

    let total_gb = total_bytes / 1024.0 / 1024.0 / 1024.0;
    let used_gb = used_bytes / 1024.0 / 1024.0 / 1024.0;
    let percent = if total_gb > 0.0 { (used_gb / total_gb) * 100.0 } else { 0.0 };

    Ok((used_gb, total_gb, percent))
}

#[tauri::command]
fn get_gpu_usage() -> Result<(f64, f64, f64), String> {
    // Returns (used_gb, total_gb, percent)
    // Use nvidia-smi to get GPU memory usage
    let output = Command::new(nvidia_smi_command())
        .arg("--query-gpu=memory.used,memory.total")
        .arg("--format=csv,noheader,nounits")
        .output()
        .map_err(|e| format!("Failed to get GPU usage: {}", e))?;
    
    if !output.status.success() {
        return Err("nvidia-smi command failed. Is NVIDIA GPU available?".to_string());
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let line = stdout.lines().next().ok_or("No GPU data found")?;
    let parts: Vec<&str> = line.split(',').map(|s| s.trim()).collect();
    
    if parts.len() >= 2 {
        let used_mb: f64 = parts[0].parse().map_err(|_| "Failed to parse used memory")?;
        let total_mb: f64 = parts[1].parse().map_err(|_| "Failed to parse total memory")?;
        
        let used_gb = used_mb / 1024.0;
        let total_gb = total_mb / 1024.0;
        let percent = if total_mb > 0.0 { (used_mb / total_mb) * 100.0 } else { 0.0 };
        
        Ok((used_gb, total_gb, percent))
    } else {
        Err("Invalid GPU data format".to_string())
    }
}

#[tauri::command]
fn get_disk_usage() -> Result<(u64, u64, u64), String> {
    let disks = Disks::new_with_refreshed_list();
    let current_dir = std::env::current_dir().map_err(|e| format!("Failed to get current directory: {}", e))?;

    // Pick the disk that contains the app's current directory.
    // On Linux this is usually "/". On Windows this is usually the app's current drive.
    let mut best_match = None;

    for disk in disks.list() {
        if current_dir.starts_with(disk.mount_point()) {
            let mount_len = disk.mount_point().as_os_str().len();
            match best_match {
                Some((best_len, _)) if best_len >= mount_len => {}
                _ => best_match = Some((mount_len, disk)),
            }
        }
    }

    if let Some((_, disk)) = best_match {
        let total = disk.total_space();
        let available = disk.available_space();
        let used = total.saturating_sub(available);
        return Ok((used, available, total));
    }

    // Fallback: return the first disk if no mount point matched.
    if let Some(disk) = disks.list().first() {
        let total = disk.total_space();
        let available = disk.available_space();
        let used = total.saturating_sub(available);
        return Ok((used, available, total));
    }

    Err("No disk found".to_string())
}

// Save/load user data
fn get_user_data_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    Ok(app_dir.join("user_data.json"))
}

fn get_user_data_path_encryption(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data encryption dir: {}", e))?;
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data encryption dir: {}", e))?;
    Ok(app_dir.join("user_data_encryption.json"))
}

#[tauri::command]
async fn load_user_data(app_handle: tauri::AppHandle) -> Result<String, String> {
    let data_path = get_user_data_path(&app_handle)?;
    
    if !data_path.exists() {
        return Ok("{}".to_string()); // Return empty object if no file
    }
    
    fs::read_to_string(&data_path)
        .map_err(|e| format!("Failed to read user data: {}", e))
}

#[tauri::command]
async fn load_user_data_encryption(app_handle: tauri::AppHandle) -> Result<String, String> {
    let data_path = get_user_data_path_encryption(&app_handle)?;
    
    if !data_path.exists() {
        return Ok("{}".to_string()); // Return empty object if no file
    }
    
    fs::read_to_string(&data_path)
        .map_err(|e| format!("Failed to read user data encryption: {}", e))
}

#[tauri::command]
async fn save_user_data(data: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let data_path = get_user_data_path(&app_handle)?;
    
    fs::write(&data_path, data)
        .map_err(|e| format!("Failed to write user data: {}", e))
}
//check save
#[tauri::command]
async fn save_user_data_encryption(data: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let data_path = get_user_data_path_encryption(&app_handle)?;
    
    fs::write(&data_path, data)
        .map_err(|e| format!("Failed to write user data encryption: {}", e))
}

// backup_user_data(app_handle: tauri::AppHandle) -> Result<(), String>
// Copies user_data.json to user_data_backup.json, overwriting the previous backup
#[tauri::command]
async fn backup_user_data(app_handle: tauri::AppHandle) -> Result<(), String> {
    let data_path = get_user_data_path(&app_handle)?;
    let data_path_encrypt = get_user_data_path_encryption(&app_handle)?;

    if !data_path.exists() {
        return Err("No user data to backup".to_string());
    }
     if !data_path_encrypt.exists() {
        return Err("No user data encryption to backup".to_string());
    }
    let backup_path = data_path.with_file_name("user_data_backup.json");
    let backup_path_encrypt = data_path_encrypt.with_file_name("user_data_backup_encrypt.json");

    fs::copy(&data_path, &backup_path)
        .map_err(|e| format!("Failed to backup user data: {}", e))?;

    fs::copy(&data_path_encrypt, &backup_path_encrypt)
        .map_err(|e| format!("Failed to backup user encrypt data: {}", e))?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_registered_apps,
            register_app,
            launch_app,
            stop_app,
            remove_app,
            get_ram_usage,
            get_gpu_usage,
            get_disk_usage,
            load_user_data,
            load_user_data_encryption,
            save_user_data,
            save_user_data_encryption,
            backup_user_data,
            encrypt_highlights,
            decrypt_highlights
        ])
        .setup(|app| {
            // Load registry from disk
            let registry_data = load_registry(&app.handle())
                .unwrap_or_else(|e| {
                    eprintln!("Failed to load registry: {}", e);
                    HashMap::new()
                });
            
            let app_registry: AppRegistry = Mutex::new(registry_data);
            app.manage(app_registry);

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

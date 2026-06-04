use std::net::UdpSocket;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::Manager;
use warp::Filter;

#[derive(Clone, serde::Serialize)]
struct RemoteCommand {
    action: String,
    value: Option<f64>,
}

fn get_local_ipv4() -> Result<String, String> {
    // Connect to a public DNS to determine our local IPv4 address
    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| format!("Bind failed: {}", e))?;
    socket.connect("8.8.8.8:80").map_err(|e| format!("Connect failed: {}", e))?;
    let addr = socket.local_addr().map_err(|e| format!("Local addr failed: {}", e))?;
    Ok(addr.ip().to_string())
}

static COMMAND_QUEUE: once_cell::sync::Lazy<Arc<Mutex<Vec<RemoteCommand>>>> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(Vec::new())));

#[tauri::command]
fn start_remote_server() -> Result<String, String> {
    let port = 18923u16;
    let ip = get_local_ipv4()?;

    // HTML page for mobile remote control
    let html = r#"<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>Prism - Remote</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,sans-serif;background:#0f0f0f;color:#fff;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:manipulation}
h1{font-size:18px;margin-bottom:24px;color:#aaa}
.controls{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:360px;width:100%}
.btn{padding:18px 12px;border:1px solid #333;border-radius:12px;background:#1a1a1a;color:#fff;font-size:16px;cursor:pointer;text-align:center;transition:background .15s;white-space:nowrap;min-width:90px}
.btn:active{background:#333}
.btn.active{background:#3b82f6;border-color:#3b82f6}
.speed{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:16px}
.speed .btn{padding:10px 16px;font-size:14px}
.status{margin-top:16px;color:#666;font-size:12px}
</style>
</head><body>
<h1>📱 Remote Control</h1>
<div class="controls">
  <button class="btn" onclick="send('seek',-5)">⏪ -5s</button>
  <button class="btn" onclick="togglePlay()" id="playBtn" style="font-size:20px">▶</button>
  <button class="btn" onclick="send('seek',5)">⏩ +5s</button>
  <button class="btn" onclick="send('seek',-30)">⏪ -30s</button>
  <button class="btn" onclick="send('speed',1)">1x</button>
  <button class="btn" onclick="send('seek',30)">⏩ +30s</button>
</div>
<p style="margin-top:16px;color:#888;font-size:13px">Speed</p>
<div class="speed">
  <button class="btn" onclick="send('speed',0.5)">0.5x</button>
  <button class="btn" onclick="send('speed',1)">1x</button>
  <button class="btn" onclick="send('speed',1.5)">1.5x</button>
  <button class="btn" onclick="send('speed',2)">2x</button>
  <button class="btn" onclick="send('speed',3)">3x</button>
  <button class="btn" onclick="send('speed',6)">6x</button>
</div>
<p class="status" id="status">Connected</p>
<script>
let isPlaying = false;
function send(action,value){
  fetch('/command',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action,value:value||null})
  }).then(r=>r.json()).then(d=>{
    document.getElementById('status').textContent='Sent: '+action+(value?' '+value:'')
  }).catch(e=>{
    document.getElementById('status').textContent='Error: '+e.message
  })
}
function togglePlay(){
  isPlaying = !isPlaying;
  const btn = document.getElementById('playBtn');
  if(isPlaying){
    btn.textContent = '⏸ Pause';
    send('play');
  }else{
    btn.textContent = '▶ Play';
    send('pause');
  }
}
</script>
</body></html>"#;

    let html_str = html.to_string();

    // GET / → serve HTML
    let html_route = warp::path::end()
        .map(move || warp::reply::html(html_str.clone()));

    // POST /command → receive command
    let command_route = warp::post()
        .and(warp::path("command"))
        .and(warp::body::json())
        .map(|cmd: serde_json::Value| {
            let action = cmd["action"].as_str().unwrap_or("").to_string();
            let value = cmd["value"].as_f64();
            let remote_cmd = RemoteCommand { action, value };
            if let Ok(mut queue) = COMMAND_QUEUE.lock() {
                queue.push(remote_cmd);
            }
            warp::reply::json(&serde_json::json!({"ok": true}))
        });

    // GET /commands → poll for commands (used by desktop app)
    let poll_route = warp::get()
        .and(warp::path("commands"))
        .map(|| {
            let cmds: Vec<RemoteCommand> = if let Ok(mut queue) = COMMAND_QUEUE.lock() {
                queue.drain(..).collect()
            } else {
                Vec::new()
            };
            warp::reply::json(&cmds)
        });

    // Add CORS headers for mobile browsers
    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "OPTIONS"])
        .allow_headers(vec!["Content-Type"]);

    let routes = html_route
        .or(command_route)
        .or(poll_route)
        .with(cors);

    thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            println!("Remote control server starting on 0.0.0.0:{}", port);
            warp::serve(routes)
                .run(([0, 0, 0, 0], port))
                .await;
        });
    });

    let url = format!("http://{}:{}", ip, port);
    Ok(url)
}

#[tauri::command]
fn get_remote_commands() -> Vec<RemoteCommand> {
    if let Ok(mut queue) = COMMAND_QUEUE.lock() {
        queue.drain(..).collect()
    } else {
        Vec::new()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            start_remote_server,
            get_remote_commands
        ])
        .setup(|app| {
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

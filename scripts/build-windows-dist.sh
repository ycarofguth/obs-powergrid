#!/bin/bash
set -e

# Assemble Windows distribution directory for NSIS installer
# Run after: pnpm build && pnpm --filter @obs-tuya/sidecar bundle

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Convert paths for Node.js on Windows (Git Bash returns /d/... but Node needs D:/...)
if command -v cygpath &>/dev/null; then
  NODE_DIR=$(cygpath -m "$ROOT_DIR")
else
  NODE_DIR="$ROOT_DIR"
fi

DIST_DIR="$ROOT_DIR/dist/obs-powergrid"
NODE_DIST_DIR="$NODE_DIR/dist/obs-powergrid"
VERSION=$(node -e "console.log(require('$NODE_DIR/package.json').version)")

echo "=== Assembling Windows distribution v${VERSION} ==="

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Neutralino binary
cp "$ROOT_DIR/bin/neutralino-win_x64.exe" "$DIST_DIR/obs-powergrid.exe"

# Config
node -e "
  const fs = require('fs');
  const config = JSON.parse(fs.readFileSync('$NODE_DIR/neutralino.config.json', 'utf8'));
  delete config.url;
  config.documentRoot = '/apps/desktop/dist/';
  config.modes.window.enableInspector = false;
  fs.writeFileSync('$NODE_DIST_DIR/neutralino.config.json', JSON.stringify(config, null, 2));
"

# Frontend
mkdir -p "$DIST_DIR/apps/desktop/dist"
cp -r "$ROOT_DIR/apps/desktop/dist/"* "$DIST_DIR/apps/desktop/dist/"

# Sidecar bundle
mkdir -p "$DIST_DIR/apps/sidecar/dist"
cp "$ROOT_DIR/apps/sidecar/dist/bundle.mjs" "$DIST_DIR/apps/sidecar/dist/"

# Native modules
# Note: pnpm override maps better-sqlite3 -> better-sqlite3-multiple-ciphers
# On Windows, pnpm symlinks/junctions may not be followed by cp -r
# So we copy from better-sqlite3-multiple-ciphers (real package) and create
# better-sqlite3 as a copy of it (since bundle.mjs imports 'better-sqlite3')
SIDECAR_NM="$ROOT_DIR/apps/sidecar/node_modules"
DIST_NM="$DIST_DIR/apps/sidecar/node_modules"
mkdir -p "$DIST_NM"

# Copy better-sqlite3-multiple-ciphers (the actual package)
if [ -d "$SIDECAR_NM/better-sqlite3-multiple-ciphers" ]; then
  mkdir -p "$DIST_NM/better-sqlite3-multiple-ciphers/build/Release"
  mkdir -p "$DIST_NM/better-sqlite3-multiple-ciphers/lib"
  cp -rL "$SIDECAR_NM/better-sqlite3-multiple-ciphers/lib/." "$DIST_NM/better-sqlite3-multiple-ciphers/lib/"
  cp -L "$SIDECAR_NM/better-sqlite3-multiple-ciphers/package.json" "$DIST_NM/better-sqlite3-multiple-ciphers/"
  find "$SIDECAR_NM/better-sqlite3-multiple-ciphers" -name "*.node" -exec cp -L {} "$DIST_NM/better-sqlite3-multiple-ciphers/build/Release/" \;
  # Create better-sqlite3 alias (pnpm override: better-sqlite3 -> better-sqlite3-multiple-ciphers)
  cp -r "$DIST_NM/better-sqlite3-multiple-ciphers" "$DIST_NM/better-sqlite3"
fi

# argon2 + its runtime dependencies (pnpm hoists them in the virtual store)
ARGON2_VSTORE=$(find "$ROOT_DIR/node_modules/.pnpm" -path "*/argon2@*/node_modules" -maxdepth 3 -type d 2>/dev/null | head -1)
if [ -n "$ARGON2_VSTORE" ]; then
  for pkg in "$ARGON2_VSTORE"/*; do
    pkgname=$(basename "$pkg")
    case "$pkgname" in
      cross-env|.bin) continue ;; # not needed at runtime
    esac
    if [ -d "$pkg" ]; then
      cp -rL "$pkg" "$DIST_NM/$pkgname"
    fi
  done
  # Scoped packages (@phc/format)
  for scope in "$ARGON2_VSTORE"/@*; do
    if [ -d "$scope" ]; then
      scopename=$(basename "$scope")
      mkdir -p "$DIST_NM/$scopename"
      for pkg in "$scope"/*; do
        if [ -d "$pkg" ]; then
          cp -rL "$pkg" "$DIST_NM/$scopename/$(basename "$pkg")"
        fi
      done
    fi
  done
  rm -rf "$DIST_NM/argon2/src" "$DIST_NM/argon2/test" "$DIST_NM/argon2/.github" 2>/dev/null || true
fi

# Helper modules for native bindings
if [ -d "$SIDECAR_NM/bindings" ]; then
  cp -rL "$SIDECAR_NM/bindings" "$DIST_NM/"
fi
if [ -d "$SIDECAR_NM/file-uri-to-path" ]; then
  cp -rL "$SIDECAR_NM/file-uri-to-path" "$DIST_NM/"
fi

# Copy .node bindings to where the `bindings` module searches
# (relative to bundle.mjs parent dir = apps/sidecar/)
SIDECAR_BUILD="$DIST_DIR/apps/sidecar/build/Release"
mkdir -p "$SIDECAR_BUILD"
find "$DIST_NM" -name "*.node" -exec cp -L {} "$SIDECAR_BUILD/" \;

# Node.js runtime
if [ -f "$ROOT_DIR/runtime/node.exe" ]; then
  mkdir -p "$DIST_DIR/runtime"
  cp "$ROOT_DIR/runtime/node.exe" "$DIST_DIR/runtime/node.exe"
elif [ -f "$ROOT_DIR/runtime/node" ]; then
  mkdir -p "$DIST_DIR/runtime"
  cp "$ROOT_DIR/runtime/node" "$DIST_DIR/runtime/node.exe"
fi

# Resources
mkdir -p "$DIST_DIR/resources"

# Generate icon.ico
node "$ROOT_DIR/scripts/generate-ico.mjs" "$DIST_DIR/icon.ico"

# Launcher script (VBScript - no console window, with logging)
cat > "$DIST_DIR/start.vbs" << 'VBSEOF'
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = appDir

' === Logging setup ===
Dim logDir, logFile
logDir = WshShell.ExpandEnvironmentStrings("%USERPROFILE%") & "\.obs-tuya\logs"
If Not fso.FolderExists(WshShell.ExpandEnvironmentStrings("%USERPROFILE%") & "\.obs-tuya") Then
    fso.CreateFolder WshShell.ExpandEnvironmentStrings("%USERPROFILE%") & "\.obs-tuya"
End If
If Not fso.FolderExists(logDir) Then
    fso.CreateFolder logDir
End If
Set logFile = fso.OpenTextFile(logDir & "\launcher.log", 2, True)

Sub Log(msg)
    logFile.WriteLine Now & " | " & msg
End Sub

Log "=== OBS PowerGrid Launcher ==="
Log "App dir: " & appDir
Log "Log dir: " & logDir

' === Verify files exist ===
Dim nodeExe, bundleMjs, neuExe
nodeExe = appDir & "\runtime\node.exe"
bundleMjs = appDir & "\apps\sidecar\dist\bundle.mjs"
neuExe = appDir & "\obs-powergrid.exe"

If Not fso.FileExists(nodeExe) Then
    Log "ERROR: node.exe not found at: " & nodeExe
    logFile.Close
    MsgBox "node.exe nao encontrado em:" & vbCrLf & nodeExe, vbCritical, "OBS PowerGrid"
    WScript.Quit 1
End If
If Not fso.FileExists(bundleMjs) Then
    Log "ERROR: bundle.mjs not found at: " & bundleMjs
    logFile.Close
    MsgBox "bundle.mjs nao encontrado em:" & vbCrLf & bundleMjs, vbCritical, "OBS PowerGrid"
    WScript.Quit 1
End If
If Not fso.FileExists(neuExe) Then
    Log "ERROR: obs-powergrid.exe not found at: " & neuExe
    logFile.Close
    MsgBox "obs-powergrid.exe nao encontrado em:" & vbCrLf & neuExe, vbCritical, "OBS PowerGrid"
    WScript.Quit 1
End If
Log "All files verified OK"

' === Start sidecar (hidden window, redirect output to log) ===
Dim sidecarLog
sidecarLog = logDir & "\sidecar.log"
Dim sidecarCmd
sidecarCmd = "cmd /c """"" & nodeExe & """ """ & bundleMjs & """ > """ & sidecarLog & """ 2>&1"""
Log "Starting sidecar: " & sidecarCmd
WshShell.Run sidecarCmd, 0, False
Log "Sidecar process launched"

' === Wait for sidecar to be ready (health check with timeout) ===
Dim http, ready, attempts
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.setTimeouts 2000, 2000, 2000, 2000  ' resolve, connect, send, receive (ms)
ready = False
attempts = 0
Log "Starting health check (max 30 attempts, 2s timeout each)..."
Do While Not ready And attempts < 30
    On Error Resume Next
    http.Open "GET", "http://localhost:47531/api/health", False
    http.Send
    If Err.Number = 0 Then
        If http.Status = 200 Then
            ready = True
            Log "Health check OK at attempt " & (attempts + 1)
        Else
            Log "Health check attempt " & (attempts + 1) & ": HTTP " & http.Status
        End If
    Else
        Log "Health check attempt " & (attempts + 1) & ": Error " & Err.Number & " - " & Err.Description
        Err.Clear
    End If
    On Error GoTo 0
    If Not ready Then
        WScript.Sleep 1000
        attempts = attempts + 1
    End If
Loop

If Not ready Then
    Log "WARNING: Sidecar not ready after 30 attempts. Launching UI anyway."
    Log "Check sidecar log at: " & sidecarLog
End If

' === Start Neutralino (GUI window) ===
Dim neuCmd
neuCmd = """" & neuExe & """ --path=""" & appDir & """ --load-dir-res"
Log "Starting Neutralino: " & neuCmd
WshShell.Run neuCmd, 1, True
Log "Neutralino exited"

' === Cleanup: stop sidecar when app exits ===
Log "Stopping sidecar..."
On Error Resume Next
Set objWMI = GetObject("winmgmts:\\.\root\cimv2")
Set colProcs = objWMI.ExecQuery("SELECT * FROM Win32_Process WHERE Name='node.exe' AND CommandLine LIKE '%bundle.mjs%'")
Dim procCount
procCount = 0
For Each objProc In colProcs
    objProc.Terminate()
    procCount = procCount + 1
Next
On Error GoTo 0
Log "Terminated " & procCount & " sidecar process(es)"
Log "=== Launcher finished ==="
logFile.Close
VBSEOF

echo ""
echo "Windows distribution assembled at: $DIST_DIR"
du -sh "$DIST_DIR" 2>/dev/null || echo "(size check skipped)"
echo ""
echo "=== Done ==="

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

DIST_DIR="$ROOT_DIR/dist/obs-tuya-smart-plug"
NODE_DIST_DIR="$NODE_DIR/dist/obs-tuya-smart-plug"
VERSION=$(node -e "console.log(require('$NODE_DIR/package.json').version)")

echo "=== Assembling Windows distribution v${VERSION} ==="

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Neutralino binary
cp "$ROOT_DIR/bin/neutralino-win_x64.exe" "$DIST_DIR/obs-tuya-smart-plug.exe"

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
  cp -rL "$SIDECAR_NM/better-sqlite3-multiple-ciphers/lib/" "$DIST_NM/better-sqlite3-multiple-ciphers/lib/"
  cp -L "$SIDECAR_NM/better-sqlite3-multiple-ciphers/package.json" "$DIST_NM/better-sqlite3-multiple-ciphers/"
  find "$SIDECAR_NM/better-sqlite3-multiple-ciphers" -name "*.node" -exec cp -L {} "$DIST_NM/better-sqlite3-multiple-ciphers/build/Release/" \;
  # Create better-sqlite3 alias (pnpm override: better-sqlite3 -> better-sqlite3-multiple-ciphers)
  cp -r "$DIST_NM/better-sqlite3-multiple-ciphers" "$DIST_NM/better-sqlite3"
fi

# argon2
if [ -d "$SIDECAR_NM/argon2" ]; then
  mkdir -p "$DIST_NM/argon2/build/Release"
  find "$SIDECAR_NM/argon2" -maxdepth 1 -name "*.js" -exec cp -L {} "$DIST_NM/argon2/" \;
  find "$SIDECAR_NM/argon2" -maxdepth 1 -name "*.cjs" -exec cp -L {} "$DIST_NM/argon2/" \;
  find "$SIDECAR_NM/argon2" -maxdepth 1 -name "*.mjs" -exec cp -L {} "$DIST_NM/argon2/" \;
  cp -L "$SIDECAR_NM/argon2/package.json" "$DIST_NM/argon2/"
  find "$SIDECAR_NM/argon2" -name "*.node" -exec cp -L {} "$DIST_NM/argon2/build/Release/" \;
  if [ -d "$SIDECAR_NM/argon2/node_modules" ]; then
    cp -rL "$SIDECAR_NM/argon2/node_modules" "$DIST_NM/argon2/"
  fi
fi

# Helper modules for native bindings
if [ -d "$SIDECAR_NM/bindings" ]; then
  cp -rL "$SIDECAR_NM/bindings" "$DIST_NM/"
fi
if [ -d "$SIDECAR_NM/file-uri-to-path" ]; then
  cp -rL "$SIDECAR_NM/file-uri-to-path" "$DIST_NM/"
fi

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

# Launcher script (VBScript - no console window)
cat > "$DIST_DIR/start.vbs" << 'VBSEOF'
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = appDir

' Start sidecar (hidden window)
WshShell.Run """" & appDir & "\runtime\node.exe"" """ & appDir & "\apps\sidecar\dist\bundle.mjs""", 0, False

' Wait for sidecar to be ready (health check)
Dim http, ready, attempts
Set http = CreateObject("MSXML2.XMLHTTP")
ready = False
attempts = 0
Do While Not ready And attempts < 30
    On Error Resume Next
    http.Open "GET", "http://localhost:47531/api/health", False
    http.Send
    If Err.Number = 0 Then
        If http.Status = 200 Then
            ready = True
        End If
    End If
    On Error GoTo 0
    If Not ready Then
        WScript.Sleep 500
        attempts = attempts + 1
    End If
Loop

' Start Neutralino (GUI window)
WshShell.Run """" & appDir & "\obs-tuya-smart-plug.exe"" --load-dir-res", 1, True

' Cleanup: stop sidecar when app exits
Set objWMI = GetObject("winmgmts:\\.\root\cimv2")
Set colProcs = objWMI.ExecQuery("SELECT * FROM Win32_Process WHERE Name='node.exe' AND CommandLine LIKE '%bundle.mjs%'")
For Each objProc In colProcs
    objProc.Terminate()
Next
VBSEOF

echo ""
echo "Windows distribution assembled at: $DIST_DIR"
du -sh "$DIST_DIR" 2>/dev/null || echo "(size check skipped)"
echo ""
echo "=== Done ==="

#!/bin/bash
set -e

# Assemble Windows distribution directory for NSIS installer
# Run after: pnpm build && pnpm --filter @obs-tuya/sidecar bundle

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist/obs-tuya-smart-plug"
VERSION=$(node -e "console.log(require('$ROOT_DIR/package.json').version)")

echo "=== Assembling Windows distribution v${VERSION} ==="

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Neutralino binary
cp "$ROOT_DIR/bin/neutralino-win_x64.exe" "$DIST_DIR/obs-tuya-smart-plug.exe"

# Config
node -e "
  const fs = require('fs');
  const config = JSON.parse(fs.readFileSync('$ROOT_DIR/neutralino.config.json', 'utf8'));
  delete config.url;
  config.documentRoot = '/apps/desktop/dist/';
  config.modes.window.enableInspector = false;
  fs.writeFileSync('$DIST_DIR/neutralino.config.json', JSON.stringify(config, null, 2));
"

# Frontend
mkdir -p "$DIST_DIR/apps/desktop/dist"
cp -r "$ROOT_DIR/apps/desktop/dist/"* "$DIST_DIR/apps/desktop/dist/"

# Sidecar bundle
mkdir -p "$DIST_DIR/apps/sidecar/dist"
cp "$ROOT_DIR/apps/sidecar/dist/bundle.mjs" "$DIST_DIR/apps/sidecar/dist/"

# Native modules
SIDECAR_NM="$ROOT_DIR/apps/sidecar/node_modules"
DIST_NM="$DIST_DIR/apps/sidecar/node_modules"

if [ -d "$SIDECAR_NM/better-sqlite3-multiple-ciphers" ]; then
  mkdir -p "$DIST_NM/better-sqlite3-multiple-ciphers/build/Release"
  mkdir -p "$DIST_NM/better-sqlite3-multiple-ciphers/lib"
  cp -r "$SIDECAR_NM/better-sqlite3-multiple-ciphers/lib/" "$DIST_NM/better-sqlite3-multiple-ciphers/lib/"
  cp "$SIDECAR_NM/better-sqlite3-multiple-ciphers/package.json" "$DIST_NM/better-sqlite3-multiple-ciphers/"
  find "$SIDECAR_NM/better-sqlite3-multiple-ciphers" -name "*.node" -exec cp {} "$DIST_NM/better-sqlite3-multiple-ciphers/build/Release/" \;
fi

if [ -d "$SIDECAR_NM/better-sqlite3" ]; then
  mkdir -p "$DIST_NM/better-sqlite3/build/Release"
  mkdir -p "$DIST_NM/better-sqlite3/lib"
  cp -r "$SIDECAR_NM/better-sqlite3/lib/" "$DIST_NM/better-sqlite3/lib/"
  cp "$SIDECAR_NM/better-sqlite3/package.json" "$DIST_NM/better-sqlite3/"
  find "$SIDECAR_NM/better-sqlite3" -name "*.node" -exec cp {} "$DIST_NM/better-sqlite3/build/Release/" \;
fi

if [ -d "$SIDECAR_NM/argon2" ]; then
  mkdir -p "$DIST_NM/argon2/build/Release"
  find "$SIDECAR_NM/argon2" -maxdepth 1 -name "*.js" -exec cp {} "$DIST_NM/argon2/" \;
  find "$SIDECAR_NM/argon2" -maxdepth 1 -name "*.cjs" -exec cp {} "$DIST_NM/argon2/" \;
  find "$SIDECAR_NM/argon2" -maxdepth 1 -name "*.mjs" -exec cp {} "$DIST_NM/argon2/" \;
  cp "$SIDECAR_NM/argon2/package.json" "$DIST_NM/argon2/"
  find "$SIDECAR_NM/argon2" -name "*.node" -exec cp {} "$DIST_NM/argon2/build/Release/" \;
  [ -d "$SIDECAR_NM/argon2/node_modules" ] && cp -r "$SIDECAR_NM/argon2/node_modules" "$DIST_NM/argon2/"
fi

[ -d "$SIDECAR_NM/bindings" ] && cp -r "$SIDECAR_NM/bindings" "$DIST_NM/"
[ -d "$SIDECAR_NM/file-uri-to-path" ] && cp -r "$SIDECAR_NM/file-uri-to-path" "$DIST_NM/"

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

echo ""
echo "Windows distribution assembled at: $DIST_DIR"
du -sh "$DIST_DIR"
echo ""
echo "=== Done ==="

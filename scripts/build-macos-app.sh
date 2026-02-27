#!/bin/bash
set -e

# Build macOS .app bundle and .dmg installer
# Usage: ./build-macos-app.sh [arch]
# Arch: arm64, x64 (auto-detected if not provided)

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(node -e "console.log(require('$ROOT_DIR/package.json').version)")
DIST_DIR="$ROOT_DIR/dist"

# Detect architecture
if [ -z "$1" ]; then
  ARCH=$(uname -m)
  if [ "$ARCH" = "arm64" ]; then
    ARCH="arm64"
  else
    ARCH="x64"
  fi
else
  ARCH="$1"
fi

if [ "$ARCH" = "arm64" ]; then
  BINARY="neutralino-mac_arm64"
else
  BINARY="neutralino-mac_x64"
fi

APP_NAME="OBS PowerGrid"
APP_BUNDLE="$DIST_DIR/${APP_NAME}.app"

echo "=== Building macOS .app bundle (${ARCH}) v${VERSION} ==="

# Clean previous build
rm -rf "$APP_BUNDLE"

# Create .app bundle structure
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# ---- Info.plist ----
sed "s/__VERSION__/${VERSION}/g" "$ROOT_DIR/installer/macos/Info.plist.template" > "$APP_BUNDLE/Contents/Info.plist"

# ---- Launcher script ----
# The launcher starts the sidecar using bundled Node.js, then runs Neutralino
cat > "$APP_BUNDLE/Contents/MacOS/${APP_NAME}" << 'LAUNCHER'
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
RESOURCES="$DIR/../Resources"

# Start sidecar with bundled Node.js
"$RESOURCES/runtime/node" "$RESOURCES/apps/sidecar/dist/bundle.mjs" &
SIDECAR_PID=$!

# Wait for sidecar to be ready
for i in $(seq 1 20); do
  if curl -sf http://localhost:47531/api/health > /dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# Run Neutralino
"$RESOURCES/obs-powergrid-bin" --path="$RESOURCES/" --load-dir-res

# Cleanup: stop sidecar when Neutralino exits
kill $SIDECAR_PID 2>/dev/null
wait $SIDECAR_PID 2>/dev/null
LAUNCHER
chmod +x "$APP_BUNDLE/Contents/MacOS/${APP_NAME}"

# ---- Neutralino binary ----
cp "$ROOT_DIR/bin/$BINARY" "$APP_BUNDLE/Contents/Resources/obs-powergrid-bin"
chmod +x "$APP_BUNDLE/Contents/Resources/obs-powergrid-bin"

# ---- Neutralino config ----
# Patch config for .app bundle: remove the url field so it uses documentRoot
node -e "
  const fs = require('fs');
  const config = JSON.parse(fs.readFileSync('$ROOT_DIR/neutralino.config.json', 'utf8'));
  delete config.url;
  config.documentRoot = '/apps/desktop/dist/';
  config.modes.window.enableInspector = false;
  fs.writeFileSync('$APP_BUNDLE/Contents/Resources/neutralino.config.json', JSON.stringify(config, null, 2));
"

# ---- Frontend ----
mkdir -p "$APP_BUNDLE/Contents/Resources/apps/desktop/dist"
cp -r "$ROOT_DIR/apps/desktop/dist/"* "$APP_BUNDLE/Contents/Resources/apps/desktop/dist/"

# ---- Sidecar bundle ----
mkdir -p "$APP_BUNDLE/Contents/Resources/apps/sidecar/dist"
cp "$ROOT_DIR/apps/sidecar/dist/bundle.mjs" "$APP_BUNDLE/Contents/Resources/apps/sidecar/dist/"

# ---- Native modules ----
SIDECAR_NM="$ROOT_DIR/apps/sidecar/node_modules"
DIST_NM="$APP_BUNDLE/Contents/Resources/apps/sidecar/node_modules"

# better-sqlite3-multiple-ciphers (pnpm override: better-sqlite3 -> better-sqlite3-multiple-ciphers)
mkdir -p "$DIST_NM"
if [ -d "$SIDECAR_NM/better-sqlite3-multiple-ciphers" ]; then
  mkdir -p "$DIST_NM/better-sqlite3-multiple-ciphers/build/Release"
  mkdir -p "$DIST_NM/better-sqlite3-multiple-ciphers/lib"
  cp -rL "$SIDECAR_NM/better-sqlite3-multiple-ciphers/lib/" "$DIST_NM/better-sqlite3-multiple-ciphers/lib/"
  cp -L "$SIDECAR_NM/better-sqlite3-multiple-ciphers/package.json" "$DIST_NM/better-sqlite3-multiple-ciphers/"
  find "$SIDECAR_NM/better-sqlite3-multiple-ciphers" -name "*.node" -exec cp -L {} "$DIST_NM/better-sqlite3-multiple-ciphers/build/Release/" \;
  # Create better-sqlite3 alias (bundle.mjs imports 'better-sqlite3')
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

# bindings + file-uri-to-path
if [ -d "$SIDECAR_NM/bindings" ]; then
  cp -rL "$SIDECAR_NM/bindings" "$DIST_NM/"
fi
if [ -d "$SIDECAR_NM/file-uri-to-path" ]; then
  cp -rL "$SIDECAR_NM/file-uri-to-path" "$DIST_NM/"
fi

# ---- Resources directory (Neutralino requirement) ----
mkdir -p "$APP_BUNDLE/Contents/Resources/resources"

# ---- Node.js runtime ----
if [ -f "$ROOT_DIR/runtime/node" ]; then
  mkdir -p "$APP_BUNDLE/Contents/Resources/runtime"
  cp "$ROOT_DIR/runtime/node" "$APP_BUNDLE/Contents/Resources/runtime/node"
  chmod +x "$APP_BUNDLE/Contents/Resources/runtime/node"
else
  echo "WARNING: No bundled Node.js runtime found at runtime/node"
  echo "Run: bash scripts/download-node-runtime.sh"
  echo "The .app will require Node.js installed on the system."
fi

# ---- Icon ----
ICONS_DIR="$ROOT_DIR/apps/desktop/resources/icons"
if command -v iconutil &>/dev/null && [ -f "$ICONS_DIR/icon-1024.png" ]; then
  ICONSET_DIR="/tmp/obs-powergrid.iconset"
  rm -rf "$ICONSET_DIR"
  mkdir -p "$ICONSET_DIR"

  cp "$ICONS_DIR/icon-16.png" "$ICONSET_DIR/icon_16x16.png"
  cp "$ICONS_DIR/icon-32.png" "$ICONSET_DIR/icon_16x16@2x.png"
  cp "$ICONS_DIR/icon-32.png" "$ICONSET_DIR/icon_32x32.png"
  cp "$ICONS_DIR/icon-64.png" "$ICONSET_DIR/icon_32x32@2x.png"
  cp "$ICONS_DIR/icon-128.png" "$ICONSET_DIR/icon_128x128.png"
  cp "$ICONS_DIR/icon-256.png" "$ICONSET_DIR/icon_128x128@2x.png"
  cp "$ICONS_DIR/icon-256.png" "$ICONSET_DIR/icon_256x256.png"
  cp "$ICONS_DIR/icon-512.png" "$ICONSET_DIR/icon_256x256@2x.png"
  cp "$ICONS_DIR/icon-512.png" "$ICONSET_DIR/icon_512x512.png"
  cp "$ICONS_DIR/icon-1024.png" "$ICONSET_DIR/icon_512x512@2x.png"

  iconutil -c icns "$ICONSET_DIR" -o "$APP_BUNDLE/Contents/Resources/icon.icns"
  rm -rf "$ICONSET_DIR"
  echo "Icon: icon.icns generated"
else
  echo "WARNING: iconutil not available or icons missing, skipping .icns generation"
fi

echo ""
echo "=== .app bundle created ==="
echo "Location: $APP_BUNDLE"
du -sh "$APP_BUNDLE"
echo ""

# ---- Create DMG ----
DMG_NAME="OBS-PowerGrid-v${VERSION}-macos-${ARCH}.dmg"

if command -v create-dmg &>/dev/null; then
  echo "Creating DMG..."
  rm -f "$DIST_DIR/$DMG_NAME"
  create-dmg \
    --volname "OBS PowerGrid" \
    --window-pos 200 120 \
    --window-size 600 400 \
    --icon-size 100 \
    --icon "OBS PowerGrid.app" 150 190 \
    --app-drop-link 450 190 \
    --no-internet-enable \
    "$DIST_DIR/$DMG_NAME" \
    "$APP_BUNDLE" || true

  if [ -f "$DIST_DIR/$DMG_NAME" ]; then
    echo "DMG: $DIST_DIR/$DMG_NAME"
    ls -lh "$DIST_DIR/$DMG_NAME"
  fi
else
  echo "create-dmg not found. Install with: brew install create-dmg"
  echo "Creating tar.gz instead..."
  cd "$DIST_DIR"
  tar -czf "obs-powergrid-v${VERSION}-macos-${ARCH}.tar.gz" "${APP_NAME}.app"
  echo "Archive: $DIST_DIR/obs-powergrid-v${VERSION}-macos-${ARCH}.tar.gz"
fi

echo ""
echo "=== macOS build complete! ==="

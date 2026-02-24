#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist/obs-tuya-smart-plug"
VERSION=$(node -e "console.log(require('./package.json').version)")

echo "=== Build OBS Tuya Smart Plug v${VERSION} ==="

# Detectar plataforma
ARCH=$(uname -m)
OS=$(uname -s)

if [ "$OS" = "Darwin" ]; then
  if [ "$ARCH" = "arm64" ]; then
    BINARY="neutralino-mac_arm64"
    PLATFORM="macos-arm64"
  else
    BINARY="neutralino-mac_x64"
    PLATFORM="macos-x64"
  fi
  TARGET="obs-tuya-smart-plug"
elif [ "$OS" = "Linux" ]; then
  BINARY="neutralino-linux_x64"
  PLATFORM="linux-x64"
  TARGET="obs-tuya-smart-plug"
else
  BINARY="neutralino-win_x64.exe"
  PLATFORM="windows-x64"
  TARGET="obs-tuya-smart-plug.exe"
fi

echo "Plataforma: $PLATFORM"

echo "[1/6] Compilando sidecar..."
pnpm --filter @obs-tuya/sidecar build

echo "[2/6] Bundlando sidecar (esbuild)..."
pnpm --filter @obs-tuya/sidecar bundle

echo "[3/6] Compilando app..."
pnpm --filter @obs-tuya/desktop build

echo "[4/6] Montando distribuicao..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Binario Neutralino
cp "$ROOT_DIR/bin/$BINARY" "$DIST_DIR/$TARGET"
chmod +x "$DIST_DIR/$TARGET"

# Config Neutralino
cp "$ROOT_DIR/neutralino.config.json" "$DIST_DIR/"

# Frontend (apps/desktop/dist)
mkdir -p "$DIST_DIR/apps/desktop/dist"
cp -r "$ROOT_DIR/apps/desktop/dist/"* "$DIST_DIR/apps/desktop/dist/"

# Sidecar bundle (arquivo unico em vez de node_modules completo)
mkdir -p "$DIST_DIR/apps/sidecar/dist"
cp "$ROOT_DIR/apps/sidecar/dist/bundle.mjs" "$DIST_DIR/apps/sidecar/dist/"
cp "$ROOT_DIR/apps/sidecar/dist/bundle.mjs.map" "$DIST_DIR/apps/sidecar/dist/" 2>/dev/null || true

# Modulos nativos (nao podem ser bundlados pelo esbuild)
SIDECAR_NM="$ROOT_DIR/apps/sidecar/node_modules"
DIST_NM="$DIST_DIR/apps/sidecar/node_modules"

# better-sqlite3 (SQLCipher) - modulo nativo
if [ -d "$SIDECAR_NM/better-sqlite3" ]; then
  mkdir -p "$DIST_NM/better-sqlite3/build/Release"
  cp "$SIDECAR_NM/better-sqlite3/lib/"*.js "$DIST_NM/better-sqlite3/lib/" 2>/dev/null || true
  mkdir -p "$DIST_NM/better-sqlite3/lib"
  # Copiar os arquivos JS necessarios
  cp -r "$SIDECAR_NM/better-sqlite3/lib/" "$DIST_NM/better-sqlite3/lib/"
  cp "$SIDECAR_NM/better-sqlite3/package.json" "$DIST_NM/better-sqlite3/"
  # Copiar o binding nativo (.node)
  find "$SIDECAR_NM/better-sqlite3" -name "*.node" -exec cp {} "$DIST_NM/better-sqlite3/build/Release/" \;
fi

# better-sqlite3-multiple-ciphers (alias do better-sqlite3)
if [ -d "$SIDECAR_NM/better-sqlite3-multiple-ciphers" ]; then
  mkdir -p "$DIST_NM/better-sqlite3-multiple-ciphers/build/Release"
  mkdir -p "$DIST_NM/better-sqlite3-multiple-ciphers/lib"
  cp -r "$SIDECAR_NM/better-sqlite3-multiple-ciphers/lib/" "$DIST_NM/better-sqlite3-multiple-ciphers/lib/"
  cp "$SIDECAR_NM/better-sqlite3-multiple-ciphers/package.json" "$DIST_NM/better-sqlite3-multiple-ciphers/"
  find "$SIDECAR_NM/better-sqlite3-multiple-ciphers" -name "*.node" -exec cp {} "$DIST_NM/better-sqlite3-multiple-ciphers/build/Release/" \;
fi

# argon2 - modulo nativo
if [ -d "$SIDECAR_NM/argon2" ]; then
  mkdir -p "$DIST_NM/argon2/build/Release"
  mkdir -p "$DIST_NM/argon2/lib"
  cp "$SIDECAR_NM/argon2/argon2.cjs" "$DIST_NM/argon2/" 2>/dev/null || true
  cp "$SIDECAR_NM/argon2/package.json" "$DIST_NM/argon2/"
  # Copiar todos os JS
  find "$SIDECAR_NM/argon2" -maxdepth 1 -name "*.js" -exec cp {} "$DIST_NM/argon2/" \;
  find "$SIDECAR_NM/argon2" -maxdepth 1 -name "*.cjs" -exec cp {} "$DIST_NM/argon2/" \;
  find "$SIDECAR_NM/argon2" -maxdepth 1 -name "*.mjs" -exec cp {} "$DIST_NM/argon2/" \;
  # Bindings nativos
  find "$SIDECAR_NM/argon2" -name "*.node" -exec cp {} "$DIST_NM/argon2/build/Release/" \;
  # neon (sub-dependencia do argon2)
  if [ -d "$SIDECAR_NM/argon2/node_modules" ]; then
    cp -r "$SIDECAR_NM/argon2/node_modules" "$DIST_NM/argon2/"
  fi
fi

# bindings (helper para localizar .node files - usado por better-sqlite3)
if [ -d "$SIDECAR_NM/bindings" ]; then
  cp -r "$SIDECAR_NM/bindings" "$DIST_NM/"
fi

# file-uri-to-path (dependencia de bindings)
if [ -d "$SIDECAR_NM/file-uri-to-path" ]; then
  cp -r "$SIDECAR_NM/file-uri-to-path" "$DIST_NM/"
fi

# prebuild-install (pode ser necessario para localizar builds)
# Nao necessario em distribuicao - os .node files ja estao copiados

# Resources vazio (necessario para Neutralino)
mkdir -p "$DIST_DIR/resources"

echo "[5/6] Verificando..."
echo ""
echo "Distribuicao montada em: $DIST_DIR"
echo ""
echo "Tamanho total:"
du -sh "$DIST_DIR"
echo ""
echo "Detalhamento:"
du -sh "$DIST_DIR/apps/desktop/dist/"
du -sh "$DIST_DIR/apps/sidecar/dist/"
du -sh "$DIST_DIR/apps/sidecar/node_modules/" 2>/dev/null || echo "0B  (sem node_modules)"
du -sh "$DIST_DIR/$TARGET"
echo ""

echo "[6/6] Compactando..."
ARCHIVE_NAME="obs-tuya-smart-plug-v${VERSION}-${PLATFORM}"

cd "$ROOT_DIR/dist"
if [ "$OS" = "Darwin" ] || [ "$OS" = "Linux" ]; then
  tar -czf "${ARCHIVE_NAME}.tar.gz" obs-tuya-smart-plug/
  echo "Arquivo: dist/${ARCHIVE_NAME}.tar.gz"
  ls -lh "${ARCHIVE_NAME}.tar.gz"
else
  if command -v 7z &> /dev/null; then
    7z a "${ARCHIVE_NAME}.zip" obs-tuya-smart-plug/
  elif command -v zip &> /dev/null; then
    zip -r "${ARCHIVE_NAME}.zip" obs-tuya-smart-plug/
  else
    echo "AVISO: zip/7z nao encontrado, pulando compactacao"
  fi
fi

echo ""
echo "=== Build concluido! ==="
echo "Para executar: cd dist/obs-tuya-smart-plug && ./$TARGET --load-dir-res"
echo ""
echo "Nota: Node.js 22+ deve estar instalado para executar o sidecar."

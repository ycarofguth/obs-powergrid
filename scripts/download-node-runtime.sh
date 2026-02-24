#!/bin/bash
set -e

# Download portable Node.js runtime for distribution
# Usage: ./download-node-runtime.sh [platform]
# Platforms: darwin-arm64, darwin-x64, win-x64, linux-x64

NODE_VERSION="22.13.1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/runtime"

# Detect platform if not provided
if [ -z "$1" ]; then
  ARCH=$(uname -m)
  OS=$(uname -s)
  if [ "$OS" = "Darwin" ]; then
    if [ "$ARCH" = "arm64" ]; then
      PLATFORM="darwin-arm64"
    else
      PLATFORM="darwin-x64"
    fi
  elif [ "$OS" = "Linux" ]; then
    PLATFORM="linux-x64"
  else
    PLATFORM="win-x64"
  fi
else
  PLATFORM="$1"
fi

echo "Downloading Node.js v${NODE_VERSION} for ${PLATFORM}..."

mkdir -p "$RUNTIME_DIR"

if [ "$PLATFORM" = "win-x64" ]; then
  URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
  TEMP_FILE="/tmp/node-runtime.zip"
  TEMP_DIR="/tmp/node-runtime-extract"

  curl -fsSL "$URL" -o "$TEMP_FILE"
  rm -rf "$TEMP_DIR"
  mkdir -p "$TEMP_DIR"

  if command -v 7z &>/dev/null; then
    7z x "$TEMP_FILE" -o"$TEMP_DIR" -y >/dev/null
  elif command -v unzip &>/dev/null; then
    unzip -q "$TEMP_FILE" -d "$TEMP_DIR"
  fi

  cp "$TEMP_DIR/node-v${NODE_VERSION}-win-x64/node.exe" "$RUNTIME_DIR/node.exe"
  rm -rf "$TEMP_FILE" "$TEMP_DIR"
else
  URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${PLATFORM}.tar.gz"
  TEMP_FILE="/tmp/node-runtime.tar.gz"

  curl -fsSL "$URL" -o "$TEMP_FILE"
  tar -xzf "$TEMP_FILE" -C /tmp/
  cp "/tmp/node-v${NODE_VERSION}-${PLATFORM}/bin/node" "$RUNTIME_DIR/node"
  chmod +x "$RUNTIME_DIR/node"

  # Strip debug symbols to reduce size
  strip "$RUNTIME_DIR/node" 2>/dev/null || true

  rm -rf "$TEMP_FILE" "/tmp/node-v${NODE_VERSION}-${PLATFORM}"
fi

echo "Node.js runtime saved to: $RUNTIME_DIR/"
ls -lh "$RUNTIME_DIR/"

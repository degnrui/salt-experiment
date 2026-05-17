#!/usr/bin/env bash
set -euo pipefail

APP_NAME="salt-experiment"
APP_DIR="$HOME/$APP_NAME"
NEXT_DIR="$HOME/${APP_NAME}-new"
OLD_DIR="$HOME/${APP_NAME}-old"
ZIP_PATH="$HOME/${APP_NAME}.zip"
ZIP_URL="https://codeload.github.com/degnrui/salt-experiment/zip/refs/heads/main"

cd "$HOME"
rm -rf "$NEXT_DIR" "$ZIP_PATH"
curl -fsSL -o "$ZIP_PATH" "$ZIP_URL"
unzip -q "$ZIP_PATH"
mv "${APP_NAME}-main" "$NEXT_DIR"

cd "$NEXT_DIR"
npm install
npm test

cd "$HOME"
if [ -f "$APP_DIR/data.sqlite" ]; then
  cp "$APP_DIR/data.sqlite" "$NEXT_DIR/data.sqlite"
fi

rm -rf "$OLD_DIR"
if [ -d "$APP_DIR" ]; then
  mv "$APP_DIR" "$OLD_DIR"
fi
mv "$NEXT_DIR" "$APP_DIR"

cd "$APP_DIR"
pm2 restart "$APP_NAME"

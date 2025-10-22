#!/bin/bash
set -e

# Build script for Twitch Mutual Follows extension
# Creates separate builds for Chrome (MV3 with service_worker) and Firefox (MV3 with scripts)

cd "$(dirname "$0")"

VERSION=$(grep '"version"' extension/manifest.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
BUILD_DIR="build"
CHROME_DIR="$BUILD_DIR/chrome"
FIREFOX_DIR="$BUILD_DIR/firefox"

echo "🔨 Building Twitch Mutual Follows v$VERSION"

# Clean previous builds
rm -rf "$BUILD_DIR"
mkdir -p "$CHROME_DIR" "$FIREFOX_DIR"

# Copy extension files to both directories
echo "📦 Copying extension files..."
cp -r extension/* "$CHROME_DIR/"
cp -r extension/* "$FIREFOX_DIR/"

# Chrome: Keep as is (already has service_worker)
echo "🌐 Configuring Chrome build (service_worker)..."
# No changes needed - manifest already has service_worker

# Firefox: Replace "service_worker" with "scripts" array
echo "🦊 Configuring Firefox build (scripts)..."
sed -i 's/"service_worker": "src\/background\.sw\.js"/"scripts": ["src\/compat.js", "src\/background.js"]/' "$FIREFOX_DIR/manifest.json"

# Create zip archives
echo "📦 Creating archives..."
cd "$CHROME_DIR"
zip -r "../twitch-mutual-follows-chrome-v$VERSION.zip" . -x "*.DS_Store" > /dev/null
cd ../..

cd "$FIREFOX_DIR"
zip -r "../twitch-mutual-follows-firefox-v$VERSION.zip" . -x "*.DS_Store" > /dev/null
cd ../..

echo "✅ Build complete!"
echo "   Chrome:  $BUILD_DIR/twitch-mutual-follows-chrome-v$VERSION.zip"
echo "   Firefox: $BUILD_DIR/twitch-mutual-follows-firefox-v$VERSION.zip"

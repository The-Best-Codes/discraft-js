#!/bin/bash

# Script to build a Bun project with Tailwind CSS

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
  echo "Bun is not installed. Please install it before running this script."
  exit 1
fi

# Define directories
TEMP_DIR="dist-temp"
DIST_DIR="dist"
SRC_DIR="src"
PACKAGE_JSON="package.json"
INDEX_HTML="index.html"

# Create temporary directory
mkdir -p "$TEMP_DIR"

# Copy necessary files to the temporary directory
cp "$PACKAGE_JSON" "$INDEX_HTML" "$SRC_DIR" "$TEMP_DIR" -r

# Navigate to the temporary directory
cd "$TEMP_DIR" || exit 1

# Run Tailwind CSS build
echo "Building Tailwind CSS..."
bunx @tailwindcss/cli -i "./$SRC_DIR/index.css" -o "./$SRC_DIR/index.css"

# Build with Bun
echo "Building with Bun..."
bun build "$INDEX_HTML" --outdir dist

###
# We have the two minify steps below because Bun won't properly minify HTML,
# So we have to do the CSS and JS minification separately.
###

# Minify the built JS file
echo "Minifying JS files..."
find dist -name "*.js" -print0 | while IFS= read -r -d $'\0' file; do
  echo "Minifying: $file"
  bun build "$file" --outfile "$file" --minify
done

# Minify the built CSS file
echo "Minifying CSS files..."
find dist -name "*.css" -print0 | while IFS= read -r -d $'\0' file; do
  echo "Minifying: $file"
  bun build "$file" --outfile "$file" --minify
done

# Navigate back to the parent directory
cd .. || exit 1

# Remove existing dist directory (if it exists)
if [ -d "$DIST_DIR" ]; then
  echo "Removing existing '$DIST_DIR' directory..."
  rm -rf "$DIST_DIR"
fi

# Copy the built files from the temporary directory to the dist directory
echo "Copying built files to '$DIST_DIR' directory..."
mkdir -p "$DIST_DIR"
cp "$TEMP_DIR/dist"/* "$DIST_DIR" -r

# Clean up the temporary directory
echo "Removing temporary directory '$TEMP_DIR'..."
rm -rf "$TEMP_DIR"

echo "Build completed successfully!"
exit 0

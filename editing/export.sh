#!/bin/bash

# IMPORTANT: This script should always be run from the directory it is in

echo "IMPORTANT: This script should always be run from the directory it is in"
echo "Exporting..."

# Clear and create the minified directory
echo "Clearing minified directory..."
rm -rf ./minified
mkdir -p ./minified

# Find path to local terser
TERSER="../node_modules/.bin/terser"

# Function to process files recursively
process_files() {
    local source_dir=$1
    local terser_args=$2
    
    # Create corresponding directory structure in minified/
    echo "Creating minified directory structure..."
    find "$source_dir" -type d -exec mkdir -p "./minified/{}" \;
    
    # Find all .js files and minify them
    echo "Minifying .js files in $source_dir..."
    find "$source_dir" -type f -name "*.js" | while read -r file; do
        # Get the relative path
        rel_path=${file#./}
        # Create minified version
        echo "Running: $TERSER $file $terser_args -o ./minified/$rel_path"
        "$TERSER" "$file" $terser_args -o "./minified/$rel_path"
        # Copy to parent directory maintaining directory structure
        mkdir -p "../$(dirname "$rel_path")"
        cp "./minified/$rel_path" "../$rel_path"
    done
}

# Process scripts/ and common/ with aggressive minification
if [ -d "./scripts" ]; then
    process_files "scripts" "--compress sequences=true,dead_code=true,conditionals=true,booleans=true,unused=true,if_return=true,join_vars=true,drop_console=false comments=false"
fi

if [ -d "./common" ]; then
    process_files "common" "--compress sequences=true,dead_code=true,conditionals=true,booleans=true,unused=true,if_return=true,join_vars=true,drop_console=false comments=false"
fi

# Process bin/ with preserved comments but still mangled
if [ -d "./bin" ]; then
    process_files "bin" "  comments=true,beautify=false"
fi

# Process src/ with preserved comments but still mangled
if [ -d "./src" ]; then
    process_files "src" "  comments=true,beautify=false"
fi

echo "Removing minified directory..."
rm -rf ./minified

# Remove the src/discraft/commands/index.js file and src/discraft/events/index.js files
echo "Removing src/discraft/commands/index.js and src/discraft/events/index.js..."
rm -f ../src/discraft/commands/index.js
rm -f ../src/discraft/events/index.js

echo "Done exporting."
#!/bin/sh

# Set color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to print styled messages
print_status() {
    printf "${BLUE}${BOLD}[STATUS]${NC} %s\n" "$1"
}

print_success() {
    printf "${GREEN}${BOLD}[SUCCESS]${NC} %s\n" "$1"
}

print_error() {
    printf "${RED}${BOLD}[ERROR]${NC} %s\n" "$1"
}

# Check if running from correct directory
if [ ! -f "$(basename "$0")" ]; then
    print_error "This script must be run from its containing directory"
    exit 1
fi

# Find required tools
TERSER="../node_modules/.bin/terser"
ROLLUP="../node_modules/.bin/rollup"
PARALLEL=$(which parallel)

if [ ! -x "$PARALLEL" ]; then
    print_error "GNU Parallel is required. Please install it first."
    exit 1
fi

if [ ! -f "$TERSER" ]; then
    print_error "Terser not found at $TERSER"
    exit 1
fi

if [ ! -f "$ROLLUP" ]; then
    print_error "Rollup not found at $ROLLUP"
    exit 1
fi

print_status "Starting export process..."

# Clear and create the minified directory
print_status "Clearing minified directory..."
rm -rf ./minified
mkdir -p ./minified

# Special handling for logger.js
print_status "Processing logger.js specially..."
cat > rollup.config.js << EOF
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: './src/utils/logger.js',
  output: {
    file: './minified/special/src/utils/logger.js',
    format: 'esm',
    compact: true
  },
  external: ['../../src/config/bot.config.js'],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    terser({
      compress: {
        drop_console: false
      },
      mangle: true,
      format: {
        comments: false
      }
    })
  ]
};
EOF

mkdir -p ./minified/special/src/utils
"$ROLLUP" -c rollup.config.js
rm rollup.config.js

# Process the bundled logger with terser
"$TERSER" ./minified/src/utils/logger.js \
  --compress sequences=true,dead_code=true,conditionals=true,booleans=true,unused=true,if_return=true,join_vars=true,drop_console=false \
  --mangle --format comments=false \
  -o ./minified/src/utils/logger.js

# Function to process directory with parallel execution
process_directory() {
    dir=$1
    terser_args=$2

    if [ ! -d "$dir" ]; then
        return
    fi

    print_status "Processing $dir/..."

    # Create all required directories in one go
    find "$dir" -type d -print0 | xargs -0 -I{} mkdir -p "./minified/{}"

    # Process files in parallel, excluding logger.js
    find "$dir" -type f -name "*.js" ! -path "*/src/utils/logger.js" -print0 | \
    $PARALLEL -0 --bar --eta \
    "mkdir -p ./minified/\$(dirname {}) && \
    \"$TERSER\" {} $terser_args -o ./minified/{} 2>/dev/null && \
    mkdir -p ../\$(dirname {}) && \
    cp ./minified/{} ../{} && \
    echo \"✓ {}\" || echo \"✗ Failed: {}\""
}

# Process all directories in parallel if they exist
(
[ -d "./scripts" ] && process_directory "scripts" "--compress sequences=true,dead_code=true,conditionals=true,booleans=true,unused=true,if_return=true,join_vars=true,drop_console=false --mangle --format comments=false" &
[ -d "./common" ] && process_directory "common" "--compress sequences=true,dead_code=true,conditionals=true,booleans=true,unused=true,if_return=true,join_vars=true,drop_console=false --mangle --format comments=false" &
[ -d "./bin" ] && process_directory "bin" "--mangle --format comments=true,beautify=false" &
[ -d "./src" ] && process_directory "src" "--mangle --format comments=true,beautify=false" &
wait
)

# Don't forget to copy the specially processed logger.js to its final destination
mkdir -p ../src/utils
cp ./minified/special/src/utils/logger.js ../src/utils/logger.js

# Remove the src/discraft/commands/index.js file and src/discraft/events/index.js files
print_status "Removing index.js files..."
rm -f ../src/discraft/commands/index.js
rm -f ../src/discraft/events/index.js
rm -rf minified

print_success "Export completed successfully!"

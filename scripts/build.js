import { exec } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { info, error, success } from '../src/utils/logger.js';
import inquirer from 'inquirer';
import { Command } from 'commander';
import { minify } from 'terser';
import { promisify } from 'util';
import { rollup } from 'rollup';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');

const program = new Command();

program
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('--max-optimize', 'Enable maximum optimization (slower build, faster runtime)', false)
  .parse(process.argv);

const options = program.opts();

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getFileSizes(dir, originalSizes = new Map()) {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  const sizes = new Map();

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const subSizes = await getFileSizes(fullPath, originalSizes);
      for (const [subPath, size] of subSizes) {
        sizes.set(subPath, size);
      }
    } else if (file.name.endsWith('.js')) {
      const stats = await fs.promises.stat(fullPath);
      sizes.set(fullPath, stats.size);
    }
  }
  return sizes;
}

// Copy directory recursively
async function copyDir(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function minifyWithTerser(filePath, config) {
  const code = await fs.promises.readFile(filePath, 'utf8');

  const terserOptions = {
    module: true,
    toplevel: true,
    compress: {
      ecma: 2020,
      module: true,
      toplevel: true,
      passes: config.maxOptimize ? 3 : 1,
      keep_fnames: config.keepFunctionNames,
      pure_getters: true,
      dead_code: true,
      unused: true,
      properties: true,
      drop_debugger: true,
      arguments: true,
      booleans_as_integers: false,
      hoist_funs: true,
      hoist_props: true,
      hoist_vars: true,
      join_vars: true,
      negate_iife: true,
      reduce_vars: true,
      collapse_vars: true,
      inline: 3,
      evaluate: true,
      pure_funcs: ['console.log', 'console.debug'],
      drop_console: config.maxOptimize,
    },
    mangle: {
      module: true,
      toplevel: true,
      keep_fnames: config.keepFunctionNames,
      properties: config.maxOptimize ? {
        reserved: ['_events', '_eventsCount', '_maxListeners', 'domain'],
        regex: /^_/
      } : false
    },
    format: {
      ecma: 2020,
      comments: !config.removeComments,
      ascii_only: true,
      beautify: false
    },
    sourceMap: config.sourceMaps,
    parse: {
      module: true,
      ecma: 2020
    }
  };

  const result = await minify(code, terserOptions);
  await fs.promises.writeFile(filePath, result.code);
  if (result.map && config.sourceMaps) {
    await fs.promises.writeFile(`${filePath}.map`, result.map);
  }
}

async function build() {
  try {
    info('Starting build process...');

    const config = await getBuildConfig();

    // Get original file sizes
    const srcDir = path.join(process.cwd(), 'src');
    const originalSizes = await getFileSizes(srcDir);

    // Ensure dist directory exists and is empty
    const outputDir = path.resolve(process.cwd(), options.output);
    if (fs.existsSync(outputDir)) {
      await fs.promises.rm(outputDir, { recursive: true });
    }
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Step 1: Copy source files to dist
    info('Copying source files...');
    await copyDir(srcDir, outputDir);

    // Step 2: Bundle with Rollup
    info('Running Rollup bundler...');
    const rollupConfig = (await import('../rollup.config.js')).default;
    const bundle = await rollup(rollupConfig);
    await bundle.write(rollupConfig.output);
    await bundle.close();

    // Step 3: Terser minification (if enabled)
    if (config.minify) {
      info('Running Terser minification...');
      if (config.maxOptimize) {
        info('Using maximum optimization settings (this may take longer)...');
      }

      const files = fs.readdirSync(outputDir, { recursive: true })
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(outputDir, file));

      await Promise.all(files.map(async (file) => {
        try {
          await minifyWithTerser(file, config);
        } catch (err) {
          error(`Error minifying ${file}:`, err);
        }
      }));
    }

    // Get final file sizes and display comparison
    const newSizes = await getFileSizes(outputDir);
    displaySizeComparison(originalSizes, newSizes);

    info(`Output location: ${outputDir}`);
    success('Build completed successfully.');
  } catch (err) {
    error('Build failed:', err);
    process.exit(1);
  }
}

function displaySizeComparison(originalSizes, newSizes) {
  let totalOriginal = 0;
  let totalNew = 0;
  const comparisons = [];

  for (const [file, newSize] of newSizes) {
    const relPath = path.relative(distPath, file);
    const srcPath = path.join(process.cwd(), 'src', relPath);
    const originalSize = originalSizes.get(srcPath) || 0;

    totalOriginal += originalSize;
    totalNew += newSize;

    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    comparisons.push({
      file: relPath,
      original: formatBytes(originalSize),
      new: formatBytes(newSize),
      reduction: reduction
    });
  }

  info('\nBuild Statistics:');
  info('================');
  comparisons.forEach(({ file, original, new: newSize, reduction }) => {
    info(`${file}:`);
    info(`  Original: ${original}`);
    info(`  Built   : ${newSize}`);
    info(`  Saved   : ${reduction}%\n`);
  });

  const totalReduction = ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1);
  success('\nTotal Results:');
  success(`Original Size: ${formatBytes(totalOriginal)}`);
  success(`Final Size  : ${formatBytes(totalNew)}`);
  success(`Total Saved : ${totalReduction}%`);
}

async function getBuildConfig() {
  if (options.yes) {
    return {
      minify: true,
      keepFunctionNames: false,
      removeComments: true,
      sourceMaps: false,
      maxOptimize: options.maxOptimize
    };
  }

  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'minify',
      message: 'Do you want to minify the code?',
      default: true
    },
    {
      type: 'confirm',
      name: 'maxOptimize',
      message: 'Enable maximum optimization (slower build, faster runtime)?',
      default: false,
      when: answers => answers.minify
    },
    {
      type: 'confirm',
      name: 'keepFunctionNames',
      message: 'Keep function names for better error traces? (disable for smaller size)',
      default: false,
      when: answers => answers.minify
    },
    {
      type: 'confirm',
      name: 'removeComments',
      message: 'Remove comments from the output?',
      default: true,
      when: answers => answers.minify
    },
    {
      type: 'confirm',
      name: 'sourceMaps',
      message: 'Generate source maps?',
      default: false
    }
  ]);
}

build();
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { info, error, success } from '../common/utils/logger.js';
import inquirer from 'inquirer';
import { Command } from 'commander';
import { rollup } from 'rollup';
import { getFileSizes, displaySizeComparison } from './utils/fileSizeUtil.js';
import { minifyWithTerser } from './utils/minifyUtilTerser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');

const program = new Command();

program
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('--max-optimize', 'Enable maximum optimization (slower build, faster runtime)', false)
  .parse(process.argv);

const options = program.opts();

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
    displaySizeComparison(originalSizes, newSizes, distPath);

    info(`Output location: ${outputDir}`);
    success('Build completed successfully.');
  } catch (err) {
    error('Build failed:', err);
    process.exit(1);
  }
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
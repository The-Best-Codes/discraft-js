import fs from 'fs';
import path from 'path';
import { info, error, success } from '../common/utils/logger.js';
import inquirer from 'inquirer';
import { Command } from 'commander';
import { rollup } from 'rollup';
import { getFileSizes, displaySizeComparison } from './utils/fileSizeUtil.js';
import { minifyWithTerser } from './utils/minifyUtilTerser.js';

const program = new Command();

program
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('--max-optimize', 'Enable maximum optimization (slower build, faster runtime)', false)
  .parse(process.argv);

const options = program.opts();

async function build() {
  try {
    info('Starting build process...');

    const config = await getBuildConfig();

    // Get original source size before clearing dist
    const srcDir = path.join(process.cwd(), 'src');
    const originalSize = await getFileSizes(srcDir);

    // Ensure dist directory exists and is empty
    const outputDir = path.resolve(process.cwd(), options.output);
    if (fs.existsSync(outputDir)) {
      await fs.promises.rm(outputDir, { recursive: true });
    }
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Bundle with Rollup
    info('Running Rollup bundler...');
    const rollupConfig = (await import('../rollup.config.js')).default;
    const bundle = await rollup(rollupConfig);
    await bundle.write(rollupConfig.output);
    await bundle.close();

    // Minify the bundle if enabled
    if (config.minify) {
      info('Running Terser minification...');
      if (config.maxOptimize) {
        info('Using maximum optimization settings (this may take longer)...');
      }

      const bundlePath = path.join(outputDir, 'bundle.js');
      await minifyWithTerser(bundlePath, config);
    }

    // Display size comparison
    await displaySizeComparison(originalSize, outputDir);

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

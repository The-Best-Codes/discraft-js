import fs from 'fs';
import path from 'path';
import { info, error, success } from '../common/utils/logger.js';
import inquirer from 'inquirer';
import { Command } from 'commander';
import { rollup } from 'rollup';
import { getFileSizes, displaySizeComparison } from './utils/fileSizeUtil.js';
import { minifyWithTerser } from './utils/minifyUtilTerser.js';
import generateCommands from './compile/genCommands.js';
import generateEvents from './compile/genEvents.js';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const discraftDir = path.resolve(__dirname, '..');

const program = new Command();
const projectDir = process.cwd();
const srcDir = path.join(projectDir, 'src');

program
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('--max-optimize', 'Enable maximum optimization (slower build, faster runtime)', true)
  .parse(process.argv);

const options = program.opts();

async function analyzeDependencies(bundlePath, rollupBundle) {
  // Get external dependencies from rollup metadata
  const externalDeps = new Set();

  // Analyze the chunk modules from rollup
  for (const chunk of rollupBundle.output) {
    if (chunk.imports) {
      chunk.imports.forEach(imp => externalDeps.add(imp));
    }
    if (chunk.modules) {
      Object.keys(chunk.modules).forEach(id => {
        // Check if the module is from node_modules
        if (id.includes('node_modules')) {
          const matches = id.match(/node_modules\/([^/]+)/);
          if (matches && matches[1]) {
            // Handle scoped packages
            if (matches[1].startsWith('@')) {
              const scopedMatch = id.match(/node_modules\/([@][^/]+\/[^/]+)/);
              if (scopedMatch) {
                externalDeps.add(scopedMatch[1]);
              }
            } else {
              externalDeps.add(matches[1]);
            }
          }
        }
      });
    }
  }

  // Also analyze the pre-minified bundle content as backup
  const content = await fs.promises.readFile(bundlePath, 'utf-8');
  const requirePattern = /(?:require|import)[\s\(]['"]([^./@][^'"]+)['"]\)?/g;
  let match;
  while ((match = requirePattern.exec(content)) !== null) {
    const packageName = match[1].split('/')[0];
    externalDeps.add(packageName);
  }

  const mainPackageJson = JSON.parse(await fs.promises.readFile(path.join(projectDir, 'package.json'), 'utf-8'));

  // Create minimal package.json with only runtime dependencies
  const minimalPackage = {
    name: "discraft-bot",
    type: "module",
    version: "1.0.0",
    description: `Bot created with Discraft`,
    main: "bundle.js",
    dependencies: {}
  };

  // Add found packages with their versions from main package.json
  for (const pkg of externalDeps) {
    if (mainPackageJson.dependencies?.[pkg]) {
      minimalPackage.dependencies[pkg] = mainPackageJson.dependencies[pkg];
    }
  }

  return minimalPackage;
}

async function build() {
  try {
    info('Starting build process...');

    // Verify source directory exists
    if (!fs.existsSync(srcDir)) {
      throw new Error(`Source directory not found at ${srcDir}`);
    }

    const inputFile = path.join(srcDir, 'index.js');
    if (!fs.existsSync(inputFile)) {
      throw new Error(`Entry point not found at ${inputFile}`);
    }

    info('Generating commands and events...');
    await new Promise((resolve) => {
      generateCommands(srcDir);
      generateEvents(srcDir);
      resolve();
    });

    const config = await getBuildConfig();

    const startTime = Date.now();

    // Get original source size before clearing dist
    const originalSize = await getFileSizes(srcDir);

    // Ensure dist directory exists and is empty
    const outputDir = path.resolve(projectDir, options.output);
    if (fs.existsSync(outputDir)) {
      await fs.promises.rm(outputDir, { recursive: true });
    }
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Resolve babel preset path
    const presetEnvPath = path.join(discraftDir, 'node_modules', '@babel/preset-env');

    // Create rollup config
    const rollupConfig = {
      input: inputFile,
      output: {
        file: path.join(outputDir, 'bundle.js'),
        format: 'es',
        exports: 'auto',
        minifyInternalExports: true,
      },
      external: (id) => {
        return (
          !id.startsWith('.') &&
          !id.startsWith('/') &&
          !id.startsWith('src/') &&
          !id.startsWith('../') &&
          !id.startsWith('./')
        );
      },
      plugins: [
        replace({
          preventAssignment: true,
          'process.env.NODE_ENV': JSON.stringify('production')
        }),
        nodeResolve({
          preferBuiltins: true,
          exportConditions: ['node']
        }),
        commonjs({
          ignoreDynamicRequires: false
        }),
        json(),
        babel({
          babelHelpers: 'bundled',
          configFile: false,
          babelrc: false,
          presets: [
            [presetEnvPath, {
              targets: { node: 'current' },
              modules: false,
              loose: true,
              exclude: ['transform-typeof-symbol']
            }]
          ]
        })
      ],
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    };

    // Bundle with Rollup
    info('Running Rollup bundler...');
    const bundle = await rollup(rollupConfig);
    const output = await bundle.write(rollupConfig.output);
    await bundle.close();

    const bundlePath = path.join(outputDir, 'bundle.js');

    // Verify bundle exists before proceeding
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`Bundle file not created at ${bundlePath}`);
    }

    // Analyze dependencies after bundle is created
    info('Analyzing dependencies...');
    const minimalPackage = await analyzeDependencies(bundlePath, { output: [output] });
    await fs.promises.writeFile(
      path.join(outputDir, 'package.json'),
      JSON.stringify(minimalPackage, null, 2)
    );
    info('Generated minimal package.json in dist directory');

    // Minify the bundle if enabled
    if (config.minify) {
      info('Running Terser minification...');
      if (config.maxOptimize) {
        info('Using maximum optimization settings (this may take longer)...');
      }
      await minifyWithTerser(bundlePath, config);
    }

    // Display size comparison
    await displaySizeComparison(originalSize, outputDir);

    info(`Output location: ${outputDir}`);
    success('Build completed successfully in ' + (Date.now() - startTime) + 'ms');
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
      default: true,
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
      default: false,
      when: answers => answers.minify
    }
  ]);
}

build();

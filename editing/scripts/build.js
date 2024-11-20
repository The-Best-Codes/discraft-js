import fs from "fs";
import path from "path";
import { info, error, success } from "../common/utils/logger.js";
import inquirer from "inquirer";
import { rollup } from "rollup";
import { getFileSizes, displaySizeComparison } from "./utils/fileSizeUtil.js";
import { minifyWithTerser } from "./utils/minifyUtilTerser.js";
import generateCommands from "./compile/genCommands.js";
import generateEvents from "./compile/genEvents.js";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import babel from "@rollup/plugin-babel";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const discraftDir = path.resolve(__dirname, "..");

const projectDir = process.cwd();
const srcDir = path.join(projectDir, "src");

// Track if build is in progress
let buildInProgress = false;
let currentBundle = null;

// Handle Ctrl+C gracefully
process.on("SIGINT", async () => {
  if (buildInProgress) {
    info("\nGracefully cancelling build process...");
    try {
      // Clean up rollup bundle if it exists
      if (currentBundle) {
        await currentBundle.close();
      }

      // Clean up output directory if it exists
      const outputDir = path.resolve(projectDir, "dist");
      if (fs.existsSync(outputDir)) {
        await fs.promises.rm(outputDir, { recursive: true });
      }

      info("Build cancelled and cleaned up successfully.");
    } catch (err) {
      error("Error while cleaning up:", err);
    }
  }
  process.exit(0);
});

async function analyzeDependencies(bundlePath, rollupBundle) {
  const externalDeps = new Set();

  // Analyze the chunk modules from rollup
  for (const item of rollupBundle.output) {
    // Check if `output` is an array inside each item
    const chunks = Array.isArray(item.output) ? item.output : [item];

    for (const chunk of chunks) {
      if (chunk.imports) {
        chunk.imports.forEach((imp) => externalDeps.add(imp));
      }
    }
  }

  // Create minimal package.json with only runtime dependencies
  const minimalPackage = {
    name: "discraft-bot",
    type: "module",
    version: "1.0.0",
    description: "Bot created with Discraft",
    main: "bundle.js",
    dependencies: {},
  };

  // Add external dependencies to package.json dependencies
  externalDeps.forEach((dep) => {
    minimalPackage.dependencies[dep] = "latest";
  });

  info(`Found ${externalDeps.size} external dependencies.`);

  return minimalPackage;
}

async function build(options) {
  buildInProgress = true;
  try {
    info("Starting build process...");

    // Verify source directory exists
    if (!fs.existsSync(srcDir)) {
      throw new Error(`Source directory not found at ${srcDir}`);
    }

    const inputFile = path.join(srcDir, "index.js");
    if (!fs.existsSync(inputFile)) {
      throw new Error(`Entry point not found at ${inputFile}`);
    }

    info("Generating commands and events...");

    await new Promise((resolve) => {
      generateCommands(srcDir);
      generateEvents(srcDir);
      resolve();
    });

    const config = await getBuildConfig(options);

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
    const presetEnvPath = path.join(
      discraftDir,
      "node_modules",
      "@babel/preset-env"
    );

    // Create rollup config
    const rollupConfig = {
      input: inputFile,
      output: {
        file: path.join(outputDir, "bundle.js"),
        format: "es",
        exports: "auto",
        minifyInternalExports: true,
      },
      external: config.standalone ? [] : (id) => {
        return (
          !id.startsWith(".") &&
          !id.startsWith("/") &&
          !id.startsWith("src/") &&
          !id.startsWith("../") &&
          !id.startsWith("./")
        );
      },
      plugins: [
        replace({
          preventAssignment: true,
          "process.env.NODE_ENV": JSON.stringify("production"),
        }),
        nodeResolve({
          preferBuiltins: true,
          exportConditions: ["node"],
        }),
        commonjs({
          ignoreDynamicRequires: false,
        }),
        json(),
        babel({
          babelHelpers: "bundled",
          configFile: false,
          babelrc: false,
          presets: [
            [
              presetEnvPath,
              {
                targets: { node: "current" },
                modules: false,
                loose: true,
                exclude: ["transform-typeof-symbol"],
              },
            ],
          ],
        }),
      ],
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    };

    // Bundle with Rollup
    info("Running Rollup bundler...");
    currentBundle = await rollup(rollupConfig);
    const bundle = await currentBundle.write(rollupConfig.output);
    await currentBundle.close();
    currentBundle = null;

    const bundlePath = path.join(outputDir, "bundle.js");

    // Verify bundle exists before proceeding
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`Bundle file not created at ${bundlePath}`);
    }

    // Only generate package.json if not in standalone mode
    if (!config.standalone) {
      const packageJson = await analyzeDependencies(bundlePath, {
        output: [bundle],
      });
      await fs.promises.writeFile(
        path.join(outputDir, "package.json"),
        JSON.stringify(packageJson, null, 2)
      );
      info("Generated package.json with dependencies");
    } else {
      info("Skipping package.json generation (standalone mode)");
    }

    // Minify the bundle if enabled
    if (config.minify) {
      info("Running Terser minification...");
      if (config.maxOptimize) {
        info("Using maximum optimization settings (this may take longer)...");
      }
      await minifyWithTerser(bundlePath, config);
    }

    // Display size comparison
    if (!config.standalone) {
      await displaySizeComparison(originalSize, outputDir);
    }

    info(`Output location: ${outputDir}`);
    success(
      "Build completed successfully in " + (Date.now() - startTime) + "ms"
    );
  } catch (err) {
    if (err.name === "ExitPromptError") {
      error("Build cancelled");
    } else if (err instanceof Error) {
      error("Build failed or cancelled:", err?.message || err);
    } else {
      error("Build failed or cancelled:", err);
    }
    process.exit(1);
  } finally {
    buildInProgress = false;
    currentBundle = null;
  }
}

async function getBuildConfig(options) {
  try {
    if (options.yes) {
      return {
        minify: true,
        keepFunctionNames: false,
        removeComments: true,
        sourceMaps: false,
        maxOptimize: options.maxOptimize,
        standalone: options.standalone,
      };
    }

    return inquirer.prompt([
      {
        type: "confirm",
        name: "minify",
        message: "Do you want to minify the code?",
        default: true,
      },
      {
        type: "confirm",
        name: "maxOptimize",
        message: "Enable maximum optimization?",
        default: true,
        when: (answers) => answers.minify,
      },
      {
        type: "confirm",
        name: "keepFunctionNames",
        message:
          "Keep function names for better error traces?",
        default: false,
        when: (answers) => answers.minify,
      },
      {
        type: "confirm",
        name: "removeComments",
        message: "Remove comments from the output?",
        default: true,
        when: (answers) => answers.minify,
      },
      {
        type: "confirm",
        name: "sourceMaps",
        message: "Generate source maps?",
        default: false,
        when: (answers) => answers.minify,
      },
      {
        type: "confirm",
        name: "standalone",
        message: "Create standalone bundle with all dependencies included?",
        default: false,
      },
    ]);
  } catch (err) {
    if (err.name === "ExitPromptError") {
      error("Build cancelled by user.");
      return process.exit(0);
    }
    error("Error while getting build config:", err);
    return process.exit(1);
  }
}

// Extract options from process arguments
const options = {
  yes: process.argv.includes("-y") || process.argv.includes("--yes"),
  output: process.argv.includes("-o")
    ? process.argv[process.argv.indexOf("-o") + 1]
    : "dist",
  maxOptimize: process.argv.includes("--max-optimize"),
  standalone: process.argv.includes("--standalone"),
};

build(options);

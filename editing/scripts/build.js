import fs from "fs";
import path from "path";
import { info, error, success, log } from "../common/utils/logger.js";
import { checkbox, confirm } from "@inquirer/prompts";
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
import { exec } from "child_process";

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

    if (config.standalone) {
      async function npmCleanModules(timeout = 60000) {
        return new Promise((resolve, reject) => {
          const process = exec("npx --yes clean-modules -y", (error, stdout, stderr) => {
            if (error) {
              reject(error || stderr);
            } else {
              resolve(stdout);
            }
          });

          // Set a timeout to reject the promise if it takes too long
          const timeoutId = setTimeout(() => {
            process.kill(); // Kill the exec process if it times out
            reject(new Error(`Process timed out after ${timeout}ms`));
          }, timeout);

          // Clear the timeout if the process finishes successfully
          process.on("close", () => clearTimeout(timeoutId));
        });
      }

      try {
        info("Simplifying dependencies (this may take a while)...");
        const result = await npmCleanModules(60000);
        log(result);
      } catch (err) {
        error("Failed to simplify dependencies:", err);
      }
    }

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

    // Check if "minify" is selected
    console.log("\n")
    const minify = await confirm({ message: 'Do you want to minify the code?' });

    // If minify is selected, ask about additional options
    let additionalOptions = [];
    if (minify) {
      additionalOptions = await checkbox({
        message: "Configure Additional Build Options:",
        choices: [
          {
            value: "maxOptimize",
            name: "Enable maximum optimization",
            checked: true,
          },
          {
            value: "keepFunctionNames",
            name: "Keep function names for better error traces",
            checked: false,
          },
          {
            value: "removeComments",
            name: "Remove comments from the output",
            checked: true,
          },
          {
            value: "sourceMaps",
            name: "Generate source maps",
            checked: false,
          },
          {
            value: "standalone",
            name: "Create standalone bundle with all dependencies included",
            checked: false,
          }
        ]
      });
    }

    // Return the final configuration
    return {
      minify: minify,
      keepFunctionNames: additionalOptions.includes('keepFunctionNames'),
      removeComments: additionalOptions.includes('removeComments'),
      sourceMaps: additionalOptions.includes('sourceMaps'),
      maxOptimize: additionalOptions.includes('maxOptimize'),
      standalone: additionalOptions.includes('standalone')
    };
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
    : process.argv.includes("--output")
      ? process.argv[process.argv.indexOf("--output") + 1]
      : "dist",
  maxOptimize: process.argv.includes("--max-optimize"),
  standalone: process.argv.includes("--standalone"),
};

build(options);

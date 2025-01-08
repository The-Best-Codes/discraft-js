import consola from "consola";
import fs from "fs/promises";
import path from "path";
import { build } from "./build";
import { generateIndexFiles } from "./commandsAndEvents";
import copyFiles from "./copyFiles";

type Builder = "esbuild" | "bun";

interface BuildOptions {
  builder?: Builder;
}

async function startBuild(options?: BuildOptions) {
  consola.info(`Starting production build...`);
  const currentWorkingDirectory = process.cwd();
  const srcPath = path.join(currentWorkingDirectory, "index.ts");
  const outputPath = path.join(currentWorkingDirectory, "dist");

  // Check if index.ts exists
  try {
    await fs.access(srcPath, fs.constants.F_OK);
  } catch (error) {
    consola.error(`Error: Could not find index.ts at ${srcPath}.`);
    consola.verbose("Error: ", error);
    throw new Error(`index.ts not found at ${srcPath}`);
  }

  consola.info("Performing pre-build setup...");
  consola.verbose("Generating index files...");
  await generateIndexFiles();
  consola.verbose("Index files generated.");
  consola.verbose("Copying files...");
  await copyFiles(currentWorkingDirectory, outputPath);
  consola.verbose("Files copied.");
  consola.success("Pre-build setup complete.");

  consola.info(`Creating production build...`);
  try {
    await build("prod", srcPath, outputPath, options?.builder);
    consola.info("Build output: " + outputPath);
    consola.success(`Build finished successfully!`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    consola.error(`Build failed: ${error.message}`);
    throw error; // Re-throw the error to stop the process
  }
}

export { startBuild as build };

import consola from "consola";
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
  } catch (error: any) {
    consola.error(`Build failed: ${error.message}`);
  }
}

export { startBuild as build };

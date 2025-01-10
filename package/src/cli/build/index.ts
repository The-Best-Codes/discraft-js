import consola from "consola";
import path from "path";
import { getEntryPoint } from "../utils";
import { build as buildFn } from "./build";
import { generateIndexFiles } from "./commandsAndEvents";
import copyFiles from "./copyFiles";

type Builder = "esbuild" | "bun";

interface BuildOptions {
  builder?: Builder;
  file?: string;
}

async function startBuild(options?: BuildOptions) {
  consola.info(`Starting production build...`);
  const currentWorkingDirectory = process.cwd();
  let outputPath = path.join(currentWorkingDirectory, "dist");
  let entryPoint;
  try {
    entryPoint = await getEntryPoint(options?.file);
    // If a custom file was provided and its not a default path, use the directory of that file for the output
    if (options?.file && !options.file.includes("index.")) {
      outputPath = path.join(path.dirname(entryPoint), "dist");
      consola.info(
        `Custom file provided, setting output path to: ${outputPath}`,
      );
    }
  } catch (e) {
    consola.error("Could not get entrypoint file");
    throw e;
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
    await buildFn("prod", entryPoint, outputPath, options?.builder);
    consola.info("Build output: " + outputPath);
    consola.success(`Build finished successfully!`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    consola.error(`Build failed: ${error.message}`);
    throw error; // Re-throw the error to stop the process
  }
}

export { startBuild as build };

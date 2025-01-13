/* eslint-disable @typescript-eslint/no-explicit-any */
import consola from "consola";
import { build as esbuild } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import path from "path";

import {
  getEntryPoint,
  isBunInstalled,
  isTypeScriptProject,
  runSubprocess,
} from "../../utils";
import { generateVercelCommandsIndex } from "./index-files/commands";

type Builder = "esbuild" | "bun";

interface BuildOptions {
  builder?: Builder;
}

async function startBuild(options?: BuildOptions) {
  consola.info("Starting Vercel build...");
  const currentWorkingDirectory = process.cwd();
  const outputDir = path.join(currentWorkingDirectory, "api");

  let entryPoint: string;
  try {
    entryPoint = await getEntryPoint();
  } catch (e: any) {
    consola.error("Could not get entrypoint file");
    throw e;
  }

  consola.info("Generating command index file...");
  const isTS = await isTypeScriptProject();
  await generateVercelCommandsIndex(isTS ? "ts" : "js");
  consola.success("Command index file generated.");

  let runner: Builder = options?.builder || "esbuild";

  if (!options?.builder) {
    if (await isBunInstalled()) {
      runner = "bun";
      consola.verbose("Bun detected. Using Bun CLI for build.");
    } else {
      consola.verbose("Bun not detected. Using esbuild for build.");
    }
  } else {
    consola.info(`Using ${options.builder} instead of auto-detect.`);
  }

  consola.info(`Creating Vercel build with ${runner}...`);
  if (runner === "bun") {
    try {
      const bunArgs = [
        "bun",
        "build",
        entryPoint,
        "--outdir",
        outputDir,
        "--target",
        "node",
        "--packages",
        "external",
        "--format",
        "esm",
        //"--minify",
      ];
      await runSubprocess(bunArgs[0], bunArgs.slice(1));
      consola.success("Build complete using Bun.");
    } catch (error: any) {
      consola.error(`Error during bun build: ${error.message}`);
      throw error;
    }
  } else {
    try {
      await esbuild({
        entryPoints: [entryPoint],
        outdir: outputDir,
        platform: "node",
        format: "esm",
        bundle: true,
        //minify: true,
        plugins: [nodeExternalsPlugin()],
      });
      consola.success("Build complete using esbuild.");
    } catch (error: any) {
      consola.error(`Error during esbuild: ${error.message}`);
      throw error;
    }
  }

  consola.info("Build output: " + outputDir);
  consola.success("Vercel build completed!");
}

export { startBuild as build };

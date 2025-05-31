/* eslint-disable @typescript-eslint/no-explicit-any */
import consola from "consola";
import { build as esbuild } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { promises as fs } from "fs";
import kleur from "kleur";
import path from "path";
import {
  getEntryPoint,
  isBunInstalled,
  isTypeScriptProject,
  runSubprocess,
} from "../../utils";
import { getCompactRelativePath } from "../../utils/relativePath";
import { generateVercelCommandsIndex } from "./index-files/commands";

type Builder = "esbuild" | "bun";

interface BuildOptions {
  builder?: Builder;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function compileAndRunRegisterScript(_isTS: boolean) {
  const currentWorkingDirectory = process.cwd();
  const registerTsPath = path.join(
    currentWorkingDirectory,
    "scripts",
    "register.ts",
  );
  const registerJsPath = path.join(
    currentWorkingDirectory,
    "scripts",
    "register.js",
  );
  const outPath = path.join(
    currentWorkingDirectory,
    ".discraft",
    "commands",
    "register.js",
  );

  let registerFile: string | null = null;
  try {
    await fs.access(registerTsPath);
    registerFile = registerTsPath;
  } catch {
    try {
      await fs.access(registerJsPath);
      registerFile = registerJsPath;
    } catch {
      consola.warn(
        "register.ts or register.js not found in scripts folder. Skipping compilation.",
      );
      return;
    }
  }

  consola.info("Compiling and running register script...");

  try {
    if (registerFile?.endsWith(".ts")) {
      // Compile register.ts to register.js
      await esbuild({
        entryPoints: [registerFile],
        outfile: outPath,
        platform: "node",
        format: "esm",
        bundle: true,
        plugins: [nodeExternalsPlugin()],
      });
      consola.verbose("register.ts compiled to .discraft/commands/register.js");
    } else {
      // Copy register.js to .discraft/commands/register.js
      await fs.copyFile(registerFile!, outPath);
      consola.verbose("register.js copied to .discraft/commands/register.js");
    }

    // Run register.js
    await runSubprocess("node", [outPath]);
    consola.success("Command registration script ran successfully.");
  } catch (error: any) {
    consola.error(`Error during register script execution.`);
    consola.verbose(error);
    consola.warn("Continuing build process.");
  }
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

  // Compile & Run register.ts or register.js if it exists.
  await compileAndRunRegisterScript(isTS);

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

  const uxOutDir = getCompactRelativePath(currentWorkingDirectory, outputDir);

  consola.info(`Build output: ${kleur.cyan(uxOutDir)}`);
  consola.success("Vercel build completed!");
}

export { startBuild as build };

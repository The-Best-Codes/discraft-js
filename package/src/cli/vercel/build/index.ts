/* eslint-disable @typescript-eslint/no-explicit-any */
import { cancel, intro, log, outro, spinner } from "@clack/prompts";
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

  const registerSpinner = spinner();
  registerSpinner.start("Compiling and running register script...");

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
    registerSpinner.stop("Command registration script ran successfully.");
  } catch (error: any) {
    registerSpinner.stop(`Error during register script execution.`, 1);
    consola.verbose(error);
    consola.warn("Continuing build process.");
  }
}

async function startBuild(options?: BuildOptions) {
  try {
    intro("Starting Vercel build...");
    const currentWorkingDirectory = process.cwd();
    const outputDir = path.join(currentWorkingDirectory, "api");

    let entryPoint: string;
    try {
      entryPoint = await getEntryPoint();
    } catch (e: any) {
      cancel("Could not get entrypoint file");
      throw e;
    }

    const indexSpinner = spinner();
    indexSpinner.start("Generating command index file...");
    const isTS = await isTypeScriptProject();
    await generateVercelCommandsIndex(isTS ? "ts" : "js");
    indexSpinner.stop("Command index file generated.");

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

    const buildSpinner = spinner();
    buildSpinner.start(`Creating Vercel build with ${runner}...`);

    try {
      if (runner === "bun") {
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
        buildSpinner.stop("Build complete using Bun.");
      } else {
        await esbuild({
          entryPoints: [entryPoint],
          outdir: outputDir,
          platform: "node",
          format: "esm",
          bundle: true,
          //minify: true,
          plugins: [nodeExternalsPlugin()],
        });
        buildSpinner.stop("Build complete using esbuild.");
      }

      const uxOutDir = getCompactRelativePath(
        currentWorkingDirectory,
        outputDir,
      );
      outro(`Vercel build completed! Output: ${kleur.cyan(uxOutDir)}`); // Final outro with output path
    } catch (error: any) {
      buildSpinner.stop(
        `Build failed: ${error?.message || "Unknown error"}`,
        1,
      );
      consola.verbose(error);
      cancel("An error occurred during build.");
      throw error;
    }
  } catch (error: any) {
    // This catches errors from getEntryPoint or the re-thrown build error
    consola.verbose(error);
    log.error(
      "An error occurred during the Vercel build. Set the `CONSOLA_LEVEL` to `verbose` to see more details.",
    );
    outro(
      `Having trouble? Submit an issue here:\n${kleur.cyan(`https://github.com/The-Best-Codes/discraft-js/issues`)}`,
    );
  }
}

export { startBuild as build };

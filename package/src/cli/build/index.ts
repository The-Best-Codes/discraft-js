import { cancel, intro, outro, spinner } from "@clack/prompts";
import consola from "consola";
import kleur from "kleur";
import path from "path";
import { checkForVercelJson, getEntryPoint } from "../utils";
import { getCompactRelativePath } from "../utils/relativePath";
import { build as buildFn } from "./build";
import { generateIndexFiles } from "./commandsAndEvents";
import copyFiles from "./copyFiles";

type Builder = "esbuild" | "bun";

interface BuildOptions {
  builder?: Builder;
}

async function startBuild(options?: BuildOptions) {
  try {
    intro("Starting production build...");

    const vercelJsonExists = await checkForVercelJson();
    if (vercelJsonExists) {
      consola.warn(
        `"vercel.json" file found in project. Did you mean to run ${kleur.cyan(
          "discraft vercel build",
        )}?`,
      );
    }

    const currentWorkingDirectory = process.cwd();
    const outputPath = path.join(currentWorkingDirectory, "dist");
    let entryPoint;
    try {
      entryPoint = await getEntryPoint();
    } catch (e) {
      cancel("Could not get entrypoint file");
      throw e;
    }

    const prebuildSpinner = spinner();
    prebuildSpinner.start("Performing pre-build setup...");
    consola.verbose("Generating index files...");
    await generateIndexFiles();
    consola.verbose("Index files generated.");
    consola.verbose("Copying files...");
    await copyFiles(currentWorkingDirectory, outputPath);
    consola.verbose("Files copied.");
    prebuildSpinner.stop("Pre-build setup complete.");

    const buildSpinner = spinner();
    buildSpinner.start("Creating production build...");

    try {
      await buildFn("prod", entryPoint, outputPath, options?.builder);
      const uxOutputPath = getCompactRelativePath(
        currentWorkingDirectory,
        outputPath,
      );
      buildSpinner.stop(
        `Build finished successfully! Output: ${kleur.cyan(uxOutputPath)}.`,
      );
      outro(
        `Run ${kleur.cyan(`discraft start`)} or ${kleur.cyan(
          `npm run start`,
        )} to start your bot.`,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      consola.verbose(error);
      buildSpinner.stop(
        `Build failed: ${error?.message || "Unknown error"}`,
        1,
      );
      throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    consola.verbose(error);
    consola.error("An error occurred during build.");
    outro(
      `Having trouble? Submit an issue here:\n${kleur.cyan(`https://github.com/The-Best-Codes/discraft-js/issues`)}`,
    );
    throw error;
  }
}

export { startBuild as build };

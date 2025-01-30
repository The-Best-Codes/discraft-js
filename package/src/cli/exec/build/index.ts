import consola from "consola";
import fs from "fs";
import path from "path";
import { runSubprocess } from "../../utils";

interface ExecBuildOptions {
  target: string;
  entry?: string;
  outfile?: string;
}

async function build(options: ExecBuildOptions) {
  consola.info("Starting executable build using Bun...");

  const entryPoint = options.entry || "dist/index.js";
  const outputFile = options.outfile || "discraft-bot";
  const target = options.target;

  const entryFullPath = path.join(process.cwd(), entryPoint);
  const outputFullPath = path.join(process.cwd(), outputFile);

  consola.info(`Building executable for target: ${target}`);
  consola.info(`Entry point: ${entryFullPath}`);
  consola.info(`Output file: ${outputFullPath}`);

  try {
    // Check if entrypoint exists
    await fs.promises.access(entryFullPath);
  } catch (e: any) {
    consola.error(
      `Entry point not found: ${entryFullPath}. Did you run \`discraft build\` first?`,
    );
    process.exit(1);
  }

  try {
    const bunArgs = [
      "bun",
      "build",
      "--compile",
      `--target=${target}`,
      entryFullPath,
      `--outfile=${outputFullPath}`,
    ];
    await runSubprocess(bunArgs[0], bunArgs.slice(1));
    consola.success(
      `Executable build finished successfully! Output file: ${outputFullPath}`,
    );
  } catch (error: any) {
    consola.error(`Executable build failed: ${error.message}`);
  }
}

export { build };

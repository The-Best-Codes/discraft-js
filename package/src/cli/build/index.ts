import consola from "consola";
import path from "path";
import { build } from "./build";
import { generateIndexFiles } from "./commandsAndEvents";

async function startBuild() {
  consola.info(`Starting production build...`);
  const currentWorkingDirectory = process.cwd();
  const srcPath = path.join(currentWorkingDirectory, "index.ts");
  const outputPath = path.join(currentWorkingDirectory, "dist");

  consola.info("Generating index files...");
  await generateIndexFiles();
  consola.success("Index files generated.");

  consola.info(`Building with bun...`);
  try {
    build("prod", srcPath, outputPath);
    consola.success(`Build finished successfully! Output at: ${outputPath}`);
  } catch (error: any) {
    consola.error(`Build failed: ${error.message}`);
  }
}

export { startBuild as build };

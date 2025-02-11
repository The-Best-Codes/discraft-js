/* eslint-disable @typescript-eslint/no-explicit-any */
import consola from "consola";
import fs from "fs/promises";
import kleur from "kleur";
import path from "path";
import { runSubprocess } from "../../utils";
import { getCompactRelativePath } from "../../utils/relativePath";

interface ServeBrowserOptions {
  targetDir?: string;
  port?: number; // Optional port number
}

async function serveBrowser(options: ServeBrowserOptions = {}) {
  const currentWorkingDirectory = process.cwd();
  const targetDir = options.targetDir || "dist";
  const browserPath = path.join(currentWorkingDirectory, targetDir, "browser");
  const uxBrowserPath = getCompactRelativePath(
    currentWorkingDirectory,
    browserPath,
  );

  consola.info(
    `Serving browser interface from ${kleur.cyan(uxBrowserPath)}...`,
  );

  // Check if the browser directory exists.
  try {
    await fs.access(browserPath);
  } catch (error: any) {
    consola.error(
      `Browser directory not found: ${kleur.cyan(
        uxBrowserPath,
      )}.  Ensure you've run ${kleur.cyan("discraft browser build")} first.`,
    );
    process.exit(1);
  }

  // Serve the browser app using `npm run preview`
  try {
    consola.verbose("Starting browser application using `npm run preview`...");

    const previewArgs = ["run", "preview", "--"]; // Add "--" to separate npm args from script args
    if (options.port) {
      previewArgs.push("--port", options.port.toString()); // Correctly passes the port to the preview script
      consola.info(`Serving on port: ${options.port}`);
    }

    consola.verbose("Preview args:", previewArgs);

    await runSubprocess("npm", previewArgs, { cwd: browserPath });
    consola.info("Browser interface is running. Press Ctrl+C to stop."); // This probably won't ever execute directly.
  } catch (error: any) {
    consola.error(`Failed to serve browser application: ${error.message}`);
    consola.verbose(error);
    process.exit(1);
  }
}

export { serveBrowser };

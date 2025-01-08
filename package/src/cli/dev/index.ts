/* eslint-disable @typescript-eslint/no-explicit-any */
import { spawn } from "child_process";
import chokidar from "chokidar";
import consola from "consola";
import path from "path";
import { promisify } from "util";
import { build } from "../build/build";
import { generateIndexFiles } from "../build/commandsAndEvents";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const exec = promisify(require("child_process").exec);

type Builder = "esbuild" | "bun";

interface DevOptions {
  builder?: Builder;
  clearConsole?: boolean;
}

const CWD = process.cwd();
const DIST_DIR = path.join(CWD, "dist");
const DISCRAFT_DIR = path.join(CWD, ".discraft");
const NODE_MODULES_DIR = path.join(CWD, "node_modules");
const IGNORED_FILES = [
  DIST_DIR,
  DISCRAFT_DIR,
  NODE_MODULES_DIR,
  "*.log",
  ".git",
  ".env",
];

async function startDev(options?: DevOptions) {
  let botProcess: any = null;
  let runner: string = "node";
  const clearConsole = options?.clearConsole ?? false;

  // Function to start bot
  const startBot = async () => {
    const distPath = path.join(DIST_DIR, "index.js");

    if (botProcess) {
      consola.info("🔄 Restarting bot...");
      botProcess.kill("SIGINT");
      await new Promise((resolve) => botProcess.on("exit", resolve));
      consola.info("Old bot process terminated.");
    }

    try {
      botProcess = spawn(runner, [distPath], {
        stdio: "inherit",
      });

      botProcess.on("error", (error: any) => {
        consola.error(`Error starting the bot: ${error.message}`);
      });

      botProcess.on("exit", (code: number | null) => {
        if (code === 0) {
          consola.info("Bot process exited.");
        } else {
          consola.error(`Bot process exited with code ${code}`);
        }
      });

      consola.info("Listening for bot output...");
    } catch (error: any) {
      consola.error(`Error starting the bot: ${error.message}`);
    }
  };

  // Function to rebuild the bot
  const rebuildBot = async () => {
    if (clearConsole) {
      process.stdout.write("\x1bc");
    }

    consola.info("Change detected, rebuilding...");
    try {
      await generateIndexFiles();
      await build(
        "dev",
        path.join(CWD, "index.ts"),
        DIST_DIR,
        options?.builder,
      );
      consola.success("Rebuild complete.");
      await startBot();
    } catch (error: any) {
      consola.error(`Rebuild failed: ${error.message}`);
      consola.info("Waiting for changes...");
      // Do NOT exit here
    }
  };

  // Setup file watching and initial build
  try {
    consola.info("Starting in development mode...");
    consola.info("Performing initial build...");

    if (!options?.builder) {
      try {
        // Use bun --version to check for bun existence
        await exec("bun --version");
        runner = "bun";
        consola.info("Bun detected. Using Bun CLI for dev.");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        consola.info("Bun not detected. Using Node CLI for dev.");
      }
    } else {
      runner = options.builder;
      consola.info(`Using ${options.builder} instead of auto-detect.`);
    }

    await generateIndexFiles();
    await build("dev", path.join(CWD, "index.ts"), DIST_DIR, options?.builder);
    consola.success("Initial build complete.");
    await startBot();

    consola.info("Starting file watcher...");
    const watcher = chokidar.watch(CWD, {
      ignored: IGNORED_FILES,
      ignoreInitial: true,
    });

    watcher.on("all", async (event, path) => {
      consola.verbose(`File system event ${event} detected at ${path}`);
      await rebuildBot();
    });

    process.on("SIGINT", () => {
      consola.info("SIGINT signal received. Exiting development mode...");
      if (botProcess) {
        botProcess.kill("SIGINT");
      }
      watcher.close();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      consola.info("SIGTERM signal received. Exiting development mode...");
      if (botProcess) {
        botProcess.kill("SIGTERM");
      }
      watcher.close();
      process.exit(0);
    });
    consola.success("Development environment is ready.");
  } catch (error: any) {
    consola.error(`Error during setup: ${error.message}`);
    process.exit(1);
  }
}

export { startDev as dev };

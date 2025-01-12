/* eslint-disable @typescript-eslint/no-explicit-any */
import { spawn } from "child_process";
import chokidar from "chokidar";
import consola from "consola";
import path from "path";
import { build as buildFn } from "../build/build";
import { generateIndexFiles } from "../build/commandsAndEvents";
import { getEntryPoint, isBunInstalled } from "../utils";
// Utility function to run a subprocess and return a promise

type Builder = "esbuild" | "bun";
type Runner = "node" | "bun";

interface DevOptions {
  builder?: Builder;
  clearConsole?: boolean;
  runner?: Runner;
}

const DIST_DIR = path.join(process.cwd(), "dist");
const DISCRAFT_DIR = path.join(process.cwd(), ".discraft");
const NODE_MODULES_DIR = path.join(process.cwd(), "node_modules");
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
  let runner: Runner = "node";
  const clearConsole = options?.clearConsole ?? false;
  const CWD = process.cwd();
  if (options?.builder === "bun") {
    runner = "bun";
    consola.verbose("Using Bun as runner (matched with builder)");
  } else {
    try {
      // Only auto-detect bun if we're not using esbuild
      if (!options?.builder) {
        if (await isBunInstalled()) {
          runner = "bun";
          consola.verbose("Bun detected. Using Bun CLI for dev.");
        } else {
          // If builder is esbuild, default to node
          runner = "node";
          consola.verbose("Using Node as runner with esbuild builder");
        }
      } else {
        // If builder is esbuild, default to node
        runner = "node";
        consola.verbose("Using Node as runner with esbuild builder");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      runner = "node";
      consola.verbose("Using Node CLI for dev.");
    }
  }

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
        cwd: CWD,
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
    let entryPoint;
    try {
      entryPoint = await getEntryPoint();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return;
    }
    try {
      await generateIndexFiles();
      await buildFn("dev", entryPoint, DIST_DIR, options?.builder);
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
    consola.verbose("Performing initial build...");
    // eslint-disable-next-line no-useless-catch
    try {
      const entryPoint = await getEntryPoint();
      consola.verbose("Entry point attempt: " + entryPoint);
    } catch (e) {
      throw e;
    }
    await generateIndexFiles();
    await buildFn("dev", await getEntryPoint(), DIST_DIR, options?.builder);
    consola.verbose("Initial build complete.");
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

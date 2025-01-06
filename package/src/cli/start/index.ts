import { spawn } from "child_process";
import consola from "consola";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const exec = promisify(require("child_process").exec);

async function start() {
  const currentWorkingDirectory = process.cwd();
  consola.info("Starting the bot...");
  consola.verbose(`Current working directory: ${currentWorkingDirectory}`);

  const distPath = path.join(currentWorkingDirectory, "dist", "index.js");
  consola.verbose(`Path to bot entrypoint: ${distPath}`);

  // Check if dist/index.js exists
  try {
    await fs.access(distPath, fs.constants.F_OK);
    consola.success("Bot entrypoint found.");
  } catch (error) {
    consola.error(
      `Bot entrypoint not found at: ${distPath}. Please ensure you have built the project. Run the build command first!`,
    );
    return;
  }

  let runner = "node";
  try {
    // Use bun --version to check for bun existence
    await exec("bun --version");
    runner = "bun";
    consola.info("Bun detected. Using Bun to run the bot.");
  } catch (error) {
    consola.info("Bun not detected. Using Node to run the bot.");
  }

  try {
    consola.start("Starting the bot process...");

    const childProcess = spawn(runner, [distPath], {
      stdio: "inherit",
    });

    // Forward SIGINT and SIGTERM to the child process
    process.on("SIGINT", () => {
      childProcess.kill("SIGINT");
    });

    process.on("SIGTERM", () => {
      childProcess.kill("SIGTERM");
    });

    childProcess.on("error", (error) => {
      consola.error(`Error starting the bot: ${error.message}`);
    });

    childProcess.on("exit", (code) => {
      if (code === 0) {
        consola.success("Bot process finished successfully.");
      } else {
        consola.error(`Bot process exited with code ${code}`);
      }
      // Exit the parent process after the child has exited
      process.exit(code ?? 0);
    });

    consola.success("Bot process started. Listening for output...");
  } catch (error: any) {
    consola.error(`Error starting the bot: ${error.message}`);
  }
}

export { start };
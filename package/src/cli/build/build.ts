/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { spawn } from "child_process";
import consola from "consola";
import { build as esbuild } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { promisify } from "util";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const exec = promisify(require("child_process").exec);

type Builder = "esbuild" | "bun";

async function build(
  env: "dev" | "prod",
  entryPoint: string,
  outputDir: string,
  builder?: Builder,
) {
  let runner: Builder = builder || "esbuild";

  if (!builder) {
    try {
      // Use bun --version to check for bun existence
      await exec("bun --version");
      runner = "bun";
      consola.verbose("Bun detected. Using Bun CLI for build.");
    } catch (error) {
      consola.info("Bun not detected. Using esbuild for build.");
    }
  } else {
    consola.info(`Using ${builder} instead of auto-detect.`);
  }

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
      ];

      if (env === "prod") {
        bunArgs.push("--minify");
      }

      const childProcess = spawn(bunArgs[0], bunArgs.slice(1), {
        stdio: "inherit",
      });

      await new Promise((resolve, reject) => {
        childProcess.on("error", (error) => {
          consola.error(`Error during bun build: ${error.message}`);
          reject(error);
        });

        childProcess.on("exit", (code) => {
          if (code === 0) {
            consola.success("Build complete using Bun.");
            resolve(true);
          } else {
            consola.error(`Bun build process exited with code ${code}`);
            reject(new Error(`Bun build exited with code ${code}`));
          }
        });
      });
    } catch (error: any) {
      consola.error(`Error during bun build: ${error.message}`);
      if (env !== "dev") {
        process.exit(1);
      }
      throw error; // Throw the error, to be caught by `rebuildBot`
    }
  } else {
    try {
      await esbuild({
        entryPoints: [entryPoint],
        outdir: outputDir,
        platform: "node",
        format: "esm",
        bundle: true,
        minify: env === "prod",
        plugins: [nodeExternalsPlugin()],
      });
      consola.success("Build complete using esbuild.");
    } catch (error: any) {
      consola.error(`Error during esbuild: ${error.message}`);
      if (env !== "dev") {
        process.exit(1);
      }
      throw error; // Throw the error, to be caught by `rebuildBot`
    }
  }
}

export { build };

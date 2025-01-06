import { spawn } from "child_process";
import consola from "consola";
import { build as esbuild } from "esbuild";
import { promisify } from "util";

const exec = promisify(require("child_process").exec);

async function build(
  env: "dev" | "prod",
  entryPoint: string,
  outputDir: string,
) {
  let runner = "esbuild";
  try {
    // Use bun --version to check for bun existence
    await exec("bun --version");
    runner = "bun";
    consola.info("Bun detected. Using Bun CLI for build.");
  } catch (error) {
    consola.info("Bun not detected. Using esbuild for build.");
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
        "--external",
        "*",
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
      process.exit(1);
    }
  } else {
    try {
      await esbuild({
        entryPoints: [entryPoint],
        outdir: outputDir,
        platform: "node",
        format: "cjs",
        bundle: true,
        minify: env === "prod",
        external: ["*"], // All packages are external
      });
      consola.success("Build complete using esbuild.");
    } catch (error: any) {
      consola.error(`Error during esbuild: ${error.message}`);
      process.exit(1);
    }
  }
}

export { build };

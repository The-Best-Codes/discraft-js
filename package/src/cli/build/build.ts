/* eslint-disable @typescript-eslint/no-explicit-any */
import consola from "consola";
import { build as esbuild } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { isBunInstalled, runSubprocess } from "../utils";

type Builder = "esbuild" | "bun";

async function build(
	env: "dev" | "prod",
	entryPoint: string,
	outputDir: string,
	builder?: Builder,
) {
	let runner: Builder = builder || "esbuild";

	if (!builder) {
		if (await isBunInstalled()) {
			runner = "bun";
			consola.verbose("Bun detected. Using Bun CLI for build.");
		} else {
			consola.verbose("Bun not detected. Using esbuild for build.");
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
			await runSubprocess(bunArgs[0], bunArgs.slice(1));
			consola.success("Build complete using Bun.");
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

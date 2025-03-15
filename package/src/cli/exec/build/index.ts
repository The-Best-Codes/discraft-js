import consola from "consola";
import fs from "fs";
import kleur from "kleur";
import path from "path";
import { isBunInstalled, runSubprocess } from "../../utils";
import { getCompactRelativePath } from "../../utils/relativePath";

interface ExecBuildOptions {
	target: string;
	entry?: string;
	outfile?: string;
}

async function build(options: ExecBuildOptions) {
	consola.verbose("Starting executable build using Bun...");

	const entryPoint = options.entry || "dist/index.js";
	const outputFile = options.outfile || "dist/discraft-bot";
	const target = options.target;

	const currentWorkingDirectory = process.cwd();
	const entryFullPath = path.join(currentWorkingDirectory, entryPoint);
	const outputFullPath = path.join(currentWorkingDirectory, outputFile);
	const uxOutputFullPath = getCompactRelativePath(
		currentWorkingDirectory,
		outputFullPath,
	);

	const distDir = path.dirname(outputFullPath);

	consola.info(`Building executable for target: ${target}`);
	consola.verbose(`Entry point: ${entryFullPath}`);
	consola.verbose(`Output file: ${outputFullPath}`);

	if (!(await isBunInstalled())) {
		consola.error(
			"Bun is not installed. Please install Bun to use the `exec build` command.",
		);
		consola.error("Visit https://bun.sh for installation instructions.");
		process.exit(1);
	}

	try {
		// Check if entrypoint exists
		await fs.promises.access(entryFullPath);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
	} catch (error: any) {
		consola.error(
			`Entry point not found: ${entryFullPath}. Did you run \`discraft build\` first?`,
		);
		process.exit(1);
	}

	try {
		await fs.promises.mkdir(distDir, { recursive: true }); // Ensure dist dir exists

		const bunArgs = [
			"bun",
			"build",
			"--compile",
			`--target=${"bun-" + target}`,
			entryFullPath,
			`--outfile=${outputFullPath}`,
		];
		await runSubprocess(bunArgs[0], bunArgs.slice(1));
		consola.success(`Executable built to \`${uxOutputFullPath}\``);

		const tips = [
			`Run the executable from the terminal (${kleur.bold("not by clicking on it")}) so you don't create duplicate processes`,
			`The \`.env\` file should be in the same directory as the executable or the bot won't start`,
			`Run \`chmod +x ${uxOutputFullPath}\` if the executable needs permission to run`,
		];

		consola.log("Important notes:");
		tips.forEach((tip) => consola.info(tip));

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		consola.error(`Executable build failed: ${error.message}`);
		consola.verbose(error);
		process.exit(1);
	}
}

export { build };

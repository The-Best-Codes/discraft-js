import consola from "consola";
import path from "path";
import { CWD, getEntryPoint, isBunInstalled, runSubprocess } from "../utils";

interface StartOptions {
	runner?: "node" | "bun";
}

async function start(options: StartOptions = {}) {
	consola.verbose("Starting the bot...");
	let entryPoint;
	try {
		entryPoint = await getEntryPoint();
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		consola.error("Could not get entrypoint file");
		return;
	}
	consola.verbose(`Path to bot entrypoint: ${entryPoint}`);
	const distPath = path.join(
		CWD,
		"dist",
		path.basename(entryPoint).replace(/\.(ts|js)$/, ".js"),
	);

	let runner = options.runner;

	if (!runner) {
		if (await isBunInstalled()) {
			runner = "bun";
			consola.verbose("Bun detected. Using Bun to run the bot.");
		} else {
			runner = "node";
			consola.verbose("Bun not detected. Using Node to run the bot.");
		}
	} else if (runner === "bun") {
		consola.info("Using Bun to run the bot.");
	} else if (runner === "node") {
		consola.info("Using Node to run the bot.");
	}
	try {
		consola.verbose("Starting the bot process...");
		await runSubprocess(runner, [distPath], { cwd: CWD });
		// Exit the parent process after the child has exited
	} catch (e) {
		consola.error(`Error starting the bot: ${e}`);
	}
}

export { start };

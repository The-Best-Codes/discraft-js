#!/usr/bin/env node

import { program } from "commander";
import consola from "consola";
import { version } from "../../package.json";
import { buildBrowser } from "./cli/browser/build";
import { serveBrowser } from "./cli/browser/serve";
import { build } from "./cli/build";
import { dev } from "./cli/dev";
import { build as execBuild } from "./cli/exec/build";
import { init } from "./cli/init";
import { start } from "./cli/start";
import { build as vercelBuild } from "./cli/vercel/build";

program
	.version(version)
	.name("discraft")
	.description("Ultimate Discord bot framework");

program
	.command("start")
	.description("Start the bot in production mode")
	.option(
		"-r, --runner <runner>",
		"Specify the runner to use (node or bun). Defaults to auto-detect.",
		(value) => {
			if (value !== "node" && value !== "bun") {
				consola.error("Invalid runner value. Must be 'node' or 'bun'.");
				process.exit(1);
			}
			return value;
		},
	)
	.action((options) => {
		start({ runner: options.runner }).catch((error) => {
			consola.error(
				"An error occurred while starting the bot. Set the CONSOLA_LEVEL to 'verbose' to see more details.",
			);
			consola.verbose(error);
			process.exit(1);
		});
	});

program
	.command("build")
	.description("Build the bot for production")
	.option(
		"-b, --builder <builder>",
		"Specify the builder to use (esbuild or bun). Defaults to auto-detect.",
		(value) => {
			if (value !== "esbuild" && value !== "bun") {
				consola.error("Invalid builder value. Must be 'esbuild' or 'bun'.");
				process.exit(1);
			}
			return value;
		},
	)
	.action((options) => {
		build({ builder: options.builder }).catch((error) => {
			consola.error(
				"An error occurred during build. Set the CONSOLA_LEVEL to 'verbose' to see more details.",
			);
			consola.verbose(error);
			process.exit(1);
		});
	});

program
	.command("vercel")
	.description("Commands for Vercel deployments")
	.addCommand(
		program
			.createCommand("build")
			.description("Build the bot for Vercel")
			.option(
				"-b, --builder <builder>",
				"Specify the builder to use (esbuild or bun). Defaults to auto-detect.",
				(value) => {
					if (value !== "esbuild" && value !== "bun") {
						consola.error("Invalid builder value. Must be 'esbuild' or 'bun'.");
						process.exit(1);
					}
					return value;
				},
			)
			.action((options) => {
				vercelBuild({ builder: options.builder }).catch((error) => {
					consola.error(
						"An error occurred during the vercel build. Set the CONSOLA_LEVEL to 'verbose' to see more details.",
					);
					consola.verbose(error);
					process.exit(1);
				});
			}),
	);

program
	.command("exec")
	.description("Commands for executable builds")
	.addCommand(
		program
			.createCommand("build")
			.description("Build a standalone executable of your bot")
			.option(
				"--target <target>",
				`Target platform for executable.
Supported targets:
- linux-x64
- linux-arm64
- windows-x64
- darwin-x64
- darwin-arm64`,
			)
			.option("--entry <entry>", "Custom entry point", "dist/index.js")
			.option("--outfile <outfile>", "Output file name", "dist/discraft-bot")
			.action((options) => {
				if (!options.target) {
					consola.error(
						"The --target option is required for `discraft exec build`.",
					);
					process.exit(1);
				}
				const supportedTargets = [
					"linux-x64",
					"linux-arm64",
					"windows-x64",
					"darwin-x64",
					"darwin-arm64",
				];
				if (!supportedTargets.includes(options.target)) {
					consola.error(
						`Invalid target: ${options.target}. Supported targets are:\n${supportedTargets.join("\n")}`,
					);
					process.exit(1);
				}

				execBuild({
					target: options.target,
					entry: options.entry,
					outfile: options.outfile,
				}).catch((error) => {
					consola.error(
						"An error occurred during the executable build. Set CONSOLA_LEVEL to 'verbose' for details.",
					);
					consola.verbose(error);
					process.exit(1);
				});
			}),
	);

program
	.command("browser")
	.description("Commands for browser interface")
	.addCommand(
		program
			.createCommand("build")
			.description("Build the browser interface")
			.option(
				"--target-dir <targetDir>",
				"Target directory for the build",
				"dist",
			)
			.action((options) => {
				buildBrowser({ targetDir: options.targetDir }).catch((error) => {
					consola.error(
						"An error occurred during the browser build. Set CONSOLA_LEVEL to 'verbose' for details.",
					);
					consola.verbose(error);
					process.exit(1);
				});
			}),
	)
	.addCommand(
		program
			.createCommand("serve")
			.description("Serve the browser interface")
			.option(
				"--target-dir <targetDir>",
				"Target directory for the build",
				"dist",
			)
			.option(
				"--port <port>",
				"Port to serve the browser interface on",
				(value) => {
					const port = parseInt(value, 10);
					if (isNaN(port) || port < 1 || port > 65535) {
						consola.error("Invalid port number. Must be between 1 and 65535.");
						process.exit(1);
					}
					return port;
				},
			)
			.action((options) => {
				serveBrowser({
					targetDir: options.targetDir,
					port: options.port,
				}).catch((error) => {
					consola.error(
						"An error occurred while serving the browser interface. Set CONSOLA_LEVEL to 'verbose' for details.",
					);
					consola.verbose(error);
					process.exit(1);
				});
			}),
	);

program
	.command("dev")
	.description("Start the bot in development mode")
	.option(
		"-b, --builder <builder>",
		"Specify the builder to use (esbuild or bun). Defaults to auto-detect.",
		(value) => {
			if (value !== "esbuild" && value !== "bun") {
				consola.error("Invalid builder value. Must be 'esbuild' or 'bun'.");
				process.exit(1);
			}
			return value;
		},
	)
	.option(
		"-r, --runner <runner>",
		"Specify the runner to use (node or bun). Defaults to auto-detect.",
		(value) => {
			if (value !== "node" && value !== "bun") {
				consola.error("Invalid runner value. Must be 'node' or 'bun'.");
				process.exit(1);
			}
			return value;
		},
	)
	.option("-c, --clear-console", "Clear the console on each rebuild.", false)
	.action((options) => {
		dev({
			builder: options.builder,
			clearConsole: options.clearConsole,
			runner: options.runner,
		}).catch((error) => {
			consola.error(
				"An error occurred during development. Set the CONSOLA_LEVEL to 'verbose' to see more details.",
			);
			consola.verbose(error);
			process.exit(1);
		});
	});

program
	.command("init")
	.description("Initialize a new Discraft project")
	.option(
		"-d, --dir <directory>",
		"Project directory (defaults to current directory)",
	)
	.option(
		"-p, --package-manager <pm>",
		"Package manager to use (npm, yarn, pnpm, bun, or none)",
		(value) => {
			if (value && !["npm", "yarn", "pnpm", "bun", "none"].includes(value)) {
				consola.error(
					"Invalid package manager value. Must be 'npm', 'yarn', 'pnpm', 'bun', or 'none'.",
				);
				process.exit(1);
			}
			return value;
		},
	)
	.option("--skip-install", "Skip dependency installation")
	.option(
		"-t, --template <template>",
		"Template to use (js, ts, or vercel-ts-ai). Defaults to prompt.",
		(value) => {
			if (value && !["js", "ts", "vercel-ts-ai"].includes(value)) {
				consola.error(
					"Invalid template value. Must be 'js', 'ts', or 'vercel-ts-ai'.",
				);
				process.exit(1);
			}
			return value;
		},
	)
	.action(async (options) => {
		try {
			await init(options);
		} catch (error) {
			consola.error(
				"An error occurred during initialization. Set the CONSOLA_LEVEL to 'verbose' to see more details.",
			);
			consola.verbose(error);
			process.exit(1);
		}
	});

program.parse(process.argv);

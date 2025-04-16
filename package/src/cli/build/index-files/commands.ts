import { consola as logger } from "consola";
import { promises as fs } from "fs";
import { glob } from "glob";
import path from "path";

import { buildCommandsJsIndex } from "./builders/commands.js.builder";
import { buildCommandsTsIndex } from "./builders/commands.ts.builder";
import type { ModuleInfo } from "./types";

const CWD = process.cwd();
const COMMANDS_DIR = path.join(CWD, "commands");
const DISCRAFT_DIR = path.join(CWD, ".discraft");

function sanitizeName(name: string): string {
	return name.replace(/[^a-zA-Z0-9]/g, "");
}

async function findModules(extension: string): Promise<ModuleInfo[]> {
	try {
		const files = await glob(path.join(COMMANDS_DIR, `*.${extension}`));
		return files.map((filePath) => {
			const fileName = path.basename(filePath, `.${extension}`);
			const sanitizedName = sanitizeName(fileName);

			if (sanitizedName !== fileName) {
				logger.warn(
					`Filename "${fileName}" has invalid characters, using "${sanitizedName}" instead.`,
				);
			}

			return {
				name: sanitizedName,
				importPath: path
					.relative(
						path.dirname(
							path.join(DISCRAFT_DIR, "commands", `index.${extension}`),
						),
						filePath,
					)
					.replace(/\\/g, "/")
					.replace(new RegExp(`\\.${extension}$`), ""),
				isValid: true,
			};
		});
	} catch (err) {
		logger.error(`Error finding files in ${COMMANDS_DIR}.`, err);
		return [];
	}
}

async function generateCommandsIndex(extension: "ts" | "js") {
	const OUTPUT_COMMANDS_FILE = path.join(
		DISCRAFT_DIR,
		"commands",
		`index.${extension}`,
	);

	const modules = await findModules(extension);
	if (!modules.length) {
		logger.warn("No command files found. Skipping command index generation.");
		const content = `
import { Client } from "discord.js";
import { logger } from "../../utils/logger";

export async function registerCommands(client) {
    logger.warn("No commands found in commands directory");
    return;
}
        `;
		await fs.writeFile(OUTPUT_COMMANDS_FILE, content);
		return;
	}

	let content = "";
	if (extension === "ts") {
		logger.verbose("Generating commands index file for typescript");
		content = buildCommandsTsIndex(modules);
	} else if (extension === "js") {
		logger.verbose("Generating commands index file for javascript");
		content = buildCommandsJsIndex(modules);
	}

	await fs.writeFile(OUTPUT_COMMANDS_FILE, content);
	logger.verbose("Commands index file generated.");
}

export { generateCommandsIndex };

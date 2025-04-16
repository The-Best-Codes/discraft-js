import { consola as logger } from "consola";
import { promises as fs } from "fs";
import { glob } from "glob";
import path from "path";

import { buildEventsJsIndex } from "./builders/events.js.builder";
import { buildEventsTsIndex } from "./builders/events.ts.builder";
import type { ModuleInfo } from "./types";

const CWD = process.cwd();
const EVENTS_DIR = path.join(CWD, "events");
const DISCRAFT_DIR = path.join(CWD, ".discraft");

function sanitizeName(name: string): string {
	return name.replace(/[^a-zA-Z0-9]/g, "");
}

async function findModules(extension: string): Promise<ModuleInfo[]> {
	try {
		const files = await glob(path.join(EVENTS_DIR, `*.${extension}`));
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
							path.join(DISCRAFT_DIR, "events", `index.${extension}`),
						),
						filePath,
					)
					.replace(/\\/g, "/")
					.replace(new RegExp(`\\.${extension}$`), ""),
				isValid: true,
			};
		});
	} catch (err) {
		logger.error(`Error finding files in ${EVENTS_DIR}.`, err);
		return [];
	}
}

async function generateEventsIndex(extension: "ts" | "js") {
	const OUTPUT_EVENTS_FILE = path.join(
		DISCRAFT_DIR,
		"events",
		`index.${extension}`,
	);
	const modules = await findModules(extension);

	if (!modules.length) {
		logger.warn("No event files found. Skipping events index generation.");
		const content = `
import { Client } from "discord.js";
import { logger } from "../../utils/logger";

export async function registerEvents(client) {
  logger.warn("No events found in events directory");
  return;
}
        `;
		await fs.writeFile(OUTPUT_EVENTS_FILE, content);
		return;
	}

	let content = "";

	if (extension === "ts") {
		logger.verbose("Generating events index file for typescript");
		content = buildEventsTsIndex(modules);
	} else if (extension === "js") {
		logger.verbose("Generating events index file for javascript");
		content = buildEventsJsIndex(modules);
	}

	await fs.writeFile(OUTPUT_EVENTS_FILE, content);
	logger.verbose("Events index file generated.");
}

export { generateEventsIndex };

import { consola as logger } from "consola";
import { promises as fs } from "fs";
import path from "path";
import { isTypeScriptProject } from "../utils";
import { generateCommandsIndex } from "./index-files/commands";
import { generateEventsIndex } from "./index-files/events";

const CWD = process.cwd();
const DISCRAFT_DIR = path.join(CWD, ".discraft");

type BuildTarget = "commands" | "events";

async function generateIndexFiles(target?: BuildTarget | BuildTarget[]) {
  logger.verbose("Generating Discraft index files...");

  const targets = target
    ? Array.isArray(target)
      ? target
      : [target]
    : ["commands", "events"];
  const isTS = await isTypeScriptProject();
  logger.verbose("Is project typescript?", isTS);
  try {
    if (targets.includes("commands")) {
      await fs.mkdir(path.join(DISCRAFT_DIR, "commands"), { recursive: true });
      await generateCommandsIndex(isTS ? "ts" : "js");
    }
    if (targets.includes("events")) {
      await fs.mkdir(path.join(DISCRAFT_DIR, "events"), { recursive: true });
      await generateEventsIndex(isTS ? "ts" : "js");
    }
  } catch (error) {
    logger.error("Failed to generate Discraft index files.", error);
  }
  logger.verbose("Finished generating Discraft index files.");
}

export { generateIndexFiles };

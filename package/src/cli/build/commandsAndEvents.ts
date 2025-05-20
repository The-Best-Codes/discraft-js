import { consola as logger } from "consola";
import { promises as fs } from "fs";
import path from "path";
import { isTypeScriptProject } from "../utils";
import { generateCommandsIndex } from "./index-files/commands";
import { generateEventsIndex } from "./index-files/events";

const CWD = process.cwd();
const DISCRAFT_DIR = path.join(CWD, ".discraft");
const COMMANDS_DIR = path.join(CWD, "commands");
const EVENTS_DIR = path.join(CWD, "events");

type BuildTarget = "commands" | "events";

async function generateIndexFiles(target?: BuildTarget | BuildTarget[]) {
  logger.verbose("Generating Discraft index files...");
  logger.verbose(`Working directory: ${CWD}`);
  logger.verbose(`Discraft directory: ${DISCRAFT_DIR}`);
  logger.verbose(`Commands directory: ${COMMANDS_DIR}`);
  logger.verbose(`Events directory: ${EVENTS_DIR}`);

  // Create the discraft directory if it doesn't exist
  try {
    await fs.mkdir(DISCRAFT_DIR, { recursive: true });
    logger.verbose("Created or confirmed .discraft directory");
  } catch (err) {
    logger.error(`Error creating .discraft directory: ${err}`);
  }

  const targets = target
    ? Array.isArray(target)
      ? target
      : [target]
    : ["commands", "events"];
  const isTS = await isTypeScriptProject();
  logger.verbose("Is project typescript?", isTS);
  try {
    if (targets.includes("commands")) {
      try {
        await fs.mkdir(COMMANDS_DIR, { recursive: true });
        logger.verbose("Created or confirmed commands directory");
      } catch (err) {
        logger.verbose(`Note: Commands directory already exists or couldn't be created: ${err}`);
      }
      
      await fs.mkdir(path.join(DISCRAFT_DIR, "commands"), { recursive: true });
      await generateCommandsIndex(isTS ? "ts" : "js");
    }
    if (targets.includes("events")) {
      try {
        await fs.mkdir(EVENTS_DIR, { recursive: true });
        logger.verbose("Created or confirmed events directory");
      } catch (err) {
        logger.verbose(`Note: Events directory already exists or couldn't be created: ${err}`);
      }
      
      await fs.mkdir(path.join(DISCRAFT_DIR, "events"), { recursive: true });
      await generateEventsIndex(isTS ? "ts" : "js");
    }
  } catch (error) {
    logger.error("Failed to generate Discraft index files.", error);
  }
  logger.verbose("Finished generating Discraft index files.");
}

export { generateIndexFiles };

import { consola as logger } from "consola";
import { promises as fs } from "fs";
import { glob } from "glob";
import path from "path";

const CWD = process.cwd();
const EVENTS_DIR = path.join(CWD, "events");
const DISCRAFT_DIR = path.join(CWD, ".discraft");
const OUTPUT_EVENTS_FILE = path.join(DISCRAFT_DIR, "events", "index.ts");

interface ModuleInfo {
  name: string;
  importPath: string;
  isValid: boolean;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "");
}

async function findModules(): Promise<ModuleInfo[]> {
  try {
    const files = await glob(path.join(EVENTS_DIR, "*.ts"));
    return files.map((filePath) => {
      const fileName = path.basename(filePath, ".ts");
      const sanitizedName = sanitizeName(fileName);

      if (sanitizedName !== fileName) {
        logger.warn(
          `Filename "${fileName}" has invalid characters, using "${sanitizedName}" instead.`,
        );
      }

      return {
        name: sanitizedName,
        importPath: path
          .relative(path.dirname(OUTPUT_EVENTS_FILE), filePath)
          .replace(/\\/g, "/")
          .replace(/\.ts$/, ""),
        isValid: true,
      };
    });
  } catch (err) {
    logger.error(`Error finding files in ${EVENTS_DIR}.`, err);
    return [];
  }
}

async function generateEventsIndex() {
  const modules = await findModules();
  if (!modules.length) {
    logger.warn("No event files found. Skipping events index generation.");
    const content = `
import { Client } from "discord.js";
import { logger } from "../../utils/logger";

export async function registerEvents(client: Client) {
  logger.warn("No events found in events directory");
  return;
}
        `;
    await fs.writeFile(OUTPUT_EVENTS_FILE, content);
    return;
  }
  let imports = "";
  let moduleList = "";
  for (const mod of modules) {
    imports += `import ${mod.name}Event from '${mod.importPath}';\n`;
    moduleList += `${mod.name}Event, `;
  }

  const content = `
import { Client } from "discord.js";
import { logger } from "../../utils/logger";

${imports}

interface EventModule {
  event: string;
  handler: (client: Client, ...args: any[]) => void;
}

const eventsToLoad: EventModule[] = [${moduleList.slice(0, -2)}];

export async function registerEvents(client: Client) {
  let errorCount = 0;
  let registeredEvents = 0;

  logger.info(\`Registering \${eventsToLoad.length} events...\`);

  for (const eventModule of eventsToLoad) {
    try {
      if (
        !eventModule ||
        typeof eventModule.event !== "string" ||
        typeof eventModule.handler !== "function"
      ) {
        logger.warn(
          \`Skipping invalid event module. Ensure it exports an object with 'event' and 'handler' properties.\`,
        );
        errorCount++;
        continue;
      }
      const { event, handler } = eventModule;
      client.on(event, (...args) => {
        handler(client, ...args);
      });
      logger.verbose(\`Registered event: \${event}\`);
      registeredEvents++;
    } catch (error) {
      logger.error(\`Failed to load event.\`);
      logger.verbose(error);
      errorCount++;
    }
  }

  logger.success(
    \`Registered \${registeredEvents} event\${registeredEvents === 1 ? "" : "s"}, \${errorCount} errors.\`,
  );
}
    `;
  await fs.writeFile(OUTPUT_EVENTS_FILE, content);
  logger.verbose("Events index file generated.");
}

export { generateEventsIndex };

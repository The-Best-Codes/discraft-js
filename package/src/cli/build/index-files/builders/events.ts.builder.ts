import type { ModuleInfo } from "../types";

export function buildEventsTsIndex(modules: ModuleInfo[]): string {
	let imports = "";
	let moduleList = "";
	for (const mod of modules) {
		imports += `import ${mod.name}Event from '${mod.importPath}';\n`;
		moduleList += `${mod.name}Event, `;
	}
	return `
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
}

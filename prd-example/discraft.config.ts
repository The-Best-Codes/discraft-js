import { nodeAdapter } from "@discraft/adapter-node";
import { commandsExtension } from "@discraft/extension-commands";
import { eventsExtension } from "@discraft/extension-events";

export default {
  adapters: [
    nodeAdapter({
      // any config here
      // This would return something that marked it as a builder perhaps. So @discraft/_core could parse it and understand what build and start scripts should run.
      // If multiple builder adapters were provided, it could throw an error.
      // However, multiple adapaters in general wouldn't be a problem, for example you could add a executableAdapter which would make the discraft build command output an executable file along with the dist.
    }),
  ],
  extensions: [
    commandsExtension({
      // commandsDirectory: "src/commands"
    }),
    eventsExtension({
      // eventsDirectory: "src/events"
    }),
  ],
};

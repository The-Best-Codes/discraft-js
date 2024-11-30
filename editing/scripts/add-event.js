import fs from "fs";
import path from "path";
import { search, input } from "@inquirer/prompts";
import { success, error } from "../common/utils/logger.js";
import { Events } from "discord.js";

async function generateEvent() {
  // Throw error if src/ directory doesn't exist
  const doesSrcDirExist = fs.existsSync(path.join(process.cwd(), "src"));

  // Check if the user is in the src/ directory (that may be the issue)
  const isSrcDir = process.cwd().endsWith("src");
  if (!doesSrcDirExist) {
    if (isSrcDir) {
      error(
        'You are in the "src/" directory. You should be in the root of your Discraft project.'
      );
      process.exit(1);
    } else {
      error(
        'The "src/" directory does not exist. Please run "discraft init" to initialize a project, or ensure you are in the root of your Discraft project.'
      );
      process.exit(1);
    }
  }

  // Initial event setup questions
  const eventConfig = {
    name: "",
    type: "",
  };
  try {
    eventConfig["name"] = await input({
      message: `Event name:`,
      required: true,
      validate: (input) => {
        if (/^[a-z]+(-[a-z]+)*$/.test(input)) return true;
        return "Must be lowercase with single dashes only.";
      },
    });

    eventConfig["type"] = await search({
      message: "Event type:",
      required: true,
      source: async (input, { signal }) => {
        const options = Object.keys(Events).map((key) => ({
          name: key,
          value: key,
        }));

        if (!input) {
          return options; // Return all options if no input is given
        }

        // Filter options based on input
        return options
          .filter((option) =>
            option.name.toLowerCase().includes(input.toLowerCase())
          )
          .map((option) => ({
            name: `${option.name}`, // Show both name and description
            value: option.value,
          }));
      },
    });

    // If custom event, ask for the event name
    if (eventConfig.type === "custom") {
      const customEvent = await input({
        message: "Custom event name (from Discord.js Events):",
        required: true,
        validate: (input) => input.length > 0,
      });
      eventConfig.type = customEvent.customEventName;
    }
  } catch (err) {
    if (err.name === "ExitPromptError") {
      error("Cancelled by user.");
      return process.exit(0);
    }
    error("Error:", err);
    return process.exit(1);
  }

  // Create events directory if it doesn't exist
  const eventsDir = path.join(process.cwd(), "src", "events");
  if (!fs.existsSync(eventsDir)) {
    fs.mkdirSync(eventsDir, { recursive: true });
  }

  // Create the event file
  const eventPath = path.join(eventsDir, `${eventConfig.name}.js`);
  const eventContent = `import { debug, error } from "../utils/logger.js";
import { Events } from "discord.js";

export default (client) => {
    client.on(Events.${eventConfig.type}, (${
    eventConfig.type === "messageCreate" ? "message" : "event"
  }) => {
        debug("'${eventConfig.name}' event triggered");
        try {
            // Add your event handling logic here
            
        } catch (err) {
            error("Error in '${eventConfig.name}' event handler:", err);
        }
    });
};
`;

  try {
    fs.writeFileSync(eventPath, eventContent);
    success(
      `Created event handler at src/events/${eventConfig.name}.js\n` +
        `Event will trigger on: ${eventConfig.type}`
    );
    return {
      name: eventConfig.name,
    };
  } catch (err) {
    error("Error creating event file:", err);
    return process.exit(1);
  }
}

// Run the event generator
generateEvent().catch((err) => {
  error("Error creating event:", err);
  process.exit(1);
});

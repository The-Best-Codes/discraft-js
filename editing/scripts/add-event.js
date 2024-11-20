import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { success, error } from "../common/utils/logger.js";

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
  let answers = {};
  try {
    answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Event name:",
        validate: (input) => {
          if (/^[a-z]+(-[a-z]+)*$/.test(input)) return true;
          return "Must be lowercase with single dashes only.";
        },
      },
      {
        type: "list",
        name: "eventType",
        message: "Event type:",
        choices: [
          { name: "Channel Create", value: "channelCreate" },
          { name: "Channel Delete", value: "channelDelete" },
          { name: "Channel Update", value: "channelUpdate" },
          { name: "Guild Member Add", value: "guildMemberAdd" },
          { name: "Guild Member Remove", value: "guildMemberRemove" },
          { name: "Message Create", value: "messageCreate" },
          { name: "Message Delete", value: "messageDelete" },
          { name: "Message Update", value: "messageUpdate" },
          { name: "Presence Update", value: "presenceUpdate" },
          { name: "Role Create", value: "roleCreate" },
          { name: "Role Delete", value: "roleDelete" },
          { name: "Role Update", value: "roleUpdate" },
          { name: "Voice State Update", value: "voiceStateUpdate" },
          { name: "Other Event", value: "custom" }
        ],
      }
    ]);

    // If custom event, ask for the event name
    if (answers.eventType === "custom") {
      const customEvent = await inquirer.prompt([
        {
          type: "input",
          name: "customEventName",
          message: "Custom event name (from Discord.js Events):",
          validate: (input) => input.length > 0,
        }
      ]);
      answers.eventType = customEvent.customEventName;
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
  const eventPath = path.join(eventsDir, `${answers.name}.js`);
  const eventContent = `import { debug, error } from "../utils/logger.js";
import { Events } from "discord.js";

export default (client) => {
    client.on(Events.${answers.eventType}, (${answers.eventType === "messageCreate" ? "message" : "event"}) => {
        debug("'${answers.name}' event triggered");
        try {
            // Add your event handling logic here
            
        } catch (err) {
            error("Error in '${answers.name}' event handler:", err);
        }
    });
};
`;

  try {
    fs.writeFileSync(eventPath, eventContent);
    success(
      `Created event handler at src/events/${answers.name}.js\n` +
      `Event will trigger on: ${answers.eventType}`
    );
    return {
      name: answers.name,
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

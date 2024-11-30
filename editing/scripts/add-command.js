import fs from "fs";
import path from "path";
import { input, confirm, search, checkbox } from "@inquirer/prompts";
import { success, error } from "../common/utils/logger.js";

async function generateCommand() {
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

  // Initial command setup questions
  let commandConfig = {
    permissions: [],
    features: [],
    options: [],
  };
  try {
    commandConfig["name"] = await input({
      message: `Command name:`,
      required: true,
      validate: (input) => {
        if (/^[a-z]+(-[a-z]+)*$/.test(input)) return true;
        return "Must be lowercase with single dashes only.";
      },
    });
    commandConfig["description"] = await input({
      message: `Command description:`,
      default: "A Discraft-js Bot Command...",
      validate: (input) => input.length > 0,
    });
  } catch (err) {
    if (err.name === "ExitPromptError") {
      error("Cancelled by user.");
      return process.exit(0);
    }
    error("Error:", err);
    return process.exit(1);
  }
  try {
    const featuresAnswers = await checkbox({
      message: "Select command features:",
      choices: [
        {
          name: "Enable command response caching",
          value: "cacheable",
          checked: false,
        },
        {
          name: "Use deferred responses",
          value: "deferred",
          checked: false,
        },
        {
          name: "Make responses ephemeral (only visible to the command user)",
          value: "ephemeral",
          checked: false,
        },
        {
          name: "Add permission requirements",
          value: "permissions",
          checked: false,
        },
      ],
    });
    commandConfig["features"] = featuresAnswers;
  } catch (err) {
    if (err.name === "ExitPromptError") {
      error("Cancelled by user.");
      return process.exit(0);
    }
    error("Error:", err);
    return process.exit(1);
  }

  // Ask about command options
  const addCmdOptions = await confirm({
    message: "Would you like to add command options? (e.g., /command <option>)",
    default: false,
  }).catch((err) => {
    if (err.name === "ExitPromptError") {
      error("Cancelled by user.");
      return process.exit(0);
    }
    error("Error:", err);
    return process.exit(1);
  });

  // If command needs options, guide through the process

  if (addCmdOptions) {
    console.log(
      "\nAdding options to your command... For each option, you'll need to specify:"
    );
    console.log("- The type of data it accepts (text, number, etc.)");
    console.log('- The name of the option (e.g., "user" in /ban <user>)');
    console.log("- A description of what the option does\n");

    let addingOptions = true;
    while (addingOptions) {
      let optionAnswers = {};
      try {
        const commandOptionType = await search({
          message: "What type of data should this option accept?",
          source: async (input, { signal }) => {
            const options = [
              {
                name: "String (text)",
                value: "String",
                description: "A sequence of characters, typically text.",
              },
              {
                name: "Integer (whole number)",
                value: "Integer",
                description: "A whole number (no decimal places).",
              },
              {
                name: "Number (decimal number)",
                value: "Number",
                description: "A number that can include decimals.",
              },
              {
                name: "Boolean (true/false)",
                value: "Boolean",
                description: "A value that can be either true or false.",
              },
              {
                name: "User (Discord user)",
                value: "User",
                description: "A Discord user (mentionable or not).",
              },
              {
                name: "Channel (Discord channel)",
                value: "Channel",
                description: "A Discord channel (text, voice, etc.).",
              },
              {
                name: "Role (Discord role)",
                value: "Role",
                description: "A Discord role that can be assigned to users.",
              },
              {
                name: "Mentionable (user or role)",
                value: "Mentionable",
                description: "A mentionable user or role.",
              },
              {
                name: "Attachment (file)",
                value: "Attachment",
                description: "A file attachment (image, document, etc.).",
              },
            ];

            if (!input) {
              return options; // Return all options if no input is given
            }

            // Filter options based on input
            return options
              .filter(
                (option) =>
                  option.name.toLowerCase().includes(input.toLowerCase()) ||
                  option.description.toLowerCase().includes(input.toLowerCase())
              )
              .map((option) => ({
                name: `${option.name} - ${option.description}`, // Show both name and description
                value: option.value,
                description: option.description,
              }));
          },
        });
        const commandOptionName = await input({
          message: 'Option name (e.g., "user"):',
          validate: (input) => {
            if (/^[a-z0-9-]+$/.test(input)) return true;
            return "Option name must be lowercase and may only contain letters, numbers, and dashes";
          },
          required: true,
        });
        const commandOptionDecription = await input({
          message: 'Option description (e.g., "The user to ban"):',
          validate: (input) => input.length > 0,
          required: false,
          default: `Command option accepts ${commandOptionType}`,
        });

        const commandOptionRequired = await confirm({
          message: "Is this option required?",
          default: false,
        });

        optionAnswers["type"] = commandOptionName;
        optionAnswers["name"] = commandOptionName;
        optionAnswers["description"] = commandOptionDecription;
        optionAnswers["required"] = commandOptionRequired;
      } catch (err) {
        if (err.name === "ExitPromptError") {
          error("Cancelled by user.");
          return process.exit(0);
        }
        error("Error:", err);
        return process.exit(1);
      }

      commandConfig["options"].push({
        type: optionAnswers.type.toLowerCase(),
        name: optionAnswers.name,
        description: optionAnswers.description,
        required: optionAnswers.required,
      });
      console.log("\n");
      const addAnother = await confirm({
        message: "Would you like to add another option?",
      }).catch((err) => {
        if (err.name === "ExitPromptError") {
          error("Cancelled by user.");
          return process.exit(0);
        }
        error("Error:", err);
        return process.exit(1);
      });

      if (!addAnother) {
        addingOptions = false;
      }
    }
  }
  // If permissions are required, guide through permission selection
  if (commandConfig.features.includes("permissions")) {
    console.log("\nSelect the permissions required to use this command:");

    const commandPerms = await checkbox({
      message: "Required permissions:",
      choices: [
        {
          name: "Administrator",
          value: "Administrator",
        },
        {
          name: "Manage Server",
          value: "ManageGuild",
        },
        {
          name: "Manage Messages",
          value: "ManageMessages",
        },
        {
          name: "Manage Channels",
          value: "ManageChannels",
        },
        {
          name: "Kick Members",
          value: "KickMembers",
        },
        {
          name: "Ban Members",
          value: "BanMembers",
        },
        {
          name: "Send Messages",
          value: "SendMessages",
        },
        {
          name: "Embed Links",
          value: "EmbedLinks",
        },
        { name: "Attach Files", value: "AttachFiles" },
        {
          name: "Read Message History",
          value: "ReadMessageHistory",
        },
        {
          name: "Mention Everyone",
          value: "MentionEveryone",
        },
      ],
    }).catch((err) => {
      if (err.name === "ExitPromptError") {
        error("Cancelled by user.");
        return process.exit(0);
      }
      error("Error:", err);
      return process.exit(1);
    });
    commandConfig["permissions"] = commandPerms;
  }

  // Generate the command file content with proper imports
  let commandContent = `import { SlashCommandBuilder`;

  if (commandConfig["permissions"].length > 0) {
    commandContent += `, PermissionFlagsBits`;
  }
  commandContent += ` } from 'discord.js';\n`;

  if (commandConfig["features"].includes("cacheable")) {
    commandContent += `import { commandCache } from '../utils/commandCache.js';\n\n`;
    commandContent += `// Set command-specific cache settings\ncommandCache.setCommandSettings('${commandConfig["name"]}', {\n  ttl: 60000, // Cache results for 1 minute\n});\n\n`;
  }

  commandContent += `export default {\n`;
  commandContent += `  data: new SlashCommandBuilder()\n`;
  commandContent += `    .setName('${commandConfig["name"]}')\n`;
  commandContent += `    .setDescription('${commandConfig["description"]}')\n`;

  // Add options if any
  if (commandConfig["options"].length > 0) {
    commandConfig["options"].forEach((opt) => {
      commandContent += `    .add${
        opt.type.charAt(0).toUpperCase() + opt.type.slice(1)
      }Option(option =>\n`;
      commandContent += `      option\n`;
      commandContent += `        .setName('${opt.name}')\n`;
      commandContent += `        .setDescription('${opt.description}')\n`;
      commandContent += `        .setRequired(${opt.required})\n`;
      commandContent += `    )\n`;
    });
  }

  // Add permissions if any
  if (commandConfig["permissions"].length > 0) {
    commandConfig["permissions"].forEach((perm) => {
      commandContent += `    .setDefaultMemberPermissions(PermissionFlagsBits.${perm})\n`;
    });
  }

  commandContent += `  ,\n\n`;

  // Add cacheable property if selected
  if (commandConfig["features"].includes("cacheable")) {
    commandContent += `  cacheable: true,\n`;
  }

  // Generate execute function
  commandContent += `  async execute(interaction) {\n`;

  if (commandConfig["features"].includes("deferred")) {
    commandContent += `    await interaction.deferReply(${
      commandConfig["features"].includes("ephemeral")
        ? "{ ephemeral: true }"
        : ""
    });\n\n`;
  }

  // Add option handling if any
  if (commandConfig["optionslength"] > 0) {
    commandContent += `    // Get command options\n`;
    commandConfig["optins"].forEach((opt) => {
      commandContent += `    const ${opt.name} = interaction.options.get${
        opt.type.charAt(0).toUpperCase() + opt.type.slice(1)
      }('${opt.name}');\n`;
    });
    commandContent += "\n";
  }

  commandContent += `    // TODO: Add your command logic here\n\n`;

  if (commandConfig["features"].includes("deferred")) {
    commandContent += `    await interaction.editReply({ content: 'Command executed!' ${
      commandConfig["features"].includes("ephemeral") ? ", ephemeral: true" : ""
    } });\n`;
  } else {
    commandContent += `    await interaction.reply({ content: 'Command executed!' ${
      commandConfig["features"].includes("ephemeral") ? ", ephemeral: true" : ""
    } });\n`;
  }

  commandContent += `  },\n`;
  commandContent += `};\n`;

  // Determine the target directory
  const projectDir = process.cwd();
  const commandsDir = path.join(projectDir, "src", "commands");

  // Create commands directory if it doesn't exist
  if (!fs.existsSync(commandsDir)) {
    fs.mkdirSync(commandsDir, { recursive: true });
  }

  // Write the command file
  const filePath = path.join(commandsDir, `${commandConfig["name"]}.js`);
  fs.writeFileSync(filePath, commandContent);

  success(
    `Command ${commandConfig["name"]} created successfully at ${filePath}`
  );

  // Return the command details for potential further use
  return {
    name: commandConfig["name"],
    path: filePath,
    features: commandConfig["features"],
    options: commandConfig["options"],
  };
}

// Run the command generator
generateCommand().catch((err) => {
  error("Error creating command:", err);
  process.exit(1);
});

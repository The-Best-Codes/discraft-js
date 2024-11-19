import fs from "fs";
import path from "path";
import inquirer from "inquirer";
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
  let answers = {};
  try {
    answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Command name:",
        validate: (input) => {
          if (/^[a-z]+(-[a-z]+)*$/.test(input)) return true;
          return "Must be lowercase with single dashes only.";
        },
      },
      {
        type: "input",
        name: "description",
        message: "Command description:",
        validate: (input) => input.length > 0,
      },
    ]);
  } catch (err) {
    if (err.name === "ExitPromptError") {
      error("Cancelled by user.");
      return process.exit(0);
    }
    error("Error:", err);
    return process.exit(1);
  }

  // Feature selection
  let featureAnswers = {};
  try {
    featureAnswers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "features",
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
      },
    ]);
  } catch (err) {
    if (err.name === "ExitPromptError") {
      error("Cancelled by user.");
      return process.exit(0);
    }
    error("Error:", err);
    return process.exit(1);
  }

  answers.features = featureAnswers.features;

  // Ask about command options
  let hasOptionsAnswer = {};
  try {
    hasOptionsAnswer = await inquirer.prompt([
      {
        type: "confirm",
        name: "hasOptions",
        message:
          "Would you like to add command options? (e.g., /command <option>)",
        default: false,
      },
    ]);
  } catch (err) {
    if (err.name === "ExitPromptError") {
      error("Cancelled by user.");
      return process.exit(0);
    }
    error("Error:", err);
    return process.exit(1);
  }

  // If command needs options, guide through the process
  const commandOptions = [];
  if (hasOptionsAnswer.hasOptions) {
    console.log(
      "\nAdding options to your command... For each option, you'll need to specify:"
    );
    console.log("- The type of data it accepts (text, number, etc.)");
    console.log('- The name of the option (e.g., "user" in /ban <user>)');
    console.log("- A description of what the option does\n");

    let addingOptions = true;
    while (addingOptions) {
      let optionAnswers;
      try {
        optionAnswers = await inquirer.prompt([
          {
            type: "list",
            name: "type",
            message: "What type of data should this option accept?",
            choices: [
              { name: "String (text)", value: "String" },
              { name: "Integer (whole number)", value: "Integer" },
              { name: "Number (decimal number)", value: "Number" },
              { name: "Boolean (true/false)", value: "Boolean" },
              { name: "User (Discord user)", value: "User" },
              { name: "Channel (Discord channel)", value: "Channel" },
              { name: "Role (Discord role)", value: "Role" },
              { name: "Mentionable (user or role)", value: "Mentionable" },
              { name: "Attachment (file)", value: "Attachment" },
            ],
          },
          {
            type: "input",
            name: "name",
            message: 'Option name (e.g., "user"):',
            validate: (input) => {
              if (/^[a-z0-9-]+$/.test(input)) return true;
              return "Option name must be lowercase and may only contain letters, numbers, and dashes";
            },
          },
          {
            type: "input",
            name: "description",
            message: 'Option description (e.g., "The user to ban"):',
            validate: (input) => input.length > 0,
          },
          {
            type: "confirm",
            name: "required",
            message: "Is this option required?",
            default: false,
          },
        ]);
      } catch (err) {
        if (err.name === "ExitPromptError") {
          error("Cancelled by user.");
          return process.exit(0);
        }
        error("Error:", err);
        return process.exit(1);
      }

      commandOptions.push({
        type: optionAnswers.type.toLowerCase(),
        name: optionAnswers.name,
        description: optionAnswers.description,
        required: optionAnswers.required,
      });

      const { addAnother } = await inquirer
        .prompt([
          {
            type: "confirm",
            name: "addAnother",
            message: "Would you like to add another option?",
            default: false,
          },
        ])
        .catch((err) => {
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
  let permissions = [];
  if (answers.features.includes("permissions")) {
    console.log("\nSelect the permissions required to use this command:");

    const permissionAnswers = await inquirer
      .prompt([
        {
          type: "checkbox",
          name: "permissions",
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
        },
      ])
      .catch((err) => {
        if (err.name === "ExitPromptError") {
          error("Cancelled by user.");
          return process.exit(0);
        }
        error("Error:", err);
        return process.exit(1);
      });
    permissions = permissionAnswers.permissions;
  }

  // Generate the command file content with proper imports
  let commandContent = `import { SlashCommandBuilder`;

  if (permissions.length > 0) {
    commandContent += `, PermissionFlagsBits`;
  }
  commandContent += ` } from 'discord.js';\n`;

  if (answers.features.includes("cacheable")) {
    commandContent += `import { commandCache } from '../utils/commandCache.js';\n\n`;
    commandContent += `// Set command-specific cache settings\ncommandCache.setCommandSettings('${answers.name}', {\n  ttl: 60000, // Cache results for 1 minute\n});\n\n`;
  }

  commandContent += `export default {\n`;
  commandContent += `  data: new SlashCommandBuilder()\n`;
  commandContent += `    .setName('${answers.name}')\n`;
  commandContent += `    .setDescription('${answers.description}')\n`;

  // Add options if any
  if (commandOptions.length > 0) {
    commandOptions.forEach((opt) => {
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
  if (permissions.length > 0) {
    permissions.forEach((perm) => {
      commandContent += `    .setDefaultMemberPermissions(PermissionFlagsBits.${perm})\n`;
    });
  }

  commandContent += `  ,\n\n`;

  // Add cacheable property if selected
  if (answers.features.includes("cacheable")) {
    commandContent += `  cacheable: true,\n\n`;
  }

  // Generate execute function
  commandContent += `  async execute(interaction) {\n`;

  if (answers.features.includes("deferred")) {
    commandContent += `    await interaction.deferReply(${
      answers.features.includes("ephemeral") ? "{ ephemeral: true }" : ""
    });\n\n`;
  }

  // Add option handling if any
  if (commandOptions.length > 0) {
    commandContent += `    // Get command options\n`;
    commandOptions.forEach((opt) => {
      commandContent += `    const ${opt.name} = interaction.options.get${
        opt.type.charAt(0).toUpperCase() + opt.type.slice(1)
      }('${opt.name}');\n`;
    });
    commandContent += "\n";
  }

  commandContent += `    // TODO: Add your command logic here\n\n`;

  if (answers.features.includes("deferred")) {
    commandContent += `    await interaction.editReply({ content: 'Command executed!' ${
      answers.features.includes("ephemeral") ? ", ephemeral: true" : ""
    } });\n`;
  } else {
    commandContent += `    await interaction.reply({ content: 'Command executed!' ${
      answers.features.includes("ephemeral") ? ", ephemeral: true" : ""
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
  const filePath = path.join(commandsDir, `${answers.name}.js`);
  fs.writeFileSync(filePath, commandContent);

  success(`Command ${answers.name} created successfully at ${filePath}`);

  // Return the command details for potential further use
  return {
    name: answers.name,
    path: filePath,
    features: answers.features,
    options: commandOptions,
  };
}

// Run the command generator
generateCommand().catch((err) => {
  error("Error creating command:", err);
  process.exit(1);
});

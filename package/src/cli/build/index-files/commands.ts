import { consola as logger } from "consola";
import { promises as fs } from "fs";
import { glob } from "glob";
import path from "path";

const CWD = process.cwd();
const COMMANDS_DIR = path.join(CWD, "commands");
const DISCRAFT_DIR = path.join(CWD, ".discraft");
const OUTPUT_COMMANDS_FILE = path.join(DISCRAFT_DIR, "commands", "index.ts");

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
    const files = await glob(path.join(COMMANDS_DIR, "*.ts"));
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
          .relative(path.dirname(OUTPUT_COMMANDS_FILE), filePath)
          .replace(/\\/g, "/")
          .replace(/\.ts$/, ""),
        isValid: true,
      };
    });
  } catch (err) {
    logger.error(`Error finding files in ${COMMANDS_DIR}.`, err);
    return [];
  }
}

async function generateCommandsIndex() {
  const modules = await findModules();
  if (!modules.length) {
    logger.warn("No command files found. Skipping command index generation.");
    const content = `
import { Client } from "discord.js";
import { logger } from "../../utils/logger";

export async function registerCommands(client: Client) {
    logger.warn("No commands found in commands directory");
    return;
}
    `;
    await fs.writeFile(OUTPUT_COMMANDS_FILE, content);
    return;
  }

  let imports = "";
  let moduleList = "";
  for (const mod of modules) {
    imports += `import ${mod.name}Command from '${mod.importPath}';\n`;
    moduleList += `${mod.name}Command, `;
  }

  const content = `
import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  type Interaction,
  REST,
  Routes,
  SlashCommandBuilder,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js";
import { logger } from "../../utils/logger";

${imports}

// Define a type for the command modules
type CommandData =
  | SlashCommandBuilder
  | ContextMenuCommandBuilder;

type InteractionType =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction;

interface CommandModule {
  data: CommandData;
  execute: (data: {
    interaction: InteractionType;
  }) => Promise<void>;
}

export async function registerCommands(client: Client) {
  const commands: any[] = [];
  const commandMap: Collection<string, CommandModule> = new Collection();
  const commandModules = [${moduleList.slice(0, -2)}];

  let errorCount = 0;
  let registeredCommands = 0;

  logger.info(\`Registering \${commandModules.length} commands...\`);

  for (const commandModuleUntyped of commandModules) {
    const commandModule = commandModuleUntyped as CommandModule;
    try {
      if (!commandModule || !commandModule.data || !commandModule.execute) {
        logger.warn(
          \`Skipping invalid command "\${commandModule?.data?.name ?? "unknown"}". Ensure it exports a default object with 'data' and 'execute' properties.\`,
        );
        errorCount++;
        continue;
      }
      const command = commandModule;

      if (command.data instanceof SlashCommandBuilder) {
        commands.push(command.data.toJSON());
        commandMap.set(command.data.name, command);
        logger.verbose(\`Registered slash command: \${command.data.name}\`);
      } else if (command.data instanceof ContextMenuCommandBuilder) {
        commands.push(command.data.toJSON());
        commandMap.set(command.data.name, command);
        logger.verbose(\`Registered context menu command: \${command.data.name}\`);
      }
      registeredCommands++;
    } catch (error) {
      logger.error(
        \`Failed to load command "\${commandModule?.data?.name ?? "unknown"}"\`,
      );
      logger.verbose(error);
      errorCount++;
    }
  }

  // Register commands with Discord REST API
  if (client.token) {
    const rest = new REST().setToken(client.token);

    try {
      logger.info("Started refreshing application (/) commands.");
      await rest.put(Routes.applicationCommands(client.user?.id || "missing"), {
        body: commands,
      });
      logger.success("Successfully reloaded application (/) commands.");
    } catch (error) {
      logger.error("Error registering commands.");
      logger.verbose(error);
      errorCount++;
    }
  } else {
    logger.warn("Client token not found. Skipping command registration.");
    errorCount++;
  }

  logger.success(
    \`Registered \${registeredCommands} command\${registeredCommands === 1 ? "" : "s"}, \${errorCount} errors.\`,
  );
  // Handle Interactions
  client.on("interactionCreate", async (interaction: Interaction) => {
     if (interaction.isChatInputCommand()) {
        const command = commandMap.get(interaction.commandName);
        if (!command) {
            logger.error(\`No command matching \${interaction.commandName} was found.\`);
            return;
        }
          try {
              await command.execute({ interaction });
            } catch (error) {
              logger.error(\`Error executing command \${interaction.commandName}:\`);
              logger.verbose(error);
              if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                  content: "There was an error executing this command!",
                  flags: MessageFlags.Ephemeral,
                });
              } else {
                await interaction.reply({
                  content: "There was an error executing this command!",
                  flags: MessageFlags.Ephemeral,
                });
              }
            }
     } else if (interaction.isUserContextMenuCommand()) {
        const command = commandMap.get(interaction.commandName);
         if (!command) {
            logger.error(\`No command matching \${interaction.commandName} was found.\`);
            return;
         }
          try {
            await command.execute({ interaction });
          } catch (error) {
             logger.error(\`Error executing user context menu command \${interaction.commandName}:\`);
              logger.verbose(error);
              if (interaction.replied || interaction.deferred) {
                  await interaction.followUp({
                  content: "There was an error executing this command!",
                  flags: MessageFlags.Ephemeral,
                  });
                } else {
                    await interaction.reply({
                    content: "There was an error executing this command!",
                   flags: MessageFlags.Ephemeral,
                  });
              }
          }
     } else if (interaction.isMessageContextMenuCommand()) {
        const command = commandMap.get(interaction.commandName);
         if (!command) {
            logger.error(\`No command matching \${interaction.commandName} was found.\`);
            return;
         }
          try {
              await command.execute({ interaction });
            } catch (error) {
                 logger.error(\`Error executing message context menu command \${interaction.commandName}:\`);
                logger.verbose(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: "There was an error executing this command!",
                        flags: MessageFlags.Ephemeral,
                    });
                } else {
                    await interaction.reply({
                        content: "There was an error executing this command!",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
     }
  });
}
    `;

  await fs.writeFile(OUTPUT_COMMANDS_FILE, content);
  logger.verbose("Commands index file generated.");
}

export { generateCommandsIndex };

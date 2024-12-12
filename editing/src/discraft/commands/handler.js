import { Collection, REST, Routes } from "discord.js";
import { clientId, token } from "../../config/bot.config.js";
import { commandCache } from "../../utils/commandCache.js";
import { debug, error, info, success } from "../../utils/logger.js";
import { commands } from "./index.js";

export class CommandHandler {
  constructor(client, startTime) {
    this.client = client;
    this.commands = new Collection();
    this.commandsData = [];
    this.setupEventListeners();
    this.serverStartTime = startTime;
  }

  setupEventListeners() {
    // Handle command interactions
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) return;

      try {
        // Check cache for command result if command is cacheable
        if (command.cacheable) {
          const cachedResult = commandCache.get(
            interaction.commandName,
            interaction.options.data,
          );

          if (cachedResult) {
            // Handle cached multi-step responses
            if (cachedResult.steps) {
              // Initial reply
              await interaction.reply(cachedResult.steps[0]);

              // Process subsequent steps
              for (let i = 1; i < cachedResult.steps.length; i++) {
                const step = cachedResult.steps[i];
                if (step.type === "edit") {
                  await interaction.editReply(step.content);
                } else if (step.type === "followUp") {
                  await interaction.followUp(step.content);
                }

                if (i > 100) {
                  error("Too many steps in cached response!");
                  break;
                }
              }
              return;
            }

            // Handle simple cached responses
            await interaction.reply(cachedResult);
            return;
          }
        }

        // Execute command
        const result = await command.execute(interaction);

        // Cache the result if command is cacheable and returned a result
        if (command.cacheable && result) {
          commandCache.set(
            interaction.commandName,
            interaction.options.data,
            result,
          );
        }
      } catch (err) {
        error("Error executing command:", err);
        const content = {
          content: "There was an error executing this command!",
          ephemeral: true,
        };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(content);
          } else {
            await interaction.reply(content);
          }
        } catch (err) {
          error("Error replying:", err);
        }
      }
    });

    // Handle guild joins
    this.client.on("guildCreate", async (guild) => {
      debug(`Bot joined new guild: ${guild.name} (${guild.id})`);
      await this.registerCommands();
    });

    // Register commands when bot is ready
    this.client.once("ready", async () => {
      debug("Registering commands...");
      await this.registerCommands();
      info(`Bot is ready as ${this.client.user.tag}`);
      debug(
        `Time to register commands: ${
          Date.now() - this.client.readyTimestamp
        }ms`,
      );
      success(`Time to online: ${Date.now() - this.serverStartTime}ms`);
    });
  }

  async loadCommands() {
    // Clear existing commands
    this.commands.clear();
    this.commandsData = [];

    // Load commands from static imports
    for (const [name, command] of Object.entries(commands)) {
      if ("data" in command && "execute" in command) {
        this.commands.set(command.data.name, command);
        this.commandsData.push(command.data.toJSON());
        debug(`Loaded command: ${command.data.name}`);
      } else {
        error(
          `The command ${name} is missing required "data" or "execute" property.`,
        );
      }
    }
  }

  async registerCommands() {
    // Reload commands to ensure we have the latest versions
    await this.loadCommands();

    const rest = new REST().setToken(token);
    try {
      debug(
        `Started refreshing ${this.commandsData.length} application (/) commands.`,
      );

      // Register commands globally
      const data = await rest.put(Routes.applicationCommands(clientId), {
        body: this.commandsData,
      });

      info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (err) {
      error("Error registering commands:", err);
    }
  }
}

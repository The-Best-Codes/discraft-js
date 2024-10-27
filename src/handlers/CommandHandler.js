import { Collection, REST, Routes } from 'discord.js';
import { log, error, info, debug } from '../utils/logger.js';
import { token, clientId } from '../config/bot.config.js';
import { commands } from '../commands/index.js';

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
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (err) {
        error('Error executing command:', err);
        const content = { content: 'There was an error executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(content);
        } else {
          await interaction.reply(content);
        }
      }
    });

    // Handle guild joins
    this.client.on('guildCreate', async (guild) => {
      log(`Bot joined new guild: ${guild.name} (${guild.id})`);
      await this.registerCommands();
    });

    // Register commands when bot is ready
    this.client.once('ready', async () => {
      debug('Registering commands...');
      await this.registerCommands();
      info(`Bot is ready as ${this.client.user.tag}`);
      debug(`Time to register commands: ${Date.now() - this.client.readyTimestamp}ms`);
      info(`Time to online: ${Date.now() - this.serverStartTime}ms`);
    });
  }

  async loadCommands() {
    // Clear existing commands
    this.commands.clear();
    this.commandsData = [];

    // Load commands from static imports
    for (const [name, command] of Object.entries(commands)) {
      if ('data' in command && 'execute' in command) {
        this.commands.set(command.data.name, command);
        this.commandsData.push(command.data.toJSON());
        debug(`Loaded command: ${command.data.name}`);
      } else {
        error(`The command ${name} is missing required "data" or "execute" property.`);
      }
    }
  }

  async registerCommands() {
    // Reload commands to ensure we have the latest versions
    await this.loadCommands();

    const rest = new REST().setToken(token);
    try {
      debug(`Started refreshing ${this.commandsData.length} application (/) commands.`);

      // Register commands globally
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: this.commandsData },
      );

      info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (err) {
      error('Error registering commands:', err);
    }
  }
}

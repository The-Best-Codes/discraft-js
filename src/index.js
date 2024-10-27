import { debug, error, info, success } from './utils/logger.js';
import client from './services/discord.js';
import { CommandHandler } from './handlers/CommandHandler.js';
import { events } from './events/index.js';

const startTime = Date.now();

info('Initializing Discord bot...');

// Initialize command handler
client.commandHandler = new CommandHandler(client, startTime);

// Load events from static imports
info('Loading events...');
try {
  for (const [name, eventHandler] of Object.entries(events)) {
    debug(`Loading event: ${name}`);
    try {
      eventHandler(client);
      debug(`Loaded event: ${name}`);
    } catch (err) {
      error(`Error loading event ${name}:`, err);
    }
  }
  info('Events loaded.');
} catch (err) {
  error('Error loading events:', err);
}

success('Bot setup complete.');

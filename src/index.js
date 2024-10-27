import './config/env.js';
import { debug, error, info, success } from '../common/utils/logger.js';
import client from './services/discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CommandHandler } from './handlers/CommandHandler.js';

const startTime = Date.now();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

info('Initializing Discord bot...');

// Initialize command handler
client.commandHandler = new CommandHandler(client, startTime);

// Dynamically load user-created events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  info('Loading events...');
  try {
    for (const file of fs.readdirSync(eventsPath)) {
      debug(`Loading event: ${file}`);
      const eventModule = await import(`./events/${file}`);
      eventModule.default(client);
      debug(`Loaded event: ${file}`);
    }
    info('Events loaded.');
  } catch (err) {
    error('Error loading events:', err);
  }
}

success('Bot setup complete.');

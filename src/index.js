import './config/env.js';
import { info, success } from './utils/logger.js';
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
  for (const file of fs.readdirSync(eventsPath)) {
    const eventModule = await import(`./events/${file}`);
    eventModule.default(client);
  }
}

success('Bot setup complete.');

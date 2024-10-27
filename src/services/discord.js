import { info } from '../utils/logger.js';
import { Client, GatewayIntentBits } from 'discord.js';
import { token } from '../config/bot.config.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.login(token).then(() => {
  info('Discord client is logged in.');
});

export default client;

/* eslint-disable promise/always-return */
import { Client, GatewayIntentBits } from 'discord.js';
import { error, success } from '../common/utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
    error('BOT_TOKEN is not set in the environment variables.');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.login(token)
    .then(() => {
        success('The bot token is valid.');
        client.destroy();
    })
    .catch(() => {
        error('Invalid bot token.');
        process.exit(1);
    });

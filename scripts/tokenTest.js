/* eslint-disable promise/always-return */
import { Client } from 'discord.js';
import { error, success } from '../common/utils/logger';

const token = process.env.BOT_TOKEN;

if (!token) {
    error('BOT_TOKEN is not set in the environment variables.');
    process.exit(1);
}

const client = new Client();

client.login(token)
    .then(() => {
        success('The bot token is valid.');
        client.destroy();
    })
    .catch(() => {
        error('Invalid bot token.');
        process.exit(1);
    });

import { spawn } from 'child_process';
import { info, error } from '../common/utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');
const bundlePath = path.join(distPath, 'bundle.js');

// Check if dist directory and bundle.js exist
if (!fs.existsSync(distPath) || !fs.existsSync(bundlePath)) {
  error('Build not found! Please run "npm run build" first');
  info('You can create a production build by running: npm run build');
  process.exit(1);
}

info('Starting bot in production mode...');

const bot = spawn('node', ['-r', 'dotenv/config', 'dist/bundle.js'], {
  stdio: 'inherit'
});

bot.on('error', (err) => {
  error('Failed to start bot:', err);
  process.exit(1);
});

// Handle process signals
process.on('SIGINT', () => {
  info('Received SIGINT. Gracefully shutting down...');
  bot.kill('SIGINT');
});

process.on('SIGTERM', () => {
  info('Received SIGTERM. Gracefully shutting down...');
  bot.kill('SIGTERM');
});

bot.on('exit', (code, signal) => {
  if (code !== null) {
    info(`Bot process exited with code ${code}`);
  } else if (signal) {
    info(`Bot process was terminated by signal ${signal}`);
  }
});

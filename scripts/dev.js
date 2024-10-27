import nodemon from 'nodemon';
import { info, warn, error } from '../src/utils/logger.js';

const mon = nodemon({
    script: 'src/index.js',
    watch: ['src'],
    ext: 'js',
    env: { 'NODE_ENV': 'development' }
});

// Handle normal exits
mon.on('quit', () => {
    info('Development mode terminated');
    process.exit();
});

// Handle errors
mon.on('error', (err) => {
    error('Nodemon error:', err);
});

// Log restart information
mon.on('restart', (files) => {
    info(`Restarting due to changes in ${files.length} files...`);
});

// Handle process signals
process.on('SIGINT', () => {
    warn('Received SIGINT. Gracefully shutting down...');
    mon.emit('quit');
});

process.on('SIGTERM', () => {
    warn('Received SIGTERM. Gracefully shutting down...');
    mon.emit('quit');
});

// Log startup
mon.on('start', () => {
    info('Starting development mode...');
});

// Handle stdout/stderr from child process
mon.on('stdout', (data) => {
    process.stdout.write(data);
});

mon.on('stderr', (data) => {
    process.stderr.write(data);
});

// Handle crashes in the child process
mon.on('crash', () => {
    error('Application crashed - waiting for file changes before restarting...');
});

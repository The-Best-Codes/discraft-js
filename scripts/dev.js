import nodemon from 'nodemon';
import { info, warn, error, success } from '../common/utils/logger.js';
import generateCommands from './compile/genCommands.js';
import generateEvents from './compile/genEvents.js';
import path from 'path';
import fs from 'fs';

try {
    // Get the user's project directory
    const projectDir = process.cwd();
    
    // Check if we're in a Discraft project
    if (!fs.existsSync(path.join(projectDir, 'src'))) {
        error('No src/ directory found. Please ensure you are in a Discraft project directory.');
        process.exit(1);
    }

    const srcDir = path.join(projectDir, 'src');

    // On startup, generate commands and events
    generateCommands(srcDir);
    generateEvents(srcDir);

    const mon = nodemon({
        exec: 'node -r dotenv/config',
        script: path.join(srcDir, 'index.js'),
        watch: [srcDir],
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
        const restartTime = Date.now();
        info(`Restarting due to changes in ${files.length} files...`);
        generateCommands(srcDir);
        generateEvents(srcDir);
        success(`Restart complete in ${Date.now() - restartTime}ms`);
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

} catch (err) {
    if (err.code === 'ENOENT') {
        error('Could not determine current working directory. Please ensure you are in a valid directory with proper permissions.');
    } else {
        error('Failed to start development server:', err);
    }
    process.exit(1);
}

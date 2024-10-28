#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import inquirer from 'inquirer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const program = new Command();

program
    .version('1.2.3')
    .description('Discraft CLI - Best framework for Discord bots');

program
    .command('init')
    .description('Initialize a new Discraft project')
    .action(async () => {
        // Get project details
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Project name:',
                default: path.basename(process.cwd()),
                validate: input => {
                    if (/^[a-zA-Z0-9-_]+$/.test(input)) return true;
                    return 'Project name may only include letters, numbers, dashes and underscores';
                }
            },
            {
                type: 'input',
                name: 'directory',
                message: 'Project directory (leave empty for current):',
                default: '',
                filter: input => input.trim()
            },
            {
                type: 'input',
                name: 'description',
                message: 'Description:',
                default: 'A Discord bot built with Discraft'
            },
            {
                type: 'input',
                name: 'author',
                message: 'Author:',
                default: ''
            },
            {
                type: 'list',
                name: 'license',
                message: 'License:',
                choices: ['MIT', 'ISC', 'Apache-2.0', 'GPL-3.0', 'None'],
                default: 'MIT'
            },
            {
                type: 'checkbox',
                name: 'features',
                message: 'Select additional features:',
                choices: [
                    {
                        name: 'Example commands (ping, help)',
                        value: 'exampleCommands',
                        checked: true
                    },
                    {
                        name: 'Environment setup (.env.example)',
                        value: 'envSetup',
                        checked: true
                    },
                    {
                        name: 'README.md with setup instructions',
                        value: 'readme',
                        checked: true
                    },
                    {
                        name: 'Basic error handling',
                        value: 'errorHandling',
                        checked: true
                    }
                ]
            }
        ]);

        // Set up project directory
        const projectDir = answers.directory 
            ? path.resolve(process.cwd(), answers.directory)
            : process.cwd();

        if (answers.directory) {
            if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir, { recursive: true });
            }
        }

        // Create src directory
        const srcDir = path.join(projectDir, 'src');
        if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
        }

        // Create project structure
        const dirs = [
            'commands',
            'events',
            'config',
            'handlers',
            'services',
            'utils'
        ];

        dirs.forEach(dir => {
            const dirPath = path.join(srcDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });

        // Copy template files
        const templateFiles = {
            'config/bot.config.js': path.join(__dirname, '..', 'src', 'config', 'bot.config.js'),
            'handlers/CommandHandler.js': path.join(__dirname, '..', 'src', 'handlers', 'CommandHandler.js'),
            'services/discord.js': path.join(__dirname, '..', 'src', 'services', 'discord.js'),
            'utils/logger.js': path.join(__dirname, '..', 'src', 'utils', 'logger.js'),
            'index.js': path.join(__dirname, '..', 'src', 'index.js')
        };

        // Add example commands if selected
        if (answers.features.includes('exampleCommands')) {
            templateFiles['commands/ping.js'] = path.join(__dirname, '..', 'src', 'commands', 'ping.js');
            templateFiles['events/ready.js'] = path.join(__dirname, '..', 'src', 'events', 'ready.js');
        }

        Object.entries(templateFiles).forEach(([target, source]) => {
            if (fs.existsSync(source)) {
                fs.copyFileSync(source, path.join(srcDir, target));
            }
        });

        // Create package.json
        const pkg = {
            name: answers.name,
            version: '1.0.0',
            description: answers.description,
            type: 'module',
            author: answers.author,
            license: answers.license === 'None' ? 'UNLICENSED' : answers.license,
            dependencies: {
                'discord.js': '^14.16.3',
                'dotenv': '^16.4.5'
            }
        };

        fs.writeFileSync(
            path.join(projectDir, 'package.json'),
            JSON.stringify(pkg, null, 2)
        );

        // Create .env and .env.example if selected
        if (answers.features.includes('envSetup')) {
            const envExample = 'TOKEN=your_bot_token_here\nCLIENT_ID=your_client_id_here\n';
            fs.writeFileSync(path.join(projectDir, '.env.example'), envExample);
            if (!fs.existsSync(path.join(projectDir, '.env'))) {
                fs.writeFileSync(path.join(projectDir, '.env'), envExample);
            }
        }

        // Create README.md if selected
        if (answers.features.includes('readme')) {
            const readme = `# ${answers.name}
${answers.description}

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Create a \`.env\` file with your bot token:
   \`\`\`
   TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   \`\`\`

3. Start development:
   \`\`\`bash
   discraft dev
   \`\`\`

## Commands

Development:
- \`discraft dev\`: Start development server
- \`discraft build\`: Build for production
- \`discraft start\`: Start production server

${answers.features.includes('exampleCommands') ? '\nBot Commands:\n- `/ping`: Check bot latency' : ''}

## License

${answers.license === 'None' ? 'This project is not licensed.' : `This project is licensed under the ${answers.license} License.`}
`;
            fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
        }

        // Create .gitignore
        const gitignore = `.env
node_modules/
dist/
`;
        fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignore);

        console.log('\n✨ Discraft project initialized successfully!');
        console.log('\nNext steps:');
        if (answers.directory) {
            console.log(`1. cd ${answers.directory}`);
        }
        console.log('1. Run "npm install" to install dependencies');
        console.log('2. Add your bot token to .env file');
        console.log('3. Run "discraft dev" to start development');
    });

program
    .command('dev')
    .description('Start development server')
    .action(() => {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'dev.js');
        spawn('node', [scriptPath], { 
            stdio: 'inherit',
            cwd: process.cwd(),
            env: { ...process.env, DISCRAFT_ROOT: __dirname }
        });
    });

program
    .command('build')
    .description('Build for production')
    .action(() => {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'build.js');
        spawn('node', [scriptPath], { 
            stdio: 'inherit',
            cwd: process.cwd(),
            env: { ...process.env, DISCRAFT_ROOT: __dirname }
        });
    });

program
    .command('start')
    .description('Start production server')
    .action(() => {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'start.js');
        spawn('node', [scriptPath], { 
            stdio: 'inherit',
            cwd: process.cwd(),
            env: { ...process.env, DISCRAFT_ROOT: __dirname }
        });
    });

program.parse(process.argv);

#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import inquirer from "inquirer";

// Functions for colorizing text (dim grey)
const tColorGray = (str) => `\x1b[38;2;170;170;170m${str}\x1b[0m`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let currentPackage = {};

// Ensure the package.json exists
try {
    const packagePath = path.resolve(__dirname, "..", "package.json");
    currentPackage = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
} catch (err) {
    console.error("Could not access package.json", err);
}

const program = new Command();

program
    .version(currentPackage?.version || "1.0.0")
    .name("discraft")
    .description("Discraft CLI - Best framework for Discord bots");

program
    .command("init")
    .description("Initialize a new Discraft project")
    .action(async () => {
        // Get project details
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "name",
                message: "Project name:",
                default: path.basename(process.cwd()),
                validate: input => {
                    if (/^[a-zA-Z0-9-_]+$/.test(input)) return true;
                    return "Project name may only include letters, numbers, dashes and underscores";
                }
            },
            {
                type: "input",
                name: "directory",
                message: "Project directory:",
                default: "(current)",
                filter: input => input.trim() === "(current)" ? "" : input.trim(),
                transformer: (input) => {
                    if (input.trim() === "" || input.trim() === "(current)") {
                        return tColorGray("(current)");
                    }
                    return input;
                }
            },
            {
                type: "list",
                name: "license",
                message: "License:",
                choices: ["MIT", "ISC", "Apache-2.0", "GPL-3.0", "None"],
                default: "MIT"
            },
            {
                type: "checkbox",
                name: "features",
                message: "Select additional features:",
                choices: [
                    {
                        name: "Example ping command",
                        value: "exampleCommands",
                        checked: true
                    },
                    {
                        name: "Environment setup (.env.example)",
                        value: "envSetup",
                        checked: true
                    },
                    {
                        name: "README.md with setup instructions",
                        value: "readme",
                        checked: true
                    }
                ]
            }
        ]);

        // Set up project directory
        const projectDir = path.resolve(process.cwd(), answers.directory);

        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        // Create src directory
        const srcDir = path.join(projectDir, "src");
        if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
        }

        // Create project structure
        const dirs = [
            "discraft",
            "commands",
            "events",
            "config",
            "services",
            "utils"
        ];

        dirs.forEach(dir => {
            const dirPath = path.join(srcDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });

        // Copy template files
        const templateFiles = {
            "config/bot.config.js": path.join(__dirname, "..", "src", "config", "bot.config.js"),
            "discraft/commands/handler.js": path.join(__dirname, "..", "src", "discraft", "commands", "handler.js"),
            "discraft/events/handler.js": path.join(__dirname, "..", "src", "discraft", "events", "handler.js"),
            "services/discord.js": path.join(__dirname, "..", "src", "services", "discord.js"),
            "utils/logger.js": path.join(__dirname, "..", "src", "utils", "logger.js"),
            "events/ready.js": path.join(__dirname, "..", "src", "events", "ready.js"),
            "events/error.js": path.join(__dirname, "..", "src", "events", "error.js"),
            "index.js": path.join(__dirname, "..", "src", "index.js")
        };

        // Add example commands if selected
        if (answers.features.includes("exampleCommands")) {
            templateFiles["commands/ping.js"] = path.join(__dirname, "..", "src", "commands", "ping.js");
        }

        Object.entries(templateFiles).forEach(([target, source]) => {
            if (fs.existsSync(source)) {
                fs.copyFileSync(source, path.join(srcDir, target));
            }
        });

        // Create package.json
        const pkg = {
            name: answers.name,
            version: "1.0.0",
            scripts: {
                dev: "discraft dev",
                build: "discraft build",
                start: "discraft start"
            },
            description: "Bot made with Discraft",
            type: "module",
            license: answers.license === "None" ? "UNLICENSED" : answers.license
        };

        fs.writeFileSync(
            path.join(projectDir, "package.json"),
            JSON.stringify(pkg, null, 2)
        );

        // Create .env and .env.example if selected
        if (answers.features.includes("envSetup")) {
            const envExample = "TOKEN=your_bot_token_here\nCLIENT_ID=your_client_id_here\n";
            fs.writeFileSync(path.join(projectDir, ".env.example"), envExample);
            if (!fs.existsSync(path.join(projectDir, ".env"))) {
                fs.writeFileSync(path.join(projectDir, ".env"), envExample);
            }
        }

        // Create README.md if selected
        if (answers.features.includes("readme")) {
            const readme = `# ${answers.name}
Bot made with Discraft

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

${answers.features.includes("exampleCommands") ? "\nBot Commands:\n- `/ping`: Check bot latency" : ""}

## License

${answers.license === "None" ? "This project is not licensed." : `This project is licensed under the ${answers.license} License.`}
`;
            fs.writeFileSync(path.join(projectDir, "README.md"), readme);
        }

        // Create .gitignore
        const gitignore = `.env
node_modules/
dist/
`;
        fs.writeFileSync(path.join(projectDir, ".gitignore"), gitignore);

        // Install latest dependencies
        console.log("\n📦 Installing dependencies...");
        const npmInstall = spawn("npm", ["install", "discord.js@latest", "dotenv@latest"], {
            stdio: "inherit",
            cwd: projectDir
        });

        npmInstall.on("close", (code) => {
            if (code === 0) {
                console.log("\n✨ Discraft project initialized successfully!");
                console.log("\nNext steps:");
                if (answers.directory !== process.cwd()) {
                    console.log(`Run \`cd ${answers.directory}\` to enter your project directory.`);
                }
                console.log("Add your bot token and client ID to .env file");
                console.log("Run \"discraft dev\" to start development");
            } else {
                console.error("\n❌ Failed to install dependencies. Please run \"npm install\" manually.");
            }
        });
    });

program
    .command("dev")
    .description("Start development server")
    .action(() => {
        const scriptPath = path.join(__dirname, "..", "scripts", "dev.js");
        spawn("node", [scriptPath], {
            stdio: "inherit",
            cwd: process.cwd(),
            env: { ...process.env, DISCRAFT_ROOT: __dirname }
        });
    });

program
    .command("build")
    .description("Build for production")
    .option("-y, --yes", "Skip prompts and use defaults")
    .option("-o, --output <dir>", "Output directory", "dist")
    .option("--max-optimize", "Enable maximum optimization (slower build, faster runtime)", true)
    .action(() => {
        const scriptPath = path.join(__dirname, "..", "scripts", "build.js");
        spawn("node", [scriptPath, ...process.argv.slice(3)], {
            stdio: "inherit",
            cwd: process.cwd(),
            env: {
                ...process.env,
                DISCRAFT_ROOT: __dirname,
                BABEL_PRESET_ENV_PATH: path.join(__dirname, "..", "node_modules", "@babel/preset-env")
            }
        });
    });

program
    .command("start")
    .description("Start production server")
    .action(() => {
        const scriptPath = path.join(__dirname, "..", "scripts", "start.js");
        spawn("node", [scriptPath], {
            stdio: "inherit",
            cwd: process.cwd(),
            env: { ...process.env, DISCRAFT_ROOT: __dirname }
        });
    });

program.
    command("check-token")
    .description("Check if the bot token is valid")
    .action(() => {
        const scriptPath = path.join(__dirname, "..", "scripts", "tokenTest.js");
        spawn("node", [scriptPath], {
            stdio: "inherit",
            cwd: process.cwd(),
            env: { ...process.env, DISCRAFT_ROOT: __dirname }
        });
    })

program.parse(process.argv);

#!/usr/bin/env node

import { Command, Option } from "commander";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { input, checkbox, select } from "@inquirer/prompts";
import figlet from "figlet";

// Functions for colorizing text (dim grey)
const tColor = (color, text) => color.replace("%s", text);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let currentPackage = {};

const tFmt = {
  cyan: "\x1b[36m%s\x1b[0m",
  green: "\x1b[32m%s\x1b[0m",
  grey: "\x1b[2m%s\x1b[0m",
  bold: `\x1b[1m`,
  blue: "\x1b[34m%s\x1b[0m",
  red: "\x1b[31m%s\x1b[0m",
  yellow: "\x1b[33m%s\x1b[0m",
};

const availableLicenses = ["MIT", "ISC", "Apache-2.0", "GPL-3.0", "None"];

// Ensure the package.json exists
try {
  const packagePath = path.resolve(__dirname, "..", "package.json");
  currentPackage = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
  // eslint-disable-next-line no-unused-vars
} catch (err) {
  // console.error("Could not access package.json", err);
}

const showBranding = (color = tFmt.cyan, txt = "Discraft-js") => {
  try {
    console.log(
      color,
      figlet.textSync(
        txt,
        {
          font: "Small",
          horizontalLayout: "default",
          verticalLayout: "default",
          width: 80,
          whitespaceBreak: true,
        },
        "\n"
      )
    );
  } catch {
    console.error("Failed to show branding");
  }
};

const program = new Command();

program
  .version(currentPackage?.version || "1.0.0")
  .name("discraft")
  .description("Discraft CLI - Best framework for Discord bots");

program
  .command("init")
  .argument("[project name]", "project name")
  .argument("[project directory]", "project directory")
  .addOption(
    new Option("-li, --license <license>", "project license").choices(
      availableLicenses
    )
  )
  .addOption(new Option("-ni, --no-install", "skip deps installation"))
  .addOption(new Option("-af, --all-features", "allow all features"))
  .description("Initialize a new Discraft project")
  .action(async (projectName, projectDirectory, cmdOptions) => {
    showBranding();
    try {
      // Get project details
      const projectConfig = {
        name: projectName,
        directory: projectDirectory,
        additionalFeatures: ["exampleCommands", "envSetup", "readme"],
        license: cmdOptions.license,
      };

      if (
        !projectConfig["name"] ||
        !/^[a-zA-Z0-9-_]+$/.test(projectConfig.name)
      ) {
        projectConfig["name"] = await input({
          message: `Project name:`,
          default: path.basename(process.cwd()),
          validate: (input) => {
            if (/^[a-zA-Z0-9-_]+$/.test(input)) return true;
            return "Project name may only include letters, numbers, dashes and underscores";
          },
        });
      }

      if (!projectConfig.directory) {
        const dir = await input({
          message: `Project directory:`,
          default: projectConfig.name,
        });
        projectConfig["directory"] = path.join(process.cwd(), dir);
      }

      if (!availableLicenses.includes(projectConfig.license)) {
        projectConfig["license"] = await select({
          message: "Project License:",
          choices: availableLicenses,
        });
      }

      // Set up project directory
      const projectDir = path.resolve(process.cwd(), projectConfig.directory);

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
        "discraft/commands",
        "discraft/events",
        "commands",
        "events",
        "config",
        "services",
        "utils",
      ];

      dirs.forEach((dir) => {
        const dirPath = path.join(srcDir, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      });

      // Copy template files
      const templateFiles = {
        "config/bot.config.js": path.join(
          __dirname,
          "..",
          "src",
          "config",
          "bot.config.js"
        ),
        "discraft/commands/handler.js": path.join(
          __dirname,
          "..",
          "src",
          "discraft",
          "commands",
          "handler.js"
        ),
        "discraft/events/handler.js": path.join(
          __dirname,
          "..",
          "src",
          "discraft",
          "events",
          "handler.js"
        ),
        "services/discord.js": path.join(
          __dirname,
          "..",
          "src",
          "services",
          "discord.js"
        ),
        "utils/logger.js": path.join(
          __dirname,
          "..",
          "src",
          "utils",
          "logger.js"
        ),
        "utils/commandCache.js": path.join(
          __dirname,
          "..",
          "src",
          "utils",
          "commandCache.js"
        ),
        "events/ready.js": path.join(
          __dirname,
          "..",
          "src",
          "events",
          "ready.js"
        ),
        "events/error.js": path.join(
          __dirname,
          "..",
          "src",
          "events",
          "error.js"
        ),
        "index.js": path.join(__dirname, "..", "src", "index.js"),
      };

      // Asking for featurers
      if (!cmdOptions.allFeatures) {
        projectConfig["additionalFeatures"] = await checkbox({
          message: "Select additional features:",
          choices: [
            {
              name: "Example commands",
              value: "exampleCommands",
              checked: true,
            },
            {
              name: "Environment setup (.env.example)",
              value: "envSetup",
              checked: true,
            },
            {
              name: "README.md with setup instructions",
              value: "readme",
              checked: true,
            },
          ],
        });
      }

      // Add example commands if selected
      if (projectConfig["additionalFeatures"].includes("exampleCommands")) {
        templateFiles["commands/ping.js"] = path.join(
          __dirname,
          "..",
          "src",
          "commands",
          "ping.js"
        );
        templateFiles["commands/random.js"] = path.join(
          __dirname,
          "..",
          "src",
          "commands",
          "random.js"
        );
        templateFiles["commands/status.js"] = path.join(
          __dirname,
          "..",
          "src",
          "commands",
          "status.js"
        );
      }

      Object.entries(templateFiles).forEach(([target, source]) => {
        if (fs.existsSync(source)) {
          const copyTo = path.join(srcDir, target);
          fs.copyFileSync(source, copyTo);
        }
      });

      // Create package.json
      const pkg = {
        name: projectConfig.name,
        version: "1.0.0",
        scripts: {
          dev: "discraft dev",
          build: "discraft build",
          start: "discraft start",
        },
        description: "Bot made with Discraft",
        type: "module",
        license:
          projectConfig.license === "None"
            ? "UNLICENSED"
            : projectConfig.license,
      };

      fs.writeFileSync(
        path.join(projectDir, "package.json"),
        JSON.stringify(pkg, null, 2)
      );

      // Create .env and .env.example if selected
      if (projectConfig["additionalFeatures"].includes("envSetup")) {
        const envFileContnet =
          "# Environment Variables for your Discraft bot\nTOKEN=<your_bot_token_here>\nCLIENT_ID=<your_client_id_here>\n";
        fs.writeFileSync(path.join(projectDir, ".env.example"), envFileContnet);
        if (!fs.existsSync(path.join(projectDir, ".env"))) {
          fs.writeFileSync(path.join(projectDir, ".env"), envFileContnet);
        }
      }

      // Create README.md if selected
      if (projectConfig["additionalFeatures"].includes("readme")) {
        const readme = `# ${projectConfig.name}
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
   npm run dev
   \`\`\`

## Commands

### Development:
- \`discraft dev\`: Start development server
- \`discraft build\`: Build for production
- \`discraft start\`: Start production server

${projectConfig.additionalFeatures.includes("exampleCommands")
            ? "\n### Bot Commands:\n- `/ping`: Check bot latency\n\n- `/random [pick, number]`: Pick something random out of a list; or pick a random number between the min and max\n\n- `/status`: Check bot and server status"
            : ""
          }

## License

${projectConfig.license === "None"
            ? "This project is not licensed."
            : `This project is licensed under the ${projectConfig.license} License.`
          }
`;
        fs.writeFileSync(path.join(projectDir, "README.md"), readme);
      }

      // Create .gitignore
      const gitignore = `.env\nnode_modules/\ndist/\n`;
      fs.writeFileSync(path.join(projectDir, ".gitignore"), gitignore);

      // Welcome
      const welcomeUser = () => {
        console.log(
          tFmt.green,
          tFmt.bold + "\n✨ Discraft project initialized successfully!"
        );
        console.log(tFmt.grey, "\nNext steps:");
        if (projectConfig.directory !== process.cwd()) {
          console.log(
            `\tRun ${tColor(
              tFmt.cyan,
              `cd ${projectConfig.directory.replace(process.cwd() + "/", "")}`
            )} to enter your project directory.`
          );
        }
        console.log(
          `\tAdd your bot token and client ID to ${tColor(
            tFmt.cyan,
            ".env"
          )} file`
        );
        if (cmdOptions.install == false)
          console.log(
            `\tRun ${tColor(
              tFmt.cyan,
              "npm install discord.js@latest dotenv@latest discraft@latest"
            )} to install dependencies`
          );
        console.log(
          `\tRun ${tColor(tFmt.cyan, "npm run dev")} to start development\n`
        );
      };

      // Install latest dependencies
      if (cmdOptions.install !== false) {
        console.log(tColor(tFmt.blue, "\n📦  Installing dependencies..."));
        const npmInstall = spawn(
          "npm",
          ["install", "discord.js@latest", "dotenv@latest", "discraft@latest"],
          {
            stdio: "inherit",
            cwd: projectDir,
          }
        );

        npmInstall.on("close", (code) => {
          if (code === 0) {
            welcomeUser();
          } else {
            console.error(
              tFmt.red,
              '\n❌ Failed to install dependencies. Please run "npm install" manually.'
            );
          }
        });
      } else {
        welcomeUser();
      }
    } catch (err) {
      if (err.isTtyError) {
        console.error(
          tFmt.red,
          "Prompt couldn't be rendered in the current environment"
        );
      } else if (err.message === "Aborted") {
        console.log(tFmt.red, "\nProject initialization cancelled.");
      } else {
        console.error(tFmt.red, "Error during initialization:\n", err);
      }
      process.exit(1);
    }
  });

let activeProcess = null;

process.on("SIGINT", () => {
  console.log("\nGracefully shutting down...");
  if (activeProcess) {
    activeProcess.kill("SIGINT");
  }
  process.exit(0);
});

program
  .command("dev")
  .description("Start development server")
  .action(() => {
    showBranding(tFmt.blue);
    const scriptPath = path.join(__dirname, "..", "scripts", "dev.js");
    activeProcess = spawn("node", [scriptPath], {
      stdio: "inherit",
      cwd: process.cwd(),
      env: { ...process.env, DISCRAFT_ROOT: __dirname },
    });
    activeProcess.on("close", (code) => {
      activeProcess = null;
      if (code !== 0 && code !== null) {
        console.error(`Dev process exited with code ${code}`);
      }
    });
  });

program
  .command("build")
  .description("Build for production")
  .option("-y, --yes", "Skip prompts and use defaults")
  .option("-o, --output <dir>", "Output directory", "dist")
  .option(
    "--max-optimize",
    "Enable maximum optimization (slower build, faster runtime)",
    true
  )
  .action(() => {
    showBranding(tFmt.blue, "Building  Discraft-js");
    console.log("\n");
    const scriptPath = path.join(__dirname, "..", "scripts", "build.js");
    activeProcess = spawn("node", [scriptPath, ...process.argv.slice(3)], {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        DISCRAFT_ROOT: __dirname,
        BABEL_PRESET_ENV_PATH: path.join(
          __dirname,
          "..",
          "node_modules",
          "@babel/preset-env"
        ),
      },
    });
    activeProcess.on("close", (code) => {
      activeProcess = null;
      if (code !== 0 && code !== null) {
        console.error(`Build process exited with code ${code}`);
      }
    });
  });

program
  .command("start")
  .description("Start production server")
  .option("-d, --dir <dir>", "Build directory", "dist")
  .action(({ dir }) => {
    showBranding(tFmt.blue, "Starting  Discraft-js");
    console.log("\n");
    const scriptPath = path.join(__dirname, "..", "scripts", "start.js");
    activeProcess = spawn("node", [scriptPath, dir], {
      stdio: "inherit",
      cwd: process.cwd(),
      env: { ...process.env, DISCRAFT_ROOT: __dirname },
    });
    activeProcess.on("close", (code) => {
      activeProcess = null;
      if (code !== 0 && code !== null) {
        console.error(`Start process exited with code ${code}`);
      }
    });
  });

program
  .command("test")
  .description("Test your bot's configuration")
  .addCommand(
    new Command("token")
      .description("Check if the bot token is valid")
      .action(() => {
        const scriptPath = path.join(
          __dirname,
          "..",
          "scripts",
          "test-token.js"
        );
        activeProcess = spawn("node", [scriptPath], {
          stdio: "inherit",
          cwd: process.cwd(),
          env: { ...process.env, DISCRAFT_ROOT: __dirname },
        });
        activeProcess.on("close", (code) => {
          activeProcess = null;
          if (code !== 0 && code !== null) {
            console.error(`Token check process exited with code ${code}`);
          }
        });
      })
  );

program
  .command("add")
  .description("Add new components to your bot")
  .addCommand(
    new Command("command")
      .description("Create a new Discord bot command")
      .action(async () => {
        showBranding(tFmt.blue);
        const scriptPath = path.join(
          __dirname,
          "..",
          "scripts",
          "add-command.js"
        );
        try {
          const child = spawn("node", [scriptPath], {
            stdio: "inherit",
            shell: true,
          });

          child.on("error", (err) => {
            console.error("Failed to start command generator:", err);
            process.exit(1);
          });

          child.on("exit", (code) => {
            if (code !== 0) {
              console.error(`Command generator exited with code ${code}`);
              process.exit(code);
            }
          });
        } catch (err) {
          console.error("Error executing command generator:", err);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command("event")
      .description("Create a new Discord event handler")
      .action(async () => {
        showBranding(tFmt.blue);
        const scriptPath = path.join(
          __dirname,
          "..",
          "scripts",
          "add-event.js"
        );
        try {
          const child = spawn("node", [scriptPath], {
            stdio: "inherit",
            shell: true,
          });

          child.on("error", (err) => {
            console.error("Failed to start event generator:", err);
            process.exit(1);
          });

          child.on("exit", (code) => {
            if (code !== 0) {
              console.error(`Event generator exited with code ${code}`);
              process.exit(code);
            }
          });
        } catch (err) {
          console.error("Error executing event generator:", err);
          process.exit(1);
        }
      })
  );

program.on("command:*", (...cmd) => {
  showBranding(tFmt.red);
  console.log(
    tFmt.red,
    tFmt.bold +
    ` Sorry, the command \`${cmd.join(
      " "
    )}\` is not recognized. Please use a valid command.`
  );
  console.log(
    tFmt.red,
    ` Available commands: ${program.commands
      .map((cmd) => cmd._name || "")
      .join(", ")}\n`
  );
  process.exit(1);
});

program.addHelpText(
  "beforeAll",
  tColor(
    tFmt.blue,
    figlet.textSync(
      "Discraft-js",
      {
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 80,
        whitespaceBreak: true,
      },
      "\n"
    )
  )
);
program.addHelpText("before", tFmt.blue.split("%s")[1]);
program.addHelpText(
  "afterAll",
  `${tColor(
    tFmt.yellow,
    "\n⭐ Support Us by Starring Our Repo: https://github.com/The-Best-Codes/discraft-js"
  )}`
);

program.parse(process.argv);

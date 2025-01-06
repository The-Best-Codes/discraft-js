import { execSync } from "child_process";
import consola from "consola";
import fs from "fs-extra";
import inquirer from "inquirer";
import kleur from "kleur";
import path from "path";
import { fileURLToPath } from "url";
import { detectPackageManager } from "./detectPm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyTemplate(templatePath: string, projectPath: string) {
  const files = [
    "clients",
    "commands",
    "events",
    "utils",
    ".env.example",
    "index.ts",
    "package.json",
    "tsconfig.json",
  ];

  for (const file of files) {
    const sourcePath = path.join(templatePath, file);
    const destPath = path.join(projectPath, file);

    try {
      if (fs.lstatSync(sourcePath).isDirectory()) {
        await fs.copy(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    } catch (e) {
      consola.error(`Failed to copy ${sourcePath} to ${destPath}`, e);
      throw new Error(`Failed to copy template files, ${e}`);
    }
  }

  // Handle .gitignore specially
  const gitignoreSourcePath = path.join(templatePath, "gitignore.template");
  const gitignoreDestPath = path.join(projectPath, ".gitignore");

  try {
    await fs.copyFile(gitignoreSourcePath, gitignoreDestPath);
  } catch (e) {
    consola.error(
      `Failed to copy ${gitignoreSourcePath} to ${gitignoreDestPath}`,
      e,
    );
    throw new Error(`Failed to copy .gitignore template file, ${e}`);
  }
}

interface InitOptions {
  dir?: string;
  packageManager?: string;
  skipInstall?: boolean;
}

async function init(options: InitOptions = {}) {
  const currentWorkingDirectory = process.cwd();
  const packageRoot = path.join(__dirname, "..", "..");
  const templatePath = path.join(packageRoot, "templates", "ts");

  let projectDir: string;
  let projectName: string;

  if (options.dir) {
    projectDir = path.isAbsolute(options.dir)
      ? options.dir
      : path.join(currentWorkingDirectory, options.dir);
    projectName = path.basename(projectDir);
  } else {
    const locationChoice = await inquirer.prompt([
      {
        type: "list",
        name: "location",
        message: "Where would you like to create your project?",
        choices: [
          { name: "Current directory", value: "current" },
          { name: "Custom directory", value: "custom" },
        ],
      },
    ]);

    if (locationChoice.location === "current") {
      projectDir = currentWorkingDirectory;
      projectName = path.basename(currentWorkingDirectory);
    } else {
      const { customDir } = await inquirer.prompt([
        {
          type: "input",
          name: "customDir",
          message: "Enter the project directory name:",
          default: "my-discord-bot",
        },
      ]);
      projectName = customDir;
      projectDir = path.join(currentWorkingDirectory, customDir);
    }
  }

  let packageManager = options.packageManager;
  if (!packageManager && !options.skipInstall) {
    const detectedPm = await detectPackageManager();
    const pmChoice = await inquirer.prompt([
      {
        type: "list",
        name: "pm",
        message: "Select a package manager:",
        choices: [
          { name: "npm", value: "npm" },
          { name: "yarn", value: "yarn" },
          { name: "pnpm", value: "pnpm" },
          { name: "bun", value: "bun" },
          { name: "Don't install dependencies", value: "none" },
        ],
        default: detectedPm ?? "npm",
      },
    ]);
    packageManager = pmChoice.pm;
  }

  consola.info(`Initializing project in ${kleur.cyan(projectDir)}...`);

  try {
    await fs.ensureDir(projectDir);
    await copyTemplate(templatePath, projectDir);
    consola.success("Template files copied successfully!");

    if (packageManager && packageManager !== "none" && !options.skipInstall) {
      consola.info(
        `Installing dependencies with ${kleur.cyan(packageManager)}...`,
      );
      execSync(`${packageManager} install`, {
        cwd: projectDir,
        stdio: "inherit",
      });
      consola.success("Dependencies installed successfully!");
    }

    const pmCommand =
      packageManager === "none" || packageManager === undefined
        ? "npm"
        : packageManager;
    const isCurrentDir = projectDir === currentWorkingDirectory;

    console.log(
      "\n" + kleur.bold("🎉 Project initialized successfully!") + "\n",
    );
    console.log(kleur.bold("Next steps:"));

    if (!isCurrentDir) {
      console.log(
        `${kleur.gray("─")} cd ${kleur.cyan(path.relative(currentWorkingDirectory, projectDir))}`,
      );
    }

    console.log(
      [
        `${kleur.gray("─")} ${kleur.yellow("cp")} ${kleur.cyan(".env.example")} ${kleur.cyan(".env")}`,
        `${kleur.gray("─")} Configure your ${kleur.cyan(".env")} file with your bot token`,
        `${kleur.gray("─")} ${kleur.yellow(`${pmCommand} run build`)} to compile your TypeScript code`,
        `${kleur.gray("─")} ${kleur.yellow(`${pmCommand} run start`)} to launch your bot`,
      ].join("\n"),
    );

    console.log("\n" + kleur.bold("Happy bot building! 🚀") + "\n");
  } catch (error: any) {
    consola.error(`Failed to initialize project: ${error.message}`);
    process.exit(1);
  }
}

export { init };

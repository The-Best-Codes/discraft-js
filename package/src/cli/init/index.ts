import { execSync } from "child_process";
import consola from "consola";
import fs from "fs-extra";
import inquirer from "inquirer";
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

async function init() {
  const currentWorkingDirectory = process.cwd();
  // Navigate to the discraft package root
  const packageRoot = path.join(__dirname, "..", "..");
  const templatePath = path.join(packageRoot, "templates", "ts");

  const useCurrentDir = await inquirer.prompt([
    {
      type: "confirm",
      name: "useCurrent",
      message: "Initialize a project in the current directory?",
      default: true,
    },
  ]);

  let projectDir = currentWorkingDirectory;
  let projectName = path.basename(currentWorkingDirectory);

  if (!useCurrentDir.useCurrent) {
    const projectDirResponse = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "What is your project directory?",
        default: "my-project",
      },
    ]);
    projectName = projectDirResponse.projectName;
    projectDir = path.join(
      currentWorkingDirectory,
      projectDirResponse.projectName,
    );
  }
  const packageManager = await detectPackageManager();

  const packageManagerResponse = await inquirer.prompt([
    {
      type: "list",
      name: "packageManager",
      message: "Select a package manager to install dependencies:",
      choices: [
        { name: "npm", value: "npm" },
        { name: "yarn", value: "yarn" },
        { name: "pnpm", value: "pnpm" },
        { name: "bun", value: "bun" },
        { name: "Don't install dependencies", value: "none" },
      ],
      default: packageManager ?? "none",
    },
  ]);

  consola.info(`Initializing project in ${projectDir}...`);

  try {
    await fs.ensureDir(projectDir);
    await copyTemplate(templatePath, projectDir);
    consola.success("Copied template files successfully.");

    if (packageManagerResponse.packageManager !== "none") {
      consola.info(
        `Installing dependencies with ${packageManagerResponse.packageManager}...`,
      );
      execSync(`${packageManagerResponse.packageManager} install`, {
        cwd: projectDir,
        stdio: "inherit",
      });
      consola.success("Installed dependencies.");
    }

    consola.success("Project initialized successfully!");

    const pmNpmDefault =
      packageManagerResponse.packageManager === "none"
        ? "npm"
        : packageManagerResponse.packageManager;
    // Enhanced instructions
    if (projectDir === currentWorkingDirectory) {
      consola.info(`
        Next Steps:
        1. Copy the .env.example file to .env:

           cp .env.example .env

        2. Open the .env file and fill in your bot's token and any other necessary environment variables.
        3. Run "${pmNpmDefault} run build" to compile your TypeScript code.
        4. Run "${pmNpmDefault} run start" to start your bot.

        You are all set! Happy bot building!
    `);
    } else {
      consola.info(`
        Next Steps:
        1. Go to your project directory:

           cd ${path.relative(currentWorkingDirectory, projectDir)}

        2. Copy the .env.example file to .env:

           cp .env.example .env

        3. Open the .env file and fill in your bot's token and any other necessary environment variables.
        4. Run "${pmNpmDefault} run build" to compile your TypeScript code.
        5. Run "${pmNpmDefault} run start" to start your bot.

        You are all set! Happy bot building!
    `);
    }
  } catch (error: any) {
    consola.error(`Failed to initialize project: ${error.message}`);
  }
}

export { init };

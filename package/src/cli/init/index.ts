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
    ".gitignore",
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
}

async function init() {
  const currentWorkingDirectory = process.cwd();
  const packageRoot = path.join(__dirname, "..", "..", ".."); // Navigate to package root from here
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

  if (!useCurrentDir.useCurrent) {
    const projectDirResponse = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "What is your project directory?",
        default: "my-project",
      },
    ]);
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
    consola.info(
      `Go to ${path.relative(currentWorkingDirectory, projectDir)} and run "${packageManagerResponse.packageManager} run build" and "${packageManagerResponse.packageManager} run start" to get started.`,
    );
  } catch (error: any) {
    consola.error(`Failed to initialize project: ${error.message}`);
  }
}

export { init };

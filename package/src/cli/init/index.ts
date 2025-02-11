import consola from "consola";
import fs from "fs-extra";
import inquirer from "inquirer";
import kleur from "kleur";
import path from "path";
import { fileURLToPath } from "url";
import { runSubprocess } from "../utils";
import { getCompactRelativePath } from "../utils/relativePath";
import { loadTemplateConfig, type TemplateConfig } from "./config";
import { detectPackageManager } from "./detectPm";
import { copyTemplateFiles } from "./template";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface InitOptions {
  dir?: string;
  packageManager?: string;
  skipInstall?: boolean;
  template?: "ts" | "js" | "vercel-ts-ai";
}

async function init(options: InitOptions = {}) {
  const currentWorkingDirectory = process.cwd();
  const packageRoot = path.join(__dirname, "..", "..");
  const template =
    options.template ??
    (
      await inquirer.prompt({
        type: "list",
        name: "template",
        message: "Select a template:",
        choices: [
          { name: "TypeScript", value: "ts" },
          { name: "JavaScript", value: "js" },
          { name: "Vercel + TypeScript + Google AI", value: "vercel-ts-ai" },
        ],
        default: "ts",
      })
    ).template;
  const templatePath = path.join(packageRoot, "templates", template);
  let projectDir: string;

  if (options.dir) {
    projectDir = path.isAbsolute(options.dir)
      ? options.dir
      : path.join(currentWorkingDirectory, options.dir);
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
    } else {
      const { customDir } = await inquirer.prompt([
        {
          type: "input",
          name: "customDir",
          message: "Enter the project directory name:",
          default: "my-discord-bot",
        },
      ]);
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

  const uxProjectDir = getCompactRelativePath(
    currentWorkingDirectory,
    projectDir,
  );

  consola.info(`Initializing project in ${kleur.cyan(uxProjectDir)}...`);

  let templateConfig: TemplateConfig;
  try {
    templateConfig = await loadTemplateConfig(templatePath);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    consola.error("Could not load template config, using defaults");
    templateConfig = {
      files: [
        "clients",
        "commands",
        "events",
        "utils",
        ".env.example",
        "index.ts",
        "package.json",
        "tsconfig.json",
      ],
    };
  }
  try {
    await fs.ensureDir(projectDir);
    await copyTemplateFiles(templatePath, projectDir, templateConfig);
    consola.success("Template files copied successfully!");

    if (packageManager && packageManager !== "none" && !options.skipInstall) {
      consola.info(
        `Installing dependencies with ${kleur.cyan(packageManager)}...`,
      );
      try {
        await runSubprocess(packageManager, ["install"], {
          cwd: projectDir,
        });
        consola.success("Dependencies installed successfully!");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      } catch (error: any) {
        consola.error("Could not install dependencies.");
      }
    }

    const pmCommand =
      packageManager === "none" || packageManager === undefined
        ? "npm"
        : packageManager;
    const isCurrentDir = projectDir === currentWorkingDirectory;
    const postCopyInstructions = templateConfig?.postCopy?.instructions ?? [];
    const defaultDevelopment = templateConfig?.postCopy?.defaultDevelopment;
    const defaultProduction = templateConfig?.postCopy?.defaultProduction;
    const defaultStart = templateConfig?.postCopy?.defaultStart;

    console.log(
      "\n" + kleur.bold("🎉 Project initialized successfully!") + "\n",
    );
    console.log(kleur.bold("Next steps:"));

    if (!isCurrentDir) {
      console.log(
        `${kleur.gray("─")} cd ${kleur.cyan(
          path.relative(currentWorkingDirectory, projectDir),
        )}`,
      );
    }

    const nextSteps = [
      ...postCopyInstructions.map(
        (instruction) => `${kleur.gray("─")} ${instruction}`,
      ),
    ];

    if (defaultDevelopment !== false) {
      nextSteps.push(`${kleur.underline("Development")}`);
      nextSteps.push(
        `${kleur.gray("─")} ${kleur.yellow(`${pmCommand} run dev`)} to start the development server`,
      );
    }

    if (defaultProduction !== false) {
      nextSteps.push(`${kleur.underline("Production")}`);
      nextSteps.push(
        `${kleur.gray("─")} ${kleur.yellow(`${pmCommand} run build`)} to compile your bot code`,
      );

      if (defaultStart !== false) {
        nextSteps.push(
          `${kleur.gray("─")} ${kleur.yellow(`${pmCommand} run start`)} to launch your bot in production`,
        );
      }
    }

    console.log(nextSteps.join("\n"));

    console.log("\n" + kleur.bold("Happy bot building! 🚀") + "\n");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    consola.error(`Failed to initialize project: ${error.message}`);
    process.exit(1);
  }
}

export { init };

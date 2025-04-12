/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { intro, isCancel, note, outro, select, text } from "@clack/prompts";
import consola from "consola";
import fs from "fs-extra";
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

  intro("Welcome to Discraft.js Project Setup");

  // Template selection
  let template: InitOptions["template"] | symbol | undefined;
  try {
    template = options.template ??
      (await select({
        message: "Select a template for your project",
        options: [
          { label: "TypeScript", value: "ts", hint: "Recommended" },
          { label: "JavaScript", value: "js" },
          {
            label: "Vercel + TypeScript + Google AI",
            value: "vercel-ts-ai",
            hint: "Advanced",
          },
        ],
      }));

    if (isCancel(template)) {
      outro("Setup cancelled");
      process.exit(0);
    }
  } catch (e) {
    outro("Setup cancelled");
    process.exit(0);
  }

  if (!template) {
    outro("Setup cancelled");
    process.exit(0);
  }

  const templatePath = path.join(packageRoot, "templates", template);
  let projectDir: string;

  // Project location selection
  if (options.dir) {
    projectDir = path.isAbsolute(options.dir)
      ? options.dir
      : path.join(currentWorkingDirectory, options.dir);
  } else {
    let locationChoice: string | symbol | undefined;
    try {
      locationChoice = await select({
        message: "Where would you like to create your project?",
        options: [
          { label: "Current directory", value: "current" },
          { label: "Custom directory", value: "custom" },
        ],
      });

      if (isCancel(locationChoice)) {
        outro("Setup cancelled");
        process.exit(0);
      }
    } catch (e) {
      outro("Setup cancelled");
      process.exit(0);
    }

    if (!locationChoice) {
      outro("Setup cancelled");
      process.exit(0);
    }

    if (locationChoice === "current") {
      projectDir = currentWorkingDirectory;
    } else {
      let customDir: string | symbol | undefined;
      try {
        customDir = await text({
          message: "Enter the project directory name",
          placeholder: "my-discord-bot",
          validate: (value) => {
            if (!value) return "Please enter a directory name";
            if (fs.existsSync(path.join(currentWorkingDirectory, value))) {
              return "Directory already exists";
            }
          },
        });

        if (isCancel(customDir)) {
          outro("Setup cancelled");
          process.exit(0);
        }
      } catch (e) {
        outro("Setup cancelled");
        process.exit(0);
      }

      if (!customDir) {
        outro("Setup cancelled");
        process.exit(0);
      }

      projectDir = path.join(currentWorkingDirectory, customDir as string);
    }
  }

  // Package manager selection
  let packageManager = options.packageManager;
  if (!packageManager && !options.skipInstall) {
    const detectedPm = await detectPackageManager();
    let pmChoice: string | symbol | undefined;

    try {
      pmChoice = await select({
        message: "Select a package manager",
        options: [
          {
            label: "npm",
            value: "npm",
            hint: detectedPm === "npm" ? "detected" : undefined,
          },
          {
            label: "yarn",
            value: "yarn",
            hint: detectedPm === "yarn" ? "detected" : undefined,
          },
          {
            label: "pnpm",
            value: "pnpm",
            hint: detectedPm === "pnpm" ? "detected" : undefined,
          },
          {
            label: "bun",
            value: "bun",
            hint: detectedPm === "bun" ? "detected" : undefined,
          },
          { label: "Don't install dependencies", value: "none" },
        ],
        initialValue: detectedPm ?? "npm",
      });

      if (isCancel(pmChoice)) {
        outro("Setup cancelled");
        process.exit(0);
      }
    } catch (e) {
      outro("Setup cancelled");
      process.exit(0);
    }

    if (!pmChoice) {
      outro("Setup cancelled");
      process.exit(0);
    }

    packageManager = pmChoice as string;
  }

  const uxProjectDir = getCompactRelativePath(
    currentWorkingDirectory,
    projectDir,
  );
  note(`Initializing project in ${kleur.cyan(uxProjectDir)}`);

  // Load and process template config
  let templateConfig: TemplateConfig;
  try {
    templateConfig = await loadTemplateConfig(templatePath);
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
    note("Template files copied successfully!");

    if (packageManager && packageManager !== "none" && !options.skipInstall) {
      try {
        await runSubprocess(packageManager, ["install"], {
          cwd: projectDir,
        });
        note("Dependencies installed successfully!");
      } catch (error: any) {
        consola.error("Could not install dependencies.");
      }
    }

    const pmCommand = packageManager === "none" || packageManager === undefined
      ? "npm"
      : packageManager;
    const isCurrentDir = projectDir === currentWorkingDirectory;
    const postCopyInstructions = templateConfig?.postCopy?.instructions ?? [];
    const defaultDevelopment = templateConfig?.postCopy?.defaultDevelopment;
    const defaultProduction = templateConfig?.postCopy?.defaultProduction;
    const defaultStart = templateConfig?.postCopy?.defaultStart;

    note(
      kleur.bold("Next steps:\n") +
        (!isCurrentDir
          ? `${kleur.gray("─")} cd ${
            kleur.cyan(path.relative(currentWorkingDirectory, projectDir))
          }\n`
          : "") +
        postCopyInstructions
          .map((instruction) => `${kleur.gray("─")} ${instruction}`)
          .join("\n") +
        (defaultDevelopment !== false
          ? `\n${kleur.underline("Development")}\n${kleur.gray("─")} ${
            kleur.yellow(`${pmCommand} run dev`)
          } to start the development server`
          : "") +
        (defaultProduction !== false
          ? `\n${kleur.underline("Production")}\n${kleur.gray("─")} ${
            kleur.yellow(`${pmCommand} run build`)
          } to compile your bot code${
            defaultStart !== false
              ? `\n${kleur.gray("─")} ${
                kleur.yellow(`${pmCommand} run start`)
              } to launch your bot in production`
              : ""
          }`
          : "") +
        "\n\n" +
        kleur.bold("Happy bot building! 🚀"),
    );

    outro(kleur.bold("🎉 Project initialized successfully!"));
  } catch (error: any) {
    consola.error(`Failed to initialize project: ${error.message}`);
    process.exit(1);
  }
}

export { init };

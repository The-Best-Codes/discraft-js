#!/usr/bin/env node

import { CancelPromptError } from "@inquirer/core";
import { program } from "commander";
import consola from "consola";
import { version } from "../../package.json";
import { build } from "./cli/build";
import { dev } from "./cli/dev";
import { init } from "./cli/init";
import { start } from "./cli/start";

program
  .version(version)
  .name("discraft")
  .description("Ultimate Discord bot framework");

program
  .command("start")
  .description("Start the bot in production")
  .action(start);

program
  .command("build")
  .description("Build the bot for production")
  .option(
    "-b, --builder <builder>",
    "Specify the builder to use (esbuild or bun). Defaults to auto-detect.",
    (value) => {
      // Check in parser, return the value or throw
      if (value !== "esbuild" && value !== "bun") {
        consola.error("Invalid builder value. Must be 'esbuild' or 'bun'.");
        process.exit(1); // Exit if invalid.
      }
      return value;
    },
  )
  .action((options) => {
    build({ builder: options.builder }).catch((error) => {
      consola.error("An error occurred during build:", error);
      process.exit(1);
    });
  });

program
  .command("dev")
  .description("Start the bot in development mode")
  .option(
    "-b, --builder <builder>",
    "Specify the builder to use (esbuild or bun). Defaults to auto-detect.",
    (value) => {
      if (value !== "esbuild" && value !== "bun") {
        consola.error("Invalid builder value. Must be 'esbuild' or 'bun'.");
        process.exit(1);
      }
      return value;
    },
  )
  .option("-c, --clear-console", "Clear the console on each rebuild.", false)
  .action((options) => {
    dev({ builder: options.builder, clearConsole: options.clearConsole }).catch(
      (error) => {
        consola.error("An error occurred during development:", error);
        process.exit(1);
      },
    );
  });

program
  .command("init")
  .description("Initialize a new Discraft project")
  .option(
    "-d, --dir <directory>",
    "Project directory (defaults to current directory)",
  )
  .option(
    "-p, --package-manager <pm>",
    "Package manager to use (npm, yarn, pnpm, bun, or none)",
    (value) => {
      if (value && !["npm", "yarn", "pnpm", "bun", "none"].includes(value)) {
        consola.error(
          "Invalid package manager value. Must be 'npm', 'yarn', 'pnpm', 'bun', or 'none'.",
        );
        process.exit(1);
      }
      return value;
    },
  )
  .option("--skip-install", "Skip dependency installation")
  .action(async (options) => {
    try {
      await init(options);
    } catch (error) {
      if (error instanceof CancelPromptError) {
        consola.info("Initialization cancelled by user.");
        process.exit(0);
      } else {
        consola.error("An error occurred during initialization:", error);
        process.exit(1);
      }
    }
  });

program.parse(process.argv);

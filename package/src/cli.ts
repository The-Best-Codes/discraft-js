#!/usr/bin/env node

import { program } from "commander";
import consola from "consola";
import { version } from "../../package.json";
import { build } from "./cli/build";
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

program.parse(process.argv);

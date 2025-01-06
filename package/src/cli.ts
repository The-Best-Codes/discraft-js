#!/usr/bin/env node

import { program } from "commander";
import { version } from "../../package.json";
import { build } from "./cli/build";
import { start } from "./cli/start";

program.version(version).description("Like Next.js, but for Discord bots");

program
  .command("start")
  .description("Start the bot in production")
  .action(start);

program
  .command("build")
  .description("Build the bot for production")
  .option("-e, --env <env>", "Build environment (dev or prod)", "dev")
  .action(build);

program.parse(process.argv);

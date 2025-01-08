# Discraft

[![npm version](https://img.shields.io/npm/v/discraft.svg)](https://www.npmjs.com/package/discraft)
[![npm downloads](https://img.shields.io/npm/dm/discraft.svg)](https://www.npmjs.com/package/discraft)
[![Discord Server](https://img.shields.io/discord/1170475897174896650)](https://discord.gg/dKeuR9yfBs)
[![CodeQL](https://github.com/The-Best-Codes/discraft-js/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/The-Best-Codes/discraft-js/actions/workflows/github-code-scanning/codeql)
[![Dependabot Updates](https://github.com/The-Best-Codes/discraft-js/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/The-Best-Codes/discraft-js/actions/workflows/dependabot/dependabot-updates)

Discraft is a modern, developer-friendly framework for building Discord bots with ease. It provides a robust CLI and a set of tools to streamline the development process, allowing you to focus on creating amazing bot experiences. Think of it as a "batteries-included" approach, letting you get started quickly and efficiently.

## Table of Contents

- [🚀 Getting Started](#-getting-started)
  - [Installation](#installation)
  - [Creating a New Project](#creating-a-new-project)
  - [Running Your Bot](#running-your-bot)
- [⚙️ Core Features](#️-core-features)
  - [Command System](#command-system)
  - [Event Handling](#event-handling)
  - [Hot Reloading](#hot-reloading)
  - [Flexible Build Options](#flexible-build-options)
- [💻 CLI Reference](#-cli-reference)
  - [`discraft init`](#discraft-init)
  - [`discraft dev`](#discraft-dev)
  - [`discraft build`](#discraft-build)
  - [`discraft start`](#discraft-start)
- [📁 Project Structure](#-project-structure)
- [🛠️ Development](#️-development)
  - [Dependencies](#dependencies)
  - [Configuration](#configuration)
  - [Commands and Events](#commands-and-events)
- [🧪 Beta Releases](#-beta-releases)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

## 🚀 Getting Started

### Installation

You can install Discraft locally in your project using `npm`, which is recommended for project-specific dependencies:

```bash
npm install discraft --save-dev
```

<details>
    <summary>Alternative Package Manager Commands</summary>
    <p>
        If you prefer to use other package managers, here are the equivalent commands:
        <br>
        <b>pnpm:</b>
        <pre><code>pnpm add discraft -D</code></pre>
        <b>bun:</b>
        <pre><code>bun add discraft --dev</code></pre>
        <b>yarn:</b>
        <pre><code>yarn add discraft -D</code></pre>
    </p>
</details>

Alternatively, you can install Discraft globally to use the CLI from any directory:

```bash
npm install -g discraft
```

When installed globally, you can use `discraft` command directly instead of `npx discraft`.

### Creating a New Project

To get started quickly, use the `discraft init` command:

```bash
npx discraft init
```

Or, if Discraft is installed globally:

```bash
discraft init
```

This will guide you through creating a new Discraft bot project, asking for details such as the project directory and package manager.

**After initialization, you will need to copy the `.env.example` file to `.env` and then edit the `.env` file with your bot token and client ID.**

```
# From `Bot > Token` | https://discord.com/developers/applications
DISCORD_TOKEN=''
# From `General Information > App ID` | https://discord.com/developers/applications
DISCORD_APP_ID=''
```

You can also specify options directly:

```bash
npx discraft init -d my-bot-dir -p bun # Initialize a project in 'my-bot-dir' using bun
```

See the [CLI Reference](#-cli-reference) for all options.

### Running Your Bot

After creating your project, navigate into the project directory and use the following commands.

To start your bot in development mode:

```bash
npx discraft dev
```

<details>
    <summary>Alternative Package Manager Commands</summary>
    <p>
        If you prefer to use other package managers, here are the equivalent commands:
        <br>
        <b>pnpm:</b>
        <pre><code>pnpm discraft dev</code></pre>
        <b>bun:</b>
        <pre><code>bunx discraft dev</code></pre>
        <b>yarn:</b>
        <pre><code>yarn discraft dev</code></pre>
    </p>
</details>

Or, if Discraft is installed globally:

```bash
discraft dev
```

To start your bot in production mode:

```bash
npx discraft start
```

<details>
    <summary>Alternative Package Manager Commands</summary>
    <p>
        If you prefer to use other package managers, here are the equivalent commands:
        <br>
        <b>pnpm:</b>
        <pre><code>pnpm discraft start</code></pre>
        <b>bun:</b>
        <pre><code>bunx discraft start</code></pre>
          <b>yarn:</b>
        <pre><code>yarn discraft start</code></pre>
    </p>
</details>

Or, if Discraft is installed globally:

```bash
discraft start
```

## ⚙️ Core Features

Discraft offers a range of features designed to make Discord bot development a breeze.

### Command System

Discraft uses the Discord.js API to create robust slash commands. Place your command files in the `commands` directory, and Discraft will automatically register them with Discord on bot startup.

Example command (`commands/ping.ts`):

```typescript
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName("ping").setDescription("Ping!"),

  async execute(data: { interaction: ChatInputCommandInteraction }) {
    const interaction = data.interaction;
    await interaction.reply("Pong!");
  },
};
```

Example long command (`commands/longcommand.ts`):

```typescript
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("longcommand")
    .setDescription("A command that takes some time and edits the reply."),

  async execute(data: { interaction: ChatInputCommandInteraction }) {
    const interaction = data.interaction;

    await interaction.deferReply();

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await interaction.editReply({ content: "Processing..." });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await interaction.editReply({ content: "Almost done..." });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await interaction.editReply({ content: "Done!" });
    await interaction.followUp({
      content: "Command Completed!",
      ephemeral: true,
    });
  },
};
```

### Event Handling

Discraft simplifies registering event handlers. Place your event files in the `events` directory, and Discraft will register them when the bot starts.

Example event handler (`events/ready.ts`):

```typescript
import { ActivityType, Client, Events } from "discord.js";
import { logger } from "../utils/logger";

export default {
  event: Events.ClientReady,
  handler: (client: Client) => {
    if (!client.user) {
      logger.error("Client user is not set.");
      return;
    }
    client.user.setPresence({
      activities: [
        {
          name: "Discraft",
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore Discord.js does not have this property, but it is valid
          state: "Created with Discraft",
          type: ActivityType.Custom,
        },
      ],
      status: "online",
    });
    logger.success("Client logged in.");
  },
};
```

### Hot Reloading

During development, Discraft supports hot reloading, meaning that your changes to command and event files will automatically restart your bot with the changes reflected. This allows for a more efficient and streamlined development process.

### Flexible Build Options

Discraft allows you to choose your preferred builder when building and running your application in development mode.

- `esbuild`: A fast and efficient JavaScript bundler.
- `bun`: A fast all-in-one toolkit for JavaScript and Typescript

## 💻 CLI Reference

Discraft provides a set of powerful CLI commands to manage your bot development.

### `discraft init`

Initializes a new Discraft project.

**Options:**

- `-d, --dir <directory>`: Specify the project directory (defaults to current directory).
- `-p, --package-manager <pm>`: Package manager to use (npm, yarn, pnpm, bun, or none).
- `--skip-install`: Skip dependency installation.

**Example:**

```bash
npx discraft init -d my-bot -p bun --skip-install
```

Or, if Discraft is installed globally:

```bash
discraft init -d my-bot -p bun --skip-install
```

### `discraft dev`

Starts the bot in development mode with hot reloading.

**Options:**

- `-b, --builder <builder>`: Specify the builder to use (esbuild or bun). Defaults to auto-detect.
- `-r, --runner <runner>`: Specify the runner to use (node or bun). Defaults to auto-detect.
- `-c, --clear-console`: Clear the console on each rebuild.

**Example:**

```bash
npx discraft dev -b esbuild -r bun -c
```

Or, if Discraft is installed globally:

```bash
discraft dev -b esbuild -r bun -c
```

### `discraft build`

Builds the bot for production.

**Options:**

- `-b, --builder <builder>`: Specify the builder to use (esbuild or bun). Defaults to auto-detect.

**Example:**

```bash
npx discraft build -b bun
```

Or, if Discraft is installed globally:

```bash
discraft build -b bun
```

### `discraft start`

Starts the bot in production mode.

**Options:**

- `-r, --runner <runner>`: Specify the runner to use (node or bun). Defaults to auto-detect.

**Example:**

```bash
npx discraft start -r node
```

Or, if Discraft is installed globally:

```bash
discraft start -r node
```

## 📁 Project Structure

A typical Discraft project is structured as follows:

```
my-discraft-bot/
├── .discraft/            # Internal Discraft files (auto-generated)
├── clients/             # Discord.js client setup
│   └── discord.ts       # Discord.js client configuration
├── commands/            # Your bot's command files
│   ├── ping.ts           # Example ping command
│   └── longcommand.ts     # Example long command
├── events/              # Event handlers
│   ├── error.ts          # Error handling
│   ├── messageCreate.ts  # Example message handler
│   └── ready.ts          # Client ready handler
├── utils/               # Utility functions
│   └── logger.ts        # Logging configuration
├── index.ts             # Main entry point for the bot
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── .env                 # Environment variables (e.g., bot token)
```

## 🛠️ Development

### Dependencies

Discraft relies on the following key dependencies:

- `discord.js`: A powerful JavaScript library for interacting with the Discord API.
- `commander`: A library for building command-line interfaces.
- `consola`: A modern console logger.
- `esbuild` or `bun`: Fast JavaScript bundlers.
- `dotenv`: To load environment variables.
- `chokidar`: File watcher.
- `fs-extra`: Extra file system methods.
- `glob`: File globbing.
- `inquirer`: Interactive CLI prompts.
- `kleur`: Colorful console output.
  - All of these are included as dependencies to discraft itself.

### Configuration

Store your bot's token and client ID in a `.env` file at the root of your project:

```
DISCORD_TOKEN=your_bot_token_here
DISCORD_APP_ID=your_client_id_here
```

### Commands and Events

- Command files are located in the `commands` directory. They export an object with `data` and `execute` properties.
- Event files are located in the `events` directory. They export an object with `event` and `handler` properties.

## 🧪 Beta Releases

Beta versions are available for testing new features. To install the latest beta:

```bash
npm install discraft@beta
```

## 🤝 Contributing

Contributions are welcome! Please visit the [GitHub repository](https://github.com/The-Best-Codes/discraft-js) to report issues or submit pull requests.

## 📜 License

This project is licensed under the [MIT License](LICENSE).

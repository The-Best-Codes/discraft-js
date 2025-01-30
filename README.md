<div align="center">
  <img alt="Discraft Logo" src="https://github.com/user-attachments/assets/144fc363-a914-4e3a-851b-4f9744818930" for="cover" width="120" />
  <h1>Discraft</h1>
</div>

[![npm version](https://img.shields.io/npm/v/discraft.svg)](https://www.npmjs.com/package/discraft)
[![npm downloads](https://img.shields.io/npm/dm/discraft.svg)](https://www.npmjs.com/package/discraft)
[![Discord Server](https://img.shields.io/discord/1170475897174896650)](https://discord.gg/dKeuR9yfBs)
[![CodeQL](https://github.com/The-Best-Codes/discraft-js/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/The-Best-Codes/discraft-js/actions/workflows/github-code-scanning/codeql)

Discraft is a modern, developer-friendly framework for building Discord bots with ease.
It provides a robust CLI and a set of tools to streamline the development process, allowing you to focus on creating amazing bot experiences.
Think of it as a "batteries-included" approach, letting you get started quickly and efficiently. It's like Next.js for Discord bots.

> **Note:** If you are viewing this documentation on npm, check out the [GitHub repository](https://github.com/The-Best-Codes/discraft-js) for more up-to-date documentation.

## Table of Contents

> **Looking for instructions on how to deploy to Vercel?** Check out the [Vercel Deployment Guide](https://dev.to/best_codes/make-a-free-ai-chatbot-with-discord-vercel-373l).

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
  - [`discraft vercel build`](#discraft-vercel-build)
- [🚀 Deploying to Vercel](#-deploying-to-vercel)
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

When installed globally, you can use the `discraft` command directly instead of `npx discraft`.

### Creating a New Project

To get started quickly, use the `discraft init` command:

```bash
npx discraft init
```

Or, if Discraft is installed globally:

```bash
discraft init
```

This will guide you through creating a new Discraft bot project, asking for details such as the project directory, package manager, and template.

**After initialization, you will need to copy the `.env.example` file to `.env` and then edit the `.env` file with your bot token and client ID.**

```
# From `Bot > Token` | https://discord.com/developers/applications
DISCORD_TOKEN=''
# From `General Information > App ID` | https://discord.com/developers/applications
DISCORD_APP_ID=''
```

You can also specify options directly:

```bash
npx discraft init -d my-bot-dir -p bun -t ts # Initialize a project in 'my-bot-dir' using bun and the typescript template
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

Discraft uses the Discord.js API to create robust slash commands, as well as message and user context menu commands. Place your command files in the `commands` directory, and Discraft will automatically register them with Discord on bot startup.

See [examples of commands here](https://github.com/The-Best-Codes/discraft-js/tree/main/templates/ts/commands).

### Event Handling

Discraft simplifies registering event handlers. Place your event files in the `events` directory, and Discraft will register them when the bot starts.

Example event handler (`events/ready.ts`, which will be registered when the bot starts):

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

See [examples of more events here](https://github.com/The-Best-Codes/discraft-js/tree/main/templates/ts/events).

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
- `-t, --template <template>`: Template to use (js, ts, or vercel-ts-ai). Defaults to prompt.

**Example:**

```bash
npx discraft init -d my-bot -p bun --skip-install -t ts
```

Or, if Discraft is installed globally:

```bash
discraft init -d my-bot -p bun --skip-install -t ts
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

### `discraft vercel build`

Builds the bot for deployment on Vercel. This command is a subcommand of `discraft vercel`.

**Options:**

- `-b, --builder <builder>`: Specify the builder to use (esbuild or bun). Defaults to auto-detect.

**Example:**

```bash
npx discraft vercel build -b bun
```

Or, if Discraft is installed globally:

```bash
discraft vercel build -b bun
```

## 🚀 Deploying to Vercel

**Check out the [Vercel Deployment Guide](https://dev.to/best_codes/make-a-free-ai-chatbot-with-discord-vercel-373l) for a more detailed, step-by-step guide.**

To deploy your Discraft bot to Vercel, follow these steps:

1. **Create a Vercel Project:** If you haven't already, create a new project in your Vercel dashboard. You can import your project from GitHub, GitLab or Bitbucket.
2. **Set Environment Variables:** In your Vercel project settings, go to "Environment Variables" and add the following variables:
   - `DISCORD_TOKEN`: Your Discord bot's token.
   - `DISCORD_APP_ID`: Your Discord application's ID.
   - **For AI templates:**
     - `GOOGLE_AI_API_KEY`: Your Google AI API key.
     - `GOOGLE_AI_MODEL`: The Google AI model you wish to use (e.g., `gemini-2.0-flash-exp`).
       You can find the project settings [here](https://vercel.com/dashboard).
3. **Run a Discraft Vercel Build**: In your project directory, run `npm run vercel-build` or `discraft vercel build` to create the API routes and files for your bot. This command prepares your bot for serverless deployment by generating the necessary API routes.
   <details>
        <summary>Alternative Package Manager Commands</summary>
        <p>
            If you prefer to use other package managers, here are the equivalent commands:
            <br>
             <b>pnpm:</b>
                <pre><code>pnpm discraft vercel build</code></pre>
             <b>bun:</b>
                <pre><code>bunx discraft vercel build</code></pre>
              <b>yarn:</b>
                <pre><code>yarn discraft vercel build</code></pre>
        </p>
    </details>
4. **Deploy:** You can deploy your bot to Vercel by running `npm run deploy` or using the `vercel` CLI. If using the CLI, you can run `vercel` and select the project you created. If you imported your project from a git repo, it should automatically deploy on commits. You can now set your bot's interactions endpoint to the `https://<your-project>.vercel.app/api` url.
   - To setup the interactions endpoint, please see the 'Discord Bot Setup' section of the Vercel + TypeScript + Google AI template [README](https://github.com/The-Best-Codes/discraft-js/blob/main/templates/vercel-ts-ai/README.md).

## 📁 Project Structure

A typical Discraft project is structured as follows:

```
my-discraft-bot/
├── .discraft/            # Internal Discraft files (auto-generated)
├── clients/             # Discord.js client setup
│   └── discord.ts       # Discord.js client configuration
├── commands/            # Your bot's command files
│   ├── ping.ts           # Example ping command
│   └── ...             # Other commands
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

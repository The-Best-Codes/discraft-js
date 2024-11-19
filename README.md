[![Publish to npm](https://github.com/The-Best-Codes/discraft-js/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/The-Best-Codes/discraft-js/actions/workflows/npm-publish.yml)
[![CodeQL](https://github.com/The-Best-Codes/discraft-js/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/The-Best-Codes/discraft-js/actions/workflows/github-code-scanning/codeql)
[![Dependabot Updates](https://github.com/The-Best-Codes/discraft-js/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/The-Best-Codes/discraft-js/actions/workflows/dependabot/dependabot-updates)
[![Discord Server](https://img.shields.io/discord/1170475897174896650)](https://discord.gg/dKeuR9yfBs)
[![npm version](https://img.shields.io/npm/v/discraft.svg)](https://www.npmjs.com/package/discraft)
[![npm downloads](https://img.shields.io/npm/dm/discraft.svg)](https://www.npmjs.com/package/discraft)

# Discraft

Discraft is a powerful framework for creating Discord bots, offering a robust CLI and a set of tools to streamline the development process.
Think of it like Next.js but for Discord bots.

## Features

- **Command Caching**: Built-in LRU cache system for commands with configurable TTL and memory limits
- **Multi-step Commands**: Support for commands that require follow-up responses or editing
- **Robust CLI**: Comprehensive command-line interface for development and deployment
- **Modern Build System**: Bundling with Rollup and Babel transformations
- **Hot Reload**: Automatic server restart on code changes during development

## Installation

You can install Discraft via npm:

```bash
npm install discraft --save-dev # Use this to install Discraft in the current project
npm install discraft -g # May require sudo, globally installs Discraft so you can use it from anywhere

# For beta releases
npm install discraft@beta # Install the latest beta version
```

## Usage

Discraft provides a CLI interface. You can use Discraft like this:

```bash
npx discraft [command]
# or
discraft [command]
```

### CLI Commands

- `discraft init`: Initialize a new Discraft project.
- `discraft dev`: Start the development server.
- `discraft build`: Build the project for production.
- `discraft start`: Start the production server.
- `discraft check-token`: Test your bot token and client ID.

## Project Structure

The project is organized into several directories:

- `src/commands`: Contains command files for the bot.
- `src/events`: Contains event handlers for the bot.
- `src/config`: Configuration files.
- `src/handlers`: Handlers for various bot functionalities.
- `src/services`: Services used by the bot. (Right now, just Discord)
- `src/utils`: Utility functions and helpers (including caching).

## Command Caching

Discraft includes a powerful command caching system to improve performance and reduce API calls:

```javascript
import { SlashCommandBuilder } from "discord.js";
import { commandCache } from "../utils/commandCache.js";

// Set command-specific cache settings
commandCache.setCommandSettings("ping", {
  ttl: 5000, // Cache ping results for 5 seconds
});

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong"),
  cacheable: true,
  async execute(interaction) {
    const response = `Pong! Latency: ${Math.round(
      interaction.client.ws.ping
    )}ms`;
    await interaction.reply(response);
    return { content: response }; // Return in a format that can be used by interaction.reply()
  },
};
```

The caching system supports both simple responses and multi-step interactions. For multi-step commands, you can return an array of steps:

```javascript
export default {
  data: new SlashCommandBuilder()
    .setName("complex-status")
    .setDescription("Complex status check with updates"),
  cacheable: true,
  execute: async (interaction) => {
    return {
      steps: [
        { content: "Initial response..." },
        { type: "edit", content: "Updated status..." },
        { type: "followUp", content: "Additional info..." },
      ],
    };
  },
};
```

The cache system automatically handles:

- Storing command results based on command name and options
- Multi-step responses with edits and follow-ups
- Command-specific TTL (Time To Live) settings
- LRU (Least Recently Used) eviction strategy
- Memory management

## Development

To start the development server, use the following command:

```bash
discraft dev
```

This will watch for changes in the `src` directory and automatically restart the server.

## Build

To build the project for production, use the following command:

```bash
discraft build
```

This will bundle the source files using Rollup and apply Babel transformations. The output will be placed in the `dist` directory.

## Production

To start the bot in production mode, use the following command:

```bash
discraft start
```

Ensure that you have built the project before starting it in production mode.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your bot token:

   ```
   BOT_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   ```

3. Start development:
   ```bash
   discraft dev
   ```

## Beta Releases

Beta versions are available for testing new features. To install the latest beta:

```bash
npm install discraft@beta
```

## Contributing

Contributions are welcome! Please visit the [GitHub repository](https://github.com/The-Best-Codes/discraft-js) to report issues or submit pull requests.

## License

This project is licensed under the GNU General Public License 3.0.

[![Publish to npm](https://github.com/The-Best-Codes/discraft-js/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/The-Best-Codes/discraft-js/actions/workflows/npm-publish.yml)
[![CodeQL](https://github.com/The-Best-Codes/discraft-js/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/The-Best-Codes/discraft-js/actions/workflows/github-code-scanning/codeql)
[![Dependabot Updates](https://github.com/The-Best-Codes/discraft-js/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/The-Best-Codes/discraft-js/actions/workflows/dependabot/dependabot-updates)

# Discraft

Discraft is a powerful framework for creating Discord bots, offering a robust CLI and a set of tools to streamline the development process.
Think of it like Next.js but for Discord bots.

## Installation

You can intsall Discraft via npm:

```bash
npm install discraft --save-dev # Use this to install Discraft in the current project
npm install discraft -g # May require sudo, globally installs Discraft so you can use it from anywhere
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

## Project Structure

The project is organized into several directories:

- `src/commands`: Contains command files for the bot.
- `src/events`: Contains event handlers for the bot.
- `src/config`: Configuration files.
- `src/handlers`: Handlers for various bot functionalities.
- `src/services`: Services used by the bot. (Right now, just Discord)
- `src/utils`: Utility functions.

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
   TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   ```

3. Start development:
   ```bash
   discraft dev
   ```

## Contributing

Contributions are welcome! Please visit the [GitHub repository](https://github.com/The-Best-Codes/discraft-js) to report issues or submit pull requests.

## License

This project is licensed under the GNU General Public License 3.0.

export const initialFiles = {
  ".env": {
    file: {
      contents: "",
    },
  },
  "package.json": {
    file: {
      contents: `{
  "name": "webcontainer-app",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "dotenv": "^16.3.1"
  }
}`.trim(),
    },
  },
  "index.js": {
    file: {
      contents: `import chalk from 'chalk';
// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

console.log(chalk.green('Hello from WebContainer!'));
console.log(chalk.blue('Current environment variables:'));

// Print all environment variables
for (const [key, value] of Object.entries(process.env)) {
  console.log(chalk.yellow(key) + '=' + chalk.white(value));
}

console.log(chalk.yellow('\\nThe process will exit in 10 minutes.'));
await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
console.log("Bye!");
`.trim(),
    },
  },
};

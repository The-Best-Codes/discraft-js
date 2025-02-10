export const initialFiles = {
  ".env": {
    file: {
      contents: "",
    },
  },
  "package.json": {
    file: {
      contents: `{\n  \"name\": \"webcontainer-app\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"start\": \"node index.js\"\n  },\n  \"dependencies\": {\n    \"chalk\": \"^5.3.0\",\n    \"dotenv\": \"^16.3.1\"\n  }\n}`,
    },
  },
  "index.js": {
    file: {
      contents: `import chalk from 'chalk';\n// Load environment variables from .env file\nimport dotenv from 'dotenv';\ndotenv.config();\n\nconsole.log(chalk.green('Hello from WebContainer!'));\nconsole.log(chalk.blue('Current environment variables:'));\n\n// Print all environment variables\nfor (const [key, value] of Object.entries(process.env)) {\n  console.log(chalk.yellow(key) + '=' + chalk.white(value));\n}\n\nconsole.log(chalk.yellow('\\nThe process will exit in 1 minute.'));\nawait new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000));\nconsole.log(\"Bye!\");`,
    },
  },
};

export const initialFiles = {
  "package.json": {
    file: {
      contents: `{
  "name": "webcontainer-app",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "chalk": "^5.3.0"
  }
}`.trim(),
    },
  },
  "index.js": {
    file: {
      contents: `import chalk from 'chalk';
console.log(chalk.green('Hello from WebContainer!'));
`.trim(),
    },
  },
};

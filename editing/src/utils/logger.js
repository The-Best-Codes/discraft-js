import { logLevel } from '../../src/config/bot.config.js';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m',
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m',
  },
};

export const log = (message, ...args) => {
  console.log(`${colors.bg.white}[LOG]${colors.reset} ${message}`, ...args);
};

export const info = (message, ...args) => {
  console.info(`${colors.fg.blue}[INFO]${colors.reset} ${message}`, ...args);
};

export const warn = (message, ...args) => {
  console.warn(`${colors.bg.yellow}[WARN]${colors.reset} ${message}`, ...args);
};

export const error = (message, ...args) => {
  console.error(`${colors.bg.red}[ERROR]${colors.reset} ${message}`, ...args);
};

export const trace = (message, ...args) => {
  console.trace(
    `${colors.fg.crimson}[TRACE]${colors.reset} ${message}`,
    ...args,
  );
};

export const success = (message, ...args) => {
  console.log(`${colors.bg.green}[SUCCESS]${colors.reset} ${message}`, ...args);
};

export const debug = (message, ...args) => {
  if (logLevel !== 'debug') return;
  console.debug(`${colors.fg.cyan}[DEBUG]${colors.reset} ${message}`, ...args);
};

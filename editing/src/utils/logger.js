import consola from "consola";
import { logLevel } from "../../src/config/bot.config.js";

export const log = consola.log;
export const info = consola.info;
export const warn = consola.warn;
export const error = consola.error;
export const trace = consola.trace;
export const success = consola.success;

export const debug = (message, ...args) => {
  if (logLevel !== "debug") return;
  consola.debug(message, ...args);
};

/**
 * Wrapper for winston logging library.
 * @module services/logging
 */
import { Chalk } from "chalk";
import { debug } from "../../config/config.js";
import logger from "./services/winston.js";

// @ts-ignore
const chalk = new Chalk({ level: 3 });

/**
 * Wrapper object for winston logging library.
 * @typedef {object} Logger
 * @property {Function} success - Log success message.
 * @property {Function} error - Log error message.
 * @property {Function} warn - Log warning message.
 * @property {Function} notice - Log notice message.
 * @property {Function} info - Log info message.
 * @property {Function} progress - Log progress message.
 * @property {Function} debug - Log debug message.
 */
export default {
  /**
   * Logs a success message to the console in green color.
   * @param {string} msg - The message.
   * @returns {Promise<void>} Promise resolved.
   */
  success(msg) {
    return new Promise((resolve) =>
      resolve(logger.success(chalk.green.bold(msg)))
    );
  },

  /**
   * Logs an error message to the console in red color.
   * @param {string} msg - The message.
   * @param {any} args - Additional arguments.
   * @returns {Promise<Logger>} Promise resolved.
   */
  error(msg, ...args) {
    return new Promise((resolve) => {
      resolve(logger.error(chalk.red(msg), ...args));
    });
  },

  /**
   * Logs a warning message to the console in yellow color.
   * @param {string} msg - The message.
   * @returns {Promise<Logger>} Promise resolved.
   */
  warn(msg) {
    return new Promise((resolve) => {
      resolve(logger.warn(chalk.yellow.bold(`[WARN] ${msg}`)));
    });
  },

  /**
   * Logs a highlighted message to the console.
   * @param {string} msg - The message.
   * @returns {Promise<Logger>} Promise resolved.
   */
  notice(msg) {
    return new Promise((resolve) => {
      resolve(logger.notice(chalk.blue(msg)));
    });
  },

  /**
   * Logs a message to the console.
   * @param {string} msg - The message.
   * @returns {Promise<Logger>} Promise resolved.
   */
  info(msg) {
    return new Promise((resolve) => {
      resolve(logger.info(chalk.grey(msg)));
    });
  },

  /**
   * Logs a progress message to the console.
   * @param {string} msg - The message.
   * @returns {Promise<Logger>} Promise resolved.
   */
  progress(msg) {
    return new Promise((resolve) => {
      resolve(logger.progress(chalk.hex("#333311").italic(msg)));
    });
  },

  /**
   * Logs a debug message to the console if debugging is enabled.
   * @param {any} args - Arguments to send to console.debug().
   */
  debug(...args) {
    if (!debug) return;

    // Get first argument
    const firstArg = args.shift();

    // If first argument is not a string or number, print it as is and the rest as separate arguments
    if (typeof firstArg !== "string" && typeof firstArg !== "number") {
      console.debug(chalk.black.italic(`[DEBUG]`), firstArg, ...args);
      return;
    }

    // If first argument is a string or number, colorize it as well
    console.debug(chalk.black.dim(`[DEBUG] ${firstArg}`), ...args);
  },
};

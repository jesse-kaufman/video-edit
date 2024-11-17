/**
 * @file Wrapper for winston logging library.
 * @module services/logging
 */
import { Chalk } from "chalk";
import { debug } from "../../config/config.js";

// @ts-ignore
const chalk = new Chalk({ level: 3 });

/**
 * Logging module for console messages.
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
      resolve(console.log(chalk.greenBright.bold(msg)))
    );
  },

  /**
   * Logs an error message to the console in red color.
   * @param {string} msg - The message.
   * @param {any} args - Additional arguments.
   * @returns {Promise<void>} Promise resolved.
   */
  error(msg, ...args) {
    return new Promise((resolve) => {
      resolve(console.error(chalk.red(msg), ...args));
    });
  },

  /**
   * Logs a warning message to the console in yellow color.
   * @param {string} msg - The message.
   * @returns {Promise<void>} Promise resolved.
   */
  warn(msg) {
    return new Promise((resolve) => {
      resolve(console.log(chalk.yellow.bold(`[WARN] ${msg}`)));
    });
  },

  /**
   * Logs a highlighted message to the console.
   * @param {string} msg - The message.
   * @returns {Promise<void>} Promise resolved.
   */
  notice(msg) {
    return new Promise((resolve) => {
      resolve(console.log(chalk.blue(msg)));
    });
  },

  /**
   * Logs a message to the console.
   * @param {string} msg - The message.
   * @returns {Promise<void>} Promise resolved.
   */
  info(msg) {
    return new Promise((resolve) => {
      resolve(console.log(msg));
    });
  },

  /**
   * Logs a progress message to the console.
   * @param {string} msg - The message.
   * @param {boolean} isExtract - True if progress message is for extract process.
   * @returns {Promise<void>} Promise resolved.
   */
  progress(msg, isExtract = false) {
    // Colorize extract progress messages differently
    const colorize = isExtract
      ? chalk.dim.italic.green
      : chalk.dim.italic.yellow;

    return new Promise((resolve) => {
      // Log message and resolve promise
      resolve(console.log(colorize(msg)));
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

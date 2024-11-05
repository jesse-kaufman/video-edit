/**
 * Wrapper for winston logging library.
 * @module services/logging
 */

import { debug } from "../../config/config.js";
import logger from "./services/winston.js";

/**
 * Wrapper object for winston logging library.
 * @typedef {object} Logger
 * @property {Function} success - Log success message.
 * @property {Function} error - Log error message.
 * @property {Function} warning - Log warning message.
 * @property {Function} notice - Log notice message.
 * @property {Function} info - Log info message.
 * @property {Function} debug - Log debug message.
 */
export default {
  /**
   * Logs a success message to the console in green color.
   * @param {string} msg - The message.
   * @returns {Promise<void>} Promise resolved.
   */
  success(msg) {
    return new Promise((resolve) => {
      resolve(logger.success(msg));
    });
  },

  /**
   * Logs an error message to the console in red color.
   * @param {string} msg - The message.
   * @param {any} args - Additional arguments.
   * @returns {Promise<Logger>} Promise resolved.
   */
  error(msg, ...args) {
    return new Promise((resolve) => {
      resolve(logger.error(msg, ...args));
    });
  },

  /**
   * Logs a warning message to the console in yellow color.
   * @param {string} msg - The message.
   * @param {any} args - Additional arguments.
   * @returns {Promise<Logger>} Promise resolved.
   */
  warn(msg, ...args) {
    return new Promise((resolve) => {
      resolve(logger.warn(msg, ...args));
    });
  },

  /**
   * Logs a highlighted message to the console.
   * @param {string} msg - The message.
   * @param {any} args - Additional arguments.
   * @returns {Promise<Logger>} Promise resolved.
   */
  notice(msg, ...args) {
    return new Promise((resolve) => {
      resolve(logger.notice(msg, ...args));
    });
  },

  /**
   * Logs a message to the console.
   * @param {string} msg - The message.
   * @param {any} args - Additional arguments.
   * @returns {Promise<Logger>} Promise resolved.
   */
  info(msg, ...args) {
    return new Promise((resolve) => {
      resolve(logger.info(msg, ...args));
    });
  },

  /**
   * Logs a debug message to the console if debugging is enabled.
   * @param {string} msg - The message.
   * @param {any} args - Additional arguments.
   * @returns {Promise<Logger>} Promise resolved.
   */
  debug(msg, ...args) {
    return new Promise((resolve) => {
      if (debug) logger.debug(`${msg}`, ...args);
      resolve(logger);
    });
  },
};

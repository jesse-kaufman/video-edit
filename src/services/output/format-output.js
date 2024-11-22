/**
 * @file Helper functions to format strings for output.
 */

import chalk from "chalk"

/**
 * Adds colon to string.
 * @param {string} txt - String to be modified.
 * @returns {string} Formatted string.
 */
export const addColon = (txt) => `${txt}:`

/**
 * Formats the stream title with optional padding and styling.
 * @param {string} title - The title of the stream to be formatted.
 * @returns {string} The formatted stream title with added padding (if applicable) and chalk styling.
 */
export const formatStreamTitle = (title) =>
  chalk.black.italic(`\n     • ${title || "(no title)"}`)

/**
 * Formats a stream label.
 * @param {string} label - Label text to be formatted.
 * @param {boolean} needsAttention - True if stream is the wrong language/codec.
 * @returns {string} Formatted stream label string.
 */
export const formatStreamLabel = (label, needsAttention) =>
  needsAttention ? chalk.red(addColon(label)) : chalk.green(addColon(label))

/**
 * Formats a label.
 * @param {string} label - Label text to be formatted.
 * @returns {string} Formatted label string.
 */
export const formatLabel = (label) => chalk.magenta.yellow(addColon(label))

/**
 * Formats a data item.
 * @param {string} data - Text to be formatted.
 * @param {boolean} needsAttention - True if stream needs attention.
 * @returns {string} Formatted label string.
 */
export const formatData = (data, needsAttention = false) =>
  needsAttention ? chalk.red.italic(data) : chalk.green.italic(data)

/**
 * Prints data item with label and data string.
 * @param {string} label - Label to be formatted.
 * @param {string} data - Data to be formatted.
 * @param {boolean} needsAttention - True if stream needs attention.
 * @returns {string} Formatted label string.
 */
export const formatDataItem = (label, data, needsAttention = false) =>
  `${formatLabel(label)} ${formatData(data, needsAttention)}`

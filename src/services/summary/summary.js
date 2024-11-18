/**
 * @file Summary service.
 */

/**
 * @typedef {object} Logger
 * @property {Function} success - Log success message.
 * @property {Function} error - Log error message.
 * @property {Function} warning - Log warning message.
 * @property {Function} notice - Log notice message.
 * @property {Function} info - Log info message.
 * @property {Function} debug - Log debug message.
 */

/**
 * Prints a summary of information about the completed conversion process.
 * @param {Logger} log - Logging object.
 */
export default (log) => {
  log.info("")
  log.info("================================================================")
  log.notice(` Summary for ${process.argv[process.argv.length - 1]}:`)
  log.info("================================================================")
  log.info("================================================================")
}

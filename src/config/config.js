/**
 * @file Configuration.
 */

/** Whether or not to print debug messages to stdout. */
export const debug = process.env.DEBUG || false

/** True to print all the output from FFMPEG. */
export const extraDebug = process.env.EXTRA_DEBUG || false

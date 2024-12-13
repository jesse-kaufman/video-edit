/**
 * @file Configuration.
 */

/** Whether or not to print debug messages to stdout. */
export const debug = process.env.DEBUG || false

/** True to print all the output from FFMPEG. */
export const extraDebug = process.env.EXTRA_DEBUG || false

/** Format to use for the container when saving a file. */
export const outputContainerFormat = "matroska"

/** Extension to use when saving a file. */
export const outputFileExt = "mkv"
/** Audio codec to use when converting audio stream. */
export const outputAudioCodec = "aac"

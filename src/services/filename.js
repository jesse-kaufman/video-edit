/**
 * @file Filename service.
 * @typedef {import("../@types/streams.js").SubtitleStream} SubtitleStream
 */

import path from "node:path"

/**
 * Generates output filename for command.
 * @param {string} inputFile - Full path to input file.
 * @param {string} command - Command to generate output filename.
 * @returns {string} Full path to output file.
 */
export const getOutputFilename = (inputFile, command) => {
  /** Directory where input file is located. */
  const dir = path.dirname(inputFile)
  /** Base filename of input file. */
  const basename = path.basename(inputFile, path.extname(inputFile))

  return path.join(dir, `${basename}-${command}.mkv`)
}

/**
 * Gets the output file based on the specified input file and stream.
 * @param {string} inputFile - The name of the input file.
 * @param {SubtitleStream} stream - The subtitle stream being extracted.
 * @param {number} streamCount - The number of streams to be extracted.
 * @returns {string} The output file.
 */
export const getSubFilename = (inputFile, stream, streamCount) => {
  // Set base output file path to the input file path minus the extension
  let outputFile = path.join(
    path.dirname(inputFile),
    path.basename(inputFile, path.extname(inputFile))
  )

  // If there are multiple streams, append title (if set) or index to the output file name
  if (streamCount > 1 && stream.index !== 0) {
    outputFile += `.${stream.title || stream.index}`
  }

  // Append ".eng.srt" to the output file name
  return `${outputFile}.${stream.lang}.srt`
}

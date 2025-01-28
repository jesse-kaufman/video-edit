/**
 * @file Filename service.
 * @typedef {import("../@types/streams.js").SubtitleStream} SubtitleStream
 */

import path from "node:path"
import { outputFileExt } from "../config/config.js"

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

  return path.join(dir, `${basename}_${command}.${outputFileExt}`)
}

/**
 * Gets the output file based on the specified input file and stream.
 * @param {string} inputFile - The name of the input file.
 * @param {SubtitleStream} stream - The subtitle stream being extracted.
 * @param {number} streamCount - The number of streams to be extracted.
 * @returns {string} The output file.
 */
export const getSubFilename = (inputFile, stream, streamCount) => {
  // Default to srt for filename extension
  let ext = "srt"

  // Set base output file path to the input file path minus the extension
  const outputFile = path.join(
    path.dirname(inputFile),
    path.basename(inputFile, path.extname(inputFile))
  )

  // Get label for subtitle filename, if applicable
  const label = getSubtitleStreamLabel(stream, streamCount)

  // Use .ass for ASS subtitles
  if (stream.codecName === "ass") ext = "ass"

  // Return full filename for subtitle extract
  return `${outputFile}.${stream.lang}${label}.${ext}`
}

/**
 * Gets label for subtitle filename, if applicable.
 * @param {SubtitleStream} stream - Subtitle stream being extracted.
 * @param {number} streamCount - Total number of streams to be extracted.
 * @returns {string} The label for the subtitle filename.
 */
function getSubtitleStreamLabel(stream, streamCount) {
  // If only one stream, don't add a label
  if (streamCount === 1) return ""

  // Default label to title if set, otherwise empty string
  let label = stream?.title || ""

  // Mark the first incoming stream as default
  if (stream.index === 0) label = "default"

  // Make "SDH" lowercase and fix invalid characters
  label = label
    .replace("SDH", "sdh")
    .replace(/\//g, " - ")
    .replace("[", "(")
    .replace("]", ")")

  // Use label if set, otherwise fall back to stream index
  return `.${label || stream.index}`
}

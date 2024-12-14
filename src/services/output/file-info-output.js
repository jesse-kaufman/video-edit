/**
 * @file File info output service.
 * @typedef {import("../ffprobe.js").FileInfo} FileInfo
 * @typedef {import("../logger.js").Logger} Logger
 * @typedef {import("../../@types/streams.js").AudioStream} AudioStream
 * @typedef {import("../../@types/streams.js").SubtitleStream} SubtitleStream
 */

import path from "node:path"
import bytes from "bytes"
import { outputVideoCodec } from "../../config/config.js"
import { streamNeedsAttention, containerNeedsAttention } from "../check-file.js"
import {
  formatLabel,
  formatStreamLabel,
  formatStreamTitle,
  formatDataItem,
} from "./format-output.js"

/**
 * Prints input file information to console.
 * @param {import("../logger.js").Logger} log - Logger instance.
 * @param {string} file - Full path to input file.
 * @param {number} size - File size in bytes.
 * @param {import("../../@types/streams.js").Streams} streams - Information to print.
 */
export const printInputFileInfo = (log, file, size, streams) => {
  log.notice("================================")
  log.notice("Input file info:")
  log.notice("--------------------------------")
  printInfo(log, "input", file, size, streams)
  log.notice("================================")
}

/**
 * Prints output file information to console.
 * @param {import("../logger.js").Logger} log - Logger instance.
 * @param {string} file - Full path to output file.
 * @param {number} size - File size in bytes.
 * @param {import("../../@types/streams.js").Streams} streams - Information to print.
 */
export const printOutputFileInfo = (log, file, size, streams) => {
  log.notice("================================")
  log.notice("Output file info:")
  log.notice("--------------------------------")
  printInfo(log, "output", file, size, streams)
  log.notice("================================")
}

/**
 * Prints file information to console.
 * @param {import("../logger.js").Logger} log - Logger instance.
 * @param {string} displayType - Type of file info display (input or output).
 * @param {string} file - Full path to input file.
 * @param {number} size - File size in bytes.
 * @param {import("../../@types/streams.js").Streams} streams - Information to print.
 */
function printInfo(log, displayType, file, size, streams) {
  const { video, audio, subtitle } = streams
  const container = path.extname(file).replace(".", "").toUpperCase()
  const fileSize = bytes(size)?.toString() || "?"

  // Print filename
  log.info(file)

  // Print container information
  printInfoItem(log, "Container", container, containerNeedsAttention(container))

  // Print file size
  printInfoItem(log, "File Size", fileSize)

  // Print video stream information
  printInfoItem(
    log,
    "Video",
    `${video[0].formattedCodecName} (${video[0].resolution} @ ${video[0].fps}FPS)`,
    video[0].codecName !== outputVideoCodec
  )

  // Print audio stream information
  printInfoItem(log, `Audio (${audio.length} streams)`, "")
  audio.forEach((stream) => printStreamInfo(log, stream, "audio", displayType))

  // Print subtitle stream information
  if (subtitle.length > 0) {
    log.info(formatLabel(`Subtitles (${subtitle.length} streams)`))
    subtitle.forEach((stream) => {
      printStreamInfo(log, stream, "subtitle", displayType)
    })
  }
}

/**
 * Prints information about a single stream to the console.
 * @param {import("../logger.js").Logger} log - Logger instance used for outputting information.
 * @param {(AudioStream|SubtitleStream)} stream - Stream object containing details to be printed.
 * @param {string} type - Type of stream (audio or subtitle).
 * @param {string} displayType - Type of display (input or output).
 */
function printStreamInfo(log, stream, type, displayType) {
  const { index, codecName, formattedCodecName, lang, title, origTitle } =
    stream

  // Setup base array of details
  const details = [lang, formattedCodecName]

  // @ts-ignore If stream is audio, add channel layout information
  if (stream?.channelLayout) details.push(stream.channelLayout)

  // Get formatted stream label
  const streamLabel = formatStreamLabel(
    `#${index} [${details.join(", ")}]`,
    streamNeedsAttention(lang, codecName, type)
  )

  const streamTitle = displayType === "input" ? origTitle : title

  // Print formatted stream info
  log.info(`  ${streamLabel} ${formatStreamTitle(`${streamTitle}`)}`)
}

/**
 * Prints data item with label and data string.
 * @param {Logger} log - Logger instance.
 * @param {string} label - Label to be formatted.
 * @param {string} data - Data to be formatted.
 * @param {boolean} needsAttention - True if stream needs attention.
 */
function printInfoItem(log, label, data, needsAttention = false) {
  log.info(formatDataItem(label, data, needsAttention))
}

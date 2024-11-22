/**
 * @file File info output service.
 * @typedef {import("../ffprobe.js").FileInfo} FileInfo
 * @typedef {import("../../@types/streams.js").AudioStream} AudioStream
 * @typedef {import("../../@types/streams.js").SubtitleStream} SubtitleStream
 */

import path from "node:path"
import bytes from "bytes"
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
  log.notice("--------------------------------")
  log.notice("Input file info:")
  log.notice("--------------------------------")
  printInfo(log, file, size, streams)
}

/**
 * Prints output file information to console.
 * @param {import("../logger.js").Logger} log - Logger instance.
 * @param {string} file - Full path to output file.
 * @param {number} size - File size in bytes.
 * @param {import("../../@types/streams.js").Streams} streams - Information to print.
 */
export const printOutputFileInfo = (log, file, size, streams) => {
  log.info("--------------------------------")
  log.notice("Output file info:")
  log.info("--------------------------------")
  printInfo(log, file, size, streams)
}

/**
 * Prints file information to console.
 * @param {import("../logger.js").Logger} log - Logger instance.
 * @param {string} file - Full path to input file.
 * @param {number} size - File size in bytes.
 * @param {import("../../@types/streams.js").Streams} streams - Information to print.
 */
function printInfo(log, file, size, streams) {
  const { video, audio, subtitle } = streams
  const container = path.extname(file).replace(".", "").toUpperCase()
  const fileSize = bytes(size).toString()

  // Print filename
  log.info(file)

  // Print container information
  log.info(
    formatDataItem("Container", container, containerNeedsAttention(container))
  )

  // Print file size
  log.info(formatDataItem("File Size", fileSize))

  // Print video stream information
  log.info(
    formatDataItem(
      "Video",
      `${video[0].formattedCodecName} @ ${video[0].fps}FPS`,
      video[0].formattedCodecName !== "H.265"
    )
  )

  // Print audio stream information
  log.info(formatLabel(`Audio (${audio.length} streams)`))
  audio.forEach((stream) => {
    printStreamInfo(log, stream, "audio")
  })

  // Print subtitle stream information
  if (subtitle.length > 0) {
    log.info(formatLabel(`Subtitles (${subtitle.length} streams)`))
    subtitle.forEach((stream) => {
      printStreamInfo(log, stream, "subtitle")
    })
  }
}

/**
 * Prints information about a single stream to the console.
 * @param {import("../logger.js").Logger} log - Logger instance used for outputting information.
 * @param {AudioStream|SubtitleStream} stream - Stream object containing details to be printed.
 * @param {string} type - Type of stream (audio or subtitle).
 */
function printStreamInfo(log, stream, type) {
  const { index, codecName, formattedCodecName, lang, title } = stream

  // Setup base array of details
  const details = [lang, formattedCodecName]

  // @ts-ignore If stream is audio, add channel layout information
  if (stream?.channelLayout) details.push(stream.channelLayout)

  // Get formatted stream label
  const streamLabel = formatStreamLabel(
    `#${index} [${details.join(", ")}]`,
    streamNeedsAttention(lang, codecName, type)
  )

  // Print formatted stream info
  log.info(`  ${streamLabel} ${formatStreamTitle(`${title}`)}`)
}

/**
 * @file Ffprobe service.
 * @typedef {import("../@types/convert-opts.js").ConvertOpts} ConvertOpts
 * @typedef {import("../@types/streams.js").Streams} Streams
 */

/**
 * @typedef FileInfo
 * @property {Streams} streams - Streams in video file.
 * @property {number} size - File size in bytes.
 */

import fs from "node:fs"
import { promisify } from "node:util"
import ffprobe from "ffprobe"
import { getInputStreams } from "./stream/stream.js"
import log from "./logger.js"

/**
 * Gets file size in bytes.
 * @param {string} file - Full path to input file.
 * @returns {Promise<number>} File size in bytes.
 */
export const getFileSize = async (file) => {
  const statAsync = promisify(fs.stat)
  const stats = await statAsync(file)
  return stats.size
}

/**
 * Gets stream info from input file using ffmpeg.
 * @param {string} inputFile - Full path to input file.
 * @returns {Promise<FileInfo>} Input file info.
 */
export const getFileInfo = async (inputFile) => {
  const opts = { path: "/usr/local/bin/ffprobe" }

  // Use ffprobe to get streams from the input file
  const streams = await ffprobe(inputFile, opts)
    .then((info) => getInputStreams(info.streams))
    .catch((err) => log.fail(err))

  // Get file size in bytes
  const size = await getFileSize(inputFile)

  return { streams, size }
}

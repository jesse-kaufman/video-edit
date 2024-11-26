/**
 * @file FFMPEG service.
 * @module services/ffmpeg
 * @typedef {import('fluent-ffmpeg').FfmpegCommand} FfmpegCommand
 * @typedef {import('../@types/convert-opts.js').ConvertOpts} ConvertOpts
 * @typedef {import('../@types/streams.js').Streams} Streams
 * @typedef {import('../@types/streams.js').SubtitleStream} SubtitleStream
 */

import fluentFfmpeg from "fluent-ffmpeg"
import { extraDebug, outputContainerFormat } from "../config/config.js"
import { getFileInfo } from "./ffprobe.js"
import log from "./logger.js"
import { mapStreams } from "./stream/stream.js"
import { printProgress } from "./output/progress-output.js"
import { getTextSubtitles } from "./stream/subtitle-stream.js"
import { getSubFilename } from "./filename.js"
import { printInputFileInfo } from "./output/file-info-output.js"

/** Class that acts as a wrapper for fluent-ffmpeg. */
class Ffmpeg {
  /** Full path to the input file. */
  inputFile
  /** Full path to the output file. */
  outputFile
  /** Conversion options. */
  convertOpts

  /** Input file size in bytes. */
  inputFileSize = 0

  /** @type {Streams} Input file stream data.*/
  inputStreams = { audio: [], video: [], subtitle: [] }

  /** @type {Streams} Output file stream data. */
  outputStreams = { audio: [], video: [], subtitle: [] }

  /**
   * Creates a new VideoEdit object.
   * @param {string} inputFile - The name of the input file.
   * @param {string} outputFile - The name of the output file.
   * @param {ConvertOpts} convertOpts - Conversion options.
   */
  constructor(inputFile, outputFile, convertOpts = {}) {
    // Set conversion options
    this.convertOpts = convertOpts
    // Set input file property
    this.inputFile = inputFile
    // Set output file property
    this.outputFile = outputFile

    return this
  }

  /**
   * Initializes inputStreams property.
   * @returns {Promise<Ffmpeg>} Promise resolves to VideoEdit instance.
   */
  async init() {
    // Read input file info
    const info = await getFileInfo(this.inputFile)
    // Set input streams from info
    this.inputStreams = info.streams
    // Set input file size
    this.inputFileSize = info.size

    if (this.inputStreams.audio.length === 0) {
      log.error("No audio streams mapped.")
    }

    // Return instance
    return this
  }

  /**
   * Sets base options for ffmpeg command.
   * @param {FfmpegCommand} ffmpeg - Fluent ffmpeg object.
   */
  setCommonOptions(ffmpeg) {
    ffmpeg
      // Hide output except progress stats
      .outputOptions("-hide_banner")
      .outputOptions(`-f ${outputContainerFormat}`)
      // Output command on start
      .on("start", (command) => log.debug(command))
      .on("stderr", (err) => {
        if (extraDebug) log.debug(err)
      })
  }

  /**
   * Extracts text-based English subtitles from the video file.
   * @param {boolean} exitIfNotFound - Whether to exit the program if no matching subtitles are found.
   */
  extractSubs(exitIfNotFound) {
    log.notice("Extracting text subtitles ...")

    // Get all text-based subtitle streams from the video file
    const textSubs = getTextSubtitles(this.inputStreams.subtitle)

    // If no English subtitles were found, exit the program
    if (textSubs.length === 0) {
      const msg = `No text English subtitles were found in the video file.`
      if (exitIfNotFound) {
        log.error(msg)
        process.exit(1)
      }
      // Log warning if not exiting
      log.warn(msg)
    }

    // Walk through subtitle streams and extract all simultaneously
    for (const stream of textSubs) {
      this.runExtract(this.inputFile, stream, stream.index)
    }
  }

  /**
   * Extracts subtitle(s) from specified input file.
   * @param {string} inputFilePath - Path to input file.
   * @param {SubtitleStream} stream - Stream being extracted.
   * @param {number} streamCount - Total number of text streams.
   */
  async runExtract(inputFilePath, stream, streamCount) {
    // Get the subtitle file path
    const outputFile = getSubFilename(inputFilePath, stream, streamCount)

    await new Promise((resolve, reject) => {
      const { fps } = this.inputStreams.video[0]
      const { index } = stream

      const ffmpegExtract = fluentFfmpeg(this.inputFile)
      this.setCommonOptions(ffmpegExtract)

      // Extract subtitle using ffmpeg
      ffmpegExtract
        // Map subtitle
        .outputOptions([`-map 0:s:${index}`, "-scodec srt"])
        // Print progress message
        .on("progress", (progress) => printProgress(log, progress, fps, index))
        // Handle errors
        .on("error", (err) => reject(console.error(err)))
        // Output message on success
        .on("end", () =>
          resolve(log.success("Subtitle extracted successfully!"))
        )
        // Save the subtitle to the output file
        .save(outputFile)
    })
  }

  /**
   * Runs the ffmpeg command.
   */
  async run() {
    const { fps } = this.inputStreams.video[0]
    const ffmpegProcess = fluentFfmpeg(this.inputFile)

    // Set common options
    this.setCommonOptions(ffmpegProcess)
    // Map streams
    await mapStreams(ffmpegProcess, this.inputStreams, this.convertOpts)

    // Wrap ffmpeg call in promise
    await new Promise((resolve, reject) => {
      ffmpegProcess
        // Set global language
        .outputOptions([`-metadata`, `language=eng`])
        // Output message on progress
        .on("progress", (progress) => printProgress(log, progress, fps))
        // Handle errors
        .on("error", (err) => reject(console.error(err)))
        // Output message on success
        .on("end", () => resolve(log.success("Command finished successfully!")))
        // Save the video to the output file
        .save(this.outputFile)
    })
  }

  /** Prints input file info. */
  printInputFileInfo() {
    printInputFileInfo(
      log,
      this.inputFile,
      this.inputFileSize,
      this.inputStreams
    )
  }
}

export default Ffmpeg

/**
 * @file FFMPEG service.
 * @module services/ffmpeg
 */

import fluentFfmpeg from "fluent-ffmpeg"
import ffprobe from "ffprobe"
import log from "./logger/logger.js"
import { mapAudioStreams } from "./stream/audio-stream.js"
import { mapVideoStreams } from "./stream/video-stream.js"
import { getInputStreams, mapStreams } from "./stream/stream.js"
import { printProgress } from "./progress-output.js"

import {
  getTextSubtitles,
  getSubFilename,
  mapImageSubs,
} from "./stream/subtitle-stream.js"

/**
 * @typedef {import('fluent-ffmpeg').FfmpegCommand} FfmpegCommand
 * @typedef {import('../@types/streams.js').Streams} Streams
 * @typedef {import('../@types/audio-stream.js').AudioStream} AudioStream
 * @typedef {import('../@types/convert-opts.js').ConvertOpts} ConvertOpts
 * @typedef {import('../@types/subtitle-stream.js').SubtitleStream} SubtitleStream
 * @typedef {import('../@types/video-stream.js').VideoStream} VideoStream
 */

/** Class that acts as a wrapper for fluent-ffmpeg. */
class VideoEdit {
  /** Full path to the input file. */
  inputFile
  /** Full path to the output file. */
  outputFile
  /** Conversion options. */
  convertOpts

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
   * @returns {Promise<VideoEdit>} Promise resolves to VideoEdit instance.
   */
  async init() {
    // Set path to ffprobe
    const opts = { path: "/usr/local/bin/ffprobe" }

    // Use ffprobe to get audio streams from the video file
    await ffprobe(this.inputFile, opts)
      .then((info) => {
        // Initialize inputStreams property
        this.inputStreams = getInputStreams(info.streams)
      })
      .catch((err) => {
        log.error(err)
        // eslint-disable-next-line no-magic-numbers
        process.exit(-1)
      })

    if (this.inputStreams.audio.length === 0) {
      log.error("No audio streams mapped.")
    }
    return this
  }

  /**
   * Sets base options for ffmpeg command.
   * @param {FfmpegCommand} ffmpeg - Fluent ffmpeg object.
   */
  setCommonOptions(ffmpeg) {
    ffmpeg
      // Hide output except progress stats
      .outputOptions(["-hide_banner"])
      // Output command on start
      .on("start", (command) => log.debug(command))
      // Handle errors
      .on("error", (err) => log.error("FFMPEG Error:", err))
  }

  /**
   * Map all streams to output file and store results in outputStream property.
   * @param {FfmpegCommand} ffmpeg - Fluent-ffmpeg instance.
   */
  mapStreams(ffmpeg) {
    const { convertVideo, convertAudio } = this.convertOpts
    const { video, audio, subtitle } = this.inputStreams

    // Map video stream(s)
    const outputVideo = mapVideoStreams(ffmpeg, video, convertVideo)
    // Map audio streams
    const outputAudio = mapAudioStreams(ffmpeg, audio, convertAudio)
    // Map image-based English subtitles
    const outputSubtitle = mapImageSubs(ffmpeg, subtitle)

    // Save mapped streams to outputStreams property for later use
    this.outputStreams = {
      audio: outputAudio,
      video: outputVideo,
      subtitle: outputSubtitle,
    }
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
      this.extractSub(stream, textSubs.length)
    }
  }

  /**
   * Extracts a single subtitle from a stream.
   * @param {SubtitleStream} stream - Subtitle stream data.
   * @param {number} index - Stream index.
   */
  async extractSub(stream, index) {
    try {
      // Run the extract
      await this.runExtract(this.inputFile, stream, index)
    } catch (err) {
      log.error(`Error extracting subtitle from stream ${stream.index}:`, err)
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
        .on("error", (err) => reject(err))
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
    mapStreams(ffmpegProcess, this.inputStreams, this.convertOpts)

    // Wrap ffmpeg call in promise
    await new Promise((resolve, reject) => {
      ffmpegProcess
        // Set subtitle codec to copy
        .outputOptions("-scodec copy")
        // Set global language
        .outputOptions([`-metadata`, `language=eng`])
        // Output message on progress
        .on("progress", (progress) => printProgress(log, progress, fps))
        // Handle errors
        .on("error", (err) => reject(err))
        // Output message on success
        .on("end", () => resolve(log.success("Command finished successfully!")))
        // Save the video to the output file
        .save(this.outputFile)
    })
  }
}

export default VideoEdit

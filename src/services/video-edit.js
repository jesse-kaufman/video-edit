/**
 * @file FFMPEG service.
 * @module services/ffmpeg
 */

import fluentFfmpeg from "fluent-ffmpeg"
import ffprobe from "ffprobe"
import log from "./logger/logger.js"
import { getOutputAudioCodec } from "./stream/audio-stream.js"
import { getInputStreams } from "./stream/stream.js"
import { printProgress } from "./progress.js"

import {
  getTextSubtitles,
  getImageSubtitles,
  getSubFilename,
} from "./stream/subtitle-stream.js"

/**
 * @typedef {import('fluent-ffmpeg').FfmpegCommand} FfmpegCommand
 * @typedef {import('../@types/audio-stream.js').AudioStream} AudioStream
 * @typedef {import('../@types/convert-opts.js').ConvertOpts} ConvertOpts
 * @typedef {import('../@types/subtitle-stream.js').SubtitleStream} SubtitleStream
 * @typedef {import('../@types/video-stream.js').VideoStream} VideoStream
 */

/** Class that acts as a wrapper for fluent-ffmpeg. */
class VideoEdit {
  /** The fluent-ffmpeg object for cleaning/converting. */
  ffmpegProcess
  /** The fluent-ffmpeg object for subtitle extraction. */
  ffmpegExtract
  /** Full path to the input file. */
  inputFile
  /** Full path to the output file. */
  outputFile
  /** Conversion options. */
  convertOpts
  /** Audio codec to use if converting. */
  outputAudioCodec

  /** Input file stream data.*/
  inputStreams = {
    /** @type {Array<AudioStream>} */ audio: [],
    /** @type {Array<VideoStream>} */ video: [],
    /** @type {Array<SubtitleStream>} */ subtitle: [],
  }

  /** Output file stream data.*/
  outputStreams = {
    /** @type {Array<AudioStream>} */ audio: [],
    /** @type {Array<VideoStream>} */ video: [],
    /** @type {Array<SubtitleStream>} */ subtitle: [],
  }

  /**
   * Creates a new VideoEdit object.
   * @param {string} inputFile - The name of the input file.
   * @param {string} outputFile - The name of the output file.
   * @param {ConvertOpts} convertOpts - Conversion options.
   */
  constructor(inputFile, outputFile, convertOpts = {}) {
    // Setup fluent-ffmpeg object for cleaning/converting
    this.ffmpegProcess = fluentFfmpeg(inputFile)
    // Setup fluent-ffmpeg object for subtitle extraction
    this.ffmpegExtract = fluentFfmpeg(inputFile)
    // Set conversion options
    this.convertOpts = convertOpts
    // Set input file property
    this.inputFile = inputFile
    // Set output file property
    this.outputFile = outputFile
    // Set audio codec
    this.outputAudioCodec = getOutputAudioCodec(
      this.ffmpegProcess,
      convertOpts?.convertAudio
    )

    // Set base options on convert/clean instance of ffmpeg-fluent
    this.setCommonOptions(this.ffmpegProcess)
    // Set base options on subtitle extract instance of ffmpeg-fluent
    this.setCommonOptions(this.ffmpegExtract)

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
        process.exit(-1)
      })

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
   * Maps audio streams in output file.
   * @returns {VideoEdit} Returns this to allow chaining.
   */
  mapAudioStreams() {
    // Filter out non-English audio streams from input file
    const streams = this.inputStreams.audio.filter((s) => s.lang === "eng")

    // Save filtered streams to property
    this.outputStreams.audio = streams

    // Get the audio codec to use based on the source codec and the stream should be converted
    const codec = getOutputAudioCodec(
      this.ffmpegProcess,
      this.convertOpts.convertAudio
    )

    // Process each audio stream
    streams.forEach((stream) => {
      // Map audio stream
      this.ffmpegProcess
        .outputOptions("-map", `0:a:${stream.index}`)
        // Set audio stream codec
        .outputOptions(`-c:a ${codec}`)
        // Set audio stream language
        .outputOptions([`-metadata:s:a:${stream.index}`, `language=eng`])
        // Set audio stream title
        .outputOptions([
          `-metadata:s:a:${stream.index}`,
          `title=${stream.title}  `,
        ])
    })

    return this
  }

  /**
   * Maps image-based English subtitle streams.
   * @returns {VideoEdit} Returns this to allow chaining.
   */
  mapImageSubs() {
    // Grab image-based English subtitle streams
    const imageSubs = getImageSubtitles(this.inputStreams.subtitle).filter(
      (sub) => sub.lang === "eng"
    )

    // Save subtitles to property
    this.outputStreams.subtitle = imageSubs

    // Map subtitle streams and set metadata
    imageSubs.forEach((/** @type {SubtitleStream} */ sub) => {
      this.ffmpegProcess
        // Map subtitle stream and set codec to copy
        .outputOptions(["-map", `0:s:${sub.index}`])
        // Set subtitle stream title
        .outputOptions([`-metadata:s:s:${sub.index}`, `title=${sub.title}  `])
    })

    return this
  }

  /**
   * Maps video stream(s).
   */
  mapVideoStreams() {
    // Get conversion options for video
    const { convertVideo } = this.convertOpts
    // Add video stream(s) to outputStreams property
    this.outputStreams.video = this.inputStreams.video

    this.ffmpegProcess
      // Map video stream
      .outputOptions("-map 0:v")
      // If converting video, set codec to h265, otherwise copy
      .videoCodec(convertVideo ? "hevc" : "copy")
      // Set video language
      .outputOptions([`-metadata:s:v:0`, `language=eng`])
      // Blank video title
      .outputOptions([`-metadata:s:v:0`, `title=`])
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
      const videoStream = this.inputStreams.video[0]
      const { index } = stream

      const ffmpegExtract = fluentFfmpeg(this.inputFile)
      this.setCommonOptions(ffmpegExtract)

      // Extract subtitle using ffmpeg
      ffmpegExtract
        // Map subtitle
        .outputOptions([`-map 0:s:${index}`, "-scodec srt"])
        // Print progress message
        .on("progress", (progress) =>
          printProgress(log, progress, videoStream, index)
        )
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
    const videoStream = this.inputStreams.video[0]

    // Wrap ffmpeg call in promise
    await new Promise((resolve, reject) => {
      this.ffmpegProcess
        // Set subtitle codec to copy
        .outputOptions("-scodec copy")
        // Set global language
        .outputOptions([`-metadata`, `language=eng`])
        // Output message on progress
        .on("progress", (progress) => printProgress(log, progress, videoStream))
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

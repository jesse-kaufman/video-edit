/**
 * @file Main video edit application.
 * @typedef {import('./services/logger.js').Logger} Logger
 * @typedef {import('./services/ffmpeg.js').ConvertOpts} ConvertOpts
 */

import log from "./services/logger.js"
import Ffmpeg from "./services/ffmpeg.js"
import { getOutputFilename } from "./services/filename.js"

/**
 * Main app class.
 */
class App {
  /** @type {Ffmpeg} - VideoEdit instance. */
  // @ts-ignore
  ffmpeg

  // Command is first argument to node app
  command = process.argv[2]
  // Input file is second argument to node app
  inputFile = process.argv[3]

  // Set output filename based on command and input file
  outputFilename = getOutputFilename(this.inputFile, this.command)

  defaultOpts = {
    extractSubs: false,
    convertAudio: false,
    convertVideo: false,
    extractOnly: false,
  }

  /**
   * Checks for ffmpeg when creating an instance of App.
   */
  constructor() {
    // Exit if file not specified
    if (this.inputFile == null) {
      log.error("Input file not specified.")
      process.exit(1)
    }

    log.debug("Starting...")
  }

  /**
   * Runs the program.
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line complexity, max-lines-per-function
  async run() {
    // Initialize VideoEdit with input file and output filename
    this.ffmpeg = await new Ffmpeg(this.inputFile, this.outputFilename).init()
    let convertOpts = {}

    // Print input file info
    this.ffmpeg.printInputFileInfo()

    // If only printing info, return immediately
    if (this.command === "info") return

    switch (this.command) {
      // Extract English subtitles from the video file
      case "extract-subs":
        convertOpts = { extractSubs: true, extractOnly: true }
        break

      // Run cleanup process on video file
      case "clean":
        convertOpts = { extractSubs: true }
        break

      // Convert audio to AAC if not already
      case "convert-audio":
        convertOpts = { convertAudio: true }
        break

      // Convert video to H265
      case "convert-video":
        convertOpts = { convertVideo: true }
        break

      // Clean and convert anything that needs to be converted
      case "full":
        convertOpts = {
          extractSubs: true,
          convertAudio: true,
          convertVideo: true,
        }
        break

      // Clean and convert anything that needs to be converted, forcing video conversion
      case "force-full":
        convertOpts = {
          extractSubs: true,
          convertAudio: true,
          convertVideo: true,
          forceConvert: true,
        }
        break

      // Clean and convert anything that needs to be converted, forcing video conversion
      case "force-full-tv":
        convertOpts = {
          extractSubs: true,
          convertAudio: true,
          convertVideo: true,
          forceConvert: true,
          ffmpegPreset: "medium",
          ffmpegCrf: 26,
        }
        break

      default:
        log.fail(`Invalid command: ${this.command}`)
    }

    await this.cleanup(convertOpts)
  }

  /**
   * Cleans up audio and subtitle tracks as well as metadata throughout the video file.
   * @param {ConvertOpts} convertOpts - Conversion options.
   */
  cleanup(convertOpts) {
    // Merge default options with provided options and set to ffmpeg instance.s
    this.ffmpeg.convertOpts = { ...this.defaultOpts, ...convertOpts }

    if (convertOpts?.extractSubs) {
      // Extract text-based English subtitles from the video file
      this.ffmpeg.extractSubs()

      // Return if only extracting subtitles
      if (convertOpts?.extractOnly === true) return
    }

    // Convert/clean file
    try {
      log.notice("Running ffmpeg command...")
      this.ffmpeg.run()
    } catch (err) {
      log.fail("Error running ffmpeg:", err)
    }
  }
}

// Run the app
const app = new App()
try {
  app.run()
} catch (/** @type {any} */ err) {
  log.fail(err)
}

/**
 * @file Main video edit application.
 * @typedef {import('./services/logger/logger.js').Logger} Logger
 * @typedef {import('./services/video-edit.js').ConvertOpts} ConvertOpts
 */

import log from "./services/logger/logger.js"
import VideoEdit from "./services/video-edit.js"
import { getOutputFilename } from "./services/filename.js"

/**
 * Main app class.
 */
class App {
  /** @type {VideoEdit} - VideoEdit instance. */
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
   */
  async run() {
    // Initialize VideoEdit with input file and output filename
    this.ffmpeg = await new VideoEdit(
      this.inputFile,
      this.outputFilename
    ).init()

    switch (this.command) {
      // Extract English subtitles from the video file
      case "extract-subs":
        this.cleanup({ extractSubs: true, extractOnly: true })
        break

      // Run cleanup process on video file
      case "clean":
        await this.cleanup({ extractSubs: true })
        break

      // Convert audio to AAC if not already
      case "convert-audio":
        await this.cleanup({ convertAudio: true })
        break

      // Convert video to H265
      case "convert-video":
        await this.cleanup({ convertVideo: true })
        break

      // Clean and convert anything that needs to be converted
      case "full":
        await this.cleanup({
          extractSubs: true,
          convertAudio: true,
          convertVideo: true,
        })
        break

      default:
        log.info(`Invalid command: ${this.command}`)
        process.exit(1)
    }
  }

  /**
   * Cleans up audio and subtitle tracks as well as metadata throughout the video file.
   * @param {ConvertOpts} convertOpts - Conversion options.
   */
  async cleanup(convertOpts) {
    // Merge default options with provided options and set to ffmpeg instance.s
    this.ffmpeg.convertOpts = { ...this.defaultOpts, ...convertOpts }

    if (convertOpts?.extractSubs) {
      // Extract text-based English subtitles from the video file
      this.ffmpeg.extractSubs(false)

      // Return if only extracting subtitles
      if (convertOpts?.extractOnly === true) return
    }

    // Convert/clean file
    try {
      log.notice("Running ffmpeg command...")
      await this.ffmpeg.run()
    } catch (err) {
      console.error("Error running ffmpeg:", err)
      process.exit(1)
    }
  }
}

// Run the app
const app = new App()
try {
  app.run()
} catch (/** @type {any} */ err) {
  console.error(err.message, err.stack)
}

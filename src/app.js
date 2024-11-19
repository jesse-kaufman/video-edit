/**
 * @file Main video edit application.
 */
import path from "node:path"
import log from "./services/logger/logger.js"
import VideoEdit from "./services/video-edit.js"

/**
 * @typedef {import('./services/logger/logger.js').Logger} Logger
 * @typedef {import('./services/video-edit.js').ConvertOpts} ConvertOpts
 */

/**
 * Main app class.
 */
export default class App {
  /** @type {VideoEdit} - VideoEdit instance. */
  // @ts-ignore
  ffmpeg

  /**
   * Checks for ffmpeg when creating an instance of App.
   */
  constructor() {
    // Command is first argument to node app
    this.command = process.argv[2]
    // Input file is second argument to node app
    this.inputFile = process.argv[3]

    // Exit if file not specified
    if (this.inputFile == null) {
      log.error("Input file not specified.")
      process.exit(1)
    }

    // Set output filename based on command and input file
    this.outputFilename = this.getOutputFilename()

    log.debug("Starting...")
  }

  /**
   * Generates output filename for command.
   * @returns {string} The generated filename.
   */
  getOutputFilename() {
    /** Directory where input file is located. */
    const dir = path.dirname(this.inputFile)
    /** Base filename of input file. */
    const basename = path.basename(this.inputFile, path.extname(this.inputFile))

    return path.join(dir, `${basename}-${this.command}.mkv`)
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
        this.extractSubs(true)
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
   * Extracts text-based English subtitles from the video file.
   * @param {boolean} exitIfNotFound - Whether to exit if no matching subtitles are found.
   */
  extractSubs(exitIfNotFound = false) {
    // Extract English subtitles from the video file
    this?.ffmpeg?.extractSubs(exitIfNotFound)
  }

  /**
   * Cleans up audio and subtitle tracks as well as metadata throughout the video file.
   * @param {ConvertOpts} convertOpts - Conversion options.
   */
  async cleanup(convertOpts = {}) {
    // Create new VideoEdit instance and map audio and subtitle streams
    this.ffmpeg.convertOpts = convertOpts

    if (convertOpts?.extractSubs === true) {
      // Extract text-based English subtitles from the video file
      await this.extractSubs()
    }

    // Run the ffmpeg command.
    try {
      log.notice("Running ffmpeg command...")
      await this.ffmpeg.run()
    } catch (err) {
      // @ts-ignore
      log.error("Error running ffmpeg:", err.message)
      process.exit(1)
    }
  }
}

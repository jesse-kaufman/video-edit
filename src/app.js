import path from "node:path";
import log from "./services/logger/logger.js";
import Ffmpeg from "./services/ffmpeg.js";

/**
 * @typedef {import('./services/logger/logger.js').Logger} Logger
 * @typedef {import('./services/ffmpeg.js').ConvertOpts} ConvertOpts
 */

/**
 * Main app class.
 */
export default class App {
  /** @type {Ffmpeg|undefined} - Ffmpeg instance. */
  ffmpeg;

  /**
   * Checks for ffmpeg when creating an instance of App.
   */
  constructor() {
    log.debug("Starting...");

    if (!Ffmpeg.check()) {
      log.error("FFMPEG not found. Please install it and try again.");
      process.exit(1);
    }

    // Command is first argument to node app
    this.command = process.argv[2];
    // Input file is second argument to node app
    this.inputFile = process.argv[3];
    // Set output filename based on command and input file
    this.outputFilename = this.getOutputFilename();
  }

  /**
   * Generates output filename for command.
   * @returns {string} The output filename.
   */
  getOutputFilename() {
    /** Directory where input file is located. */
    const dir = path.dirname(this.inputFile);
    /** Base filename of input file. */
    const basename = path.basename(
      this.inputFile,
      path.extname(this.inputFile)
    );

    return path.join(dir, `${basename}-${this.command}.mkv`);
  }

  /**
   * Runs the program.
   */
  async run() {
    /** Command to execute. */
    const command = process.argv[2];
    /** Input file to process. */
    const file = process.argv[3];

    // Exit if file not specified
    if (file == null) {
      log.error("Input file not specified.");
      process.exit(1);
    }

    // Initialize Ffmpeg with input file and output filename
    this.ffmpeg = await new Ffmpeg(this.inputFile, this.outputFilename).init();

    switch (command) {
      // Extract English subtitles from the video file
      case "extract-subs":
        await this.extractSubs(true);
        break;

      // Run cleanup process on video file
      case "clean":
        await this.cleanup({ extractSubs: true });
        break;

      // Convert audio to AAC if not already
      case "convert-audio":
        await this.cleanup({ convertAudio: true });
        break;

      // Convert video to H265
      case "convert-video":
        await this.cleanup({ convertVideo: true });
        break;

      default:
        log.info(`Invalid command: ${command}`);
        process.exit(1);
    }
  }

  /**
   * Extracts text-based English subtitles from the video file.
   * @param {boolean} exitIfNotFound - Whether to exit if no matching subtitles are found.
   */
  async extractSubs(exitIfNotFound = false) {
    // Extract English subtitles from the video file
    await this?.ffmpeg?.extractSubs(exitIfNotFound);
  }

  /**
   * Cleans up audio and subtitle tracks as well as metadata throughout the video file.
   * @param {ConvertOpts} convertOpts - Conversion options.
   */
  async cleanup(convertOpts = {}) {
    // Create new Ffmpeg instance and map audio and subtitle streams
    const ffmpeg = await new Ffmpeg(
      this.inputFile,
      this.outputFilename,
      convertOpts
    ).init();

    if (convertOpts?.extractSubs === true) {
      // Extract text-based English subtitles from the video file
      await this.extractSubs();
    }

    ffmpeg.mapAudioStreams();
    ffmpeg.mapSubtitles();

    // Run the ffmpeg command.
    try {
      log.info("Running ffmpeg command...");
      await ffmpeg.run();
    } catch (err) {
      // @ts-ignore
      log.error("Error running ffmpeg:", err.message);
      process.exit(1);
    }
  }
}

import path from "node:path";
import log from "./services/logger/logger.js";
import { extractSubs, getSubtitleStreams } from "./services/subtitle.js";
import { getAudioStreams } from "./services/audio.js";
import Ffmpeg from "./services/ffmpeg.js";

/**
 * @typedef {import('./services/logger/logger.js').Logger} Logger
 * @typedef {import('./services/ffmpeg.js').ConvertOpts} ConvertOpts
 */

/**
 * Main app class.
 */
export default class App {
  /**
   * Checks for ffmpeg when creating an instance of App.
   */
  constructor() {
    this.command = process.argv[2];
    this.inputFile = process.argv[3];
    this.outputFilename = this.getOutputFilename(this.inputFile, this.command);

    log.debug("Starting...");

    if (!Ffmpeg.check()) {
      log.error("FFMPEG not found. Please install it and try again.");
      process.exit(1);
    }
  }

  /**
   * Generates output filename for command.
   * @param {string} inputFile - The input file.
   * @param {string} command - The command.
   * @returns {string} The output filename.
   */
  getOutputFilename(inputFile, command) {
    const dir = path.dirname(inputFile);
    const basename = path.basename(inputFile, path.extname(inputFile));

    const output = path.join(dir, `${basename}-${command}.mkv`);
    return output;
  }

  /**
   * Runs the program.
   */
  async run() {
    const command = process.argv[2];
    const file = process.argv[3];

    if (file == null) {
      log.error("Input file not specified.");
      process.exit(1);
    }

    switch (command) {
      case "extract-subs":
        // Extract English subtitles from the video file
        await extractSubs(file, true);
        break;

      case "clean":
        // Run cleanup process on video file
        await this.cleanup(file);
        break;

      case "convert-audio":
        // Convert audio to AAC if not already
        await this.cleanup(file, { convertAudio: true });
        break;

      case "convert-video":
        // Convert video to H265
        await this.cleanup(file, { convertVideo: true });
        break;

      default:
        log.info("Missing filename or action");
        process.exit(1);
    }
  }

  /**
   * Cleans up audio and subtitle tracks as well as metadata throughout the video file.
   * @param {string} file - The video file to be cleaned up.
   * @param {ConvertOpts} convertOpts - Conversion options.
   */
  async cleanup(file, convertOpts = {}) {
    // Extract text-based English subtitles from the video file
    await extractSubs(file);

    // Get audio streams from the video file
    const audioStreams = await getAudioStreams(file);

    // Get image-based subtitle streams
    const imageSubs = await getSubtitleStreams(file, "image");

    // Create new Ffmpeg instance and map audio and subtitle streams
    const ffmpeg = await new Ffmpeg(
      file,
      this.outputFilename,
      convertOpts
    ).init();

    ffmpeg.mapAudioStreams(audioStreams).mapSubtitles(imageSubs);

    // Run the ffmpeg command.
    try {
      await ffmpeg.run();
    } catch (err) {
      // @ts-ignore
      log.error("Error cleaning up the video file:", err.message);
      process.exit(1);
    }
  }
}

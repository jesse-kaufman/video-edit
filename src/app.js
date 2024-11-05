import path from "node:path";
import logger from "./services/logger/logger.js";
import { extractSubs, getSubtitleStreams } from "./services/subtitle.js";
import { getAudioStreams } from "./services/audio.js";
import Ffmpeg from "./services/ffmpeg.js";

/**
 * @typedef {import('./services/logger/logger.js').Logger} Logger
 */

/**
 * Main app class.
 */
export default class App {
  /**
   * Static property holding logger object for logging.
   * @type {Logger}
   */
  static log = logger;

  constructor() {
    App.log.info("Starting");
    if (!Ffmpeg.check()) {
      App.log.error("FFMPEG not found. Please install it and try again.");
      process.exit(1);
    }
    console.log("FFMPEG found");
  }

  /**
   * Runs the program.
   */
  async run() {
    const command = process.argv[2];
    const file = process.argv[3];

    if (command === "extract-subs" && file != null) {
      await extractSubs(file);
      process.exit(0);
    }

    if (command === "clean" && file != null) {
      try {
        await this.cleanup(file);
        process.exit(0);
      } catch (err) {
        App.log.error("Error stripping audio:", err);
        process.exit(1);
      }
    }

    console.log("Missing filename or action");
  }

  /**
   * Cleans up audio and subtitle tracks as well as metadata throughout the video file.
   * @param {string} file - The video file to be cleaned up.
   */
  async cleanup(file) {
    // Get audio streams from the video file
    const audioStreams = await getAudioStreams(file);

    // If no English audio streams were found, exit the program
    if (audioStreams.length === 0) {
      console.error("No English audio streams found in the video file.");
      process.exit(1);
    }

    const imageSubs = await getSubtitleStreams(file, "image");

    const outputFile = path.join(
      path.dirname(file),
      path.basename(file, path.extname(file))
    );

    // Create new Ffmpeg instance and map audio and subtitle streams
    const ffmpeg = await new Ffmpeg(file, `${outputFile}-cleaned.mkv`)
      .mapAudioStreams(audioStreams)
      .mapSubtitles(imageSubs);

    // Run the ffmpeg command.
    await ffmpeg.run();
  }
}

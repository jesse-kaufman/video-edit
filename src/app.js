import path from "node:path";
import log from "./services/logger/logger.js";
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
   * Checks for ffmpeg when creating an instance of App.
   */
  constructor() {
    log.debug("Starting");
    if (!Ffmpeg.check()) {
      log.error("FFMPEG not found. Please install it and try again.");
      process.exit(1);
    }
    log.info("FFMPEG found");
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

    if (command === "extract-subs") {
      // Extract English subtitles from the video file
      await extractSubs(file, true);
      process.exit(0);
    }

    if (command === "clean") {
      // Run cleanup process on video file
      await this.cleanup(file);
      process.exit(0);
    }

    log.info("Missing filename or action");
  }

  /**
   * Cleans up audio and subtitle tracks as well as metadata throughout the video file.
   * @param {string} file - The video file to be cleaned up.
   */
  async cleanup(file) {
    // Extract text-based English subtitles from the video file
    await extractSubs(file);

    // Get audio streams from the video file
    const audioStreams = await getAudioStreams(file);

    // If no English audio streams were found, exit the program
    if (audioStreams.length === 0) {
      log.error("No English audio streams found in the video file.");
      process.exit(1);
    }

    // Get image-based subtitle streams
    const imageSubs = await getSubtitleStreams(file, "image");

    // Setup base output filename
    const outputFile = path.join(
      path.dirname(file),
      path.basename(file, path.extname(file))
    );

    // Create new Ffmpeg instance and map audio and subtitle streams
    const ffmpeg = new Ffmpeg(file, `${outputFile}-cleaned.mkv`)
      .mapAudioStreams(audioStreams)
      .mapSubtitles(imageSubs);

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

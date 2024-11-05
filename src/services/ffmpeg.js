/**
 * FFMPEG service.
 * @module services/ffmpeg
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fluentFfmpeg from "fluent-ffmpeg";

/**
 * @typedef {import('./audio.js').AudioStream} AudioStream
 * @typedef {import('./subtitle.js').SubtitleStream} SubtitleStream
 */

/**
 * Class that acts as a wrapper for fluent-ffmpeg.
 */
class Ffmpeg {
  /**
   * Creates a new Ffmpeg object.
   * @param {string} inputFile - The name of the input file.
   * @param {string} outputFile - The name of the output file.
   */
  constructor(inputFile, outputFile) {
    // Save the name of the input file to class property
    this.inputFile = inputFile;

    // Save the name of the output file to class property
    this.outputFile = outputFile;

    // Save fluent ffmpeg object to class property
    this.ffmpegProcess = fluentFfmpeg(inputFile);

    // Initialize with base ffmpeg options
    this.setBaseOptions();
    return this;
  }

  /**
   * Check if ffmpeg binary can be found.
   * @returns {Promise<boolean>} True if ffmpeg was found.
   */
  static async check() {
    // Promisify exec
    const execAsync = promisify(exec);

    // Check if ffmpeg is available by running the command "ffmpeg -version"
    try {
      await execAsync("ffmpeg -version");
      return true;
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      return false;
    }
  }

  /**
   * Sets base options for ffmpeg command.
   */
  setBaseOptions() {
    this.ffmpegProcess
      // Hide output except progress stats
      .outputOptions(["-stats", "-loglevel quiet"])
      // Map video stream and set codec to copy
      .outputOptions("-map 0:v")
      // Set audio codec to copy
      .audioCodec("copy")
      // Set video codec to copy
      .videoCodec("copy")
      // Set global language
      .outputOptions([`-metadata`, `language=eng`])
      // Blank video title
      .outputOptions([`-metadata:s:v:0`, `title=`]);
  }

  /**
   * Maps audio streams in output file.
   * @param {Array<AudioStream>} audioStreams - An array of audio streams.
   * @returns {Ffmpeg} Returns this to allow chaining.
   */
  mapAudioStreams(audioStreams) {
    // Walk through audio streams and map them
    for (const [i, stream] of audioStreams.entries()) {
      this.ffmpegProcess
        // Map audio stream
        .outputOptions(`-map 0:a:${i}`)
        // Set audio stream title
        .outputOptions([`-metadata:s:a:${i}`, `title=${stream.title}`])
        // Set audio stream language
        .outputOptions([`-metadata:s:a:${i}`, `language=eng`]);
    }
    return this;
  }

  /**
   * Maps subtitle streams.
   * @param {Array<SubtitleStream>} subtitles - An array of subtitle streams.
   * @returns {Ffmpeg} Returns this to allow chaining.
   */
  mapSubtitles(subtitles) {
    // Map subtitle streams and set metadata
    for (const [i, sub] of subtitles.entries()) {
      this.ffmpegProcess
        // Map subtitle stream and set codec to copy
        .outputOptions([`-map 0:s:${i}`, "-c:s copy"])
        // Set subtitle stream title
        .outputOptions([`-metadata:s:s:${i}`, `title=${sub.title}`])
        // Set subtitle stream language
        .outputOptions([`-metadata:s:s:${i}`, `language=eng`]);
    }
    return this;
  }

  /**
   * Runs the ffmpeg command.
   */
  async run() {
    // Wrap ffmpeg call in promise
    await new Promise((resolve, reject) => {
      this.ffmpegProcess
        .on("start", (command) => console.log(command))
        // Output message on progress
        .on("stderr", (err) => console.log(err))
        // Handle errors
        .on("error", (err) =>
          reject(console.error("Error stripping audio:", err))
        )
        // Output message on success
        .on("end", () => resolve(console.log("Audio stripped successfully.")))
        // Save the video to the output file
        .save(this.outputFile);
    });
  }
}

export default Ffmpeg;

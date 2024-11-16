/**
 * FFMPEG service.
 * @module services/ffmpeg
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fluentFfmpeg from "fluent-ffmpeg";
import log from "./logger/logger.js";

/**
 * @typedef {import('../@types/audio-stream.js').AudioStream} AudioStream
 * @typedef {import('../@types/subtitle-stream.js').SubtitleStream} SubtitleStream
 * @typedef {import('../@types/convert-opts.js').ConvertOpts} ConvertOpts
 * @typedef {import('fluent-ffmpeg').FfmpegCommand} FfmpegCommand
 */

/**
 * Class that acts as a wrapper for fluent-ffmpeg.
 */
class Ffmpeg {
  /** The fluent-ffmpeg object. */
  ffmpegProcess;
  /** The output file. */
  outputFile = "";
  /** Conversion options. */
  convertOpts = {};
  /** Audio codec to use if converting. */
  audioCodec = "aac";

  /**
   * Creates a new Ffmpeg object.
   * @param {string} inputFile - The name of the input file.
   * @param {string} outputFile - The name of the output file.
   * @param {ConvertOpts} convertOpts - Conversion options.
   */
  constructor(inputFile, outputFile, convertOpts = {}) {
    // Save fluent ffmpeg object for access later
    this.ffmpegProcess = fluentFfmpeg(inputFile);
    // Init conversion options
    this.convertOpts = convertOpts;
    // Init output file property
    this.outputFile = outputFile;

    this.setAudioEncoder();

    this.setBaseOptions(this.convertOpts);
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
   * Sets the audio codec based on whether or not libfdk_aac is available.
   */
  setAudioEncoder() {
    fluentFfmpeg.getAvailableEncoders((err, encoders) => {
      if (err) throw err;

      // Use libfdk_aac if available
      if (encoders?.libfdk_aac?.type === "audio") {
        this.audioCodec = "libfdk_aac";
      }
    });
  }

  /**
   * Sets base options for ffmpeg command.
   * @param {ConvertOpts} convertOpts - Conversion options.
   * @returns {Ffmpeg} Ffmpeg instance.
   */
  setBaseOptions(convertOpts = {}) {
    const convertAudio = convertOpts?.convertAudio;
    const convertVideo = convertOpts?.convertVideo;

    this.ffmpegProcess
      // Hide output except progress stats
      .outputOptions(["-stats", "-loglevel quiet"])
      // Map video stream and set codec to copy
      .outputOptions("-map 0:v")
      // If converting audio, set codec to AAC, otherwise copy (for now, assume libfdk_acc is supported)
      .audioCodec(convertAudio ? this.audioCodec : "copy")
      // If converting video, set codec to h265, otherwise copy
      .videoCodec(convertVideo ? "h265" : "copy")
      // Set subtitle codec to copy
      .outputOptions("-scodec copy")
      // Set global language
      .outputOptions([`-metadata`, `language=eng`])
      // Set video language
      .outputOptions([`-metadata:s:v:0`, `language=eng`])
      // Blank video title
      .outputOptions([`-metadata:s:v:0`, `title=`]);

    return this;
  }

  /**
   * Maps audio streams in output file.
   * @param {Array<AudioStream>} audioStreams - An array of audio streams.
   * @returns {Ffmpeg} Returns this to allow chaining.
   */
  mapAudioStreams(audioStreams) {
    // Walk through audio streams and map them
    for (const [, stream] of audioStreams.entries()) {
      this.ffmpegProcess
        // Map audio stream
        .outputOptions("-map", `0:a:${stream.index}`)
        .outputOptions([`-metadata:s:a:${stream.index}`, `language=eng`])
        // Set audio stream title
        .outputOptions([
          `-metadata:s:a:${stream.index}`,
          `title=${stream.title}  `,
        ]);
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
    for (const [, sub] of subtitles.entries()) {
      this.ffmpegProcess
        // Map subtitle stream and set codec to copy
        .outputOptions(["-map", `0:s:${sub.index}`])
        // Set subtitle stream title
        .outputOptions([`-metadata:s:s:${sub.index}`, `title=${sub.title}  `]);
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
        .on("start", (command) => log.debug(command))
        // Output message on progress
        .on("stderr", (err) => log.progress(err))
        // Handle errors
        .on("error", (err) => reject(log.error("FFMPEG Error:", err)))
        // Output message on success
        .on("end", () => resolve(log.success("FFMPEG finished successfully!")))
        // Save the video to the output file
        .save(this.outputFile);
    });
  }
}

export default Ffmpeg;

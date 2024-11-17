/**
 * FFMPEG service.
 * @module services/ffmpeg
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fluentFfmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe";
import log from "./logger/logger.js";
import { getOutputAudioCodec, getAudioStreamData } from "./audio.js";
import { getVideoStreamData } from "./video.js";
import {
  getSubtitleStreamData,
  getTextSubtitles,
  getImageSubtitles,
  extractSub,
} from "./subtitle.js";

/**
 * @typedef {import('fluent-ffmpeg').FfmpegCommand} FfmpegCommand
 * @typedef {import('../@types/audio-stream.js').AudioStream} AudioStream
 * @typedef {import('../@types/convert-opts.js').ConvertOpts} ConvertOpts
 * @typedef {import('../@types/subtitle-stream.js').SubtitleStream} SubtitleStream
 * @typedef {import('../@types/video-stream.js').VideoStream} VideoStream
 */

/**
 * Class that acts as a wrapper for fluent-ffmpeg.
 */
class Ffmpeg {
  /** The fluent-ffmpeg object. */
  ffmpegProcess;
  /** The output file. */
  outputFile;
  /** Conversion options. */
  convertOpts;
  /** Audio codec to use if converting. */
  outputAudioCodec;

  /** Input file stream data.*/
  inputStreams = {
    /** @type {Array<AudioStream>} */ audio: [],
    /** @type {Array<VideoStream>} */ video: [],
    /** @type {Array<SubtitleStream>} */ subtitle: [],
  };

  /** Output file stream data.*/
  outputStreams = {
    /** @type {Array<AudioStream>} */ audio: [],
    /** @type {Array<VideoStream>} */ video: [],
    /** @type {Array<SubtitleStream>} */ subtitle: [],
  };

  /**
   * Creates a new Ffmpeg object.
   * @param {string} inputFile - The name of the input file.
   * @param {string} outputFile - The name of the output file.
   * @param {ConvertOpts} convertOpts - Conversion options.
   */
  constructor(inputFile, outputFile, convertOpts = {}) {
    // Save fluent ffmpeg object for access later
    this.ffmpegProcess = fluentFfmpeg(inputFile);
    // Set conversion options
    this.convertOpts = convertOpts;
    // Set input file property
    this.inputFile = inputFile;
    // Set output file property
    this.outputFile = outputFile;
    // Set audio codec
    this.outputAudioCodec = getOutputAudioCodec(
      this.ffmpegProcess,
      convertOpts?.convertAudio
    );

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
    } catch (err) {
      log.error("Error:", err);
      return false;
    }
  }

  async init() {
    // Get audio streams with ffprobe
    try {
      // Use ffprobe to get audio streams from the video file
      const video = await ffprobe(this.inputFile, {
        path: "/usr/local/bin/ffprobe",
      });

      this.setupStreams(video.streams);
    } catch (err) {
      log.error("Error getting ffprobe data:", err);
      process.exit(1);
    }

    return this;
  }

  /**
   * Sets up audio, video, and subtitle stream properties.
   * @param {Array<any>} streams - Input streams from ffprobe.
   */
  setupStreams(streams) {
    streams.forEach((stream) => {
      switch (stream.codec_type) {
        case "audio":
          this.inputStreams.audio.push(
            getAudioStreamData(stream, this.inputStreams.audio.length)
          );
          break;

        case "video":
          this.inputStreams.video.push(
            getVideoStreamData(stream, this.inputStreams.video.length)
          );
          break;

        case "subtitle":
          this.inputStreams.subtitle.push(
            getSubtitleStreamData(stream, this.inputStreams.subtitle.length)
          );
          break;
      }
    });
  }

  /**
   * Sets base options for ffmpeg command.
   * @returns {Ffmpeg} Ffmpeg instance.
   */
  setBaseOptions() {
    const { convertAudio, convertVideo } = this.convertOpts;

    this.ffmpegProcess
      // Hide output except progress stats
      .outputOptions(["-stats", "-loglevel quiet"])
      // Map video stream and set codec to copy
      .outputOptions("-map 0:v")
      // If converting audio, set codec to AAC, otherwise copy (for now, assume libfdk_acc is supported)
      .audioCodec(convertAudio ? this.outputAudioCodec : "copy")
      // If converting video, set codec to h265, otherwise copy
      .videoCodec(convertVideo ? "hevc" : "copy")
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
   * @returns {Ffmpeg} Returns this to allow chaining.
   */
  mapAudioStreams() {
    // Filter out non-English audio streams from input file
    const streams = this.inputStreams.audio.filter((s) => s.lang === "eng");
    this.outputStreams.audio = streams;

    streams.forEach((stream) => {
      this.ffmpegProcess
        // Map audio stream
        .outputOptions("-map", `0:a:${stream.index}`)
        .outputOptions([`-metadata:s:a:${stream.index}`, `language=eng`])
        // Set audio stream title
        .outputOptions([
          `-metadata:s:a:${stream.index}`,
          `title=${stream.title}  `,
        ]);
    });

    return this;
  }

  /**
   * Maps subtitle streams.
   * @returns {Ffmpeg} Returns this to allow chaining.
   */
  mapSubtitles() {
    // Filter out non-English and text-based subtitles
    const imageSubs = getImageSubtitles(this.inputStreams.subtitle);
    // Save subtitles to property
    this.outputStreams.subtitle = imageSubs;

    // Map subtitle streams and set metadata
    imageSubs.forEach((/** @type {SubtitleStream} */ sub) => {
      this.ffmpegProcess
        // Map subtitle stream and set codec to copy
        .outputOptions(["-map", `0:s:${sub.index}`])
        // Set subtitle stream title
        .outputOptions([`-metadata:s:s:${sub.index}`, `title=${sub.title}  `]);
    });

    return this;
  }

  /**
   * Extracts text-based English subtitles from the video file.
   * @param {boolean} exitIfNotFound - Whether to exit the program if no matching subtitles are found.
   * @returns {Promise<void>} Promise that resolves when the subtitles are extracted.
   */
  async extractSubs(exitIfNotFound) {
    log.info("Extracting text subtitles ...");

    const textSubs = getTextSubtitles(this.inputStreams.subtitle);

    // If no English subtitles were found, exit the program
    if (textSubs.length === 0) {
      const msg = `No text English subtitles were found in the video file.`;
      if (exitIfNotFound) {
        log.error(msg);
        process.exit(1);
      }

      log.warn(msg);
    }

    // Walk through subtitle streams and extract each.
    for (const stream of this.inputStreams.subtitle) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await extractSub(this.inputFile, stream, textSubs.length);
      } catch (err) {
        log.error(
          `Error extracting subtitle from stream ${stream.index}:`,
          err
        );
      }
    }
  }

  /**
   * Runs the ffmpeg command.
   */
  async run() {
    // Wrap ffmpeg call in promise
    await new Promise((resolve, reject) => {
      this.ffmpegProcess
        .on("start", (command) => log.info(command))
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

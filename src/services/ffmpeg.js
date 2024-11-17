/**
 * @file FFMPEG service.
 * @module services/ffmpeg
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import fluentFfmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe";
import log from "./logger/logger.js";
import { getOutputAudioCodec, getAudioStreamData } from "./audio.js";
import { getVideoStreamData } from "./video.js";
import { printProgress } from "./progress.js";

import {
  getSubtitleStreamData,
  getTextSubtitles,
  getImageSubtitles,
  getSubFilename,
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
  /** The fluent-ffmpeg object for cleaning/converting. */
  ffmpegProcess;
  /** The fluent-ffmpeg object for subtitle extraction. */
  ffmpegExtract;
  /** Full path to the output file. */
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
    // Setup fluent-ffmpeg object for cleaning/converting
    this.ffmpegProcess = fluentFfmpeg(inputFile);
    // Setup fluent-ffmpeg object for subtitle extraction
    this.ffmpegExtract = fluentFfmpeg(inputFile);
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

    this.setBaseOptions(this.ffmpegProcess);

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

  /**
   * Initializes the ffmpeg object.
   * @returns {Promise<Ffmpeg>} Promise resolves to Ffmpeg instance.
   */
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
          console.log(this.inputStreams.video);
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
   * @param {FfmpegCommand} ffmpeg - Fluent ffmpeg object.
   */
  setBaseOptions(ffmpeg) {
    ffmpeg
      // Hide output except progress stats
      .outputOptions(["-stats", "-loglevel quiet"]);
  }

  /**
   * Maps audio streams in output file.
   * @returns {Ffmpeg} Returns this to allow chaining.
   */
  mapAudioStreams() {
    // Filter out non-English audio streams from input file
    const streams = this.inputStreams.audio.filter((s) => s.lang === "eng");
    // Save filtered streams to property
    this.outputStreams.audio = streams;

    // Get the audio codec to use based on the source codec and the stream should be converted
    const codec = getOutputAudioCodec(
      this.ffmpegProcess,
      this.convertOpts.convertAudio
    );

    // Process each audio stream
    streams.forEach((stream) => {
      // Map audio stream
      this.ffmpegProcess
        .outputOptions("-map", `0:a:${stream.index}`)
        // Set audio stream codec
        .outputOptions(`-c:a ${codec}`)
        // Set audio stream language
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
   * Maps image-based English subtitle streams.
   * @returns {Ffmpeg} Returns this to allow chaining.
   */
  mapImageSubs() {
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
   */
  extractSubs(exitIfNotFound) {
    log.info("Extracting text subtitles ...");

    const textSubs = getTextSubtitles(this.inputStreams.subtitle);

    // If no English subtitles were found, exit the program
    if (textSubs.length === 0) {
      const msg = `No text English subtitles were found in the video file.`;
      if (exitIfNotFound) {
        log.error(msg);
        process.exit(1);
      }
      // Log warning if not exiting
      log.warn(msg);
    }

    // Walk through subtitle streams and extract all simultaneously
    for (const stream of textSubs) {
      this.extractSub(stream, textSubs.length);
    }
  }

  /**
   * Extracts a single subtitle from a stream.
   * @param {SubtitleStream} stream - Subtitle stream data.
   * @param {number} index - Stream index.
   */
  async extractSub(stream, index) {
    try {
      // Run the extract
      await this.runExtract(this.inputFile, stream, index);
    } catch (err) {
      log.error(`Error extracting subtitle from stream ${stream.index}:`, err);
    }
  }

  /**
   * Gets subtitle from specified input file.
   * @param {string} inputFilePath - Path to input file.
   * @param {SubtitleStream} stream - Stream being extracted.
   * @param {number} streamCount - Total number of text streams.
   */
  async runExtract(inputFilePath, stream, streamCount) {
    // Get the subtitle file path
    const outputFile = getSubFilename(inputFilePath, stream, streamCount);

    await /** @type {Promise<void>} */ (
      new Promise((resolve, reject) => {
        // Extract subtitle using ffmpeg
        this.ffmpegExtract
          // Map subtitle
          .outputOptions([`-map 0:s:${stream.index}`, "-scodec srt"])
          // Set hide output except progress stats
          .outputOptions(["-stats", "-loglevel quiet"])
          // Output message on start
          .on("start", (command) => log.info(command))
          // Output message on error
          .on("stderr", (err) => log.error(err))
          .on("progress", (progress) =>
            printProgress(progress, this.inputStreams.video[0], stream.index)
          )
          // Handle errors
          .on("error", (err) =>
            reject(log.error("Error extracting subtitles:", err))
          )
          // Output message on success
          .on("end", () =>
            resolve(log.success("Subtitles extracted successfully."))
          )
          // Save the subtitle to the output file
          .save(outputFile);
      })
    );
  }

  /**
   * Runs the ffmpeg command.
   */
  async run() {
    const { convertVideo } = this.convertOpts;

    // Wrap ffmpeg call in promise
    await new Promise((resolve, reject) => {
      // Map video stream
      this.ffmpegProcess
        .outputOptions("-map 0:v")
        // If converting video, set codec to h265, otherwise copy
        .videoCodec(convertVideo ? "hevc" : "copy")
        // Set subtitle codec to copy
        .outputOptions("-scodec copy")
        // Set global language
        .outputOptions([`-metadata`, `language=eng`])
        // Set video language
        .outputOptions([`-metadata:s:v:0`, `language=eng`])
        // Blank video title
        .outputOptions([`-metadata:s:v:0`, `title=`])
        // Output command on start
        .on("start", (command) => log.info(command))
        // Output message on error
        .on("stderr", (err) => log.error(err))
        // Output message on progress
        .on("progress", (progress) =>
          printProgress(progress, this.inputStreams.video[0])
        )
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

// SubtitleExtractor.js
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import log from "./logger/logger.js";

/** @typedef {import('../@types/subtitle-stream.js').SubtitleStream} SubtitleStream */

// Supported subtitle formats
export const textSubs = ["subrip", "ass", "ssa"];

/**
 * Returns only image-based subtitle streams.
 * @param {Array<SubtitleStream>} streams - All input subtitle streams.
 * @returns {Array<SubtitleStream>} Image-based subtitle streams.
 */
export const getImageSubtitles = (streams) =>
  streams.filter((stream) => !textSubs.includes(stream.codecName));

/**
 * Returns only text-based subtitle streams.
 * @param {Array<SubtitleStream>} streams - All input subtitle streams.
 * @returns {Array<SubtitleStream>} Text-based subtitle streams.
 */
export const getTextSubtitles = (streams) =>
  streams.filter((stream) => textSubs.includes(stream.codecName));

/**
 * Returns a SubtitleStream object for the given input stream from ffprobe.
 * @param {any} stream - The stream to process.
 * @param {number} index - The index of the subtitle stream.
 * @returns {SubtitleStream} SubtitleStream object.
 */
export const getSubtitleStreamData = (stream, index) => {
  const formattedCodecName = stream.codec_long_name
    .replace("SubRip subtitle", "SubRip")
    .replace(/HDMV.*/, "HDMV PGS subtitles");

  return {
    lang: stream.tags?.language || "",
    title: stream.tags?.title || "",
    codecName: `${stream.codec_name}`,
    formattedCodecName,
    index,
  };
};

/**
 * Gets subtitle from specified input file.
 * @param {string} inputFilePath - Path to input file.
 * @param {SubtitleStream} stream - Stream being extracted.
 * @param {number} streamCount - Total number of text streams.
 */
export const extractSub = async (inputFilePath, stream, streamCount) => {
  // Get the subtitle file path
  const outputFile = getSubFilename(inputFilePath, stream, streamCount);

  await /** @type {Promise<void>} */ (
    new Promise((resolve, reject) => {
      // Extract subtitle using ffmpeg
      ffmpeg(inputFilePath, { logger: log })
        // Map subtitle
        .outputOptions([`-map 0:s:${stream.index}`, "-c:s srt"])
        // Set hide output except progress stats
        .outputOptions(["-stats", "-loglevel quiet"])
        // Output message on start
        .on("start", (command) => log.info(command))
        // Output message on progress
        .on("stderr", (err) => log.progress(err))
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
};

/**
 * Gets the output file based on the specified input file and stream.
 * @param {string} inputFile - The name of the input file.
 * @param {SubtitleStream} stream - The subtitle stream being extracted.
 * @param {number} streamCount - The number of streams to be extracted.
 * @returns {string} The output file.
 */
function getSubFilename(inputFile, stream, streamCount) {
  // Set base output file path to the input file path minus the extension
  let outputFile = path.join(
    path.dirname(inputFile),
    path.basename(inputFile, path.extname(inputFile))
  );

  // If there are multiple streams, append title (if set) or index to the output file name
  if (streamCount > 1 && stream.index !== 0) {
    outputFile += `.${stream.title ?? stream.index}`;
  }

  // Append ".eng.srt" to the output file name
  return `${outputFile}.${stream.lang}.srt`;
}

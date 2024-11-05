// SubtitleExtractor.js
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe";
import log from "./logger/logger.js";

/**
 * @typedef SubtitleStream
 * @property {string} lang - Language code of the subtitle.
 * @property {string} codecName - Codec name of subtitle.
 * @property {number} index - Index of subtitle.
 * @property {string} title - Title of subtitle stream.
 */

// Stream count for current input file
let streamCount = 0;

// Supported subtitle formats
export const textSubs = ["subrip", "ass", "ssa"];

/**
 * Gets subtitle streams from the input file.
 * @param {string} file - The input file path.
 * @param {string} type - If "image", get image subs. If "text", get text subs.
 * @returns {Promise<Array<SubtitleStream>>} Array of subtitle streams.
 */
export const getSubtitleStreams = async (file, type = "") => {
  // Get subtitle streams with ffprobe
  try {
    // Use ffprobe to get subtitle streams from the video file
    const video = await ffprobe(file, {
      path: "/usr/local/bin/ffprobe",
    });

    // Filter subtitle streams and return the English ones, along with their indices and codec names.
    const streams = video.streams
      // Filter out non-subtitle streams.
      // @ts-ignore
      .filter((stream) => stream.codec_type === "subtitle")
      // Map subtitle streams to an array of objects containing language, codec name, and subtitle index.
      .map((stream, index) => {
        const subtitleStream = {
          lang: stream.tags?.language || "",
          title: stream.tags?.title || "",
          codecName: stream.codec_name || "",
          index,
        };
        log.debug("subtitle stream:", subtitleStream);
        return subtitleStream;
      })
      // Filter out subtitle streams that are not in English and don't match the arguments passed
      .filter(
        (stream) =>
          stream.lang === "eng" &&
          ((type === "text" && textSubs.includes(stream.codecName)) ||
            (type === "image" && !textSubs.includes(stream.codecName)))
      );

    // Return data for the matching streams
    return streams;
  } catch (err) {
    log.error("Error getting ffprobe data:", err);
    process.exit(1);
  }
};

/**
 * Extract English subtitles from a video file.
 * @param {string} inputFilePath - Path to the input video file.
 * @param {boolean=} exitIfNotFound - Whether to exit if no subtitles were found.
 */
export const extractSubs = async (inputFilePath, exitIfNotFound) => {
  // Get subtitle streams from the video file
  const streams = await getSubtitleStreams(inputFilePath, "text");
  log.debug(streams);

  // If no English subtitles were found, exit the program
  if (streams.length === 0) {
    const msg = `No text English subtitles were found in the video file.`;
    if (exitIfNotFound) {
      log.error(msg);
      process.exit(1);
    }

    log.warn(msg);
  }

  // Set stream count on module global.
  streamCount = streams.length;

  // Walk through subtitle streams and extract each.
  for (const stream of streams) {
    // eslint-disable-next-line no-await-in-loop
    await extractSubtitle(inputFilePath, stream);
  }
};

/**
 * Gets subtitle from specified input file.
 * @param {string} inputFilePath - Path to input file.
 * @param {SubtitleStream} stream - Stream being extracted.
 */
async function extractSubtitle(inputFilePath, stream) {
  // Get the subtitle file path
  const outputFile = getOutputFilename(inputFilePath, stream);

  // Extract the subtitle using ffmpeg and save it to the output file
  await /** @type {Promise<void>} */ (
    new Promise((resolve, reject) => {
      ffmpeg(inputFilePath, { logger: log })
        // Map subtitle
        .outputOptions([`-map 0:s:${stream.index}`, "-c:s srt"])
        // Set hide output except progress stats
        .outputOptions(["-stats", "-loglevel quiet"])
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
}

/**
 * Gets the output file based on the specified input file and stream.
 * @param {string} inputFile - The name of the input file.
 * @param {SubtitleStream} stream - The subtitle stream being extracted.
 * @returns {string} The output file.
 */
function getOutputFilename(inputFile, stream) {
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

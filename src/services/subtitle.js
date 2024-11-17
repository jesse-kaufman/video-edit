/**
 * @file Subtitle stream service.
 */

import path from "node:path";

/** @typedef {import('../@types/subtitle-stream.js').SubtitleStream} SubtitleStream */

/** Text subtitle formats. */
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
 * @param {number} index - The index of the subtitle stream in the file.
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
 * Gets the output file based on the specified input file and stream.
 * @param {string} inputFile - The name of the input file.
 * @param {SubtitleStream} stream - The subtitle stream being extracted.
 * @param {number} streamCount - The number of streams to be extracted.
 * @returns {string} The output file.
 */
export const getSubFilename = (inputFile, stream, streamCount) => {
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
};

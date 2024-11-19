/**
 * @file Subtitle stream service.
 * @typedef {import('../../@types/streams.js').SubtitleStream} SubtitleStream
 */

import path from "node:path"

/** Text subtitle formats. */
export const textSubTypes = ["mov_text", "subrip", "ass", "ssa"]

/**
 * Returns only image-based subtitle streams.
 * @param {Array<SubtitleStream>} streams - All input subtitle streams.
 * @returns {Array<SubtitleStream>} Image-based subtitle streams.
 */
export const getImageSubtitles = (streams) =>
  streams.filter((stream) => !textSubTypes.includes(stream.codecName))

/**
 * Returns only text-based subtitle streams.
 * @param {Array<SubtitleStream>} streams - All input subtitle streams.
 * @returns {Array<SubtitleStream>} Text-based subtitle streams.
 */
export const getTextSubtitles = (streams) =>
  streams.filter((stream) => textSubTypes.includes(stream.codecName))

/**
 * Returns a SubtitleStream object for the given input stream from ffprobe.
 * @param {any} stream - The stream to process.
 * @param {number} index - The index of the subtitle stream in the file.
 * @returns {SubtitleStream} SubtitleStream object.
 */
export const getSubtitleStreamData = (stream, index) => {
  const formattedCodecName = stream.codec_long_name
    .replace("SubRip subtitle", "SubRip")
    .replace(/HDMV.*/, "HDMV PGS subtitles")

  return {
    lang: stream.tags?.language || "",
    title: stream.tags?.title?.trim() || "",
    codecName: `${stream.codec_name}`,
    formattedCodecName,
    index,
  }
}

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
  )

  // If there are multiple streams, append title (if set) or index to the output file name
  if (streamCount > 1 && stream.index !== 0) {
    outputFile += `.${stream.title || stream.index}`
  }

  // Append ".eng.srt" to the output file name
  return `${outputFile}.${stream.lang}.srt`
}

/**
 * Map image-based English subtitles.
 * @param {import('fluent-ffmpeg').FfmpegCommand} ffmpegProcess - Fluent-ffmpeg instance.
 * @param {Array<SubtitleStream>} streams - Array of subtitle streams from ffprobe.
 * @returns {Array<SubtitleStream>} An array of mapped subtitle streams.
 */
export const mapImageSubs = (ffmpegProcess, streams) => {
  // Grab image-based English subtitle streams
  const imageSubs = getImageSubtitles(streams).filter(
    (sub) => sub.lang === "eng"
  )

  // Map subtitle streams and set metadata
  imageSubs.forEach((/** @type {SubtitleStream} */ sub) => {
    ffmpegProcess
      // Map subtitle stream and set codec to copy
      .outputOptions(["-map", `0:s:${sub.index}`])

    // Set subtitle stream title
    if (sub?.title !== "") {
      console.log("Subtitle title already set: `", sub.title.trim(), "`")
      ffmpegProcess.outputOptions([
        `-metadata:s:s:${sub.index}`,
        `title=${sub.title}  `,
      ])
    }
  })

  return imageSubs
}

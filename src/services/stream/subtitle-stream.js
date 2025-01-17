/**
 * @file Subtitle stream service.
 * @typedef {import('../../@types/streams.js').SubtitleStream} SubtitleStream
 */

/** Text subtitle formats. */
export const textSubTypes = ["mov_text", "subrip", "ass", "ssa"]

/**
 * Returns only image-based subtitle streams.
 * @param {Array<SubtitleStream>} streams - All input subtitle streams.
 * @returns {Array<SubtitleStream>} Image-based subtitle streams.
 */
export const getImageSubtitles = (streams) =>
  streams.filter(
    (stream) =>
      !textSubTypes.includes(stream.codecName) &&
      stream.codecName !== "hdmv_pgs_subtitle"
  )

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
    .replace(/HDMV.*/, "PGS subtitle")

  return {
    lang: stream.tags?.language,
    title: stream.tags?.title?.trim() || "",
    codecName: `${stream.codec_name}`,
    origTitle: stream.tags?.title?.trim() || "",
    formattedCodecName,
    index,
  }
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
    (sub) => sub.lang === "eng" || sub.lang === undefined
  )

  // Map subtitle streams and set metadata
  imageSubs.forEach((/** @type {SubtitleStream} */ sub, i) => {
    ffmpegProcess
      // Map subtitle stream and set codec to copy
      .outputOptions(["-map", `0:s:${sub.index}`])
      .outputOptions(`-c:s:${i} copy`)

    // Set subtitle stream title
    if (sub?.title?.trim() !== "") {
      ffmpegProcess.outputOptions([
        `-metadata:s:s:${i}`,
        `title=${sub.title}  `,
      ])
    }
  })

  return imageSubs
}

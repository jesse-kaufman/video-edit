/**
 * @file Video stream service.
 * @typedef {import('../../@types/streams.js').VideoStream} VideoStream
 */

/**
 * Sets up VideoStream based on ffprobe stream data.
 * @param {any} stream - The video stream object from ffprobe.
 * @param {number} index - The index of the video stream in the file.
 * @returns {VideoStream} The audio stream object.
 */
export const getVideoStreamData = (stream, index) => {
  let formattedCodecName = stream.codec_long_name.replace(/\(.*\)/, "")
  const frameRateParts = stream.r_frame_rate.split("/")
  // eslint-disable-next-line no-magic-numbers
  const fps = parseFloat((frameRateParts[0] / frameRateParts[1]).toFixed(2))

  // If formatted codec contains " / ", grab the text before it as the codec name
  if (formattedCodecName.match(" / ")) {
    formattedCodecName = formattedCodecName.split(" / ")[0]
  }

  // Setup video stream object with blank title.
  return {
    lang: stream.tags?.language || "eng",
    codecName: stream.codec_name || "",
    formattedCodecName,
    resolution: `${stream.width}x${stream.height}`,
    fps,
    title: "",
    index,
  }
}

/**
 * Maps video stream(s).
 * @param {import('fluent-ffmpeg').FfmpegCommand} ffmpegProcess - The fluent-ffmpeg object.
 * @param {Array<VideoStream>} inputStreams - Video streams from input file.
 * @param {boolean} [convertVideo] - True to convert video stream, otherwise copy.
 * @returns {Array<VideoStream>} Array of mapped video streams.
 */
export const mapVideoStreams = (ffmpegProcess, inputStreams, convertVideo) => {
  // Add video stream(s) to outputStreams property
  const outputStreams = inputStreams

  ffmpegProcess
    // Map video stream
    .outputOptions("-map 0:v:0")
    // If converting video, set codec to h265, otherwise copy
    .videoCodec(convertVideo ? "hevc" : "copy")
    // Set video language
    .outputOptions([`-metadata:s:v:0`, `language=eng`])
    // Blank video title
    .outputOptions([`-metadata:s:v:0`, `title=`])

  return outputStreams
}

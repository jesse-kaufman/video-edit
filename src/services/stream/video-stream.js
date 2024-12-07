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
    // Set video language
    .outputOptions([`-metadata:s:v:0`, `language=eng`])

  setVideoConvertOpts(ffmpegProcess, streams[0], convertVideo)

  return outputStreams
}

/**
 * Sets video conversion options.
 * @param {import('fluent-ffmpeg').FfmpegCommand} ffmpegProcess - The fluent-ffmpeg object.
 * @param {VideoStream} stream - Video stream from input file.
 * @param {boolean} [convertVideo] - True to convert video stream, otherwise copy.
 * @returns {void}
 */
function setVideoConvertOpts(ffmpegProcess, stream, convertVideo) {
  // Add video options if converting video stream
  if (convertVideo && stream.codecName !== "hevc") {
    ffmpegProcess
      // Set codec to libx265
      .videoCodec("libx265")
      // Use slow preset
      .outputOptions(["-preset", "slow"])
      // Use CRF of 24 by default
      .outputOptions(["-crf", "24"])
      // Set pixel format to yuv420p10le for HEVC streams
      .outputOptions(["-pix_fmt:v:0", "yuv420p10le"])
      // Set HEVC profile to main10 for HEVC streams
      .outputOptions(["-profile:v:0", "main10"])
    return
  }

  // If not converting video, set video codec to copy
  ffmpegProcess
    // Set codec to libx265
    .videoCodec("copy")
}

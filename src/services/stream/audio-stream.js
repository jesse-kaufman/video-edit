/**
 * @file Audio stream service.
 */
import log from "../logger/logger.js"

/**
 * @typedef {import('../../@types/audio-stream.js').AudioStream} AudioStream
 * @typedef {import('fluent-ffmpeg').FfmpegCommand} FfmpegCommand
 */

/**
 * Sets up AudioStream based on ffprobe stream data.
 * @param {any} stream - The audio stream object from ffprobe.
 * @param {number} index - Index of audio stream within file.
 * @returns {AudioStream} The audio stream object.
 */
export const getAudioStreamData = (stream, index) => {
  const formattedCodecName = formatCodecName(stream.codec_long_name)
  const channelLayout = formatChannelLayout(
    stream.channel_layout || stream.channels
  )

  // Setup audio stream object with blank title to be filled in next.
  const audioStream = {
    lang: stream.tags?.language || "eng",
    origTitle: stream.tags?.title.trim() || "",
    codecName: `${stream.codec_name}`,
    formattedCodecName,
    channelLayout,
    title: "",
    index,
  }
  return {
    ...audioStream,
    title: formatStreamTitle(audioStream),
  }
}

/**
 * Formats the audio codec long name.
 * @param {string} name - Default long name from ffprobe.
 * @returns {string} Formatted long name.
 */
function formatCodecName(name) {
  let formattedCodecName = name.replace(/\(.*\)/, "").trim()

  if (formattedCodecName === "ATSC A/52B") {
    formattedCodecName = "AC3"
  }

  return formattedCodecName
}

/**
 * Gets title for audio stream.
 * @param {AudioStream} stream - The audio stream.
 * @returns {string} Title for audio stream.
 */
function formatStreamTitle(stream) {
  // If current stream is not the first, and stream has title, use that title
  if (stream.index > 0 && stream.origTitle !== "") {
    return stream.origTitle
  }

  /*
   * In all other cases, set title to "English - [channel layout]"
   * (where channel layout is "5.1", "2.0", "1.0", etc.)
   */
  const formattedChannelLayout = formatChannelLayout(stream.channelLayout)

  // Append " - Default" on first track, otherwise append space to prevent ffmpeg error 234
  const defaultString = stream.index === 0 ? " - Default" : " "

  return `${formattedChannelLayout}${defaultString}`
}

/**
 * Gets formatted channel layout for a given stream.
 * @param {string} channelLayout - The channel layout from ffprobe.
 * @returns {string} Formatted channel layout.
 */
function formatChannelLayout(channelLayout) {
  log.debug("Channel layout:", channelLayout)
  // Extract channel layout from stream, stripping out anything in parentheses
  const channels = channelLayout.toString().replace(/\(.*\)/, "")

  // Replace surround channel layouts with friendlier names
  if (channels === "5.1") return "5.1 Surround"
  if (channels === "7.1") return "7.1 Surround"

  // Default to channel layout with initial caps
  return `${channels.slice(0, 1).toUpperCase()}${channels.slice(1)}`
}

/**
 * Sets the audio codec based on if we're converting and if libfdk_aac is available.
 * @param {FfmpegCommand} fluentFfmpeg - Fluent ffmpeg object.
 * @param {boolean|undefined} convert - Whether or not to convert the audio stream.
 * @returns {string} The audio codec to use.
 */
export const getOutputAudioCodec = (fluentFfmpeg, convert) => {
  // Copy audio stream unless we're converting
  if (convert !== true) return "copy"

  // Default to aac codec
  let codec = "aac"

  // Check if libfdk_aac is available and use it if available
  fluentFfmpeg.getAvailableEncoders((err, encoders) => {
    if (err) {
      log.error("Error getting available encoders:", err)
      process.exit(1)
    }

    // Use libfdk_aac if available
    if (encoders?.libfdk_aac?.type === "audio") {
      codec = "libfdk_aac"
    }
  })

  return codec
}

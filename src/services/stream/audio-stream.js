/**
 * @file Audio stream service.
 * @typedef {import('../../@types/streams.js').AudioStream} AudioStream
 * @typedef {import('fluent-ffmpeg').FfmpegCommand} FfmpegCommand
 */

import log from "../logger.js"

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
    origTitle: stream.tags?.title?.trim() || "",
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
  const formattedCodecName = name.replace(/\(.*\)/, "").trim()

  // Use AC3 for ATSC A/52B codec
  return formattedCodecName === "ATSC A/52B" ? "AC3" : formattedCodecName
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
  const formattedChannelLayout = stream.channelLayout

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
  if (channels === "6" || channels === "5.1") return "5.1 Surround"
  if (channels === "7.1") return "7.1 Surround"

  // Default to channel layout with initial caps
  return `${channels.slice(0, 1).toUpperCase()}${channels.slice(1)}`
}

/**
 * Sets the audio codec based on if we're converting and if libfdk_aac is available.
 * @param {FfmpegCommand} fluentFfmpeg - Fluent ffmpeg object.
 * @param {string} currentCodec - The audio codec of the current stream.
 * @param {boolean|undefined} convert - Whether or not to convert the audio stream.
 * @returns {Promise<string>} The audio codec to use.
 */
export const getOutputAudioCodec = async (
  fluentFfmpeg,
  currentCodec,
  convert
) => {
  // Copy audio stream unless we're converting
  if (convert !== true) return "copy"

  // Copy if already AAC
  if (currentCodec === "aac") return "copy"

  // Check if libfdk_aac is available
  const codec = await new Promise((resolve, reject) => {
    fluentFfmpeg.getAvailableEncoders((err, availableEncoders) => {
      if (err) reject(log.fail("Error getting available encoders:", err))

      // If libfdk_aac is available, use it
      if (availableEncoders.libfdk_aac.type === "audio") {
        log.debug("Using libfdk_aac codec")
        resolve("libfdk_aac")
      }

      // Default audio codec to aac
      resolve("aac")
    })
  })

  return codec
}

/**
 * Maps audio streams in fluent-ffmpeg and returns array of mapped streams.
 * @param {FfmpegCommand} ffmpegProcess - Fluent-ffmpeg object.
 * @param {Array<AudioStream>} streams - Audio streams from ffprobe.
 * @param {boolean} [convertAudio] - True to convert audio stream, otherwise copy.
 * @returns {Array<AudioStream>} Array of audio stream objects.
 */
export const mapAudioStreams = (ffmpegProcess, streams, convertAudio) => {
  // Filter out non-English audio streams from input file
  const outputStreams = streams.filter((s) => s.lang === "eng")

  // Process each audio stream
  streams.forEach(async (stream) => {
    // Get the audio codec to use based on the source codec and the stream should be converted
    const codec = await getOutputAudioCodec(
      ffmpegProcess,
      stream.codecName,
      convertAudio
    )

    // Map audio stream
    ffmpegProcess
      .outputOptions("-map", `0:a:${stream.index}`)
      // Set audio stream codec
      .outputOptions(`-c:a ${codec}`)
      // Set audio stream language
      .outputOptions([`-metadata:s:a:${stream.index}`, `language=eng`])
      // Set audio stream title
      .outputOptions([
        `-metadata:s:a:${stream.index}`,
        `title=${stream.title}  `,
      ])
  })

  return outputStreams
}

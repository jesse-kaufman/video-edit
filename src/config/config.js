/**
 * @file Configuration.
 */

/** Whether or not to print debug messages to stdout. */
export const debug = process.env.DEBUG || false

/** True to print all the output from FFMPEG. */
export const extraDebug = process.env.EXTRA_DEBUG || false

/** Format to use for the container when saving a file. */
export const outputContainerFormat = "matroska"

/** Extension to use when saving a file. */
export const outputFileExt = "mkv"

/** Video codec to use when converting video stream. */
export const outputVideoCodec = "hevc"

/** Audio codec to use when converting audio stream. */
export const outputAudioCodec = "aac"

/**
 * Gets human-friendly names for codecs.
 * @param {string} codec - Codec from ffprobe/ffmpeg.
 * @returns {string} Human-friendly name.
 */
export const getCodecName = (codec) => {
  const codecNames = {
    hevc: "H.265",
    aac: "AAC",
  }

  // Return human-friendly name if available
  if (Object.prototype.hasOwnProperty.call(codecNames, codec)) {
    // @ts-ignore
    return codecNames[codec]
  }

  // Fall back to returning codec as-is
  return codec
}

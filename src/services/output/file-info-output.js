/**
 * @file File info output service.
 * @typedef {import("../ffprobe.js").FileInfo} FileInfo
 */
import bytes from "bytes"

/**
 * Prints input file information to console.
 * @param {import("../logger.js").Logger} log - Logger instance.
 * @param {string} file - Full path to input file.
 * @param {number} size - File size in bytes.
 * @param {import("../../@types/streams.js").Streams} streams - Information to print.
 */
export const printInputFileInfo = (log, file, size, streams) => {
  log.info("--------------------------------")
  log.notice("Input file info:")
  log.info("--------------------------------")
  printInfo(log, file, size, streams)
}

/**
 * Prints output file information to console.
 */
export const printOutputFileInfo = () => {}

/**
 * Prints file information to console.
 * @param {import("../logger.js").Logger} log - Logger instance.
 * @param {string} file - Full path to input file.
 * @param {number} size - File size in bytes.
 * @param {import("../../@types/streams.js").Streams} streams - Information to print.
 */
function printInfo(log, file, size, streams) {
  const { video, audio, subtitle } = streams
  const fileSize = bytes(size).toString()

  log.info(file)

  // Print file size
  log.info(`File size: ${fileSize}`)

  // Print video stream information
  log.info(`Video: ${video[0].formattedCodecName} @ ${video[0].fps}FPS`)

  // Print audio stream information
  log.info(`Audio (${audio.length} streams):`)
  audio.forEach((stream) => {
    const { index, formattedCodecName, channelLayout, lang, title } = stream
    log.info(
      `- Stream ${index}: [${lang}] ${title} (${channelLayout} / ${formattedCodecName})`
    )
  })

  // Print subtitle stream information
  if (subtitle.length > 0) {
    log.info(`Subtitles (${subtitle.length}):`)
    subtitle.forEach((stream) => {
      const { index, formattedCodecName, lang } = stream
      log.info(`Stream ${index} - [${lang}] ${formattedCodecName}`)
    })
  }
}

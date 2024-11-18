/** @file Stream service. */

/** @typedef {import("../../@types/streams.js").Streams} Streams */

import { getAudioStreamData } from "./audio-stream.js"
import { getVideoStreamData } from "./video-stream.js"
import { getSubtitleStreamData } from "./subtitle-stream.js"

/**
 * Sets up audio, video, and subtitle stream properties.
 * @param {Array<any>} streams - Input streams from ffprobe.
 * @returns {Streams} - Streams from ffprobe.
 */
export const getInputStreams = (streams) => {
  /** @type {Streams} - Input streams to be returned. */
  const inputStreams = {
    audio: [],
    video: [],
    subtitle: [],
  }

  streams.forEach((stream) => {
    switch (stream.codec_type) {
      // Push data for audio stream to inputStreams
      case "audio":
        inputStreams.audio.push(
          getAudioStreamData(stream, inputStreams.audio.length)
        )
        break

      // Push data for video stream to inputStreams
      case "video":
        inputStreams.video.push(
          getVideoStreamData(stream, inputStreams.video.length)
        )
        break

      // Push data for subtitle stream to inputStreams
      case "subtitle":
        inputStreams.subtitle.push(
          getSubtitleStreamData(stream, inputStreams.subtitle.length)
        )
        break
    }
  })

  return inputStreams
}

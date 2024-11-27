/**
 * @file Stream service.
 * @typedef {import("../../@types/streams.js").Streams} Streams
 * @typedef {import("../../@types/convert-opts.js").ConvertOpts} ConvertOpts
 */

import { getAudioStreamData, mapAudioStreams } from "./audio-stream.js"
import { getVideoStreamData, mapVideoStreams } from "./video-stream.js"
import { getSubtitleStreamData, mapImageSubs } from "./subtitle-stream.js"

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

/**
 * Map all streams to output file and store results in outputStream property.
 * @param {import('fluent-ffmpeg').FfmpegCommand} ffmpeg - Fluent-ffmpeg instance.
 * @param {Streams} streams - Input file streams.
 * @param {ConvertOpts} opts - Options.
 * @returns {Promise<Streams>} Mapped outbut streams.
 */
export const mapStreams = (ffmpeg, streams, opts) => {
  const { convertVideo, convertAudio } = opts
  const { video, audio, subtitle } = streams

  // Map video stream(s)
  const outputVideo = mapVideoStreams(ffmpeg, video, convertVideo)
  // Map audio streams
  const outputAudio = mapAudioStreams(ffmpeg, audio, convertAudio)
  // Map image-based English subtitles
  const outputSubtitle = mapImageSubs(ffmpeg, subtitle)

  return {
    video: outputVideo,
    audio: outputAudio,
    subtitle: outputSubtitle,
  }
}

/** @file Type definition for Streams service. */

/**
 * @typedef {import('./video-stream.js').VideoStream} VideoStream
 * @typedef {import('./audio-stream.js').AudioStream} AudioStream
 * @typedef {import('./subtitle-stream.js').SubtitleStream} SubtitleStream
 */

/**
 * @typedef Streams
 * @property {Array<AudioStream>} audio - Audio streams from ffmpeg.
 * @property {Array<VideoStream>} video - Video streams from ffmpeg.
 * @property {Array<SubtitleStream>} subtitle - Subtitle streams from ffmpeg.
 */

export default {}

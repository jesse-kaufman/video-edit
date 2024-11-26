/** @file Type definitions for stream service. */

/**
 * @typedef {object} Streams
 * @property {Array<AudioStream>} audio - Audio streams from ffmpeg.
 * @property {Array<VideoStream>} video - Video streams from ffmpeg.
 * @property {Array<SubtitleStream>} subtitle - Subtitle streams from ffmpeg.
 */

/**
 * @typedef {object} VideoStream
 * @property {string} lang - Language code of the video stream.
 * @property {string} codecName - Codec name of video stream.
 * @property {string} formattedCodecName - Long name of codec.
 * @property {string} [profile] - Codec profile.
 * @property {number} fps - FPS of video stream.
 * @property {number} index - Index of video stream.
 * @property {string} title - Title of video stream.
 * @property {string} resolution - Resolution of video stream.
 */

/**
 * @typedef {object} AudioStream
 * @property {string} lang - Language code of the audio.
 * @property {string} codecName - Codec name of audio.
 * @property {string} formattedCodecName - Long name of codec.
 * @property {number} index - Index of audio.
 * @property {string} origTitle - Original title of audio stream.
 * @property {string} title - Title of audio stream.
 * @property {string} channelLayout - Channel layout of audio stream.
 * @property {number} channelCount - Number of channels in audio stream.
 */

/**
 * @typedef {object} SubtitleStream
 * @property {string} lang - Language code of the subtitle.
 * @property {string} codecName - Codec name of subtitle.
 * @property {string} formattedCodecName - Long name of codec.
 * @property {number} index - Index of subtitle.
 * @property {string} title - Title of subtitle stream.
 */

export default {}

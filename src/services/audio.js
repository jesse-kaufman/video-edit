import { promisify } from "node:util";
import ffprobe from "ffprobe";
import log from "./logger/logger.js";

/**
 * @typedef {import('../@types/audio-stream.js').AudioStream} AudioStream
 * @typedef {import('fluent-ffmpeg').FfmpegCommand} FfmpegCommand
 */

/**
 * Gets audio streams from the input file.
 * @param {string} file - The input file path.
 * @returns {Promise<Array<AudioStream>>} Array of audio streams.
 */
export const getAudioStreams = async (file) => {
  // Get audio streams with ffprobe
  try {
    // Use ffprobe to get audio streams from the video file
    const video = await ffprobe(file, {
      path: "/usr/local/bin/ffprobe",
    });

    // Filter audio streams and return the English ones, along with their indices and codec names.
    const streams = video.streams.filter((s) => s.codec_type === "audio");

    const mappedStreams = streams
      .map((stream, index) => {
        // Setup audio stream object with blank title to be filled in next.
        const audioStream = {
          lang: stream.tags?.language || "eng",
          origTitle: stream.tags?.title || "",
          codecName: stream.codec_name || "",
          channelLayout: stream.channel_layout || "",
          title: "",
          index,
        };

        return { ...audioStream, title: generateStreamTitle(audioStream) };
      })
      // Filter out English audio streams
      .filter((s) => s.lang === "eng");

    log.debug("streams", mappedStreams);

    // If no English audio streams were found, exit the program
    if (mappedStreams.length === 0) {
      log.error("No English audio streams found in the video file.");
      process.exit(1);
    }

    // Return data for the matching streams
    return mappedStreams;
  } catch (err) {
    log.error("Error getting ffprobe data:", err);
    process.exit(1);
  }
};

/**
 * Gets title for audio stream.
 * @param {AudioStream} stream - The audio stream.
 * @returns {string} Title for audio stream.
 */
function generateStreamTitle(stream) {
  // If current stream is not the first, and stream has title, use that title
  if (stream.index > 0 && stream.origTitle !== "") {
    return stream.origTitle;
  }

  /*
   * In all other cases, set title to "English - [channel layout]"
   * (where channel layout is "5.1", "2.0", "1.0", etc.)
   */
  const formattedChannelLayout = getFormattedChannelLayout(stream);

  // Append " - Default" on first track, otherwise append space to prevent ffmpeg error 234
  const defaultString = stream.index === 0 ? " - Default" : " ";

  return `${formattedChannelLayout}${defaultString}`;
}

/**
 * Gets formatted channel layout for a given stream.
 * @param {AudioStream} stream - The audio stream.
 * @returns {string} Formatted channel layout.
 */
function getFormattedChannelLayout(stream) {
  // Extract channel layout from stream, stripping out anything in parentheses
  const channels = stream.channelLayout.replace(/\(.*\)/, "");

  // Replace surround channel layouts with friendlier names
  if (channels === "5.1") return "5.1 Surround";
  if (channels === "7.1") return "7.1 Surround";

  // Default to channel layout with initial caps
  return `${channels.slice(0, 1).toUpperCase()}${channels.slice(1)}`;
}

/**
 * Checks if libfdk_aac is available.
 * @param {FfmpegCommand} ffmpegProcess - The fluent-ffmpeg object.
 * @returns {Promise<boolean>} True if libfdk_aac is available.
 */
export const isLibfdkAvailable = async (ffmpegProcess) => {
  // Promisify getAvailableEncoders method from fluent-ffmpeg
  const getAvailableEncodersAsync = promisify(
    ffmpegProcess.getAvailableEncoders
  );

  // Get available encoders
  const encoders = await getAvailableEncodersAsync();

  if (encoders?.libfdk_aac?.type === "audio") {
    // The libfdk_aac encoder is available
    return true;
  }

  // The libfdk_aac encoder is NOT available
  return false;
};

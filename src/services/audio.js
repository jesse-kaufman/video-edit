import ffprobe from "ffprobe";

/**
 * @typedef AudioStream
 * @property {string} lang - Language code of the audio.
 * @property {string} codecName - Codec name of audio.
 * @property {number} index - Index of audio.
 * @property {string} origTitle - Original title of audio stream.
 * @property {string} title - Title of audio stream.
 * @property {string} channelLayout - Channel layout of audio stream.
 */

// Stores count of audio streams in file
let streamCount = 0;

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
    const streams = video.streams.filter(
      (s) => s.codec_type === "audio" && s.tags?.language === "eng"
    );

    // Update the stream count on module global variable
    streamCount = streams.length;

    const mappedStreams = streams.map((stream, index) => {
      // Setup audio stream object with blank title to be filled in next.
      const audioStream = {
        lang: stream.tags?.language || "",
        origTitle: stream.tags?.title || "",
        codecName: stream.codec_name || "",
        channelLayout: stream.channel_layout || "",
        title: "",
        index,
      };

      return { ...audioStream, title: getStreamTitle(audioStream) };
    });

    console.log("streams", mappedStreams);
    // Return data for the matching streams
    return mappedStreams;
  } catch (err) {
    console.error("Error getting ffprobe data:", err);
    process.exit(1);
  }
};

/**
 * Gets title for audio stream.
 * @param {AudioStream} stream - The audio stream.
 * @returns {string} Title for audio stream.
 */
function getStreamTitle(stream) {
  // If more than one stream, current stream is not the first, and stream has title, use the title
  if (streamCount > 1 && stream.index > 0 && stream.origTitle !== "") {
    return stream.origTitle;
  }

  // In all other cases, return "English - [channels]" where channels is "5.1", "2.0", "1.0", etc.
  return formatChannelLayout(stream.channelLayout);
}

/**
 * Formats channel layout for audio stream title.
 * @param {string} channelLayout - Channel layout from ffmpeg.
 * @returns {string} Formatted channel layout.
 */
function formatChannelLayout(channelLayout) {
  // Extract channel layout from stream, stripping out anything in parentheses
  const channels = channelLayout.replace(/\(.*\)/, "");

  // Replace common channel layouts with proper names
  if (channels === "5.1") return "5.1 Surround ";
  if (channels === "7.1") return "7.1 Surround ";

  // Default to channel layout with initial caps
  return channels.slice(0, 1).toUpperCase() + channels.slice(1);
}

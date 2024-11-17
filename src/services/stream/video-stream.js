/**
 * @file Video stream service.
 */

/** @typedef {import('../../@types/video-stream.js').VideoStream} VideoStream */

/**
 * Sets up VideoStream based on ffprobe stream data.
 * @param {any} stream - The video stream object from ffprobe.
 * @param {number} index - The index of the video stream in the file.
 * @returns {VideoStream} The audio stream object.
 */
export const getVideoStreamData = (stream, index) => {
  let formattedCodecName = stream.codec_long_name.replace(/\(.*\)/, "");
  const frameRateParts = stream.r_frame_rate.split("/");
  const fps = parseFloat((frameRateParts[0] / frameRateParts[1]).toFixed(2));

  // If formatted codec contains " / ", grab the text before it as the codec name
  if (formattedCodecName.match(" / ")) {
    [formattedCodecName] = formattedCodecName.split(" / ");
  }

  // Setup video stream object with blank title.
  return {
    lang: stream.tags?.language || "eng",
    codecName: stream.codec_name || "",
    formattedCodecName,
    resolution: `${stream.width}x${stream.height}`,
    fps,
    title: "",
    index,
  };
};
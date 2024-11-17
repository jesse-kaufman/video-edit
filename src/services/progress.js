/** @file Helpers for printing progress to console. */

import log from "./logger/logger.js";

/**
 * @typedef {import ("../@types/video-stream.js").VideoStream} VideoStream
 */

/**
 * Gets FPS information for progress reporting.
 * @param {number} fps - The current framerate of the ffmpeg process.
 * @returns {string} Formatted FPS information.
 */
const formatFps = (fps) => (isNaN(fps) ? "" : `FPS=${fps}`);

/**
 * Gets size information for progress reporting.
 * @param {number} size - The current size of the output file.
 * @returns {string} Formatted size information.
 */
const formatCurrentSize = (size) => (isNaN(size) ? "" : `(${size} KiB)`);

/**
 * Rounds percent to one decimal point and appends percent sign.
 * @param {number} pct - Percent of progress.
 * @returns {string} Formatted progress percentage.
 */
const formatPercent = (pct) => (isNaN(pct) ? "" : `${pct?.toFixed(1)}%`);

/**
 * Gets speed information for progress reporting.
 * @param {number} videoFps - FPS of the source video.
 * @param {number} currentFps - Current processing FPS.
 * @returns {string} Formatted speed information.
 */
const formatSpeed = (videoFps, currentFps) =>
  isNaN(currentFps) ? "" : `@ ${(currentFps / videoFps).toFixed()}x`;

/**
 * Gets details for progress output.
 * @param {any} progress - The progress object from ffmpeg.
 * @param {VideoStream} videoStream - The video stream data of the input file.
 * @returns {Array<string>} The progress details parts.
 */
export const getDetailParts = (progress, videoStream) => {
  const parts = [];

  // Add FPS information to progress output
  parts.push(formatFps(progress.currentFps));
  // Add filesize to progress output
  parts.push(formatCurrentSize(progress.targetSize));
  // Add timestamp to progress output
  parts.push(progress.currentTime || "");
  // Add speed information to progress output
  parts.push(formatSpeed(videoStream.fps, progress.currentFps));
  // Return non-empty parts.
  return parts.filter((part) => part !== "");
};

/**
 * Prints progress information to console.
 * @param {any} progress - Progress data from ffmpeg.
 * @param {VideoStream} videoStream - The main video stream of file.
 * @param {?number} index - Index of subtitle if extracting subtitles.
 */
export const printProgress = (progress, videoStream, index = null) => {
  let progressTitle = "Clean/convert";

  // Format percent
  const percent = formatPercent(progress.percent);

  // If index is set progress data is for subtitle extract
  if (index !== null) progressTitle = `Subtitle extract #${index}`;

  // Get progress details
  const details = getDetailParts(progress, videoStream).join(" ");

  // Print progress to console
  log.progress(`[${percent}] ${progressTitle}: ${details}`);
};

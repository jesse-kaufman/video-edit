/**
 * Functions to check stream and container for compliance.
 * @file File check service.
 */

import { textSubTypes } from "./stream/subtitle-stream.js"

/**
 * Returns true if the stream needs attention.
 * Stream needs attention if:
 * - Language is not English.
 * - Codec is not AAC (if audio track).
 * - Codec is SubRip (if subtitle).
 * @param {string} lang - Language of stream.
 * @param {string} codec - Codec name of stream.
 * @param {string} type - Type of stream (audio or subtitle).
 * @returns {boolean} True if stream needs attention.
 */
export const streamNeedsAttention = (lang, codec, type) =>
  lang !== "eng" ||
  (type === "audio" && codec !== "aac") ||
  (type === "subtitle" && textSubTypes.includes(codec))

/**
 * Returns true if the container needs attention (it is not MP4).
 * @param {string} container - Container type of input file.
 * @returns {boolean} True if container needs attention, otherwise false.
 */
export const containerNeedsAttention = (container) => container !== "MP4"

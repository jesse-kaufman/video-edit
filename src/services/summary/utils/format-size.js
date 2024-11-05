const KB = 1024;
// eslint-disable-next-line no-magic-numbers
const MB = KB * 1024;
// eslint-disable-next-line no-magic-numbers
const GB = MB * 1024;

/**
 * Converts bytes to human-readable format, optionally with padding.
 * @param {number} bytes - Number of bytes to convert.
 * @param {number} places - Number of places to round.
 * @param {number} [padding] - Number of characters to pad.
 * @returns {string} Human-readable format of the size.
 */
const formatSize = (bytes, places, padding = 0) => {
  // Default to size in MB and set label to "MB"
  let size = bytes / MB;
  let label = "MB";

  // If size is greater than GB, convert to GB and update label
  if (bytes > GB) {
    size = bytes / GB;
    label = "GB";
  }

  // Round to specified number of decimal places and format as string
  const fsize = size.toFixed(places);

  // Add padding to size if specified
  const formattedSize = padding > 0 ? fsize.padStart(padding, ".") : fsize;

  // Return the formatted size with label (MB or GB)
  return `${formattedSize} ${label}`;
};

export default formatSize;

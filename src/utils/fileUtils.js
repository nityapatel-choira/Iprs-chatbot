/**
 * Converts a base64 encoded data URL to a File object.
 *
 * @param {string} dataUrl - The base64 encoded data URL.
 * @param {string} [filename="captured-photo.jpg"] - The name of the file to create.
 * @returns {File} The resulting File object.
 */
export function dataUrlToFile(dataUrl, filename = "captured-photo.jpg") {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

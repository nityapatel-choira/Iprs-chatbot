import { request, uploadRequest } from "./apiClient";

function sendMessage(message) {
  const body = { message: message ?? "" };
  return request("/conversation/message", { method: "POST", body });
}

function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  return uploadRequest("/conversation/upload", formData, onProgress);
}

export { sendMessage, uploadFile };

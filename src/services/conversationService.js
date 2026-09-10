import { request, uploadRequest } from "./apiClient";

function sendMessage(message) {
  const body = message ? { message } : {};
  return request("/conversation/message", { method: "POST", body });
}

function uploadFile(file, onProgress, onUploadComplete) {
  const formData = new FormData();
  formData.append("file", file);
  return uploadRequest("/conversation/upload", formData, onProgress, onUploadComplete);
}

export { sendMessage, uploadFile };

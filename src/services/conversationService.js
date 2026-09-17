import { request, uploadRequest } from "./apiClient";

function sendMessage(message) {
  const body = message ? { message } : {};
  return request("/conversation/message", { method: "POST", body });
}

function initiatePayment() {
  return request("/payment/initiate", {
    method: "POST",
    body: {},
  });
}

function uploadFile(file, onProgress, onUploadComplete) {
  const formData = new FormData();
  formData.append("file", file);
  return uploadRequest("/conversation/upload", formData, onProgress, onUploadComplete);
}

function checkPaymentStatus(txnId) {
  return request(`/payment/status/${txnId}`, { method: "GET" });
}

export { sendMessage, initiatePayment, uploadFile, checkPaymentStatus };

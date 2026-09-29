import { getToken, clearToken } from "./tokenStorage";
import { getLanguageCode } from "./languagePreference";
import { t } from "../i18n";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.iprs.choira.io";

class ApiError extends Error {
  constructor(message, { code, status, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let unauthorizedHandler = null;

function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

function handleUnauthorized(status, code) {
  if (status === 401 || code === "UNAUTHORIZED") {
    clearToken();
    unauthorizedHandler?.();
  }
}

function buildApiError(status, json, fallbackMessage) {
  const code = json?.error?.code;
  const message = json?.error?.message || fallbackMessage;
  handleUnauthorized(status, code);
  return new ApiError(message, { code, status, details: json?.error?.details });
}

async function parseEnvelope(res) {
  let json;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(t("Unexpected response from server."), { code: "PARSE_ERROR", status: res.status });
  }

  if (!res.ok || json?.success === false) {
    throw buildApiError(res.status, json, t("Something went wrong. Please try again."));
  }

  return json.data;
}

async function request(path, { method = "GET", body, headers } = {}) {
  const token = getToken();
  const finalHeaders = { "Content-Type": "application/json", ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  // The language the member picked on the first screen. The backend translates its
  // reply into it; without this header it answers in English, which is also what
  // happens for anyone who somehow reaches the chat without choosing.
  const language = getLanguageCode();
  if (language) finalHeaders["X-Language"] = language;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(t("Network error. Please check your connection and try again."), { code: "NETWORK_ERROR" });
  }

  return parseEnvelope(res);
}

function uploadRequest(path, formData, onProgress, onUploadComplete) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}${path}`);

    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    // Uploads answer with the next chat step, so they need the language too.
    const language = getLanguageCode();
    if (language) xhr.setRequestHeader("X-Language", language);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };

    xhr.upload.onload = () => {
      if (onUploadComplete) onUploadComplete();
    };

    xhr.onload = () => {
      let json;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        reject(new ApiError(t("Unexpected response from server."), { code: "PARSE_ERROR", status: xhr.status }));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && json?.success !== false) {
        resolve(json?.data !== undefined ? json.data : json);
        return;
      }

      reject(buildApiError(xhr.status, json, t("Upload failed. Please try again.")));
    };

    xhr.onerror = () => reject(new ApiError(t("Network error during upload."), { code: "NETWORK_ERROR" }));

    xhr.send(formData);
  });
}

export { request, uploadRequest, onUnauthorized, ApiError };

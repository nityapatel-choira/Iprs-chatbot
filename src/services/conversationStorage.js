const CHAT_HISTORY_KEY = "iprs_chat_history";
const CHAT_PROGRESS_KEY = "iprs_chat_progress";
const FRESH_LOGIN_KEY = "iprs_fresh_login";

function getStoredHistory() {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStoredHistory(history) {
  try {
    if (!Array.isArray(history)) return;
    const serializable = history.map((msg) => {
      if (msg && typeof msg === "object" && "rawFile" in msg) {
        const copy = { ...msg };
        delete copy.rawFile;
        return copy;
      }
      return msg;
    });
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore storage quota or serialization errors
  }
}

function getStoredProgress() {
  try {
    const raw = localStorage.getItem(CHAT_PROGRESS_KEY);
    if (!raw) return 0;
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  } catch {
    return 0;
  }
}

function setStoredProgress(progress) {
  try {
    if (typeof progress === "number" && Number.isFinite(progress)) {
      localStorage.setItem(CHAT_PROGRESS_KEY, String(progress));
    }
  } catch {
    // Ignore storage errors
  }
}

function setFreshLoginFlag() {
  try {
    sessionStorage.setItem(FRESH_LOGIN_KEY, "true");
  } catch {
    // Ignore
  }
}

function consumeFreshLoginFlag() {
  try {
    const isFresh = sessionStorage.getItem(FRESH_LOGIN_KEY) === "true";
    if (isFresh) {
      sessionStorage.removeItem(FRESH_LOGIN_KEY);
    }
    return isFresh;
  } catch {
    return false;
  }
}

function clearStoredConversation() {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
    localStorage.removeItem(CHAT_PROGRESS_KEY);
    sessionStorage.removeItem(FRESH_LOGIN_KEY);
  } catch {
    // Ignore
  }
}

export {
  getStoredHistory,
  setStoredHistory,
  getStoredProgress,
  setStoredProgress,
  setFreshLoginFlag,
  consumeFreshLoginFlag,
  clearStoredConversation,
};

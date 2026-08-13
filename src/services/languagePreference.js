const LANGUAGE_KEY = "iprs_language_code";

function getLanguageCode() {
  return localStorage.getItem(LANGUAGE_KEY);
}

function setLanguageCode(code) {
  localStorage.setItem(LANGUAGE_KEY, code);
}

function clearLanguageCode() {
  localStorage.removeItem(LANGUAGE_KEY);
}

export { getLanguageCode, setLanguageCode, clearLanguageCode };

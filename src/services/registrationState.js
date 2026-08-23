const REGISTRATION_COMPLETED_KEY = "iprs_registration_completed";

// Persisted so a refresh can show the completed UI instantly instead of
// waiting on a network round trip. The backend call still runs on refresh
// and remains the source of truth - this flag only controls the first paint.
function getRegistrationCompleted() {
  return localStorage.getItem(REGISTRATION_COMPLETED_KEY) === "true";
}

function setRegistrationCompleted(completed) {
  if (completed) {
    localStorage.setItem(REGISTRATION_COMPLETED_KEY, "true");
  } else {
    localStorage.removeItem(REGISTRATION_COMPLETED_KEY);
  }
}

function clearRegistrationCompleted() {
  localStorage.removeItem(REGISTRATION_COMPLETED_KEY);
}

export { getRegistrationCompleted, setRegistrationCompleted, clearRegistrationCompleted };

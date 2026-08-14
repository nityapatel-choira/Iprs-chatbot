const REGISTRATION_COMPLETED_KEY = "iprs_registration_completed";

// Persisted once the backend confirms a session has ended (registration
// complete), so a page refresh can restore the completed-registration UI
// instantly instead of rendering it only after a live network round trip
// resolves. The backend call still runs on refresh and remains the source
// of truth - this flag is what lets the UI show the right screen from the
// very first render, before that call has a chance to respond.
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

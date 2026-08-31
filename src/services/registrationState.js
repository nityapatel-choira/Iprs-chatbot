const REGISTRATION_COMPLETED_KEY = "iprs_registration_completed";

// Enables instant UI render on page refresh.
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

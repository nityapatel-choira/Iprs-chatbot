// Single source of truth for mapping the backend's overall registration
// `progress` percentage (0-100) onto the 4 stepper stages. To change how
// progress maps to stages, edit these ranges only - nothing else in the
// stepper needs to change.
//
// IMPORTANT - current state of the backend (as confirmed against real API
// responses, not assumed): only Personal Details exists so far. Every
// question implemented today - mobile number, OTP, individual/company,
// stage name, music role, etc. - is Personal Details, regardless of what
// `progress` says (confirmed at both progress=21 and progress=36, still
// Personal Details). Bank Details/Work Notifications/Document Upload have
// no real backend flow yet, so they're given unreachable ranges (101-101)
// rather than a guessed percentage split - guessing a split is exactly what
// caused the last two bugs. Personal Details intentionally claims the full
// 0-100 span so the tracker can never visually cross into a stage that
// doesn't exist yet, while its own connector still fills with real progress.
//
// When Bank Details actually ships: shrink personalDetails.max back down
// and give bankDetails a real min/max. Better still, if the backend adds an
// explicit step/section identifier at that point, switch the mapping in
// getStepProgress below to read that directly instead of a percentage range
// at all - a percentage can't reliably encode discrete section boundaries.
export const STEP_RANGES = {
  personalDetails: { min: 0, max: 100, label: "Personal Details" },
  bankDetails: { min: 101, max: 101, label: "Bank Details" },
  workNotifications: { min: 101, max: 101, label: "Work Notifications" },
  documentUpload: { min: 101, max: 101, label: "Document Upload" },
};

const STAGE_ORDER = Object.keys(STEP_RANGES);

export const STAGE_LABELS = STAGE_ORDER.map((key) => STEP_RANGES[key].label);

// Maps a raw progress percentage to { activeIndex, currentFill }.
// activeIndex is which stage is currently active (0-based); currentFill is
// how far through that active stage's own range the progress is (0-100),
// used to size the connector fill directly off the real backend number
// instead of a hardcoded 50%.
export function getStepProgress(progress) {
  const clamped = Math.max(0, Math.min(100, Number(progress) || 0));

  let activeIndex = STAGE_ORDER.length - 1;
  for (let i = 0; i < STAGE_ORDER.length; i += 1) {
    const range = STEP_RANGES[STAGE_ORDER[i]];
    if (clamped <= range.max) {
      activeIndex = i;
      break;
    }
  }

  const activeRange = STEP_RANGES[STAGE_ORDER[activeIndex]];
  const span = activeRange.max - activeRange.min || 1;
  const currentFill = Math.max(0, Math.min(100, ((clamped - activeRange.min) / span) * 100));

  return { activeIndex, currentFill, progress: clamped };
}

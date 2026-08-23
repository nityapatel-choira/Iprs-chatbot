// Maps the backend's overall `progress` (0-100) onto the 4 stepper stages.
// Backend sends no step identifier, so stages split the range evenly.
export const STEP_RANGES = {
  personalDetails: { min: 0, max: 25, label: "Personal Details" },
  bankDetails: { min: 25, max: 50, label: "Bank Details" },
  workNotifications: { min: 50, max: 75, label: "Work Notifications" },
  documentUpload: { min: 75, max: 100, label: "Document Upload" },
};

const STAGE_ORDER = Object.keys(STEP_RANGES);

export const STAGE_LABELS = STAGE_ORDER.map((key) => STEP_RANGES[key].label);

// activeIndex is the current stage; currentFill is how far through its
// range progress is - drives the connector fill instead of a hardcoded 50%.
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

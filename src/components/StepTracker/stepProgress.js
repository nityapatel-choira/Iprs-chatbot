// Single source of truth for mapping the backend's overall registration
// `progress` percentage (0-100) onto the 4 stepper stages. To change how
// progress maps to stages, edit these ranges only - nothing else in the
// stepper needs to change.
//
// The backend sends only a single overall `progress` number, never a
// step/section identifier, and the flow now spans well past Personal
// Details (document upload, face scan, consent, payment all happen before
// registration reaches 100). An earlier version of this file pinned Bank
// Details/Work Notifications/Document Upload to an unreachable 101-101
// range on the assumption only Personal Details existed yet - that made
// `activeIndex` resolve to 0 for every progress value, which is why the
// tracker visually froze on step 1 regardless of real progress. Until the
// backend exposes an explicit step identifier, an even split across the 4
// stages is the only content-driven mapping available that doesn't invent
// per-stage thresholds the backend never sent.
export const STEP_RANGES = {
  personalDetails: { min: 0, max: 25, label: "Personal Details" },
  bankDetails: { min: 25, max: 50, label: "Bank Details" },
  workNotifications: { min: 50, max: 75, label: "Work Notifications" },
  documentUpload: { min: 75, max: 100, label: "Document Upload" },
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

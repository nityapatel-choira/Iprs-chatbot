const PASSPORT_PHOTO_STEP_PATTERN = /passport.{0,15}(size|photo)|photo.{0,15}passport/i;
const PROFILE_PHOTO_STEP_PATTERN = /profile.{0,15}photo|चेहरे की स्पष्ट फोटो/i;
const PROFILE_PHOTO_VARIABLE_ID = "vww01qa7jizgywxikfu1yu48x";

export function isPassportPhotoStep(input, trailingBotText) {
  if (input?.type !== "file input") return false;
  return (
    PASSPORT_PHOTO_STEP_PATTERN.test(`${input.title || ""} ${input.caption || ""}`) ||
    PASSPORT_PHOTO_STEP_PATTERN.test(trailingBotText)
  );
}

export function isProfilePhotoStep(input, trailingBotText) {
  if (input?.type !== "file input") return false;
  if (isPassportPhotoStep(input, trailingBotText)) return false;
  
  const textToSearch = `${input.title || ""} ${input.caption || ""} ${trailingBotText}`;
  return (
    input.options?.variableId === PROFILE_PHOTO_VARIABLE_ID ||
    PROFILE_PHOTO_STEP_PATTERN.test(textToSearch)
  );
}

export function isCityStep(input, trailingBotText) {
  if (input?.type === "city input") return true;
  if (input?.type === "text input") {
    const searchStr = `${input.placeholder || ""} ${input.title || ""} ${trailingBotText}`;
    if (/\b(city|place of birth|current city)\b/i.test(searchStr)) return true;
  }
  return false;
}

export function isMotherTongueStep(input, trailingBotText) {
  if (input?.type === "text input") {
    const searchStr = `${input.placeholder || ""} ${input.title || ""} ${trailingBotText}`;
    if (/\bmother tongue\b/i.test(searchStr)) return true;
  }
  return false;
}

export function isSongLanguageStep(input) {
  return input?.id === "work-language";
}

export function isPaymentReviewStep(input, lastMessage, lastMessageText) {
  return (
    (input?.id === "payment-review" ||
      input?.type === "payment-review" ||
      input?.type === "review input" ||
      input?.data?.type === "payment-review" ||
      lastMessage?.id === "payment-review" ||
      lastMessage?.type === "payment-review" ||
      /check\s+your\s+details|review\s+your\s+details/i.test(lastMessageText)) &&
    input?.id !== "payment-review-correction" &&
    lastMessage?.id !== "payment-review-correction"
  );
}

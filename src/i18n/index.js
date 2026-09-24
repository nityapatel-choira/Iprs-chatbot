// ==================================================================
// t() - the app's own text in the member's language.
//
// Falls back to the English it was given whenever there is no entry, so a
// missing translation shows real wording rather than a blank or a key.
// ==================================================================
import { getLanguageCode } from "../services/languagePreference";
import STRINGS, { TEMPLATES } from "./strings";

export function t(text) {
  const language = getLanguageCode();
  if (!language || language === "en" || typeof text !== "string") return text;
  return STRINGS[text]?.[language] ?? text;
}

/** For wording that carries a live value: t1("Enter the code we sent to {0}.", phone). */
export function t1(template, value) {
  const language = getLanguageCode();
  const pattern = (!language || language === "en") ? template : TEMPLATES[template]?.[language] ?? template;
  return pattern.replace("{0}", value);
}

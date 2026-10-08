import { useMemo, useState } from "react";
import { useCombobox } from "downshift";
import SearchablePicker from "../SearchablePicker/SearchablePicker";
import { t } from "../../i18n";
import { getLanguageCode } from "../../services/languagePreference";
import { searchLanguages, getCanonicalName, getLanguageDisplayName } from "../../../packages/choira-iso-639-3/index.js";

function getEstimatedPillWidth(item) {
  const charWidth = 8.2;
  const padding = 35;
  const displayName = item.displayName || item.name || "";
  return Math.ceil(displayName.length * charWidth + padding);
}

function ChatLanguagePicker({ onSubmit, disabled, placeholder = t("Write your message"), clearOnSubmit = false, isMulti = false }) {
  const [inputValue, setInputValue] = useState("");
  const uiLanguageCode = getLanguageCode() || "en";

  const parts = isMulti ? inputValue.split(",") : [inputValue];
  const lastPart = parts[parts.length - 1] || "";
  const trimmed = lastPart.trim();
  const isSearchable = trimmed.length >= 2;

  const matchingLanguages = useMemo(() => {
    return isSearchable ? searchLanguages(trimmed, uiLanguageCode) : [];
  }, [isSearchable, trimmed, uiLanguageCode]);

  const canonicalMatch = useMemo(() => {
    if (!trimmed) return null;
    const canonical = getCanonicalName(trimmed);
    if (canonical) {
      return {
        canonicalName: canonical,
        name: getLanguageDisplayName(canonical, uiLanguageCode)
      };
    }
    return matchingLanguages.length > 0 ? matchingLanguages[0] : null;
  }, [trimmed, uiLanguageCode, matchingLanguages]);

  const handleSelectSuggestion = (item) => {
    if (disabled || !item) return;

    const canonical = item.canonicalName || getCanonicalName(item.name) || item.name;

    if (isMulti) {
      const allParts = inputValue.split(",");
      allParts.pop(); // remove partial search term
      const newValue = [...allParts.map(p => p.trim()).filter(Boolean), canonical].join(", ");
      setInputValue(newValue);
    }
  };

  const stateReducer = (state, actionAndChanges) => {
    const { type, changes } = actionAndChanges;
    if (isMulti && (type === useCombobox.stateChangeTypes.ItemClick || type === useCombobox.stateChangeTypes.InputKeyDownEnter)) {
      // Prevent Downshift from overriding the input in multi-select mode
      return {
        ...changes,
        inputValue: state.inputValue,
      };
    }
    return changes;
  };

  const handleSubmit = (item) => {
    if (disabled) return;
    let submittedValue = null;
    let displayValue = null;

    if (isMulti) {
      const canonicals = inputValue.split(",").map(s => s.trim()).filter(Boolean).map(val => getCanonicalName(val) || val);
      submittedValue = canonicals.join(", ");
      displayValue = canonicals.map(c => getLanguageDisplayName(c, uiLanguageCode)).join(", ");
    } else {
      const directCanonical = getCanonicalName(trimmed);
      if (directCanonical) {
        submittedValue = directCanonical;
        displayValue = getLanguageDisplayName(directCanonical, uiLanguageCode);
      } else if (item) {
        submittedValue = item.canonicalName || getCanonicalName(item.name) || item.name;
        displayValue = item.displayName || getLanguageDisplayName(submittedValue, uiLanguageCode);
      } else if (canonicalMatch) {
        submittedValue = canonicalMatch.canonicalName;
        displayValue = canonicalMatch.name;
      }
    }

    if (submittedValue) {
      onSubmit?.(submittedValue, displayValue || submittedValue);
      if (clearOnSubmit) {
        setInputValue("");
      }
    }
  };

  const isSubmitDisabled = disabled || (isMulti 
    ? inputValue.trim().length === 0 
    : (!getCanonicalName(trimmed) && !canonicalMatch));

  return (
    <SearchablePicker
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      matchingItems={matchingLanguages}
      getEstimatedWidth={getEstimatedPillWidth}
      canonicalMatch={canonicalMatch}
      onSubmit={handleSubmit}
      disabled={disabled}
      placeholder={placeholder}
      ariaLabel={t("Language selection")}
      noMatchesText={t("No languages found")}
      showMenu={isSearchable}
      isSubmitDisabled={isSubmitDisabled}
      onSelectSuggestion={isMulti ? handleSelectSuggestion : undefined}
      stateReducer={stateReducer}
    />
  );
}

export default ChatLanguagePicker;

import { useMemo, useState } from "react";
import { useCombobox } from "downshift";
import { iso6393 } from 'iso-639-3';
import SearchablePicker from "../SearchablePicker/SearchablePicker";
import { t } from "../../i18n";

const LANGUAGE_MAP = new Map();
const LANGUAGE_LIST = [];

const ALIASES = {
  "panjabi": "Punjabi",
  "bodo (india)": "Bodo",
  "oriya": "Odia",
};
const EXTRA_SEARCH_KEYS = {
  "punjabi": "Punjabi",
  "meitei": "Manipuri",
  "panjabi": "Punjabi",
  "oriya": "Odia"
};

const INDIAN = new Set([
  "Assamese", "Bengali", "Bodo", "Dogri", "Gujarati", "Hindi", "Kannada", "Kashmiri", "Konkani", "Maithili", "Malayalam", "Manipuri", "Marathi", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi", "Tamil", "Telugu", "Urdu", "Bhojpuri", "English"
]);

iso6393
  .filter(lang => lang.scope !== 'special' && ['living', 'ancient', 'constructed'].includes(lang.type))
  .forEach(lang => {
    let cleanName = lang.name.replace(/\s*\((macrolanguage|individual language)\)$/i, '').trim();
    let key = cleanName.toLowerCase();
    
    if (ALIASES[key]) {
      cleanName = ALIASES[key];
      key = cleanName.toLowerCase();
    }
    
    const priority = !!lang.iso6391 || INDIAN.has(cleanName);

    if (!LANGUAGE_MAP.has(key)) {
      LANGUAGE_MAP.set(key, cleanName);
    }
    
    const existing = LANGUAGE_LIST.find(item => item.name === cleanName);
    if (existing) {
      if (priority) existing.isPriority = true;
    } else {
      LANGUAGE_LIST.push({ name: cleanName, lower: key, isPriority: priority });
    }
  });

Object.entries(EXTRA_SEARCH_KEYS).forEach(([key, name]) => {
  LANGUAGE_MAP.set(key, name);
  const canonicalItem = LANGUAGE_LIST.find(item => item.name === name);
  const isPriority = canonicalItem ? canonicalItem.isPriority : false;

  if (!LANGUAGE_LIST.some(item => item.lower === key)) {
    LANGUAGE_LIST.push({ name, lower: key, isPriority });
  }
});

function getSuggestions(query) {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];

  const exactPriority = [];
  const indianStartsWith = [];
  const priorityStartsWith = [];
  const otherStartsWith = [];
  const contains = [];
  const noisyContains = [];

  for (let i = 0; i < LANGUAGE_LIST.length; i++) {
    const lang = LANGUAGE_LIST[i];
    
    if (!lang.lower.includes(normalized)) continue;
    
    const isNoisy = /(creole|pidgin|cape)/i.test(lang.name);
    const isIndian = INDIAN.has(lang.name);

    if (lang.lower === normalized) {
      if (lang.isPriority || isIndian) {
        exactPriority.push(lang);
      } else {
        otherStartsWith.push(lang);
      }
    } else if (lang.lower.startsWith(normalized)) {
      if (isIndian) {
        indianStartsWith.push(lang);
      } else if (lang.isPriority) {
        priorityStartsWith.push(lang);
      } else {
        otherStartsWith.push(lang);
      }
    } else {
      if (isNoisy) {
        noisyContains.push(lang);
      } else {
        contains.push(lang);
      }
    }
  }

  exactPriority.sort((a, b) => a.name.localeCompare(b.name));
  indianStartsWith.sort((a, b) => a.name.localeCompare(b.name));
  priorityStartsWith.sort((a, b) => a.name.localeCompare(b.name));
  otherStartsWith.sort((a, b) => a.name.localeCompare(b.name));
  contains.sort((a, b) => a.name.localeCompare(b.name));
  noisyContains.sort((a, b) => a.name.localeCompare(b.name));

  const all = [
    ...exactPriority, 
    ...indianStartsWith, 
    ...priorityStartsWith, 
    ...otherStartsWith, 
    ...contains, 
    ...noisyContains
  ];
  
  const uniqueNames = new Set();
  const result = [];
  for (const item of all) {
    if (!uniqueNames.has(item.name)) {
      uniqueNames.add(item.name);
      result.push(item);
    }
  }

  return result;
}

function getEstimatedPillWidth(item) {
  const charWidth = 8.2;
  const padding = 35;
  return Math.ceil(item.name.length * charWidth + padding);
}

function ChatLanguagePicker({ onSubmit, disabled, placeholder = t("Write your message"), clearOnSubmit = false, isMulti = false }) {
  const [inputValue, setInputValue] = useState("");

  const parts = isMulti ? inputValue.split(",") : [inputValue];
  const lastPart = parts[parts.length - 1] || "";
  const trimmed = lastPart.trim();
  const isMinLength = trimmed.length >= 2;
  
  const matchingLanguages = useMemo(() => {
    return isMinLength ? getSuggestions(trimmed) : [];
  }, [isMinLength, trimmed]);

  const canonicalMatch = useMemo(() => {
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (LANGUAGE_MAP.has(lower)) {
      return { name: LANGUAGE_MAP.get(lower) };
    }
    return matchingLanguages.length > 0 ? matchingLanguages[0] : null;
  }, [trimmed, matchingLanguages]);

  const handleSelectSuggestion = (item) => {
    if (disabled || !item) return;
    
    const itemName = LANGUAGE_MAP.has(item.name.toLowerCase()) ? LANGUAGE_MAP.get(item.name.toLowerCase()) : item.name;
    
    if (isMulti) {
      const allParts = inputValue.split(",");
      allParts.pop(); // remove partial search term
      const newValue = [...allParts.map(p => p.trim()).filter(Boolean), itemName].join(", ");
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
    const lower = trimmed.toLowerCase();
    let submittedValue = null;
    
    if (isMulti) {
      submittedValue = inputValue.split(",").map(s => s.trim()).filter(Boolean).join(", ");
    } else {
      if (LANGUAGE_MAP.has(lower)) {
        submittedValue = LANGUAGE_MAP.get(lower);
      } else if (item && LANGUAGE_MAP.has(item.name.toLowerCase())) {
        submittedValue = item.name;
      }
    }

    if (submittedValue) {
      onSubmit?.(submittedValue);
      if (clearOnSubmit) {
        setInputValue("");
      }
    }
  };

  const isSubmitDisabled = disabled || (isMulti 
    ? inputValue.trim().length === 0 
    : (!LANGUAGE_MAP.has(trimmed.toLowerCase()) && !canonicalMatch));

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
      showMenu={isMinLength}
      isSubmitDisabled={isSubmitDisabled}
      onSelectSuggestion={isMulti ? handleSelectSuggestion : undefined}
      stateReducer={stateReducer}
    />
  );
}

export default ChatLanguagePicker;

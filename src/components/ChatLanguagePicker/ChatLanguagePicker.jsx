import { useEffect, useMemo, useRef, useState } from "react";
import { useCombobox } from "downshift";
import { iso6393 } from 'iso-639-3';
import SendIcon from "../icons/SendIcon";
import styles from "./ChatLanguagePicker.module.css";

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

  // Sort them alphabetically within their groups
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
  
  // Deduplicate by name
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

function getFittingSuggestions(candidates, containerWidth, isMobile) {
  if (!candidates || candidates.length === 0) return [];
  const maxW = containerWidth || 360;
  const gap = isMobile ? 6 : 8;
  const selected = [];
  let currentUsedW = 0;

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    const w = getEstimatedPillWidth(item);

    if (selected.length === 0) {
      selected.push(item);
      currentUsedW = w;
    } else if (selected.length < 3) {
      if (currentUsedW + gap + w <= maxW) {
        selected.push(item);
        currentUsedW += gap + w;
      }
    }

    if (selected.length === 3) break;
  }

  return selected;
}

function ChatLanguagePicker({ onSubmit, disabled, placeholder = "Write your message" }) {
  const [inputValue, setInputValue] = useState("");
  const [containerWidth, setContainerWidth] = useState(360);
  const [isMobile, setIsMobile] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (formRef.current) {
        setContainerWidth(formRef.current.clientWidth);
      }
      setIsMobile(window.innerWidth <= 480);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const trimmed = (inputValue || "").trim();
  const isMinLength = trimmed.length >= 2;
  
  const matchingLanguages = useMemo(() => {
    return isMinLength ? getSuggestions(trimmed) : [];
  }, [isMinLength, trimmed]);
  
  const suggestions = useMemo(() => {
    return getFittingSuggestions(matchingLanguages, containerWidth, isMobile);
  }, [matchingLanguages, containerWidth, isMobile]);

  // Exact canonical match from Map
  const canonicalMatch = useMemo(() => {
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (LANGUAGE_MAP.has(lower)) {
      return { name: LANGUAGE_MAP.get(lower) };
    }
    return matchingLanguages.length > 0 ? matchingLanguages[0] : null;
  }, [trimmed, matchingLanguages]);

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items: suggestions,
    inputValue,
    onInputValueChange({ inputValue: nextVal }) {
      setInputValue(nextVal || "");
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem && !disabled) {
        onSubmit?.(selectedItem.name);
      }
    },
    itemToString(item) {
      return item ? item.name : "";
    },
  });

  const showMenu = isOpen && isMinLength;

  useEffect(() => {
    if (showMenu && formRef.current) {
      const messagesContainer = document.querySelector("[class*='messages']");
      if (messagesContainer) {
        requestAnimationFrame(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
      }
    }
  }, [showMenu]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    // Strict exact match validation for free text as requested
    const lower = trimmed.toLowerCase();
    if (LANGUAGE_MAP.has(lower)) {
      onSubmit?.(LANGUAGE_MAP.get(lower));
    } else if (canonicalMatch && LANGUAGE_MAP.has(canonicalMatch.name.toLowerCase())) {
      onSubmit?.(canonicalMatch.name);
    }
  };

  const isSubmitDisabled = disabled || (!LANGUAGE_MAP.has(trimmed.toLowerCase()) && !canonicalMatch);

  return (
    <div className={styles.container}>
      <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
        {showMenu && (
          <ul
            {...getMenuProps({
              className: styles.suggestionsRow,
            })}
          >
            {suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <li
                  key={`${item.name}-${index}`}
                  {...getItemProps({
                    item,
                    index,
                    className: `${styles.pill} ${
                      highlightedIndex === index ? styles.pillActive : ""
                    }`,
                  })}
                >
                  <span className={styles.languageName}>{item.name}</span>
                </li>
              ))
            ) : (
              <li className={styles.noMatchesPill}>No languages found</li>
            )}
          </ul>
        )}

        <div className={styles.inputContainer}>
          <input
            {...getInputProps({
              className: styles.input,
              placeholder,
              disabled,
              "aria-label": "Language selection",
            })}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={isSubmitDisabled}
            aria-label="Submit language"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatLanguagePicker;

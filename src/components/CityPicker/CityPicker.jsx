import { useState } from "react";
import { useCombobox } from "downshift";
import { INDIA_CITIES } from "../../constants/indiaCities";
import SendIcon from "../icons/SendIcon";
import styles from "./CityPicker.module.css";

const MAX_SUGGESTIONS = 100;

function filterCities(inputValue) {
  const clean = (inputValue || "").toLowerCase().trim();
  if (!clean) return INDIA_CITIES.slice(0, MAX_SUGGESTIONS);
  return INDIA_CITIES.filter(
    (item) =>
      item.name.toLowerCase().includes(clean) ||
      item.state.toLowerCase().includes(clean) ||
      item.label.toLowerCase().includes(clean)
  ).slice(0, MAX_SUGGESTIONS);
}

function findCanonicalMatch(inputValue) {
  const clean = (inputValue || "").toLowerCase().trim();
  if (!clean) return null;
  return (
    INDIA_CITIES.find((item) => item.name.toLowerCase() === clean) ||
    INDIA_CITIES.find((item) => item.label.toLowerCase() === clean) ||
    INDIA_CITIES.find((item) => item.name.toLowerCase().startsWith(clean)) ||
    null
  );
}

function CityPicker({ onSubmit, disabled, placeholder = "Search or select city..." }) {
  const [inputValue, setInputValue] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const matchingCities = filterCities(inputValue);
  const canonicalMatch = findCanonicalMatch(inputValue);

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items: matchingCities,
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
      return item ? item.label : "";
    },
  });

  const handleSelectOther = () => {
    setManualValue(inputValue);
    setIsManualMode(true);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const clean = manualValue.trim();
    if (disabled || !clean) return;
    onSubmit?.(clean);
  };

  const handleBackToSearch = () => {
    setIsManualMode(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || !canonicalMatch) return;
    onSubmit?.(canonicalMatch.name);
  };

  if (isManualMode) {
    return (
      <div className={styles.container}>
        <form className={styles.form} onSubmit={handleManualSubmit}>
          <div className={styles.inputContainer}>
            <input
              className={styles.input}
              type="text"
              placeholder="Enter your city or place of birth..."
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              disabled={disabled}
              aria-label="Manual city entry"
              autoFocus
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={disabled || !manualValue.trim()}
              aria-label="Submit city"
            >
              <SendIcon />
            </button>
          </div>
          <button
            type="button"
            className={styles.backLink}
            onClick={handleBackToSearch}
            disabled={disabled}
          >
            ← Select from city list
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputContainer}>
          <input
            {...getInputProps({
              className: styles.input,
              placeholder,
              disabled,
              "aria-label": "City selection",
            })}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={disabled || !canonicalMatch}
            aria-label="Submit city"
          >
            <SendIcon />
          </button>
        </div>

        <ul
          {...getMenuProps({
            className: `${styles.menu} ${isOpen ? styles.menuOpen : ""}`,
          })}
        >
          {isOpen &&
            (matchingCities.length > 0 ? (
              matchingCities.map((item, index) => (
                <li
                  key={`${item.name}-${item.state}-${index}`}
                  {...getItemProps({
                    item,
                    index,
                    className: `${styles.menuItem} ${
                      highlightedIndex === index ? styles.menuItemActive : ""
                    }`,
                  })}
                >
                  {item.label}
                </li>
              ))
            ) : (
              <li
                className={`${styles.menuItem} ${styles.otherItem}`}
                onClick={handleSelectOther}
                role="option"
                aria-selected={false}
              >
                Other (Enter manually)
              </li>
            ))}
        </ul>
      </form>
    </div>
  );
}

export default CityPicker;

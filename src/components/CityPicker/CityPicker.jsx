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

  const trimmed = (inputValue || "").trim();
  const isMinLength = trimmed.length >= 3;
  const matchingCities = isMinLength ? filterCities(trimmed) : [];
  const canonicalMatch = isMinLength ? findCanonicalMatch(trimmed) : null;

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

  const showMenu = isOpen && isMinLength;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || !canonicalMatch) return;
    onSubmit?.(canonicalMatch.name);
  };

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
            className: `${styles.menu} ${showMenu ? styles.menuOpen : ""}`,
          })}
        >
          {showMenu &&
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
              <li className={styles.noMatches}>No cities found</li>
            ))}
        </ul>
      </form>
    </div>
  );
}

export default CityPicker;

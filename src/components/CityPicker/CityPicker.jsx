import { useEffect, useRef, useState } from "react";
import { useCombobox } from "downshift";
import { INDIA_CITIES } from "../../constants/indiaCities";
import { getSuggestions } from "../../utils/locationSearch";
import SendIcon from "../icons/SendIcon";
import styles from "./CityPicker.module.css";

function getEstimatedPillWidth(item, isMobile) {
  const showState = !isMobile && Boolean(item.state);
  const text = showState ? `${item.name}, ${item.state}` : item.name;
  const charWidth = 8.2;
  const padding = 35;
  return Math.ceil(text.length * charWidth + padding);
}

function getFittingSuggestions(candidates, containerWidth, isMobile) {
  if (!candidates || candidates.length === 0) return [];
  const maxW = containerWidth || 360;
  const gap = isMobile ? 6 : 8;
  const selected = [];
  let currentUsedW = 0;

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    const w = getEstimatedPillWidth(item, isMobile);

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

function CityPicker({ onSubmit, disabled, placeholder = "Search or select city..." }) {
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
  const isMinLength = trimmed.length >= 3;
  const matchingCities = isMinLength ? getSuggestions(trimmed, INDIA_CITIES) : [];
  const suggestions = getFittingSuggestions(matchingCities, containerWidth, isMobile);
  const canonicalMatch = matchingCities.length > 0 ? matchingCities[0] : null;

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
      return item ? item.label : "";
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
    if (disabled || !canonicalMatch) return;
    onSubmit?.(canonicalMatch.name);
  };

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
                  key={`${item.name}-${item.state}-${index}`}
                  {...getItemProps({
                    item,
                    index,
                    className: `${styles.pill} ${
                      highlightedIndex === index ? styles.pillActive : ""
                    }`,
                  })}
                >
                  <span className={styles.cityName}>{item.name}</span>
                  {!isMobile && item.state && <span className={styles.stateName}>, {item.state}</span>}
                </li>
              ))
            ) : (
              <li className={styles.noMatchesPill}>No cities found</li>
            )}
          </ul>
        )}

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
      </form>
    </div>
  );
}

export default CityPicker;

import { useEffect, useRef, useState, useMemo } from "react";
import { useCombobox } from "downshift";
import SendIcon from "../icons/SendIcon";
import styles from "./SearchablePicker.module.css";
import { t } from "../../i18n";

function getFittingSuggestions(candidates, containerWidth, isMobile, getEstimatedWidth) {
  if (!candidates || candidates.length === 0) return [];
  const maxW = containerWidth || 360;
  const gap = isMobile ? 6 : 8;
  const selected = [];
  let currentUsedW = 0;

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    const w = getEstimatedWidth(item, isMobile);

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

function SearchablePicker({
  inputValue,
  onInputValueChange,
  matchingItems,
  getEstimatedWidth,
  canonicalMatch,
  onSubmit,
  disabled,
  placeholder,
  ariaLabel,
  renderPill,
  noMatchesText,
  showMenu,
  isSubmitDisabled,
  onSelectSuggestion,
  stateReducer,
}) {
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

  const suggestions = useMemo(() => {
    return getFittingSuggestions(
      matchingItems,
      containerWidth,
      isMobile,
      getEstimatedWidth
    );
  }, [matchingItems, containerWidth, isMobile, getEstimatedWidth]);

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
      onInputValueChange(nextVal || "");
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem && !disabled) {
        if (onSelectSuggestion) {
          onSelectSuggestion(selectedItem);
        } else {
          onSubmit?.(selectedItem);
        }
      }
    },
    stateReducer: stateReducer || ((state, actionAndChanges) => actionAndChanges.changes),
    itemToString(item) {
      return item ? item.localName || item.name || item.label || "" : "";
    },
  });

  const shouldShowMenu = isOpen && showMenu;

  useEffect(() => {
    if (shouldShowMenu && formRef.current) {
      const messagesContainer = document.querySelector("[class*='messages']");
      if (messagesContainer) {
        requestAnimationFrame(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
      }
    }
  }, [shouldShowMenu]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitDisabled || disabled) return;
    if (canonicalMatch) {
      onSubmit?.(canonicalMatch);
    }
  };

  return (
    <div className={styles.container}>
      <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
        {shouldShowMenu && (
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
                  {renderPill ? renderPill(item, highlightedIndex === index, isMobile) : <span className={styles.itemName}>{item.name}</span>}
                </li>
              ))
            ) : (
              <li className={styles.noMatchesPill}>{noMatchesText}</li>
            )}
          </ul>
        )}

        <div className={styles.inputContainer}>
          <input
            {...getInputProps({
              className: styles.input,
              placeholder,
              disabled,
              "aria-label": ariaLabel,
            })}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={isSubmitDisabled || disabled}
            aria-label={t("Submit")}
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchablePicker;

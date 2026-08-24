import { useState } from "react";
import { useCombobox } from "downshift";
import { INDIAN_CITIES } from "../../constants/cities";
import SendIcon from "../icons/SendIcon";
import styles from "./CityPicker.module.css";

function filterCities(inputValue) {
  const clean = (inputValue || "").toLowerCase().trim();
  if (!clean) return INDIAN_CITIES;
  return INDIAN_CITIES.filter((city) => city.toLowerCase().includes(clean));
}

function CityPicker({ onSubmit, disabled, placeholder = "Search or select city..." }) {
  const [inputValue, setInputValue] = useState("");
  const matchingCities = filterCities(inputValue);

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
        onSubmit?.(selectedItem);
      }
    },
    itemToString(item) {
      return item || "";
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || disabled) return;
    onSubmit?.(trimmed);
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
            disabled={disabled || !inputValue.trim()}
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
              matchingCities.map((city, index) => (
                <li
                  key={`${city}-${index}`}
                  {...getItemProps({
                    item: city,
                    index,
                    className: `${styles.menuItem} ${
                      highlightedIndex === index ? styles.menuItemActive : ""
                    }`,
                  })}
                >
                  {city}
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

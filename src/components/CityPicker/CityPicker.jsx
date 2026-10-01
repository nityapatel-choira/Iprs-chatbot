import { useEffect, useMemo, useState } from "react";
import { getSuggestions } from "../../utils/locationSearch";
import SearchablePicker from "../SearchablePicker/SearchablePicker";
import { t } from "../../i18n";

function getEstimatedPillWidth(item, isMobile) {
  const showState = !isMobile && Boolean(item.state);
  const text = showState ? `${item.name}, ${item.state}` : item.name;
  const charWidth = 8.2;
  const padding = 35;
  return Math.ceil(text.length * charWidth + padding);
}

function CityPicker({ onSubmit, disabled, placeholder = t("Write your message") }) {
  const [inputValue, setInputValue] = useState("");
  const [citiesList, setCitiesList] = useState([]);

  useEffect(() => {
    let isCancelled = false;
    import("../../constants/indiaCities").then((module) => {
      if (!isCancelled) setCitiesList(module.INDIA_CITIES || []);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const trimmed = (inputValue || "").trim();
  const isMinLength = trimmed.length >= 3;
  
  const matchingCities = useMemo(() => {
    return isMinLength ? getSuggestions(trimmed, citiesList) : [];
  }, [isMinLength, trimmed, citiesList]);
  
  const canonicalMatch = matchingCities.length > 0 ? matchingCities[0] : null;

  return (
    <SearchablePicker
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      matchingItems={matchingCities}
      getEstimatedWidth={getEstimatedPillWidth}
      canonicalMatch={canonicalMatch}
      onSubmit={(item) => onSubmit?.(item.name)}
      disabled={disabled}
      placeholder={placeholder}
      ariaLabel={t("City selection")}
      noMatchesText={t("No cities found")}
      showMenu={isMinLength}
      isSubmitDisabled={!canonicalMatch}
      renderPill={(item, isActive, isMobile) => (
        <>
          <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{item.name}</span>
          {!isMobile && item.state && (
            <span style={{ fontSize: "0.78rem", color: isActive ? "#3b82f6" : "#64748b", fontWeight: 400, whiteSpace: "nowrap" }}>
              , {item.state}
            </span>
          )}
        </>
      )}
    />
  );
}

export default CityPicker;

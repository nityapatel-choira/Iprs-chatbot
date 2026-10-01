import { useEffect, useMemo, useState } from "react";
import { getSuggestions } from "../../utils/locationSearch";
import SearchablePicker from "../SearchablePicker/SearchablePicker";
import { t } from "../../i18n";
import { getLanguageCode } from "../../services/languagePreference";

function getEstimatedPillWidth(item, isMobile) {
  const showState = !isMobile && Boolean(item.localState || item.state);
  const text = showState ? `${item.localName || item.name}, ${item.localState || item.state}` : (item.localName || item.name);
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
  const currentLanguage = getLanguageCode() || "en";
  
  const matchingCities = useMemo(() => {
    return isMinLength ? getSuggestions(trimmed, citiesList, currentLanguage) : [];
  }, [isMinLength, trimmed, citiesList, currentLanguage]);
  
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
          <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{item.localName || item.name}</span>
          {!isMobile && (item.localState || item.state) && (
            <span style={{ fontSize: "0.78rem", color: isActive ? "#3b82f6" : "#64748b", fontWeight: 400, whiteSpace: "nowrap" }}>
              , {item.localState || item.state}
            </span>
          )}
        </>
      )}
    />
  );
}

export default CityPicker;

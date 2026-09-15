import { INDIA_CITIES } from "../constants/indiaCities";

const STATE_NAMES = new Set([
  "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh", "goa", "gujarat",
  "haryana", "himachal pradesh", "jharkhand", "karnataka", "kerala", "madhya pradesh",
  "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "punjab",
  "rajasthan", "sikkim", "tamil nadu", "telangana", "tripura", "uttar pradesh",
  "uttarakhand", "west bengal", "andaman and nicobar islands", "dadra and nagar haveli and daman and diu",
  "jammu and kashmir", "ladakh", "lakshadweep"
]);

const VALID_CITY_STATES = new Set(["delhi", "chandigarh", "puducherry"]);

const ADMINISTRATIVE_REGION_PATTERN =
  /\b(district|tehsil|tahsil|taluka|taluk|division|region|sub-district|subdistrict|territory)\b/i;

/**
 * Checks whether a location item represents a valid city.
 */
export function isCityRecord(item) {
  if (!item) return false;

  if (item.type && typeof item.type === "string" && item.type.toLowerCase() !== "city") {
    return false;
  }
  if (item.level && typeof item.level === "string" && item.level.toLowerCase() !== "city") {
    return false;
  }
  if (item.isCity === false) {
    return false;
  }

  const rawName = (item.name || item.city || item.cityName || "").trim();
  if (!rawName) return false;

  const rawLower = rawName.toLowerCase();
  if (STATE_NAMES.has(rawLower) && !VALID_CITY_STATES.has(rawLower)) {
    return false;
  }

  if (ADMINISTRATIVE_REGION_PATTERN.test(rawName)) {
    return false;
  }

  return true;
}

/**
 * Normalizes a raw location record into distinct city, locality, and state fields.
 */
export function normalizeLocationRecord(item) {
  if (!item) return { name: "", city: "", locality: "", state: "", label: "" };

  let name = (item.name || "").trim();
  let city = (item.city || item.cityName || "").trim();
  let locality = (item.locality || item.localityName || "").trim();
  let state = (item.state || item.stateName || "").trim();

  // If data has a combined string e.g. "Banda, Maharashtra" or "Alipur, Delhi"
  if (!city && name.includes(",")) {
    const parts = name.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const lastPartLower = parts[parts.length - 1].toLowerCase();
      if ((state && lastPartLower === state.toLowerCase()) || STATE_NAMES.has(lastPartLower)) {
        if (!state) state = parts[parts.length - 1];
        city = parts[0];
        name = parts[0];
      } else {
        locality = parts[0];
        city = parts[1];
        if (parts.length >= 3) {
          state = parts[2];
        }
      }
    }
  }

  if (!city) {
    city = locality ? city : name;
  }

  if (STATE_NAMES.has(city.toLowerCase()) && !VALID_CITY_STATES.has(city.toLowerCase()) && name && name.toLowerCase() !== city.toLowerCase()) {
    city = name;
  }

  const displayName = locality || name || city;
  const label = item.label || (state ? `${displayName}, ${state}` : displayName);

  return {
    ...item,
    name: displayName,
    city,
    locality,
    state,
    label,
  };
}

/**
 * Priority-based location autocomplete search.
 * 
 * Priority 1: Prefix match on city field only (deduplicated by city name).
 * Priority 2: Prefix match on locality field.
 * Priority 3: Fallback substring match.
 */
export function getSuggestions(query, locationList = INDIA_CITIES) {
  const cleanQuery = (query || "").toLowerCase().trim();
  if (!cleanQuery) return [];

  const cityOnlyList = (locationList || []).filter(isCityRecord);
  const normalizedList = cityOnlyList.map(normalizeLocationRecord);

  // Priority 1: Prefix match on city field only
  const priority1Matches = [];
  const seenCitiesP1 = new Set();

  for (let i = 0; i < normalizedList.length; i++) {
    const item = normalizedList[i];
    const cityLower = (item.city || "").toLowerCase();

    if (STATE_NAMES.has(cityLower) && !VALID_CITY_STATES.has(cityLower)) {
      continue;
    }

    if (cityLower.startsWith(cleanQuery)) {
      if (!seenCitiesP1.has(cityLower)) {
        seenCitiesP1.add(cityLower);
        priority1Matches.push({
          name: item.city,
          state: item.state,
          city: item.city,
          label: item.state ? `${item.city}, ${item.state}` : item.city,
        });
      }
    }
  }

  if (priority1Matches.length > 0) {
    return priority1Matches;
  }

  // Priority 2: Prefix match on locality field
  const priority2Matches = [];
  const seenLocalitiesP2 = new Set();

  for (let i = 0; i < normalizedList.length; i++) {
    const item = normalizedList[i];
    const localityLower = (item.locality || "").toLowerCase();
    const cityLower = (item.city || "").toLowerCase();

    if (STATE_NAMES.has(cityLower) && !VALID_CITY_STATES.has(cityLower)) {
      continue;
    }

    if (localityLower && localityLower.startsWith(cleanQuery)) {
      const key = `${localityLower}-${cityLower}`;
      if (!seenLocalitiesP2.has(key)) {
        seenLocalitiesP2.add(key);
        priority2Matches.push({
          name: item.locality || item.city,
          state: item.state,
          city: item.city,
          label: item.state ? `${item.locality || item.city}, ${item.state}` : (item.locality || item.city),
        });
      }
    }
  }

  if (priority2Matches.length > 0) {
    return priority2Matches;
  }

  // Priority 3: Fallback broader substring match
  const priority3Matches = [];
  const seenKeysP3 = new Set();

  for (let i = 0; i < normalizedList.length; i++) {
    const item = normalizedList[i];
    const cityLower = (item.city || "").toLowerCase();
    const localityLower = (item.locality || "").toLowerCase();
    const nameLower = (item.name || "").toLowerCase();

    if (STATE_NAMES.has(cityLower) && !VALID_CITY_STATES.has(cityLower)) {
      continue;
    }

    if (
      cityLower.includes(cleanQuery) ||
      localityLower.includes(cleanQuery) ||
      nameLower.includes(cleanQuery)
    ) {
      const cityName = item.city || item.name;
      const key = cityName.toLowerCase();
      if (!seenKeysP3.has(key)) {
        seenKeysP3.add(key);
        priority3Matches.push({
          name: cityName,
          state: item.state,
          city: cityName,
          label: item.state ? `${cityName}, ${item.state}` : cityName,
        });
      }
    }
  }

  return priority3Matches;
}

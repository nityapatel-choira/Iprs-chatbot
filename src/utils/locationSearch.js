import { INDIA_CITIES } from "../constants/indiaCities";

/**
 * Normalizes a raw location record into distinct city, locality, and state fields.
 */
export function normalizeLocationRecord(item) {
  if (!item) return { name: "", city: "", locality: "", state: "", label: "" };

  let name = item.name || "";
  let city = item.city || item.cityName || "";
  let locality = item.locality || item.localityName || "";
  let state = item.state || item.stateName || "";

  // If data has a combined string e.g. "Alipur, Delhi"
  if (!city && name.includes(",")) {
    const parts = name.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      locality = parts[0];
      city = parts[1];
      if (parts.length >= 3) {
        state = parts[2];
      }
    }
  }

  if (!city) {
    city = locality ? city : name;
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

  const normalizedList = (locationList || []).map(normalizeLocationRecord);

  // Priority 1: Prefix match on city field only
  const priority1Matches = [];
  const seenCitiesP1 = new Set();

  for (let i = 0; i < normalizedList.length; i++) {
    const item = normalizedList[i];
    const cityLower = (item.city || "").toLowerCase();

    if (cityLower.startsWith(cleanQuery)) {
      if (!seenCitiesP1.has(cityLower)) {
        seenCitiesP1.add(cityLower);
        // For a city match, return the city item
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

    if (localityLower && localityLower.startsWith(cleanQuery)) {
      const key = `${localityLower}-${(item.city || "").toLowerCase()}`;
      if (!seenLocalitiesP2.has(key)) {
        seenLocalitiesP2.add(key);
        priority2Matches.push(item);
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

    if (
      cityLower.includes(cleanQuery) ||
      localityLower.includes(cleanQuery) ||
      nameLower.includes(cleanQuery)
    ) {
      const key = (item.city || item.name).toLowerCase();
      if (!seenKeysP3.has(key)) {
        seenKeysP3.add(key);
        priority3Matches.push({
          name: item.city || item.name,
          state: item.state,
          city: item.city || item.name,
          label: item.state ? `${item.city || item.name}, ${item.state}` : item.city || item.name,
        });
      }
    }
  }

  return priority3Matches;
}

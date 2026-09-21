const { iso6393 } = require('iso-639-3');

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

iso6393
  .filter(lang => lang.scope !== 'special' && ['living', 'ancient', 'constructed'].includes(lang.type))
  .forEach(lang => {
    let cleanName = lang.name.replace(/\s*\((macrolanguage|individual language)\)$/i, '').trim();
    let key = cleanName.toLowerCase();
    
    if (ALIASES[key]) {
      cleanName = ALIASES[key];
      key = cleanName.toLowerCase();
    }
    
    if (!LANGUAGE_MAP.has(key)) {
      LANGUAGE_MAP.set(key, cleanName);
    }
    
    if (!LANGUAGE_LIST.some(item => item.name === cleanName)) {
      LANGUAGE_LIST.push({ name: cleanName, lower: key });
    }
  });

Object.entries(EXTRA_SEARCH_KEYS).forEach(([key, name]) => {
  LANGUAGE_MAP.set(key, name);
  if (!LANGUAGE_LIST.some(item => item.lower === key)) {
    LANGUAGE_LIST.push({ name, lower: key });
  }
});

function getSuggestions(query) {
  const normalized = query.toLowerCase().trim();
  if (!normalized || normalized.length < 2) return [];

  const startsWith = [];
  const contains = [];

  for (let i = 0; i < LANGUAGE_LIST.length; i++) {
    const lang = LANGUAGE_LIST[i];
    if (lang.lower.startsWith(normalized)) {
      startsWith.push(lang);
    } else if (lang.lower.includes(normalized)) {
      contains.push(lang);
    }
  }

  startsWith.sort((a, b) => a.name.localeCompare(b.name));
  contains.sort((a, b) => a.name.localeCompare(b.name));

  const all = [...startsWith, ...contains];
  
  // Deduplicate array of objects by name, then take first 3
  const uniqueNames = [];
  for(const item of all) {
      if(!uniqueNames.includes(item.name)) uniqueNames.push(item.name);
  }
  
  return uniqueNames.slice(0, 3);
}

function validate(query) {
  const lower = (query || "").trim().toLowerCase();
  return LANGUAGE_MAP.has(lower) ? LANGUAGE_MAP.get(lower) : "REJECTED";
}

console.log("=== 1. SEARCH QUERIES (Max 3 Chips) ===");
const queries = ["hind", "hindi", "HINDI", " hindi ", "punjabi", "panjabi", "odia", "oriya", "malay", "meitei", "manipuri", "bodo", "konkani", "bhojpuri", "xyz", ""];
queries.forEach(q => {
  const res = getSuggestions(q);
  console.log(`Query: "${q}" -> ${res.length} chips: ${JSON.stringify(res)}`);
});

console.log("\n=== 2. VALIDATION (Submit Free Text) ===");
const valQueries = ["hindi", "Punjabi", "xyz", ""];
valQueries.forEach(q => {
  console.log(`Validate: "${q}" -> ${validate(q)}`);
});

console.log("\n=== 3. ALIAS LIST ===");
console.log("Main Aliases:", ALIASES);
console.log("Extra Search Keys:", EXTRA_SEARCH_KEYS);

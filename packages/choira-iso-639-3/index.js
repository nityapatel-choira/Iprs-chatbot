import { iso6393 } from 'iso-639-3';
import {
  ALIASES,
  EXTRA_SEARCH_KEYS,
  INDIAN_LANGUAGES,
  LOCALIZED_LANGUAGE_NAMES,
  NATIVE_LANGUAGE_NAMES
} from './iso6393.js';

export { iso6393 };

const LANGUAGE_MAP = new Map();
const ALL_LANGUAGES = [];

// Helper to normalize search query string
function normalize(str) {
  if (!str) return '';
  return str.trim().toLowerCase();
}

// Transliteration helper for Latin names into Devanagari / Indic scripts when no explicit translation exists
function latinToDevanagari(text) {
  if (!text) return text;
  let str = text;

  const wordMap = {
    "North": "उत्तरी", "Northern": "उत्तरी",
    "South": "दक्षिणी", "Southern": "दक्षिणी",
    "East": "पूर्वी", "Eastern": "पूर्वी",
    "West": "पश्चिमी", "Western": "पश्चिमी",
    "Central": "केंद्रीय", "Upper": "ऊपरी", "Lower": "निचला",
    "Creole": "क्रियोल", "Pidgin": "पिजिन", "Sign": "साइन",
    "Language": "भाषा"
  };

  Object.entries(wordMap).forEach(([en, hi]) => {
    const reg = new RegExp(`\\b${en}\\b`, 'gi');
    str = str.replace(reg, hi);
  });

  const subMap = [
    [/sh/gi, "श"], [/ch/gi, "च"], [/kh/gi, "ख"], [/gh/gi, "घ"],
    [/ph/gi, "फ़"], [/bh/gi, "भ"], [/th/gi, "थ"], [/dh/gi, "ध"],
    [/zh/gi, "झ"], [/ts/gi, "त्स"], [/ng/gi, "ंग"], [/ny/gi, "न्या"],
    [/aa/gi, "आ"], [/ee/gi, "ी"], [/oo/gi, "ू"], [/ai/gi, "ऐ"], [/au/gi, "औ"],
    [/a/gi, "ा"], [/i/gi, "ि"], [/u/gi, "ु"], [/e/gi, "े"], [/o/gi, "ो"],
    [/b/gi, "ब"], [/c/gi, "क"], [/d/gi, "द"], [/f/gi, "फ़"], [/g/gi, "ग"],
    [/h/gi, "ह"], [/j/gi, "ज"], [/k/gi, "क"], [/l/gi, "ल"], [/m/gi, "म"],
    [/n/gi, "न"], [/p/gi, "प"], [/q/gi, "क"], [/r/gi, "र"], [/s/gi, "स"],
    [/t/gi, "त"], [/v/gi, "व"], [/w/gi, "व"], [/x/gi, "क्स"], [/y/gi, "य"], [/z/gi, "ज़"]
  ];

  return str.split(' ').map(w => {
    if (/[\u0900-\u097F]/.test(w)) return w;
    let res = w;
    subMap.forEach(([pat, rep]) => {
      res = res.replace(pat, rep);
    });
    // Format leading vowel sound if standalone
    if (res.startsWith('ा')) res = 'अ' + res.slice(1);
    if (res.startsWith('ि')) res = 'इ' + res.slice(1);
    if (res.startsWith('ु')) res = 'उ' + res.slice(1);
    if (res.startsWith('े')) res = 'ए' + res.slice(1);
    if (res.startsWith('ो')) res = 'ओ' + res.slice(1);
    return res;
  }).join(' ');
}

// Build internal database from iso-639-3 data
iso6393
  .filter(lang => lang.scope !== 'special' && ['living', 'ancient', 'constructed'].includes(lang.type))
  .forEach(lang => {
    let cleanName = lang.name.replace(/\s*\((macrolanguage|individual language)\)$/i, '').trim();
    let lowerName = normalize(cleanName);

    if (ALIASES[lowerName]) {
      cleanName = ALIASES[lowerName];
      lowerName = normalize(cleanName);
    }

    const isPriority = !!lang.iso6391 || INDIAN_LANGUAGES.has(cleanName);

    if (!LANGUAGE_MAP.has(lowerName)) {
      LANGUAGE_MAP.set(lowerName, cleanName);
    }
    if (lang.iso6391 && !LANGUAGE_MAP.has(normalize(lang.iso6391))) {
      LANGUAGE_MAP.set(normalize(lang.iso6391), cleanName);
    }
    if (lang.iso6393 && !LANGUAGE_MAP.has(normalize(lang.iso6393))) {
      LANGUAGE_MAP.set(normalize(lang.iso6393), cleanName);
    }

    let existing = ALL_LANGUAGES.find(item => item.canonicalName === cleanName);
    if (!existing) {
      existing = {
        canonicalName: cleanName,
        iso6391: lang.iso6391 || null,
        iso6393: lang.iso6393 || null,
        isPriority,
        searchTerms: new Set([
          lowerName,
          ...(lang.iso6391 ? [normalize(lang.iso6391)] : []),
          ...(lang.iso6393 ? [normalize(lang.iso6393)] : [])
        ])
      };
      ALL_LANGUAGES.push(existing);
    } else {
      if (lang.iso6391) existing.searchTerms.add(normalize(lang.iso6391));
      if (lang.iso6393) existing.searchTerms.add(normalize(lang.iso6393));
      if (isPriority) existing.isPriority = true;
    }
  });

// Register aliases and extra search keys
Object.entries(EXTRA_SEARCH_KEYS).forEach(([key, canonicalName]) => {
  const normKey = normalize(key);
  LANGUAGE_MAP.set(normKey, canonicalName);
  const existing = ALL_LANGUAGES.find(item => item.canonicalName === canonicalName);
  if (existing) {
    existing.searchTerms.add(normKey);
  }
});

// Register native and localized names into searchTerms and lookup maps
ALL_LANGUAGES.forEach(item => {
  const canonical = item.canonicalName;

  // Native name
  const native = NATIVE_LANGUAGE_NAMES[canonical];
  if (native) {
    const normNative = normalize(native);
    item.searchTerms.add(normNative);
    if (!LANGUAGE_MAP.has(normNative)) LANGUAGE_MAP.set(normNative, canonical);

    if (canonical === 'Hindi') {
      item.searchTerms.add('हिंदी');
      item.searchTerms.add('हिन्दी');
      LANGUAGE_MAP.set('हिंदी', canonical);
      LANGUAGE_MAP.set('हिन्दी', canonical);
    }
  }

  // Localized names across supported UI languages
  Object.keys(LOCALIZED_LANGUAGE_NAMES).forEach(uiLang => {
    const locName = LOCALIZED_LANGUAGE_NAMES[uiLang]?.[canonical];
    if (locName) {
      const normLoc = normalize(locName);
      item.searchTerms.add(normLoc);
      if (!LANGUAGE_MAP.has(normLoc)) LANGUAGE_MAP.set(normLoc, canonical);
    }
  });
});

/**
 * Returns localized display name for a language under current UI language preference.
 * Fallback hierarchy: Localized UI Name -> Native Name -> Script Transliterated Name -> Canonical English
 */
export function getLanguageDisplayName(canonicalName, uiLanguageCode = 'en') {
  if (!canonicalName) return '';
  const langCode = uiLanguageCode || 'en';
  if (langCode === 'en') return canonicalName;

  const loc = LOCALIZED_LANGUAGE_NAMES[langCode]?.[canonicalName];
  if (loc) return loc;

  const native = NATIVE_LANGUAGE_NAMES[canonicalName];
  if (native) return native;

  if (langCode === 'hi' || langCode === 'mr') {
    return latinToDevanagari(canonicalName);
  }

  return canonicalName;
}

/**
 * Returns canonical English name from any valid search query, code, or alias.
 */
export function getCanonicalName(input) {
  if (!input) return null;
  const norm = normalize(input);
  if (LANGUAGE_MAP.has(norm)) {
    return LANGUAGE_MAP.get(norm);
  }
  return null;
}

/**
 * Searches languages with script safety and ranked relevance.
 */
export function searchLanguages(query, uiLanguageCode = 'en') {
  const q = normalize(query);
  if (!q) return [];

  const exactCanonical = [];
  const exactLocalizedOrNative = [];
  const exactIso = [];
  const indianStartsWith = [];
  const priorityStartsWith = [];
  const otherStartsWith = [];
  const contains = [];
  const noisyContains = [];

  ALL_LANGUAGES.forEach(item => {
    const canonical = item.canonicalName;
    const lowerCanonical = normalize(canonical);
    const locName = getLanguageDisplayName(canonical, uiLanguageCode);
    const normLocName = normalize(locName);
    const nativeName = NATIVE_LANGUAGE_NAMES[canonical];
    const normNativeName = nativeName ? normalize(nativeName) : null;
    const isIndian = INDIAN_LANGUAGES.has(canonical);
    const isNoisy = /(creole|pidgin|cape)/i.test(canonical);

    // 1. Exact match on canonical English name
    if (lowerCanonical === q) {
      exactCanonical.push(item);
      return;
    }

    // 2. Exact match on localized name or native name
    if (normLocName === q || normNativeName === q || (canonical === 'Hindi' && (q === 'हिंदी' || q === 'हिन्दी'))) {
      exactLocalizedOrNative.push(item);
      return;
    }

    // 3. Exact ISO code match
    if ((item.iso6391 && normalize(item.iso6391) === q) || (item.iso6393 && normalize(item.iso6393) === q)) {
      exactIso.push(item);
      return;
    }

    // Check startsWith or contains across any search terms
    let matchesStartsWith = false;
    let matchesContains = false;

    for (const term of item.searchTerms) {
      if (term.startsWith(q)) {
        matchesStartsWith = true;
        break;
      }
      if (term.includes(q)) {
        matchesContains = true;
      }
    }

    if (matchesStartsWith) {
      if (isIndian) {
        indianStartsWith.push(item);
      } else if (item.isPriority) {
        priorityStartsWith.push(item);
      } else {
        otherStartsWith.push(item);
      }
    } else if (matchesContains) {
      if (isNoisy) {
        noisyContains.push(item);
      } else {
        contains.push(item);
      }
    }
  });

  const sortItems = arr => arr.sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));

  sortItems(exactCanonical);
  sortItems(exactLocalizedOrNative);
  sortItems(exactIso);
  sortItems(indianStartsWith);
  sortItems(priorityStartsWith);
  sortItems(otherStartsWith);
  sortItems(contains);
  sortItems(noisyContains);

  const combined = [
    ...exactCanonical,
    ...exactLocalizedOrNative,
    ...exactIso,
    ...indianStartsWith,
    ...priorityStartsWith,
    ...otherStartsWith,
    ...contains,
    ...noisyContains
  ];

  const seen = new Set();
  const results = [];

  combined.forEach(item => {
    if (!seen.has(item.canonicalName)) {
      seen.add(item.canonicalName);
      const displayName = getLanguageDisplayName(item.canonicalName, uiLanguageCode);
      results.push({
        name: displayName,
        displayName: displayName,
        canonicalName: item.canonicalName,
        isPriority: item.isPriority
      });
    }
  });

  return results;
}

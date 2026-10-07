const STANDALONE_VOWELS = {
  a: 'अ', aa: 'आ', i: 'इ', ee: 'ई', u: 'उ', oo: 'ऊ', e: 'ए', ai: 'ऐ', o: 'ओ', au: 'औ', ou: 'औ'
};

const MATRAS = {
  a: '', aa: 'ा', i: 'ि', ee: 'ी', u: 'ु', oo: 'ू', e: 'े', ai: 'ै', o: 'ो', au: 'ौ', ou: 'ौ'
};

const CONSONANTS = {
  ksh: 'क्ष', chh: 'छ', sh: 'श', ch: 'च', gh: 'घ', kh: 'ख', ph: 'फ', bh: 'भ', dh: 'ध', th: 'थ', jh: 'झ', gy: 'ज्ञ',
  k: 'क', c: 'क', g: 'ग', j: 'ज', t: 'ट', d: 'ड', n: 'न', p: 'प', f: 'फ', b: 'ब', m: 'म',
  y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व', s: 'स', h: 'ह', q: 'क', x: 'क्स', z: 'ज'
};

/**
 * Phonetically transliterates an English word into an Indic script using Unicode shifting.
 * This is a lightweight fallback for words not in the verified translation dictionary.
 */
export function phoneticTransliterate(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  // Base Devanagari transliteration
  const words = text.split(/\s+/).map(word => {
    // Basic English silent 'e' removal for longer words to improve phonetics
    if (word.length > 3 && word.endsWith('e') && !word.endsWith('ee')) {
      word = word.slice(0, -1);
    }
    // English 'y' at the end of a word is usually an 'ee' sound
    if (word.endsWith('y')) {
      word = word.slice(0, -1) + 'ee';
    }
    
    let result = '';
    let i = 0;
    let lastWasConsonant = false;

    while (i < word.length) {
      let matched = false;
      
      // 1. Try Vowels (up to 2 chars)
      for (const len of [2, 1]) {
        if (i + len > word.length) continue;
        const chunk = word.substr(i, len).toLowerCase();
        if (STANDALONE_VOWELS[chunk] !== undefined) {
          if (lastWasConsonant) {
            result += MATRAS[chunk];
          } else {
            result += STANDALONE_VOWELS[chunk];
          }
          i += len;
          lastWasConsonant = false;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // 2. Try Consonants (up to 3 chars)
      for (const len of [3, 2, 1]) {
        if (i + len > word.length) continue;
        const chunk = word.substr(i, len).toLowerCase();
        
        // Handle soft C (c followed by i, e, y)
        if (chunk === 'c' && i + 1 < word.length) {
          const nextChar = word[i + 1].toLowerCase();
          if (['i', 'e', 'y'].includes(nextChar)) {
            if (lastWasConsonant) result += '्';
            result += 'स'; // 's' sound
            i += 1;
            lastWasConsonant = true;
            matched = true;
            break;
          }
        }
        
        if (CONSONANTS[chunk] !== undefined) {
          if (lastWasConsonant) {
            result += '्'; // halant (virama)
          }
          result += CONSONANTS[chunk];
          i += len;
          lastWasConsonant = true;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // 3. Fallback for unmapped characters (e.g. punctuation, numbers)
      result += word[i];
      i++;
      lastWasConsonant = false;
    }
    
    // Remove trailing halant (implicit schwa deletion)
    if (result.endsWith('्')) {
      result = result.slice(0, -1);
    }
    return result;
  });

  const devanagari = words.join(' ');
  
  if (lang === 'hi' || lang === 'mr') {
    return devanagari;
  }
  
  // ISCII Unicode Shift for Bengali and Gujarati
  let offset = 0;
  if (lang === 'bn') offset = 0x0080;
  else if (lang === 'gu') offset = 0x0180;
  else return text; // unsupported lang, return English
  
  return Array.from(devanagari).map(char => {
    const code = char.charCodeAt(0);
    // Devanagari block is 0x0900 to 0x097F
    if (code >= 0x0900 && code <= 0x097F) {
      if (lang === 'bn' && code === 0x0935) { // 'व' maps to 'ব' in Bengali
        return String.fromCharCode(0x09AC);
      }
      return String.fromCharCode(code + offset);
    }
    return char;
  }).join('');
}

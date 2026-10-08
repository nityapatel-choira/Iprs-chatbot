import assert from 'node:assert';
import {
  getCanonicalName,
  searchLanguages
} from './index.js';

console.log('Running packages/choira-iso-639-3 test suite...');

// 1. Current UI language = Hindi, Search "Hindi" -> Hindi result displayed in Hindi ("हिन्दी")
const res1 = searchLanguages('Hindi', 'hi');
assert(res1.length > 0, 'Test 1 failed: empty results for Hindi');
assert.strictEqual(res1[0].canonicalName, 'Hindi', 'Test 1 failed: canonicalName is not Hindi');
assert.strictEqual(res1[0].displayName, 'हिन्दी', 'Test 1 failed: displayName is not हिन्दी');
console.log('✔ Test 1 passed: Current UI language = Hindi, Search "Hindi" -> Hindi ("हिन्दी")');

// 2. Search "हिन्दी" -> Hindi
const res2 = searchLanguages('हिन्दी', 'hi');
assert(res2.length > 0, 'Test 2 failed: empty results for हिन्दी');
assert.strictEqual(res2[0].canonicalName, 'Hindi', 'Test 2 failed: हिन्दी did not match Hindi');
console.log('✔ Test 2 passed: Search "हिन्दी" -> Hindi');

// 3. Search "हिंदी" -> Hindi
const res3 = searchLanguages('हिंदी', 'hi');
assert(res3.length > 0, 'Test 3 failed: empty results for हिंदी');
assert.strictEqual(res3[0].canonicalName, 'Hindi', 'Test 3 failed: हिंदी did not match Hindi');
console.log('✔ Test 3 passed: Search "हिंदी" -> Hindi');

// 4. Search "hin" -> Hindi should rank first (before Hinduri, Hinukh)
const res4 = searchLanguages('hin', 'hi');
assert(res4.length > 0, 'Test 4 failed: empty results for hin');
assert.strictEqual(res4[0].canonicalName, 'Hindi', `Test 4 failed: top result for "hin" was ${res4[0].canonicalName}, expected Hindi`);
console.log('✔ Test 4 passed: Search "hin" ranks Hindi first before Hinduri/Hinukh');

// 5. Search "Bhojpuri" -> Bhojpuri
const res5 = searchLanguages('Bhojpuri', 'hi');
assert(res5.length > 0, 'Test 5 failed: empty results for Bhojpuri');
assert.strictEqual(res5[0].canonicalName, 'Bhojpuri', 'Test 5 failed: Bhojpuri search mismatch');
assert.strictEqual(res5[0].displayName, 'भोजपुरी', 'Test 5 failed: Bhojpuri Hindi display name mismatch');
console.log('✔ Test 5 passed: Search "Bhojpuri" -> Bhojpuri ("भोजपुरी")');

// 6. Search "भोजपुरी" -> Bhojpuri
const res6 = searchLanguages('भोजपुरी', 'hi');
assert(res6.length > 0, 'Test 6 failed: empty results for भोजपुरी');
assert.strictEqual(res6[0].canonicalName, 'Bhojpuri', 'Test 6 failed: भोजपुरी search mismatch');
console.log('✔ Test 6 passed: Search "भोजपुरी" -> Bhojpuri');

// 7. Current UI language = Marathi -> Marathi display names
const res7 = searchLanguages('Hindi', 'mr');
assert.strictEqual(res7[0].displayName, 'हिंदी', 'Test 7 failed: Marathi display name for Hindi');
const res7b = searchLanguages('Marathi', 'mr');
assert.strictEqual(res7b[0].displayName, 'मराठी', 'Test 7 failed: Marathi display name for Marathi');
console.log('✔ Test 7 passed: Marathi UI language uses Marathi display names');

// 8. Current UI language = Gujarati -> Gujarati display names
const res8 = searchLanguages('Hindi', 'gu');
assert.strictEqual(res8[0].displayName, 'હિન્દી', 'Test 8 failed: Gujarati display name for Hindi');
const res8b = searchLanguages('Gujarati', 'gu');
assert.strictEqual(res8b[0].displayName, 'ગુજરાતી', 'Test 8 failed: Gujarati display name for Gujarati');
console.log('✔ Test 8 passed: Gujarati UI language uses Gujarati display names');

// 9. Current UI language = Bengali -> Bengali display names
const res9 = searchLanguages('Hindi', 'bn');
assert.strictEqual(res9[0].displayName, 'হিন্দি', 'Test 9 failed: Bengali display name for Hindi');
const res9b = searchLanguages('Bengali', 'bn');
assert.strictEqual(res9b[0].displayName, 'বাংলা', 'Test 9 failed: Bengali display name for Bengali');
console.log('✔ Test 9 passed: Bengali UI language uses Bengali display names');

// 10. Backend submission canonical values
assert.strictEqual(getCanonicalName('हिन्दी'), 'Hindi', 'Test 10 failed: getCanonicalName(हिन्दी)');
assert.strictEqual(getCanonicalName('हिंदी'), 'Hindi', 'Test 10 failed: getCanonicalName(हिंदी)');
assert.strictEqual(getCanonicalName('hi'), 'Hindi', 'Test 10 failed: getCanonicalName(hi)');
assert.strictEqual(getCanonicalName('hin'), 'Hindi', 'Test 10 failed: getCanonicalName(hin)');
assert.strictEqual(getCanonicalName('भोजपुरी'), 'Bhojpuri', 'Test 10 failed: getCanonicalName(भोजपुरी)');
console.log('✔ Test 10 passed: Backend canonical submit values preserved');

// 11. Empty search works
const res11 = searchLanguages('', 'hi');
assert.deepStrictEqual(res11, [], 'Test 11 failed: empty search should return empty array');
console.log('✔ Test 11 passed: Empty search returns empty array');

// 12. No-result search works
const res12 = searchLanguages('xyz123nonexistent', 'hi');
assert.deepStrictEqual(res12, [], 'Test 12 failed: no match should return empty array');
console.log('✔ Test 12 passed: No-result search returns empty array');

// 13. No duplicate results
const namesSeen = new Set();
let duplicatesFound = false;
for (const item of res4) {
  if (namesSeen.has(item.canonicalName)) {
    duplicatesFound = true;
    break;
  }
  namesSeen.add(item.canonicalName);
}
assert(!duplicatesFound, 'Test 13 failed: duplicate canonical names in search results');
console.log('✔ Test 13 passed: No duplicate results returned');

// 14. Exact matches rank above partial matches
assert.strictEqual(res4[0].canonicalName, 'Hindi', 'Test 14 failed: exact match Hindi should rank before Hinduri/Hinukh');
console.log('✔ Test 14 passed: Exact matches rank above partial matches');

// 15. Assert all search results under Hindi UI are rendered in Devanagari script (no plain Latin)
const res15 = searchLanguages('hin', 'hi');
res15.forEach(item => {
  assert(/[\u0900-\u097F]/.test(item.displayName), `Test 15 failed: ${item.canonicalName} (${item.displayName}) is not in Devanagari script`);
});
console.log('✔ Test 15 passed: All search suggestions under Hindi UI are rendered in Devanagari script');

console.log('\nAll 15 tests PASSED successfully!');

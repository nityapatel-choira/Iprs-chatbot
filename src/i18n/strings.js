// ==================================================================
// The app's own wording, in the languages the member can pick.
//
// The chat itself is translated by the API, which knows the member's language
// from the X-Language header. These screens never reach the API - the language
// picker, the splash and sign-in all render before there is a session - so
// their wording lives here.
//
// Keyed by the English text so a screen reads as it displays, and so a missing
// entry falls back to English rather than showing a bare key to a member.
// ==================================================================
const STRINGS = {
  // --- Sign in ---
  "Sign In": { hi: "साइन इन", mr: "साइन इन", gu: "સાઇન ઇન" },
  "We'll text a one-time code to verify your number.": {
    hi: "हम आपका नंबर सत्यापित करने के लिए एक बार का कोड भेजेंगे।",
    mr: "आम्ही तुमचा क्रमांक पडताळण्यासाठी एकवेळचा कोड पाठवू.",
    gu: "અમે તમારો નંબર ચકાસવા માટે વન-ટાઇમ કોડ મોકલીશું.",
  },
  "Enter a valid 10-digit mobile number": {
    hi: "10 अंकों का सही मोबाइल नंबर दर्ज करें",
    mr: "10 अंकी वैध मोबाइल क्रमांक प्रविष्ट करा",
    gu: "10 અંકનો માન્ય મોબાઇલ નંબર દાખલ કરો",
  },
  "Enter the code we texted you": {
    hi: "हमने जो कोड भेजा है वह दर्ज करें",
    mr: "आम्ही पाठवलेला कोड प्रविष्ट करा",
    gu: "અમે મોકલેલો કોડ દાખલ કરો",
  },
  "Couldn't send the code. Please try again.": {
    hi: "कोड नहीं भेजा जा सका। कृपया पुनः प्रयास करें।",
    mr: "कोड पाठवता आला नाही. कृपया पुन्हा प्रयत्न करा.",
    gu: "કોડ મોકલી શકાયો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
  },
  "Couldn't resend the code. Please try again.": {
    hi: "कोड दोबारा नहीं भेजा जा सका। कृपया पुनः प्रयास करें।",
    mr: "कोड पुन्हा पाठवता आला नाही. कृपया पुन्हा प्रयत्न करा.",
    gu: "કોડ ફરી મોકલી શકાયો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
  },
  "Invalid OTP. Please enter the correct OTP.": {
    hi: "अमान्य OTP। कृपया सही OTP दर्ज करें।",
    mr: "अवैध OTP. कृपया योग्य OTP प्रविष्ट करा.",
    gu: "અમાન્ય OTP. કૃપા કરીને સાચો OTP દાખલ કરો.",
  },
  "Sending...": { hi: "भेजा जा रहा है...", mr: "पाठवत आहे...", gu: "મોકલી રહ્યા છીએ..." },
  "Verifying...": { hi: "सत्यापित हो रहा है...", mr: "पडताळत आहे...", gu: "ચકાસી રહ્યા છીએ..." },
  Continue: { hi: "आगे बढ़ें", mr: "पुढे जा", gu: "આગળ વધો" },
  "Verify & Continue": { hi: "सत्यापित करें और आगे बढ़ें", mr: "पडताळा आणि पुढे जा", gu: "ચકાસો અને આગળ વધો" },

  // --- Language picker ---
  "Choose your language": { hi: "अपनी भाषा चुनें", mr: "तुमची भाषा निवडा", gu: "તમારી ભાષા પસંદ કરો" },
};

// `Enter the code we sent to {0}.` - the number is filled in at render time, so
// the entry is stored with a placeholder rather than one entry per member.
export const TEMPLATES = {
  "Enter the code we sent to {0}.": {
    hi: "हमने {0} पर जो कोड भेजा है वह दर्ज करें।",
    mr: "आम्ही {0} वर पाठवलेला कोड प्रविष्ट करा.",
    gu: "અમે {0} પર મોકલેલો કોડ દાખલ કરો.",
  },
};

export default STRINGS;

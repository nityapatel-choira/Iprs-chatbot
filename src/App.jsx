import { useState } from "react";
import "./App.css";
import LanguageSelection from "./pages/LanguageSelection/LanguageSelection";
import { LANGUAGES } from "./constants/languages";
import Chat from "./pages/Chat/Chat";
// import FaceVerification from "./pages/FaceVerification/FaceVerification";

function App() {
  const [languageCode, setLanguageCode] = useState(null);
  // const [onboardingDone, setOnboardingDone] = useState(false);

  if (!languageCode) {
    return <LanguageSelection onContinue={setLanguageCode} />;
  }

  // if (onboardingDone) {
  //   return <FaceVerification />;
  // }

  const language = LANGUAGES.find((lang) => lang.code === languageCode)?.name;
  return <Chat language={language} /* onFinished={() => setOnboardingDone(true)} */ />;
}

export default App;

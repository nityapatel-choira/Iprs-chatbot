import { useState } from "react";
import "./App.css";
import LanguageSelection, { LANGUAGES } from "./pages/LanguageSelection/LanguageSelection";
import Chat from "./pages/Chat/Chat";

function App() {
  const [languageCode, setLanguageCode] = useState(null);

  if (!languageCode) {
    return <LanguageSelection onContinue={setLanguageCode} />;
  }

  const language = LANGUAGES.find((lang) => lang.code === languageCode)?.name;
  return <Chat language={language} />;
}

export default App;

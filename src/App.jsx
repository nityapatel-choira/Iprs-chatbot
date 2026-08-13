import { lazy, Suspense, useEffect, useState } from "react";
import "./App.css";
import LanguageSelection from "./pages/LanguageSelection/LanguageSelection";
import { LANGUAGES } from "./constants/languages";
import { logout } from "./services/authService";
import { getToken } from "./services/tokenStorage";
import { getLanguageCode, setLanguageCode, clearLanguageCode } from "./services/languagePreference";
import { onUnauthorized } from "./services/apiClient";

const Login = lazy(() => import("./pages/Login/Login"));
const Chat = lazy(() => import("./pages/Chat/Chat"));
// const FaceVerification = lazy(() => import("./pages/FaceVerification/FaceVerification"));

function App() {
  const [languageCode, setLanguageCodeState] = useState(() => getLanguageCode());
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()));
  // const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    onUnauthorized(() => setLoggedIn(false));
  }, []);

  const handleLanguageContinue = (code) => {
    setLanguageCode(code);
    setLanguageCodeState(code);
  };

  const handleLogout = async () => {
    setLoggedIn(false);
    clearLanguageCode();
    setLanguageCodeState(null);
    try {
      await logout();
    } catch {
      // token is already cleared locally by authService.logout regardless of API outcome
    }
  };

  if (!languageCode) {
    return <LanguageSelection onContinue={handleLanguageContinue} />;
  }

  if (!loggedIn) {
    return (
      <Suspense fallback={null}>
        <Login onContinue={() => setLoggedIn(true)} />
      </Suspense>
    );
  }

  // if (onboardingDone) {
  //   return (
  //     <Suspense fallback={null}>
  //       <FaceVerification />
  //     </Suspense>
  //   );
  // }

  const language = LANGUAGES.find((lang) => lang.code === languageCode)?.name;
  return (
    <Suspense fallback={null}>
      <Chat language={language} onLogout={handleLogout} /* onFinished={() => setOnboardingDone(true)} */ />
    </Suspense>
  );
}

export default App;

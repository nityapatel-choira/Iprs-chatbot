import { lazy, Suspense, useEffect, useState } from "react";
import "./App.css";
import LanguageSelection from "./pages/LanguageSelection/LanguageSelection";
import { LANGUAGES } from "./constants/languages";
import { logout } from "./services/authService";
import { getToken } from "./services/tokenStorage";
import { onUnauthorized } from "./services/apiClient";

const Login = lazy(() => import("./pages/Login/Login"));
const Chat = lazy(() => import("./pages/Chat/Chat"));
// const FaceVerification = lazy(() => import("./pages/FaceVerification/FaceVerification"));

function App() {
  const [languageCode, setLanguageCode] = useState(null);
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()));
  // const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    onUnauthorized(() => setLoggedIn(false));
  }, []);

  const handleLogout = async () => {
    setLoggedIn(false);
    try {
      await logout();
    } catch {
      // token is already cleared locally by authService.logout regardless of API outcome
    }
  };

  if (!languageCode) {
    return <LanguageSelection onContinue={setLanguageCode} />;
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

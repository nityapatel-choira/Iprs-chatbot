import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import "./App.css";
import Splash from "./pages/Splash/Splash";
import LanguageSelection from "./pages/LanguageSelection/LanguageSelection";
import { LANGUAGES } from "./constants/languages";
import { logout } from "./services/authService";
import { setLanguageCode, clearLanguageCode } from "./services/languagePreference";
import { onUnauthorized } from "./services/apiClient";

import { clearRegistrationCompleted } from "./services/registrationState";
import { clearStoredConversation } from "./services/conversationStorage";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setAuthenticated, selectIsAuthenticated } from "./store/slices/authSlice";
import { setLanguage, clearLanguage, selectLanguageCode } from "./store/slices/uiSlice";
import { resetConversation } from "./store/slices/conversationSlice";
import { resetRegistration } from "./store/slices/registrationSlice";

const Login = lazy(() => import("./pages/Login/Login"));
const Chat = lazy(() => import("./pages/Chat/Chat"));

const DevFaceScan = import.meta.env.DEV ? lazy(() => import("./pages/FaceVerification/FaceVerification")) : null;
const DevCityTest = import.meta.env.DEV ? lazy(() => import("./components/CityPicker/CityPicker")) : null;

const App = () => {
  const dispatch = useAppDispatch();
  const languageCode = useAppSelector(selectLanguageCode);
  const loggedIn = useAppSelector(selectIsAuthenticated);
  const [showSplash, setShowSplash] = useState(true);

  const resetSession = useCallback(() => {
    dispatch(setAuthenticated(false));
    clearRegistrationCompleted();
    clearStoredConversation();
    dispatch(resetConversation());
    dispatch(resetRegistration());
  }, [dispatch]);

  useEffect(() => {
    onUnauthorized(resetSession);
  }, [resetSession]);

  const handleLanguageContinue = (code) => {
    setLanguageCode(code);
    dispatch(setLanguage(code));
  };

  const handleLogout = async () => {
    resetSession();
    clearLanguageCode();
    dispatch(clearLanguage());
    try {
      await logout();
    } catch {
      // Ignore API error
    }
  };

  if (DevFaceScan && typeof window !== "undefined" && window.location.search.includes("test=facescan")) {
    return (
      <Suspense fallback={null}>
        <DevFaceScan
          onBack={() => {
            window.location.href = window.location.pathname;
          }}
        />
      </Suspense>
    );
  }

  if (DevCityTest && typeof window !== "undefined" && window.location.search.includes("test=city")) {
    return (
      <div style={{ padding: "40px 20px", background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "580px" }}>
          <h3 style={{ marginBottom: "16px", textAlign: "center", fontFamily: "sans-serif", color: "#0f172a" }}>
            CityPicker Test Harness (?test=city)
          </h3>
          <Suspense fallback={null}>
            <DevCityTest onSubmit={(city) => alert(`City selected: ${city}`)} />
          </Suspense>
        </div>
      </div>
    );
  }

  if (showSplash) {
    return <Splash onDone={() => setShowSplash(false)} />;
  }

  if (!languageCode) {
    return <LanguageSelection onContinue={handleLanguageContinue} />;
  }

  if (!loggedIn) {
    return (
      <Suspense fallback={null}>
        <Login onContinue={() => dispatch(setAuthenticated(true))} />
      </Suspense>
    );
  }

  const language = LANGUAGES.find((lang) => lang.code === languageCode)?.name;
  return (
    <Suspense fallback={null}>
      <Chat language={language} onLogout={handleLogout} />
    </Suspense>
  );
};

export default App;

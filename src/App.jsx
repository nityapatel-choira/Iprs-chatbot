import { lazy, Suspense, useEffect, useState } from "react";
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
// const PaymentCard = lazy(() => import("./components/payment/PaymentCard"));
// const FaceVerification = lazy(() => import("./pages/FaceVerification/FaceVerification"));

function App() {
  const dispatch = useAppDispatch();
  const languageCode = useAppSelector(selectLanguageCode);
  const loggedIn = useAppSelector(selectIsAuthenticated);
  const [showSplash, setShowSplash] = useState(true);
  // const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    onUnauthorized(() => {
      dispatch(setAuthenticated(false));
      clearRegistrationCompleted();
      clearStoredConversation();
      dispatch(resetConversation());
      dispatch(resetRegistration());
    });
  }, [dispatch]);

  // TEMPORARY test route commented out for now
  /*
  if (typeof window !== "undefined" && window.location.search.includes("test=payment")) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f3f7f9", fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "580px" }}>
          <Suspense fallback={null}>
            <PaymentCard
              onComplete={(result) => console.log("payment complete", result)}
            />
          </Suspense>
        </div>
      </div>
    );
  }
  */

  const handleLanguageContinue = (code) => {
    setLanguageCode(code);
    dispatch(setLanguage(code));
  };

  const handleLogout = async () => {
    dispatch(setAuthenticated(false));
    clearLanguageCode();
    dispatch(clearLanguage());
    clearRegistrationCompleted();
    clearStoredConversation();
    dispatch(resetConversation());
    dispatch(resetRegistration());
    try {
      await logout();
    } catch {
      // token is already cleared locally by authService.logout regardless of API outcome
    }
  };

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

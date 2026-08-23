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

// Dev-only (?test=payment): exercises Razorpay checkout before the backend's
// payment step exists (see paymentService.js). import.meta.env.DEV is
// statically false in prod, so Vite dead-code-eliminates this branch and
// its PaymentCard chunk from the production bundle.
const DevPaymentTest = import.meta.env.DEV ? lazy(() => import("./components/payment/PaymentCard")) : null;
// Dev-only (?test=facescan): exercises FaceVerification before it's wired
// into the real registration flow. Same DCE pattern as DevPaymentTest above.
const DevFaceScan = import.meta.env.DEV ? lazy(() => import("./pages/FaceVerification/FaceVerification")) : null;

function App() {
  const dispatch = useAppDispatch();
  const languageCode = useAppSelector(selectLanguageCode);
  const loggedIn = useAppSelector(selectIsAuthenticated);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    onUnauthorized(() => {
      dispatch(setAuthenticated(false));
      clearRegistrationCompleted();
      clearStoredConversation();
      dispatch(resetConversation());
      dispatch(resetRegistration());
    });
  }, [dispatch]);

  if (DevPaymentTest && typeof window !== "undefined" && window.location.search.includes("test=payment")) {
    return (
      <div className="App-devPaymentTest">
        <div className="App-devPaymentTestPanel">
          <Suspense fallback={null}>
            <DevPaymentTest
              prefill={{ name: "Test User", email: "test@example.com", contact: "9999999999" }}
              onComplete={(result) => console.log("[DevPaymentTest] payment complete", result)}
            />
          </Suspense>
        </div>
      </div>
    );
  }

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
}

export default App;

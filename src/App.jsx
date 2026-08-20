import { lazy, Suspense, useEffect, useState } from "react";
import "./App.css";
import Splash from "./pages/Splash/Splash";
import LanguageSelection from "./pages/LanguageSelection/LanguageSelection";
import { LANGUAGES } from "./constants/languages";
import { logout } from "./services/authService";
import { getToken } from "./services/tokenStorage";
import { getLanguageCode, setLanguageCode, clearLanguageCode } from "./services/languagePreference";
import { onUnauthorized } from "./services/apiClient";

import { clearRegistrationCompleted } from "./services/registrationState";
import { clearStoredConversation } from "./services/conversationStorage";

const Login = lazy(() => import("./pages/Login/Login"));
const Chat = lazy(() => import("./pages/Chat/Chat"));
// const FaceVerification = lazy(() => import("./pages/FaceVerification/FaceVerification"));

// Dev-only entry point (?test=payment) for exercising the real Razorpay
// Standard Checkout flow (open/success/failure/dismiss) without needing the
// backend's "payment input" conversation step to exist yet - see
// src/services/paymentService.js. import.meta.env.DEV is statically false in
// production builds, so Vite dead-code-eliminates this whole branch (and the
// PaymentCard chunk it lazy-imports) out of the prod bundle - same pattern
// as useBackendConversation's ?mockInput= dev harness.
const DevPaymentTest = import.meta.env.DEV ? lazy(() => import("./components/payment/PaymentCard")) : null;

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [languageCode, setLanguageCodeState] = useState(() => getLanguageCode());
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()));
  // const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    onUnauthorized(() => {
      setLoggedIn(false);
      clearRegistrationCompleted();
      clearStoredConversation();
    });
  }, []);

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
    setLanguageCodeState(code);
  };

  const handleLogout = async () => {
    setLoggedIn(false);
    clearLanguageCode();
    setLanguageCodeState(null);
    clearRegistrationCompleted();
    clearStoredConversation();
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

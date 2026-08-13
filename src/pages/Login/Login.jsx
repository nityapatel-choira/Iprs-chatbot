import { useState } from "react";
import iprsLogo from "../../assets/iprs-logo.png";
import PhoneNumberField from "../../components/PhoneNumberField/PhoneNumberField";
import styles from "./Login.module.css";

function isValidPhone(value) {
  return /^\d{10}$/.test(value);
}

function Login({ onContinue }) {
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  const valid = isValidPhone(phone);
  const showError = touched && phone.length > 0 && !valid;

  const handlePhoneChange = (raw) => {
    setPhone(raw.replace(/\D/g, "").slice(0, 10));
  };

  const handleContinue = () => {
    setTouched(true);
    if (!valid) return;
    onContinue?.({ countryCode, phone });
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.headerBar} aria-hidden="true" />

        <div className={styles.content}>
          <img src={iprsLogo} alt="IPRS" className={styles.logo} />

          <div className={styles.textGroup}>
            <h1 className={styles.heading}>Sign In</h1>
            <p className={styles.subtitle}>We&apos;ll text a one-time code to verify your number.</p>
          </div>

          <PhoneNumberField
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() => setTouched(true)}
            error={showError ? "Enter a valid 10-digit mobile number" : ""}
          />
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.continueButton} disabled={!valid} onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

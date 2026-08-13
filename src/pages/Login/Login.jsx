import { useState } from "react";
import iprsLogo from "../../assets/iprs-logo.png";
import PhoneNumberField from "../../components/PhoneNumberField/PhoneNumberField";
import OtpField from "../../components/OtpField/OtpField";
import { sendOtp, verifyOtp } from "../../services/authService";
import styles from "./Login.module.css";

function isValidPhone(value) {
  return /^\d{10}$/.test(value);
}

function isValidOtp(value) {
  return /^\d{4,6}$/.test(value);
}

function Login({ onContinue }) {
  const [phase, setPhase] = useState("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpTouched, setOtpTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const phoneValid = isValidPhone(phone);
  const otpValid = isValidOtp(otp);
  const fullPhone = `${countryCode}${phone}`;

  const phoneError = phoneTouched && phone.length > 0 && !phoneValid ? "Enter a valid 10-digit mobile number" : "";
  const otpError = otpTouched && otp.length > 0 && !otpValid ? "Enter the code we texted you" : "";

  const handlePhoneChange = (raw) => setPhone(raw.replace(/\D/g, "").slice(0, 10));
  const handleOtpChange = (raw) => setOtp(raw.replace(/\D/g, "").slice(0, 6));

  const handleSendOtp = async () => {
    setPhoneTouched(true);
    if (!phoneValid || isSubmitting) return;

    setApiError("");
    setIsSubmitting(true);
    try {
      await sendOtp(fullPhone);
      setPhase("otp");
    } catch (err) {
      setApiError(err.message || "Couldn't send the code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpTouched(true);
    if (!otpValid || isSubmitting) return;

    setApiError("");
    setIsSubmitting(true);
    try {
      const data = await verifyOtp(fullPhone, otp);
      onContinue?.(data);
    } catch (err) {
      setApiError(err.message || "Invalid or expired code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeNumber = () => {
    setPhase("phone");
    setOtp("");
    setOtpTouched(false);
    setApiError("");
  };

  const handleResend = async () => {
    if (isSubmitting) return;
    setApiError("");
    setIsSubmitting(true);
    try {
      await sendOtp(fullPhone);
    } catch (err) {
      setApiError(err.message || "Couldn't resend the code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFooterClick = phase === "phone" ? handleSendOtp : handleVerifyOtp;
  const footerDisabled = phase === "phone" ? !phoneValid || isSubmitting : !otpValid || isSubmitting;
  const footerLabel =
    phase === "phone" ? (isSubmitting ? "Sending..." : "Continue") : isSubmitting ? "Verifying..." : "Verify & Continue";

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.headerBar} aria-hidden="true" />

        <div className={styles.content}>
          <img src={iprsLogo} alt="IPRS" className={styles.logo} />

          <div className={styles.textGroup}>
            <h1 className={styles.heading}>Sign In</h1>
            <p className={styles.subtitle}>
              {phase === "phone"
                ? "We'll text a one-time code to verify your number."
                : `Enter the code we sent to ${fullPhone}.`}
            </p>
          </div>

          {phase === "phone" ? (
            <PhoneNumberField
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              value={phone}
              onChange={handlePhoneChange}
              onBlur={() => setPhoneTouched(true)}
              error={phoneError}
              disabled={isSubmitting}
            />
          ) : (
            <div className={styles.otpGroup}>
              <OtpField
                value={otp}
                onChange={handleOtpChange}
                onBlur={() => setOtpTouched(true)}
                error={otpError}
                disabled={isSubmitting}
              />
              <div className={styles.otpActions}>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={handleChangeNumber}
                  disabled={isSubmitting}
                >
                  Change number
                </button>
                <button type="button" className={styles.linkButton} onClick={handleResend} disabled={isSubmitting}>
                  Resend code
                </button>
              </div>
            </div>
          )}

          {apiError && (
            <p className={styles.apiError} role="alert">
              {apiError}
            </p>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.continueButton} disabled={footerDisabled} onClick={handleFooterClick}>
            {footerLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

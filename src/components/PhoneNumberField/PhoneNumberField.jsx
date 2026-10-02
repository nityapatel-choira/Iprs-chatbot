import styles from "./PhoneNumberField.module.css";
import { t } from "../../i18n";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", label: t("India") },
  { code: "+1", flag: "🇺🇸", label: t("United States") },
  { code: "+44", flag: "🇬🇧", label: t("United Kingdom") },
];

const PhoneNumberField = ({
  label = t("Mobile number"),
  countryCode,
  onCountryCodeChange,
  value,
  onChange,
  onBlur,
  placeholder = "98765 43210",
  error,
  disabled,
}) => {
  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="phone-number-input">
        {label}
      </label>
      <div className={`${styles.fieldRow} ${error ? styles.fieldRowError : ""}`}>
        <select
          className={styles.codeSelect}
          value={countryCode}
          onChange={(e) => onCountryCodeChange?.(e.target.value)}
          disabled={disabled}
          aria-label={t("Country code")}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <input
          id="phone-number-input"
          className={styles.input}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "phone-number-error" : undefined}
        />
      </div>
      {error && (
        <span id="phone-number-error" className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default PhoneNumberField;

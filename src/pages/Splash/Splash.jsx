import { useEffect } from "react";
import iprsLogo from "../../assets/iprs-logo.png";
import styles from "./Splash.module.css";
import { t } from "../../i18n";

const SPLASH_DURATION_MS = 1200;

const Splash = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={styles.page}>
      <img src={iprsLogo} alt="IPRS" className={styles.logo} />
      <p className={styles.wordmark}>{t("The Indian Performing Right Society Limited")}</p>
    </div>
  );
};

export default Splash;

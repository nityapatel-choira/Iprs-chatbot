import { useEffect } from "react";
import iprsLogo from "../../assets/iprs-logo.png";
import styles from "./Splash.module.css";

const SPLASH_DURATION_MS = 1200;

function Splash({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={styles.page}>
      <img src={iprsLogo} alt="IPRS" className={styles.logo} />
      <p className={styles.wordmark}>The Indian Performing Right Society Limited</p>
    </div>
  );
}

export default Splash;

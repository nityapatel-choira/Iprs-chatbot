import ShieldIcon from "../icons/ShieldIcon";
import styles from "./Navbar.module.css";

function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.seal} aria-hidden="true">
          <ShieldIcon width={18} height={18} variant="outlined" />
        </span>
        <div>
          <h1 className={styles.title}>IPRS Assist</h1>
          <p className={styles.subtitle}>Membership &amp; registration helpdesk</p>
        </div>
      </div>
      <span className={styles.status}>
        <span className={styles.dot} aria-hidden="true" />
        Online
      </span>
    </header>
  );
}

export default Navbar;

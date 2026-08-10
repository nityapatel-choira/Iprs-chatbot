import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.seal} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path
              d="M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4Z"
              fill="currentColor"
              opacity="0.15"
            />
            <path
              d="M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M8.5 12.2 11 14.5l4.5-5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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

import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
  ariaLabel,
}) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

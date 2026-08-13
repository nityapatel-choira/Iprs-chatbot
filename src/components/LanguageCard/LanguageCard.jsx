import styles from "./LanguageCard.module.css";

function LanguageCard({ name, native, selected, onSelect, disabled }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      className={`${styles.card} ${selected ? styles.cardSelected : ""} ${disabled ? styles.cardDisabled : ""}`}
      onClick={onSelect}
      disabled={disabled}
    >
      <span className={styles.cardName}>{name}</span>
      <span className={styles.cardNative}>{native}</span>
    </button>
  );
}

export default LanguageCard;

import styles from "./LanguageCard.module.css";

function LanguageCard({ name, native, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`${styles.card} ${selected ? styles.cardSelected : ""}`}
      onClick={onSelect}
    >
      <span className={styles.cardName}>{name}</span>
      <span className={styles.cardNative}>{native}</span>
    </button>
  );
}

export default LanguageCard;

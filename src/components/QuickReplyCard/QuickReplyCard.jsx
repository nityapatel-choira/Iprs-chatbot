import styles from "./QuickReplyCard.module.css";

const QuickReplyCard = ({ options, onSelect, disabled }) => {
  const safeOptions = options || [];

  return (
    <div className={styles.card} role="group" aria-label="Choice options">
      {safeOptions.map((option, index) => (
        <button
          key={option.value || option.label || index}
          type="button"
          className={styles.option}
          onClick={() => onSelect?.(option)}
          disabled={disabled}
        >
          <span className={styles.optionLabel}>{option.label}</span>
          {option.subtext && <span className={styles.optionSubtext}>{option.subtext}</span>}
        </button>
      ))}
    </div>
  );
};

export default QuickReplyCard;

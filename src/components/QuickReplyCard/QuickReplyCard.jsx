import styles from "./QuickReplyCard.module.css";

const QuickReplyCard = ({ options, onSelect, disabled }) => {
  return (
    <div className={styles.card}>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          className={styles.option}
          onClick={() => onSelect(option)}
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

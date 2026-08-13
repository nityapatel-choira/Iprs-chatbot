import styles from "./QuickTopics.module.css";

const TOPICS = [
  "Membership Registration",
  "Required Documents",
  "Tariff & Fees",
  "DigiLocker Verification",
];

function QuickTopics({ onSelect }) {
  return (
    <div className={styles.container}>
      <span className={styles.label}>Quick topics:</span>
      <div className={styles.pills}>
        {TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            className={styles.pill}
            onClick={() => onSelect && onSelect(topic)}
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickTopics;

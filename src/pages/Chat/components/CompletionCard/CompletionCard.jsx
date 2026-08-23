import { Fragment } from "react";
import styles from "./CompletionCard.module.css";

const TIMELINE_STEPS = [
  { label: "Application Under Review", status: "active" },
  { label: "Document Verification", status: "pending" },
  { label: "Member ID Activation", status: "pending" },
];

const CompletionCard = () => {
  return (
    <div className={styles.card}>
      <div className={styles.badge}>
        <span className={styles.check}>✓</span> Application Submitted
      </div>
      <h3 className={styles.title}>IPRS Membership Registration Complete</h3>
      <p className={styles.desc}>
        Your application has been received. Track your membership verification status through the timeline below:
      </p>

      <div className={styles.timeline}>
        {TIMELINE_STEPS.map((step, index) => (
          <Fragment key={step.label}>
            <div className={styles.stepNode}>
              <div className={step.status === "active" ? styles.stepCircleActive : styles.stepCirclePending}>
                {index + 1}
              </div>
              <span className={step.status === "active" ? styles.stepTitleActive : styles.stepTitlePending}>
                {step.label}
              </span>
              <span className={step.status === "active" ? styles.stepBadgeActive : styles.stepBadgePending}>
                {step.status === "active" ? "Under Review" : "Pending"}
              </span>
            </div>
            {index < TIMELINE_STEPS.length - 1 && <div className={styles.stepLine} />}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default CompletionCard;

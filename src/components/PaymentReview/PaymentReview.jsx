import BotAvatar from "../../pages/Chat/components/BotAvatar/BotAvatar";
import styles from "./PaymentReview.module.css";

const DEFAULT_SECTIONS = [
  {
    title: "Personal Details",
    fields: [
      { label: "Name", value: "Tanmay Sharad Kathane" },
      { label: "Mobile Number", value: "+91 9819705348" },
      { label: "Email Address", value: "tanmay@choira.io" },
      { label: "Date of Birth", value: "12/08/1997" },
      { label: "PAN Card", value: "THIK18223H" },
      { label: "Present Address", value: "144 Amar Jyoti Nagar, Nara Road, Jaripatka, Nagpur" },
    ],
  },
  {
    title: "Bank Details",
    fields: [
      { label: "Bank Name", value: "State Bank of India" },
      { label: "Branch", value: "Lorem ipsum" },
      { label: "IFSC", value: "SBIN0000755A" },
      { label: "Account no", value: "1231273812748" },
      { label: "A/c Holder Name", value: "Tanmay Sharad Kathane" },
      { label: "Permanent Address", value: "A-1302, Gokuldham Society, Sector 35D, Kharghar." },
    ],
  },
  {
    title: "Work Submission",
    fields: [
      { label: "Song Name", value: "Heavy Is The Crown" },
      { label: "Album Name", value: "From Zero" },
      { label: "Language", value: "English" },
      { label: "Category", value: "Rock" },
      { label: "Artists", value: "Name1, Name2, Name3" },
      { label: "Music Composer", value: "Linkin Park" },
      { label: "Lyricist", value: "Mike Shinoda" },
      { label: "Publish", value: "Name" },
      { label: "Release Year", value: "2025" },
    ],
  },
  {
    title: "Other Documents",
    fields: [
      { label: "GST Number", value: "S3093214U2" },
      { label: "Legal/Trade Name", value: "Lorem ipsum" },
    ],
  },
];

const DEFAULT_ACTIONS = [
  { label: "Edit Personal Details", action: "edit_personal" },
  { label: "Edit Bank Details", action: "edit_bank" },
  { label: "Edit Work Submission", action: "edit_work" },
  { label: "Edit Other Documents", action: "edit_documents" },
  { label: "Proceed for Payment", action: "proceed_payment", primary: true },
];

function normalizeReviewPayload(data, input) {
  const introTitle =
    data?.title || input?.title || "Please review all the details once before proceeding to payment.";

  const sections =
    (Array.isArray(data?.sections) && data.sections.length > 0 && data.sections) ||
    (Array.isArray(input?.sections) && input.sections.length > 0 && input.sections) ||
    DEFAULT_SECTIONS;

  const actions =
    (Array.isArray(data?.actions) && data.actions.length > 0 && data.actions) ||
    (Array.isArray(input?.actions) && input.actions.length > 0 && input.actions) ||
    DEFAULT_ACTIONS;

  return { introTitle, sections, actions };
}

const PaymentReview = ({ data, input, onAction }) => {
  const { introTitle, sections, actions } = normalizeReviewPayload(data, input);

  return (
    <div className={styles.container}>
      {/* Intro Message */}
      <div className={styles.introRow}>
        <BotAvatar />
        <div className={styles.introBubble}>{introTitle}</div>
      </div>

      {/* Review Sections */}
      {sections.map((section, idx) => (
        <div key={`${section.title}-${idx}`} className={styles.sectionRow}>
          <BotAvatar />
          <div className={styles.sectionCard}>
            <div className={styles.headerPill}>{section.title}</div>
            <div className={styles.fieldsList}>
              {(section.fields || []).map((field, fIdx) => (
                <div key={`${field.label}-${fIdx}`} className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>{field.label}: </span>
                  <span className={styles.fieldValue}>{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Actions Box */}
      <div className={styles.actionsCard}>
        {actions.map((act, aIdx) => (
          <button
            key={`${act.label}-${aIdx}`}
            type="button"
            className={`${styles.actionButton} ${act.primary ? styles.actionButtonPrimary : ""}`}
            onClick={() => onAction?.(act.action || act.label)}
          >
            {act.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentReview;
